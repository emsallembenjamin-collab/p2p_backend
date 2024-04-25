const config = require("../config/auth");
const User = require("../models/user");
const Admin = require("../models/admin");
const sessions = require('express-session');
var moment = require('moment')
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const uuid = require('uuid');
const BotController = require("./Bot");
const EmailController = require("./Email");
const speakeasy = require('speakeasy');
const { KYCStatus } = require("./constant");
const TFAController = require("./TFA");
const UserService = require("./Database/account.js");
const RoleService = require("./Database/role.js");
const AdminService = require("./Database/admin.js");
const ethWallet = require("ethereumjs-wallet").default;
/*
    Here we are configuring our SMTP Server details.
    STMP is mail server which is responsible for sending and recieving email.
*/
let smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});
/*------------------SMTP Over-----------------------------*/

exports.signup = async (req, res) => {
  try {

    let ethdata = ethWallet.generate();
    let user = new User({
      fullname: req.body.fullname,
      email: req.body.email,
      countryCode: req.body.countryCode,
      phone: req.body.phone,
      password: bcrypt.hashSync(req.body.password, 8),
      ethAddress: ethdata.getAddressString(), 
      ethPrivateKey: ethdata.getPrivateKeyString(), 
      accountUuid: uuid.v4()
    });
    user.save((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      let email = user.email;
      let info = { id: user._id, email: email, fullname: user.fullname, countryCode: user.countryCode, password: req.body.password, parentTradingAccountId: parentTradingAccountId, parentTradingAccountUuid: parentTradingAccountUuid };
      // The hash we will be sending to the user
      const token = jwt.sign(info, config.secret);
      link = process.env.BACKEND_SERVER + "/api/auth/verify?token=" + token;

      EmailController.verifyEmail(email, link);

      res.status(200).send("User was registered successfully. Please check your email.");
    });
  } catch (error) {
    res.status(500).send("User register failed.");
    BotController.errors(error, "Signup");
  }
};
exports.resetLink = async (req, res) => {

  try {
    let user = await UserService.getAccountDetailByEmail(req.body.email);
    if (!user) {
      return res.status(200).send({ success: false, error: "User not found" });
    }
    let email = user.email;
    let info = { id: user._id, email: email };
    const token = jwt.sign(info, config.secret, {
      expiresIn: "1h"
    });

    link = process.env.BACKEND_SERVER + "/api/auth/reset-password?token=" + token;

    await EmailController.forgotPassword(email, link);

    res.status(200).send("We've sent the email to your account. Please check your email.");
  } catch (error) {
    BotController.errors(error, "ResetLink");
    res.status(500).send("User register failed.");
  }
};

exports.resendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const _verifyEmail = await Database.VerifyEmail.getVerifyEmail(email);
    await EmailController.verifyEmail(email, _verifyEmail.link);
  } catch (e) {
    console.log(e);
    BotController.errors(e, "resendEmail");
    return res.status(200).send({
      success: false,
      error: "Server Error"
    })
  }

}
exports.resetPasswordPage = async (req, res) => {
  try {
    let decoded = jwt.verify(req.query.token, config.secret);
    let user = await User.findById(decoded.id);
    if (!user)
      return res.status(200).send({ success: false, error: "Couldn't find the user!" });
    else {
      if (decoded.exp < new Date().getTime() / 1000) {
        return res.status(200).send({ success: false, error: "The link was expired" });
      }
      global.resetEmail = decoded.email;
      return res.redirect(`${process.env.FRONT_ENTRY}/reset-password`);
    }
  } catch (err) {
    BotController.errors(err, "ResetPasswordPage");
    return res.status(500).send("The link was expired");
  }

}

exports.verifyEmail = async (req, res) => {
  let decoded = jwt.verify(req.query.token, config.secret);
  try {
    let user = await User.findById(decoded.id);
    if (!user)
      return res.redirect(`${process.env.FRONT_ENTRY}/login`);
    else {
      user.isEmailVerified = true;
      let result = await BOController.registerUser(decoded);
      user.accountUuid = result.accountUuid;
      await user.save();
      return res.redirect(`${process.env.FRONT_ENTRY}/login`);
    }
  } catch (e) {
    return res.redirect(`${process.env.FRONT_ENTRY}/login`);
  }
}

exports.resetPassword = async (req, res) => {
  try {
    let _user = UserService.getAccountDetailByEmail(global.resetEmail);
    if (!_user) {
      return res.status(404).send({ message: "User Not found." });
    }
    global.resetEmail = null;
    _user.password = bcrypt.hashSync(req.body.password, 8);

    let result = await BOController.Account.createPassword({ email: _user.email, password: req.body.password });
    console.log(result, "BO create password");
    if (result) {
      await _user.save();
      return res.status(200).send({ success: true, message: "Successfully changed " });
    } else {
      return res.status(200).send({ success: false, message: "Failed to reset password." });
    }
  } catch (e) {
    res.status(500).send({ message: err });
  }

}

exports.signin = async (req, res) => {
  try {

    const email = req.body.email;
    const keep_signin = req.body.keep_signin;
    let user = await UserService.getAccountDetailByEmail(email);
    if (!user) {
      return res.status(200).send({
        success: false,
        error: "User Not found."
      });
    } else {
      if (!user.isEmailVerified) {
        return res.status(200).send({
          success: true,
          body: {
            ...user._doc, 
            password: undefined
          }
        }
        );
      }
      if (user.verification_status === KYCStatus.DELETED) {
        return res.status(200).send({
          success: false,
          error: "This account doesn't exist."
        })
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(403).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      let tfa_secret = config.secret;

      if (user.enable2FA) {
        tfa_secret = config.tfa_secret;
        TFAController.sendTFACode(user);
      }

      var token = jwt.sign({ email: req.body.email, accountUuid: user.accountUuid, isEmailVerified: user.isEmailVerified }, tfa_secret, {
        expiresIn: !keep_signin && 3599 || 3599 * 24 * 30// 1 hours
      });
      const { email, accountUuid } = user._doc;
      if (process.env.APP_MODE !== 'Local') {
        BotController.sendLogin(email);
      }
      console.log({token})
      res.status(200).send(
        {
          success: true,
          body: {
            ...user._doc,
            accessToken: token,
            pasword: undefined,
            gaSecret: undefined,
          
            submittedAt: undefined,
            updated: undefined,
          }
        });
    }
  } catch (e) {
    BotController.errors(e , 'signin')
    res.status(200).send(
      {
        success: false,
        error: "Server Error"
      });
  }

};
exports.getAdmins = (req, res) => {
  Admin.find({}).exec((err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).send(result);
    }
  });
}
exports.updateAdmin = (req, res) => {
  if (!req.body) {
    return res.status(500).send({ message: "Request error!" });
  }
  const { name, email, role, subRole } = req.body;
  const password = bcrypt.hashSync(req.body.password, 8);
  const createdAt = new Date();
  Admin.findOne({ email }, async function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      if (result) {
        result.name = name;
        result.email = email;
        result.role = role;
        result.subRole = subRole;
        // result.password = password;
        result.createdAt = createdAt;
        result.save();
      } else {
        let admin = new Admin({
          name,
          email,
          role,
          password,
          adminUuid: uuid.v4(),
          createdAt,
          subRole
        })
        await admin.save();
      }
      EmailController.addAdmin(email, req.body.password);
      return res.status(200).send(result);
    }
  });
}

exports.deleteAdmin = (req, res) => {
  if (!req.body) {
    return res.status(500).send({ message: "Request error!" });
  }
  const name = req.body.name;
  const email = req.body.email;
  const role = req.body.role;
  const createdAt = new Date();
  Admin.findOneAndRemove({ email }, async function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).send(result);
    }
  });
}

exports.adminSignin = async (req, res) => {

  try {

    let user = await Admin.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    var passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",

      });
    }

    var token = jwt.sign({ email: req.body.email, role: user.role, adminUuid: user.adminUuid, enable2FA: user.enable2FA, subRole: user.subRole }, config.secret, {
      expiresIn: 3599// 1 hours
    });

    if (process.env.APP_MODE !== "Local") {
      BotController.sendAdminLogin(req.body.email);
    }
    const user_role = await RoleService.getRole({ roleUuid: user.subRole });

    res.status(200).send({
      ...user._doc,
      accessToken: token,
      secret: undefined,
      password: undefined,
      permissions: user_role?.permissions
    })
    // if (user.enable2FA) {
    //   let secret_2fa = AdminService.generateSecret(user.email);
    //   EmailController.sendTFACode(user.email, secret_2fa, token);
    // }
  } catch (e) {
    res.status(500).send({ message: e });
    return;
  }
};

exports.adminSigninWithToken = async (req, res) => {

  const { admin } = req;
  const _admin = await AdminService.findAdminByUuid(admin.adminUuid);
  const user_role = await RoleService.getRole({ roleUuid: _admin.subRole });

  return res.status(200).send({
    success: true,
    body: {
      ...admin,
      permissions: user_role?.permissions
    }
  });
}

exports.sendWithdrawVerifyCode = async (req, res) => {
  var minm = 10000;
  var maxm = 99999;
  var code = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
  try {
    let cur_moment = moment()
    sessions.withdraw_verify_code = code;
    sessions.moment = cur_moment;

    await EmailController.sendWithdrawVerifyCode(req.email, code);

    res.status(200).send({
      success: true,
      body: "Withdraw verification code was sent successfully. Please check your email."
    });
  } catch (e) {
    console.log(e);
    BotController.errors(e, "sendWithdrawVerifyCode");
  }
};

exports.verifyWithdrawCode = (req, res) => {
  let cur_moment = moment();
  let timeDifference = cur_moment.diff(sessions.moment, 'seconds')
  if (timeDifference > 30 * 60) { // expired after 30min
    res.status(200).send({
      "status": 0,
      "msg": "Expired verification code. Try to send again"
    });
  }
  res.status(200).send({
    "status": 1,
    "Code": sessions.withdraw_verify_code,
    "TimeDiff": timeDifference,
    "msg": "Success to get verification code"
  });
};

exports.startAdmin2FA = async (req, res) => {
  const { email, role } = req;
  const secret_2fa = speakeasy.generateSecret();
  const _admin = await AdminService.findAdminByEmail(email);
  _admin.secret = secret_2fa.base32;
  _admin.save();
  res.json({ secret: secret_2fa.otpauth_url });
}

exports.verifyAdmin2FA = async (req, res) => {
  const { email, role, admin } = req;
  const { token_2fa } = req.body;
  const _admin = await AdminService.findAdminByEmail(email);
  const secret_2fa = _admin.secret;
  if (!secret_2fa) {
    return res.status(200).send({
      success: false,
      error: "User Not Found"
    })
  }
  const verified = speakeasy.totp.verify({
    secret: secret_2fa,
    encoding: 'base32',
    token: token_2fa,
    window: 1
  });

  var token = jwt.sign({ ...admin, verified_2fa: true }, config.secret);

  if (verified) {
    return res.status(200).send({ success: true, body: token });
  } else {
    return res.status(200).send({ success: false });
  }
}
exports.getAdmin2FA = async (req, res) => {
  const { email, role } = req;
  const secret_2fa = speakeasy.generateSecret({ length: 16, symbols: 1 });
  res.json({ secret: secret_2fa });

}
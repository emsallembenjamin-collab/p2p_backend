const session = require("express-session");
const EmailController = require("../Email");
var jwt = require("jsonwebtoken");
const sessions = require("express-session");
const BotController = require("../Bot");
const { TFAMode } = require("../constant");
const moment = require("moment");
const config = require("../../config/auth");
const speakeasy = require("speakeasy");
const UserService = require("../Database/account");

const generateTFACode = () => {
  var minm = 10000;
  var maxm = 99999;
  var code = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
  console.log(code);
  return code;
};

const sendTFACode = (user) => {
  let code = generateTFACode();
  try {
    let cur_moment = moment();
    sessions.tfaVerifCode = code;
    sessions.tfa_moment = cur_moment;

  
    console.log({code});

    if (user.tfa_mode === TFAMode.TFA_EMAIL) {
      sendEmail(user.email, code);
    } else if (user.tfa_mode === TFAMode.TFA_GA) {
    } else if (user.tfa_mode === TFAMode.TFA_SMS) {
      sendSMS(user.phone, code);
    }
  } catch (e) {
    console.log(e);
    BotController.errors(e, "sendWithdrawVerifyCode");
  }
};

const sendEmail = async (email, code) => {
  await EmailController.sendTFAVerifyCode(email, code);
};

const sendSMS = (phone, code) => {
  sendSMS(phone, code);
};

const verifyTFA = (req, res, next) => {
  const user = req.user;
  let code = req.body.verifyCode;
  let session_code = session.tfaVerifCode;
  if (user.tfa_mode === TFAMode.TFA_GA) {
    let result = verifyGASecret(user, code);
    if (!result) {
      return res.status(200).send({
        success: false,
        error: "It is not valid code. Please try again.",
      });
    }
  } else {
    let cur_moment = moment();

    let timeDifference = cur_moment.diff(sessions.tfa_moment, "seconds");

    if (!session_code) {
      return res.status(200).send({ success: false, error: "Invalid code" });
    }

    if (timeDifference > 20 * 60) {
      sendTFACode(req.user);
      return res.status(200).send({
        success: false,
        error: "Time out. Please check your code again.",
      });
    } else if (code !== session_code.toString()) {
      return res.status(200).send({
        success: false,
        error: "It is not valid code. Please try again.",
      });
    }
  }

  var token = jwt.sign(
    {
      email: user.email,
      accountUuid: user.accountUuid,
      isEmailVerified: user.isEmailVerified,
    },
    config.secret,
    {
      expiresIn: 3599, // 1 hours
    }
  );
  BotController.sendLogin(user.email);
  res.status(200).send({
    success: true,
    body: {
      ...user._doc,
      gaSecret: undefined,
      accessToken: token,
      password: undefined,
    },
  });
};

const resendTFACode = (req, res, next) => {
  try {
    sendTFACode(req.user);
    res.status(200).send({
      success: true,
    });
  } catch (e) {}
};

const verifyPhone = (req, res, next) => {};
const sendPhoneVerify = async (req, res, next) => {
  try {
    let email = req.email;
    let user = await UserService.getAccountDetailByEmail(email);
    let code = generateTFACode();
    sendSMS(user.phone, code);
    sessions.phone_code = code;
    sessions.phone_verif_moment = moment();

    return res.status(200).send({ success: true });
  } catch (e) {
    return res.status(200).send({ success: false });
  }
};

const getGASecret = async (req, res, next) => {
  try {
    const accountUuid = req.accountUuid;
    const secret_2fa = speakeasy.generateSecret({ length: 16, symbols: 1 });
    await UserService.updateAccountProfile(accountUuid, {
      gaSecret: secret_2fa.base32,
    });
    return res.status(200).send({ success: true, gaSecret: secret_2fa.base32 });
  } catch (e) {
    return res.status(200).send({ success: false });
  }
};
const verifyGASecret = (user, secretCode) => {
  const secret_2fa = user.gaSecret;
  if (!secret_2fa) {
    return false;
  }
  const verified = speakeasy.totp.verify({
    secret: secret_2fa,
    encoding: "base32",
    token: secretCode,
    window: 1,
  });
  return verified;
};

const TFAController = {
  sendTFACode,
  verifyTFA,
  resendTFACode,
  verifyPhone,
  sendPhoneVerify,
  getGASecret,
};

module.exports = TFAController;

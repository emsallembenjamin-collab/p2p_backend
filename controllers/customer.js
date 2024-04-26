const EmailController = require("./Email");
const { templateNames, templateKeys } = require("./Email/constant");
const jwt = require("jsonwebtoken");
const config = require("../config/auth");
const bcrypt = require("bcryptjs");
const { IBStatus, KYCStatus } = require("./constant");
const BotController = require("./Bot");
const { OAuth2Client } = require('google-auth-library');
const { generatePassword } = require("../utils/helper");
const DepositHistory = require("../models/deposit_history");
const UserService = require("./Database/account");
const VerifyEmailService = require("./Database/verifyEmail");
const LogService = require("./Database/syslogs");
const User = require("../models/user");
const BalanceController = require("./balance");
const client = new OAuth2Client(`${process.env.GOOGLE_CLIENT_ID}`);

const getUsers = async (req, res, next) => {
    const { adminUuid, role } = req;
    const result = await UserService.getUsers(adminUuid, role);
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        return res.status(200).send({
            success: true,
            body: [
                ...result
            ]
        })
    }
}

//// For user Role: using token
const getUserProfile = async (req, res, next) => {
    const id = req.params.id;
    const result = await UserService.getAccountDetailById(id);
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        return res.status(200).send({
            success: true,
            body: {
                ...result._doc,
            }
        })
    }
}

/// For Admin Role
const getUserProfileByUuid = async (req, res, next) => {
    const accountUuid = req.params.id;
    const result = await UserService.getAccountDetailByUuid(accountUuid);

    if (result) {
        return res.status(200).send({
            success: true,
            body: {
                ...result._doc,
            }
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const saveUserProfile = async (req, res, next) => {
    const accountUuid = req.accountUuid;
    const data = req.body;
    const result = await UserService.updateAccountProfile(accountUuid, { ...data });
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        return res.status(200).send({
            success: true,
            body: {
                ...result
            }
        })
    }
}
const updateProfileFromAdmin = async (req, res, next) => {
    const { id: accountUuid } = req.params;
    const data = req.body;
    const result = await UserService.updateAccountProfile(accountUuid, { ...data });
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        return res.status(200).send({
            success: true,
            body: {
                ...result
            }
        })
    }
}

const saveUserProfileImage = async (req, res, next) => {
    const { email, accountUuid } = req;
    let filename = req.file.filename;
    await UserService.updateProfileImage(email, filename);
    res.status(200).send({
        success: true,
        body: filename
    })
}

const createUser = async (req, res, next) => {
    const _data = req.body;
    let parentTradingAccountUuid = null, parentTradingAccountId = null, parentAccountUuid = null;

    const data = {
        ...req.body,
        branchUuid,
        parentTradingAccountId,
        parentTradingAccountUuid,
        parentAccountUuid,
        password: bcrypt.hashSync(req.body.password, 8)
    };
    let result = await UserService.createAccountSync(data)
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        try {
            BotController.userSignup(req.body.email);
            let info = { id: result._id, accountUuid: result.accountUuid, email: req.body.email, fullname: result.fullname, countryCode: result.countryCode, password: req.body.password };
            const token = jwt.sign(info, config.secret, { expiresIn: 3600 * 24 * 365 });
            link = process.env.BACKEND_SERVER + "/api/auth/verify?token=" + token;
            await EmailController.verifyEmail(req.body.email, link);
            await VerifyEmailService.createVerifyEmail(req.body.email, link);
        } catch (e) {
            console.log(e);
        }
        return res.status(200).send({
            success: true,
            body: {
                ...result
            }
        })
    }
}
const updateStatus = async (req, res, next) => {
    try {
        const _id = req.params.id;
        let status = req.body.verification_status;
        let place = await UserService.updateVerifyStatus({ _id, status });

        if (place) {
            if (status === KYCStatus.APPROVED) {
                BotController.userApporved(place.email);
                EmailController.sendUserApproved(place.email);
            } else {
                EmailController.sendUserDeclined(place.email, req.body.remark);
            }
            return res.status(200).send({
                body: place,
                success: true
            })
        } else {
            return res.status(200).send({
                success: false,
                error: "Failed to create user."
            })
        }
    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "Failed to create user."
        })
    }
}
const verifyEmail = async (req, res, next) => {

    try {
        let decoded = jwt.verify(req.query.token, config.secret);
        let user = await UserService.getAccountDetailByEmail(decoded.email);
        if (!user)
            return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
        else {

            await UserService.updateAccountProfileByEmail(decoded.email, { ...user, isEmailVerified: true, password: user.password });
            BotController.emailVerified(decoded.email);
            return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
        }
    } catch (e) {
        return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
    }

}


const getSystemLogs = async (req, res, next) => {
    const { from, to } = req.query;
    const { adminUuid, role } = req;
    let result = await LogService.getSysteLogs({ from, to, adminUuid, role });
    if (result) {
        res.status(200).send({
            success: true,
            body: result
        })
    } else {
        res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const changePassword = async (req, res, next) => {

    try {
        const { email, accountUuid } = req;
        const { currentPassword, newPassword } = req.body;
        const _user = await UserService.getAccountDetailByEmail(email);
        const result = await bcrypt.compare(currentPassword, _user.password);

        if (result) {
            await UserService.updateAccountPassword(accountUuid, newPassword);
            return res.status(200).send({
                success: true,
                body: {

                }
            })
        } else {
            return res.status(200).send({
                success: false,
                error: "Password was not matched."
            })
        }
    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "Internal server error"
        })
    }
}

const changePasswordFP = async (req, res, next) => {
    try {
        const { password } = req.body;
        const _user = await UserService.getAccountDetailByEmail(global.resetEmail);
        if (!_user) {
            return res.status(404).send({ error: "User not found" });
        }

        global.resetEmail = "";
        await UserService.updateAccountPassword(_user.accountUuid, password);
        return res.status(200).send({
            success: true,
            body: {
            }
        })

    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "Failed to update password by Some issue."
        })
    }
}

const changePasswordFromAdmin = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        const { id } = req.params;
        const _user = await UserService.getAccountDetailByUuid(id);

        await UserService.updateAccountPassword(id, newPassword);
        return res.status(200).send({
            success: true,
            body: {

            }
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "Failed to update password by Some issue."
        })
    }
}
const changeEmail = async (req, res, next) => {
    try {
        const { newEmail } = req.body;
        const { id } = req.params;
        const _user = await UserService.getAccountDetailByUuid(id);

        await UserService.updateAccountProfile(id, { email: newEmail });
        return res.status(200).send({
            success: true,
            body: {

            }
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "Internal server error"
        })
    }
}
const googleSignIn = async (req, res, next) => {

    const { clientId, credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: `${process.env.GOOGLE_CLIENT_ID}`  // Specify the CLIENT_ID of the app that accesses the backend
        });

        // If token is valid, you'll get the decoded user's data
        const payload = ticket.getPayload();
        const { email, name: fullname } = payload;

        const user = await UserService.getAccountDetailByEmail(email);
        if (!user) {
            return res.redirect(`${process.env.FRONT_ENTRY}/login`);
        } else {
            var token = jwt.sign({ email, accountUuid: user.accountUuid }, config.secret, {
                expiresIn: 3599 // 1 hours
            });
            BotController.sendLogin(email);
            res.status(200).send(
                {
                    success: true,
                    body: {
                        ...user._doc,
                        accessToken: token,
                    }
                });
        }
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
}
const createUserFromGoogle = async (req, res, next) => {

    const { clientId, credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: `${process.env.GOOGLE_CLIENT_ID}`  // Specify the CLIENT_ID of the app that accesses the backend
        });

        // If token is valid, you'll get the decoded user's data
        const payload = ticket.getPayload();
        const { email, name: fullname } = payload;

        let password = generatePassword(14);

        await UserService.createAccountSync({
            email,
            fullname,
            ...result.data,
            isEmailVerified: true,
            branchUuid
        })
        EmailController.sendTFACode(email, password);
        return res.redirect(`${process.env.FRONT_ENTRY}/login`);
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
}
const deleteUser = async (req, res, next) => {

    const { id } = req.params;
    let result = await UserService.updateVerifyStatus({ _id: id, status: KYCStatus.DELETED, remark: "" });

    // 
    // BO Action
    ///
    return res.status(200).send({
        success: true,
    })

}
const approveBulkKYCStatus = async (req, res, next) => {
    const { ids } = req.body;
    try {
        for (let index = 0; index < ids.length; index++) {
            await UserService.updateVerifyStatus({ _id: ids[index], status: KYCStatus.APPROVED, remark: "" });
        }
        return res.status(200).send({
            success: true,
            body: ids
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
        })
    }
}
const rejectBulkKYCStatus = async (req, res, next) => {
    const { ids, remark } = req.body;
    try {
        for (let index = 0; index < ids.length; index++) {
            let result = await UserService.updateVerifyStatus({ _id: ids[index], status: KYCStatus.REJECTED, remark });
            EmailController.sendUserDeclined(req.email, result.email);
        }
        return res.status(200).send({
            success: true,
            body: ids
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
        })
    }
}
const deleteBulkKYCStatus = async (req, res, next) => {
    const { ids, remark } = req.body;
    try {
        for (let index = 0; index < ids.length; index++) {
            let result = await UserService.updateVerifyStatus({ _id: ids[index], status: KYCStatus.DELETED, remark });
            BotController.deleteUser()
        }
        return res.status(200).send({
            success: true,
            body: ids
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
        })
    }
}


const updateGASecret = async (req, res, next) => {
    const accountUuid = req.params.id;
    try {
        const user = await UserService.getAccountDetailByUuid(accountUuid);
        const secret_2fa = speakeasy.generateSecret({ length: 16, symbols: 1 });
        await UserService.updateAccountProfile(accountUuid, {
            gaSecret: secret_2fa.base32,
        });
        EmailController.sendTFACode(user.email, secret_2fa.base32);
        return res.status(200).send({ success: true, gaSecret: secret_2fa.base32 });

    } catch (e) {
        return res.status(200).send({
            success: false
        })
    }
}
const updateTFAMode = async (req, res, next) => {
    console.log("---------updateTFAMode---------");
    const accountUuid = req.accountUuid;
    const data = req.body;
    try {
        const user = await UserService.updateAccountProfile(accountUuid, data);
        if (user) {
            return res.status(200).send({
                success: true,
            })
        }
    } catch (e) {
        return res.status(200).send({
            success: false
        })
    }
}
const updateTfa = async (req, res, next) => {

    const accountUuid = req.accountUuid;
    const data = req.body;
    try {
        const user = await UserService.updateAccountProfile(accountUuid, data);
        if (user) {
            return res.status(200).send({
                success: true,
            })
        }
    } catch (e) {
        return res.status(200).send({
            success: false
        })
    }
}

const webhook = async (req, res, next) => {
    const transactions = req.body.erc20Transfers;

    if (!req.body.confirmed) {
      return res.status(200).send("Not confirmed");
    }else if(transactions.length == 0 && transactions){
      return res.status(200).send('Verified'); 
    }
  
    console.log("process");
    if (transactions?.length > 0) {
      const element = transactions[0];
      const deposit_amount = element.valueWithDecimals;
      if (deposit_amount <= 0) {
        return res.status(200).send("Value is 0");
      }
      let history = await DepositHistory.findOne({
        txhash: element?.transactionHash,
      });
      if (history) {
        if (history.status == 4) {
          return res.status(200).send("Processed already!");
        }
      } else {
        history = new DepositHistory({ txhash: element?.transactionHash });
        await history.save();
      }
      const wallet_address = element.to;
      User.findOne({ ethAddress: wallet_address }).exec(async (err, user) => {
        if (err || !user) {
          return res.status(200).send("Couldn't find a wallet of this address!");
        }
        let sender = global.ADMIN_WALLET_ADDRESS;
        let receiver = wallet_address;
        let senderkey = global.ADMIN_WALLET_PRIVATE_KEY; //admin private key
  
        const contract = new web3.eth.Contract(BNB_ABI, bnb);
        const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt);
  
        const balance = await usdtContract.methods.balanceOf(receiver).call();
        const amount = web3.utils.toHex(balance);
        
        const balanceInUSDT = web3.utils.fromWei(balance, 'ether'); // 'mwei' stands for mega-wei, or 10^6 wei
  
        /// if balance <=0 then, fake
        if(balanceInUSDT<=0) {
          return res.status(200).send("Error"); 
        }
  
        try {
          if (history.status == 0){
            BotController.depositByWallet(
                user.email,
              balanceInUSDT,
              wallet_address,
            );
            history.status = 1; 
          }
        } catch (error) {
          return res.status(500).send("Error"); 
          console.log(error);
        }
       
       
        if (history.status == 1 ){
          BalanceController._depositToTradingAccountId(
            balanceInUSDT,
            balanceInUSDT,
            DepositMode.GATEWAY,
            wallet.tradingAccountId,
            "USD",
            "Deposit From Wallet",
            wallet.email,
            wallet.email,
            wallet.clientUuid
          );
          history.status = 2; 
        }
        try {
          //BNB needed for getting USDT
          let result = await Web3Controller.sendBNBToWallet(
            global.ADMIN_WALLET_ADDRESS,
            global.ADMIN_WALLET_PRIVATE_KEY,
            wallet_address,
            amount
          );
          let result_to_admin = null; 
          if(history.status== 2){
            result_to_admin = await Web3Controller.sendUSDTToWallet(
              wallet_address,
              wallet.ethPrivateKey,
              global.ADMIN_WALLET_DEPOSIT_ADDRESS,
              0
            );
          }
  
          if (result_to_admin) {
            history.status = 4;
            history.save();
            let admin_balance = await Web3Controller.getUSDTBalance(
              global.ADMIN_WALLET_DEPOSIT_ADDRESS
            );
            BotController.balanceChanged(
              balanceInUSDT,
              PaymentType.DEPOSIT,
              wallet.tradingAccountId,
              admin_balance
            );
            EmailController.sendDepositSuccess(wallet.email, deposit_amount);
            return res.status(200).send("success");
          }
          history.save(); 
          return res.status(500).send("error"); 
        } catch (err) {
          history.save();
          console.log(err);
          BotController.errors(err, "WebHook");
          return res.status(500).send("error");
        }
      });
    } else {
      return res.status(500).send("Didn't get correct transactions");
    }
};
const verifyProfile = async (req, res, next) => {
    const email = req.body.email;
    console.log("*****************", req.body);
    User.findOne({
        email: email,
    }).exec(async function (err, place) {
        if (err) {
            console.log(err);
            return res.status(200).send({
                success: false,
                error: "Internal Server Error",
            });
        }
        if (!place) {
            res.status(200).send({
                success: false,
                error: "User doesn't exist!",
            });
            return;
        }
        EmailController.sendKYCRecieved(email);
        BotController.kycUploaded(email);

        place.expDate = req.body.expDate;
        place.docType = req.body.docType;
        place.docType2 = req.body.docType2;
        place.docUrl1 = req.files?.frontImg ? req.files?.frontImg[0]?.path : "";
        place.docUrl2 = req.files?.backImg ? req.files?.backImg[0]?.path : "";
        place.docUrl3 = req.files?.proofOfResident
            ? req.files?.proofOfResident[0]?.path
            : "";
        place.verification_status = KYCStatus.PENDING;
        await place.save();

        return res.status(200).send({
            success: true,
            ...place._doc,
            password: undefined,
            partnerId: undefined,
        });
    });
};
const UserController = {
    changePasswordFP,
    changePasswordFromAdmin,
    changePassword,
    changeEmail,
    createUser,
    createUserFromGoogle,
    googleSignIn,
    getUserProfile,
    getUserProfileByUuid,
    getUsers,
    getSystemLogs,
    saveUserProfile,
    deleteUser,
    saveUserProfileImage,

    updateProfileFromAdmin,
    updateStatus,
    verifyEmail,

    approveBulkKYCStatus,
    rejectBulkKYCStatus,
    deleteBulkKYCStatus,

    updateTFAMode,
    updateTfa,
    updateGASecret,

    webhook,
    verifyProfile
}

module.exports = UserController; 

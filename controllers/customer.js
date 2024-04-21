const Database = require("./Database");
const EmailController = require("./Email");
const { templateNames, templateKeys } = require("./Email/constant");
const jwt = require("jsonwebtoken");
const config = require("../config/auth");
const bcrypt = require("bcryptjs");
const { IBStatus, KYCStatus } = require("./constant");
const BOController = require("./BO");
const BotController = require("./Bot");
const PositionController = require("./position");
const { OAuth2Client } = require('google-auth-library');
const { generatePassword } = require("../utils/helper");
const { readSettings } = require("./Commission");
const DepositHistory = require("../models/deposit_history");
const client = new OAuth2Client(`${process.env.GOOGLE_CLIENT_ID}`);

const getUsers = async (req, res, next) => {
    const { adminUuid, role } = req;
    const result = await Database.Account.getUsers(adminUuid, role);
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
    const result = await Database.Account.getAccountDetailById(id);
    if (!result) {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    } else {
        const branchInfo = await Database.Branch.getBranchDetailsByUuid(result._doc.branchUuid);
        return res.status(200).send({
            success: true,
            body: {
                ...result._doc,
                branchInfo
            }
        })
    }
}

/// For Admin Role
const getUserProfileByUuid = async (req, res, next) => {
    const accountUuid = req.params.id;
    const result = await Database.Account.getAccountDetailByUuid(accountUuid);

    if (result) {
        const branchInfo = await Database.Branch.getBranchDetailsByUuid(result._doc.branchUuid);
        return res.status(200).send({
            success: true,
            body: {
                ...result._doc,
                branchInfo
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
    const result = await Database.Account.updateAccountProfile(accountUuid, { ...data });
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
    const result = await Database.Account.updateAccountProfile(accountUuid, { ...data });
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
    await Database.Account.updateProfileImage(email, filename);
    res.status(200).send({
        success: true,
        body: filename
    })
}

const createUser = async (req, res, next) => {
    const _data = req.body;
    let parentTradingAccountUuid = null, parentTradingAccountId = null, parentAccountUuid = null;

    let branchUuid = await Database.Setting.getDefaultBranch();
    const { ibLinkCookie } = _data;
    if (!!ibLinkCookie) {
        const IBUser = await Database.Account.getAccountDetailByIblink(Number(ibLinkCookie));
        if (!!IBUser) {
            parentTradingAccountId = IBUser.ibParentTradingAccountId;
            parentTradingAccountUuid = IBUser.ibParentTradingAccountUuid;
            branchUuid = IBUser.branchUuid;
            parentAccountUuid = IBUser.accountUuid;
        }
    }

    const data = {
        ...req.body,
        branchUuid,
        parentTradingAccountId,
        parentTradingAccountUuid,
        parentAccountUuid,
        password: bcrypt.hashSync(req.body.password, 8)
    };
    let result = await Database.Account.createAccountSync(data)
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
            await Database.VerifyEmail.createVerifyEmail(req.body.email, link);
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
        let place = await Database.Account.updateVerifyStatus({ _id, status });

        if (place) {
            if (status === KYCStatus.APPROVED) {
                BotController.userApporved(place.email);
                EmailController.sendUserApproved(place.email);
                BOController.Account.updateUserInfo(place.email, place);
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
        let user = await Database.Account.getAccountDetailByEmail(decoded.email);
        if (!user)
            return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
        else {
            let result = await BOController.Account.registerUser(decoded);
            if (!result) {
                return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
            }
            let branchUuid = await Database.Setting.getDefaultBranch();
            await Database.Account.updateAccountProfileByEmail(decoded.email, { ...result.data, isEmailVerified: true, password: user.password, branchUuid });
            BotController.emailVerified(decoded.email);
            return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
        }
    } catch (e) {
        return res.redirect(`${process.env.FRONT_ENTRY}/signin`);
    }

}
const updateUserBranch = async (req, res, next) => {

    const id = req.params.id;
    const branchUuid = req.body.branchUuid;
    let branchInfo = await Database.Branch.getBranchDetailsByUuid(branchUuid);
    try {
        if (branchInfo) {
            const data = {
                branchUuid,
                branchInfo: branchInfo[0]
            }
            let result = await Database.Account.updateAccountProfile(id, data);
            if (result) {
                return res.status(200).send({
                    success: true,
                    body: result
                })
            }
        }
    } catch (e) {
        BotController.errors(e, "customer.updateUserBranch");
    }
    return res.status(200).send({
        success: false,
        error: "Internal Server Error"
    });
}

const getSystemLogs = async (req, res, next) => {
    const { from, to } = req.query;
    const { adminUuid, role } = req;
    let result = await Database.SysLog.getSysteLogs({ from, to, adminUuid, role });
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
const updateIBCommissionType = async (req, res, next) => {
    const { accountUuid, ibCommissionType } = req.body;
    try {
        const result = await Database.Account.updateAccountProfile(accountUuid, { ibCommissionType });
        return res.status(200).send({
            success: true,
            body: result
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const updateIBStatus = async (req, res, next) => {
    const reqbody = req.body;
    const { id, ibStatus } = reqbody;
    let tradingAccount = null;

    const _user = await Database.Account.getAccountDetailById(id);
    if (_user.ibStatus === ibStatus) {
        return res.status(200).send({
            success: false,
            error: "Already in " + ibStatus
        })
    }

    if (ibStatus === IBStatus.APPROVED) {

        tradingAccount = await Database.TradingAccount.getIBTradingAccountByAccountUuid(_user.accountUuid);
        if (!tradingAccount)
            tradingAccount = await Database.TradingAccount.createIBTradingAccount(id);
        if (!tradingAccount) {
            return res.status(200).send({
                success: false,
                error: "Can't create trading account for IB Account"
            })
        }
    }
    let user_result = null;
    if (ibStatus === IBStatus.APPROVED) {
        let commissionType = await Database.Setting.getCommissionType();
        user_result = await Database.Account.updateIBStatus(req.body, tradingAccount.tradingAccountId, tradingAccount.tradingAccountUuid);
        if (user_result.parentTradingAccountId) {
            let parentAccount = await Database.Account.findOneAccountByQuery({ ibParentTradingAccountId: user_result.parentTradingAccountId });
            user_result.ibCommissionType = parentAccount.ibCommissionType || commissionType || 'Lot';
        } else {
            user_result.ibCommissionType = commissionType || 'Lot'
        }
        await user_result.save();
    } else {
        user_result = await Database.Account.updateIBStatus(req.body, null, null);
    }
    if (user_result) {
        if (ibStatus === IBStatus.APPROVED)
            await EmailController.sendIBApproved(user_result.email);
        else
            await EmailController.sendIBDecliend(user_result.email);
        return res.status(200).send({
            success: true,
            body: user_result
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Failed to update IBStatus"
        })
    }
}
const getIBClients = async (req, res, next) => {

    const { eamil, accountUuid } = req;
    const account = await Database.Account.getAccountDetailByUuid(accountUuid);
    if (account) {
        const parentTradingAccountId = account.ibParentTradingAccountId;
        const verification_status = KYCStatus.APPROVED;
        const _ibClients = await Database.Account.getIBOwnClients({ parentTradingAccountId, verification_status });
        return res.status(200).send({
            success: true,
            body: _ibClients
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const getIBOwnClients = async (req, res, next) => {
    const { eamil, accountUuid } = req;
    const user = await Database.Account.getAccountDetailByUuid(accountUuid);

    if (user && user.ibStatus == IBStatus.APPROVED && user.ibParentTradingAccountId) {
        let start = 0, end = 10;
        const commissionSetting = readSettings();
        const index = commissionSetting.rankingLabels.findIndex(item => item == user.ibRanking);
        if (index == 0 || index == -1) {
            start = 0;
            end = commissionSetting.rankingCommissionLevels[0];
        } else {
            start = commissionSetting.rankingCommissionLevels[index - 1];
            end = commissionSetting.rankingCommissionLevels[index];
        }

        /////// get tree and summary info 
        let summary = {
            totalQClients: 0,
            totalIbs: 0,
            totalVolume: 0
        }

        let result = await Database.Account.createIBClientTree(user.ibParentTradingAccountId, 0, start, end, summary);
        return res.status(200).send({
            success: true,
            body: result,
            summary
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "There are some problems with your account."
        })
    }
}


const getAccountInfo = async (req, res, next) => {

    const email = req.email;
    const accountUuid = req.accountUuid;

    let depositHistory = await Database.Deposit.getDepositAmountByUserId(accountUuid);
    let closedPositions = await PositionController._getClosedPositionsByClientUuid(0, new Date().getTime(), accountUuid);
    let activePositions = await PositionController._getAllPositionsByClientUuid(accountUuid);
    return res.status(200).send({
        success: true,
        body: {
            deposit: depositHistory && depositHistory.length && depositHistory[0].totalAmount,
            closedPositions,
        }
    })
}

const changePassword = async (req, res, next) => {

    try {
        const { email, accountUuid } = req;
        const { currentPassword, newPassword } = req.body;
        const _user = await Database.Account.getAccountDetailByEmail(email);
        const result = await bcrypt.compare(currentPassword, _user.password);

        if (result) {
            let result_BO = await BOController.Account.createPassword({ email: _user.email, password: newPassword });
            await Database.Account.updateAccountPassword(accountUuid, newPassword);
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
        const _user = await Database.Account.getAccountDetailByEmail(global.resetEmail);
        if (!_user) {
            return res.status(404).send({ error: "User not found" });
        }

        let result = await BOController.Account.createPassword({ email: _user.email, password: password });
        global.resetEmail = "";
        // let result = await BOController.Account.updateUserInfo({ accountUuid: _user.accountUuid, password: newPassword });
        if (result) {
            await Database.Account.updateAccountPassword(_user.accountUuid, password);
            return res.status(200).send({
                success: true,
                body: {
                }
            })
        } else {
            return res.status(200).send({
                success: false,
                error: "Failed to update password."
            })
        }
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
        const _user = await Database.Account.getAccountDetailByUuid(id);

        let result = await BOController.Account.createPassword({ email: _user.email, password: newPassword });
        // let result = await BOController.Account.updateUserInfo({ accountUuid: _user.accountUuid, password: newPassword });
        if (result) {
            await Database.Account.updateAccountPassword(id, newPassword);
            return res.status(200).send({
                success: true,
                body: {

                }
            })
        } else {
            return res.status(200).send({
                success: false,
                error: "Failed to update password."
            })
        }
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
        const _user = await Database.Account.getAccountDetailByUuid(id);
        let result = await BOController.Account.updateUserInfo({ accountUuid: _user.accountUuid, email: newEmail });
        if (result) {
            await Database.Account.updateAccountProfile(id, { email: newEmail });
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

        const user = await Database.Account.getAccountDetailByEmail(email);
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
        let result = await BOController.Account.registerUser({ email, fullname, password });
        if (!result) {
            return res.redirect(`${process.env.FRONT_ENTRY}/login`);
        }
        let branchUuid = await Database.Setting.getDefaultBranch();
        await Database.Account.createAccountSync({
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
    let result = await Database.Account.updateVerifyStatus({ _id: id, status: KYCStatus.DELETED, remark: "" });

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
            await Database.Account.updateVerifyStatus({ _id: ids[index], status: KYCStatus.APPROVED, remark: "" });
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
            let result = await Database.Account.updateVerifyStatus({ _id: ids[index], status: KYCStatus.REJECTED, remark });
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
            let result = await Database.Account.updateVerifyStatus({ _id: ids[index], status: KYCStatus.DELETED, remark });
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

const approveBulkIBStatus = async (req, res, next) => {
    const { ids, remark } = req.body;
    for (let index = 0; index < ids.length; index++) {
        await _approveIBStatus(ids[index]);
    }
    return res.status(200).send({
        success: true
    })
}

const _approveIBStatus = async (id) => {
    let tradingAccount;
    const _user = await Database.Account.getAccountDetailById(id);
    tradingAccount = await Database.TradingAccount.getIBTradingAccountByAccountUuid(_user.accountUuid);
    if (!tradingAccount)
        tradingAccount = await Database.TradingAccount.createIBTradingAccount(id);
    if (!tradingAccount) {
        return false
    }
    let user_result = null;
    user_result = await Database.Account.updateIBStatus({ id, ibStatus: IBStatus.APPROVED }, tradingAccount.tradingAccountId, tradingAccount.tradingAccountUuid);
    BotController.errors(user_result);
    if (user_result) {
        EmailController.sendIBApproved(user_result.email);
    } else {
        return false;
    }
    return true;
}
const rejectBulkIBStatus = async (req, res, next) => {
    const { ids, remark } = req.body;
    for (let index = 0; index < ids; index++) {
        await _rejectIBStatus(ids[index], remark);
    }
    return res.status(200).send({
        success: true
    })
}
const _rejectIBStatus = async (id, remark) => {

    let user_result = null;
    user_result = await Database.Account.updateIBStatus({ id, ibStatus: IBStatus.DECLINED, remark }, tradingAccount.tradingAccountId, tradingAccount.tradingAccountUuid);
    if (user_result) {
        EmailController.sendIBDecliend(user_result.email);
    } else {
        return false;
    }
    return true;
}
const getIBUser = async (req, res, next) => {
    const accountUuid = req.params.id;
    try {
        const _ibUser = await Database.Account.getAccountDetailByUuid(accountUuid);
        if (_ibUser) {

            return res.status(200).send({
                success: true,
                body: {
                    accountUuid: _ibUser.accountUuid,
                    email: _ibUser.email,
                }
            })
        }
    } catch (e) {
        return res.status(200).send({
            success: false
        })
    }
}
const updateIBUser = async (req, res, next) => {
    const accountUuid = req.params.id;
    const data = req.body;
    try {
        const user = await Database.Account.updateAccountProfile(accountUuid, data);
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
const updateGASecret = async (req, res, next) => {
    const accountUuid = req.params.id;
    try {
        const user = await Database.Account.getAccountDetailByUuid(accountUuid);
        const secret_2fa = speakeasy.generateSecret({ length: 16, symbols: 1 });
        await Database.Account.updateAccountProfile(accountUuid, {
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
        const user = await Database.Account.updateAccountProfile(accountUuid, data);
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
        const user = await Database.Account.updateAccountProfile(accountUuid, data);
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
    } else if (transactions.length == 0 && transactions) {
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
        Wallet.findOne({ ethAddress: wallet_address }).exec(async (err, wallet) => {
            if (err || !wallet) {
                return res.status(200).send("Couldn't find a wallet of this address!");
            }
            try {
                if (history.status == 0) {
                    BotController.depositByWallet(
                        wallet.email,
                        deposit_amount,
                        wallet_address,
                        wallet.tradingAccountId
                    );
                    history.status = 1;
                }
            } catch (error) {
                return res.status(500).send("Error");
                console.log(error);
            }
            const contract = new web3.eth.Contract(BNB_ABI, bnb);
            const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt);

            let sender = global.ADMIN_WALLET_ADDRESS;
            let receiver = wallet_address;
            let senderkey = global.ADMIN_WALLET_PRIVATE_KEY; //admin private key

            if (history.status == 1) {
                BalanceController._depositToTradingAccountId(
                    deposit_amount,
                    deposit_amount,
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
                const balance = await usdtContract.methods.balanceOf(receiver).call();
                const amount = web3.utils.toHex(balance);

                let result = await Web3Controller.sendBNBToWallet(
                    global.ADMIN_WALLET_ADDRESS,
                    global.ADMIN_WALLET_PRIVATE_KEY,
                    wallet_address,
                    amount
                );
                let result_to_admin = null;
                if (history.status == 2) {
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
                        global.ADMIN_WALLET_ADDRESS
                    );
                    BotController.balanceChanged(
                        deposit_amount,
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
    getIBClients,
    getIBOwnClients,
    getAccountInfo,

    saveUserProfile,
    deleteUser,
    saveUserProfileImage,

    updateProfileFromAdmin,
    updateUserBranch,
    updateIBCommissionType,
    updateStatus,
    verifyEmail,

    approveBulkKYCStatus,
    rejectBulkKYCStatus,
    deleteBulkKYCStatus,

    approveBulkIBStatus,
    rejectBulkIBStatus,
    getIBUser,
    updateIBStatus,
    updateIBUser,
    updateTFAMode,
    updateTfa,
    updateGASecret, 
    
    webhook
}

module.exports = UserController; 

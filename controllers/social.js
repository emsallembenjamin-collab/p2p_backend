const SocialAccount = require("../models/socialAccounts");
const EmailController = require("./Email");
const { templateNames } = require("./Email/constant");
const { SocialStatus, KYCStatus } = require("./constant");

const registerSocialTradingFeed = async (req, res, next) => {
    const accountUuid = req.body.params.accountUuid;
    const email = req.body.params.email;
    const socialAccountInfo = req.body.params.socialAccountInfo;
    console.log("social account info:", socialAccountInfo);
    const sStatus = SocialStatus.PENDING;

    let _socialAccountInfo = await SocialAccount.findOne({ accountUuid: accountUuid });
    if (_socialAccountInfo) {
        return res.status(501).send({ errType: "Wrong Application", errorMessage: "This user already applied the social trading Account" });
    }

    let socialAccount = new SocialAccount({
        email: email,
        accountUuid: accountUuid,
        hasWebsite: socialAccountInfo?.hasWebsite || false,
        hasClientBase: socialAccountInfo?.hasClientBase || false,
        shareTradingPerformance: socialAccountInfo?.shareTradingPerformance || false,
        promoteContent: socialAccountInfo?.promoteContent,
        tradingInstruments: socialAccountInfo?.tradingInstruments,
        tradingAccountForSocial: socialAccountInfo?.tradingAccountForSocial,
        incentiveFeePercentage: socialAccountInfo?.incentiveFeePercentage,
        sStatus: sStatus,
        createAt: new Date()
    });
    socialAccount.save(function (err, result) {
        if (err) {
            return res.status(500).send(err);
        }
        return res.status(200).send(result);
    })
}
const updateSocialAccountStatus = async (req, res, next) => {

    const sStatus = req.body.sStatus;
    const id = req.body.id;
    try {
        
        let result = await SocialAccount.findOneAndUpdate({ "_id": id }, { sStatus: sStatus } );
        if (result === null) {
            return res.status(200).send("Account doesn't exist");
        }
        let email = result.email;
        let email_file = "Social_account_approve.html";
        if (sStatus === SocialStatus.DECLINED) {
            EmailController.sendSocialAccountDeclined(email, result.declinedReason);
        }else{
            EmailController.sendSocialAccountApproved(email); 
        }
        return res.status(200).send({ message: "success" });

    } catch (e) {
        console.log(e);
        return res.status(500).json(err);
    }
}

const getSocialTradingAccountInfo = async (req, res, next) => {
    const email = req.query.email;
    const accountUuid = req.query.accountUuid;
    SocialAccount.findOne({ email, accountUuid }, function (err, result) {
        if (err) {
            return res.status(500).send({ errType: "Server Error", errorMessage: err.toString() });
        }
        return res.status(200).send({ socialAccountInfo: result });
    })
}

const getSocialTradingAccountInfoWithId = async (req, res, next) => {

    const id = req.query.id;

    SocialAccount.findOne({ _id: id }, function (err, result) {
        if (err) {
            return res.status(500).send({ errType: "Server Error", errorMessage: err.toString() });
        }
        return res.status(200).send({ socialAccountInfo: result });
    })

}

const getSocialTradingAccountInfoAll = async (req, res, next) => {

    try{
        let result = await SocialAccount.aggregate([
            {
                $lookup: {
                    from: "users", 
                    localField: "accountUuid", 
                    foreignField: "accountUuid", 
                    as: "user"
                }
            }, 
            {
                $unwind: "$user"
            }, 
            {
                $match: {
                    "user.verification_status": {
                        $ne: KYCStatus.DELETED
                    }
                }
            }, 
            {
                $project: {
                    "fullname": "$user.fullname", 
                    "email": 1, 
                    "accountUuid": 1,
                    "createAt": 1,
                    "sStatus": 1,
                }
            },
            {
                $sort: {
                    createAt: -1
                }
            }
        ])
        return res.status(200).send(result); 
    }catch(e){
        console.log(e); 
        return res.status(500).send(err);
    }
}

const SocialAccountController = {
    getSocialTradingAccountInfo, getSocialTradingAccountInfoAll, getSocialTradingAccountInfoWithId, updateSocialAccountStatus, registerSocialTradingFeed
}

module.exports = SocialAccountController; 

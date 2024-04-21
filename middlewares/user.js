const { readSettings } = require("../controllers/Commission");
const Database = require("../controllers/Database");
const { KYCStatus, IBStatus, offerNames } = require("../controllers/constant");


const EmailVerifyed = async (req, res, next) => {



}

const kycApproved = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    const email = req.email; 
    let userInfo =await Database.Account.getAccountDetailByEmail(email); 
    if(userInfo.verification_status !== KYCStatus.APPROVED){
        return res.status(403).send({
            message: "You should be approved to use this role."
        }); 
    }
    next(); 
}
const ibApproved = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    const email = req.email; 
    let userInfo =await Database.Account.getAccountDetailByEmail(email); 
    if(userInfo.ib_status !== IBStatus.APPROVED ){
        return res.status(403).send({
            message: "You should be IBClient to use this role."
        }); 
    }
    next(); 
}
const socialApproved = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    let userInfo =await Database.SocialAccount.getSocialAccountInfoByUuid(accountUuid); 
    if(userInfo.ibStatus !== IBStatus.APPROVED ){
        return res.status(403).send({
            message: "You should be IBClient to use this role."
        }); 
    }
    next(); 
}

// "rankingLabels": ["Q", "S1", "S2", "S3", "S4"], 
// "rankingCommissionLevels":[3, 4, 6, 8, 10],
// "rankingMinVolume":[0, 100, 300, 600, 1000], 
// "rankingOwnNumbers":[3, 3, 3, 3, 3], 
// "resetPeriod":90, 
// "rankingResetTime": 0

const validateWithdraw = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    let userInfo =await Database.Account.getAccountDetailByEmail(req.email);
    let data = req.body; 
    const tradingAccounts = await Database.TradingAccount.getTradingAccountByEmail(userInfo.email); 
    if(tradingAccounts){
        if(tradingAccounts.findIndex((tradingAccount)=>tradingAccount.tradingAccountId === data.tradingAccountId) ==-1)
            return res.status(403).send("Bad request"); 
        let tradingAccount  =await Database.TradingAccount.getTradingAccountByTradintAccountId(data.tradingAccountId);
        if(tradingAccount.offer.name === process.env.IBOFFER){
            const commissoinSetting = readSettings();
            if(userInfo.ibRanking <1){
                return res.status(403).send("Should be at least Qualified IB."); 
            }
            if(tradingAccount.balance <50) 
                return res.status(403).send("Not enough to withdraw.");
        }
        next(); 
    }
}

const UserValidation = {
    kycApproved, ibApproved, socialApproved, validateWithdraw
}

module.exports = UserValidation; 
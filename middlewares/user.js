const UserService = require("../controllers/Database/account");
const { KYCStatus, IBStatus, offerNames } = require("../controllers/constant");


const EmailVerifyed = async (req, res, next) => {



}

const kycApproved = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    const email = req.email; 
    let userInfo =await UserService.getAccountDetailByEmail(email); 
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
    let userInfo =await UserService.getAccountDetailByEmail(email); 
    if(userInfo.ib_status !== IBStatus.APPROVED ){
        return res.status(403).send({
            message: "You should be IBClient to use this role."
        }); 
    }
    next(); 
}

const validateWithdraw = async (req, res, next)=>{
    const accountUuid = req.accountUuid; 
    
        next(); 
}

const UserValidation = {
    kycApproved, ibApproved, validateWithdraw
}

module.exports = UserValidation; 
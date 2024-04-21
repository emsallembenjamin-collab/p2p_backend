const SocialAccount = require("../../models/socialAccounts");
const BotController = require("../Bot");
const { SocialStatus } = require("../constant");

const createSocialAccount = async (data)=>{
    let socialAccount = new SocialAccount(data); 
    try{
        let result = socialAccount.save(); 
        return result; 
    }catch(e){
        BotController.errors(e, "Create Social Account"); 
        console.log(e); 
    }
}
const findSocialAccounts = async (data)=>{
    try{
        let result =await SocialAccount.find({...data});
        return result; 
    }catch(e){
        BotController.errors(e, "findSocialAccounts");
        console.log(e);
        return false; 
    }
}
const getSocialAccountRequest = async () =>{
    const data = {
        sStatus: SocialStatus.PENDING
    }
    let result = await findSocialAccounts(data);
    return result; 
}
const getSocialAccounts = async ()=>{
    const data = {}
    let result = await findSocialAccounts(data);
    return result; 
}
const getSocialAccountInfoByUuid = async (accountUuid) =>{

    const data = {accountUuid}; 
    let result = await findSocialAccounts(data);
    if(result.length){
        return result[0]; 
    }else{
        return false; 
    }
}
const getApprovedSocialAccounts = async ()=>{
    const data = {sSttus: SocialStatus.APPROVED}; 
    let result = await findSocialAccounts(data);
    if(result.length){
        return result[0]; 
    }else{
        return false; 
    }
}
const getDeclinedSocialAccounts = async ()=>{
    const data = {sSttus: SocialStatus.DECLINED}; 
    let result = await findSocialAccounts(data);
    if(result.length){
        return result[0]; 
    }else{
        return false; 
    }
}
const updateSocialAccount = async (accountUuid, data)=>{
    try{
        let result =await SocialAccount.findOneAndUpdate({accountUuid}, {data}, {new: true}); 
        return result; 
    }catch(e){
        BotController.errors(e, "updateSoicalAccount");
    }
}
const approveSocialAccount = async (accountUuid) =>{
    const data = {sStatus: SocialStatus.APPROVED}; 
    const result = await updateSocialAccount(accountUuid, data); 
    return result;
}
const declineSocialAccount = async (accountUuid, declinedReason) =>{
    const data = {sStatus: SocialStatus.DECLINED, declinedReason}; 
    const result = await updateSocialAccount(accountUuid, data); 
    return result;
}

const SocialAccountController = {
    createSocialAccount,
    updateSocialAccount,
    approveSocialAccount, 
    declineSocialAccount, 
    getSocialAccountRequest, 
    getSocialAccounts,  
    getSocialAccountInfoByUuid,
    getApprovedSocialAccounts,
    getDeclinedSocialAccounts, 
}

module.exports = SocialAccountController; 
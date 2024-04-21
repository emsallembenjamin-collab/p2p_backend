const Mail = require("../../models/mails");
const uuid = require('uuid');
const createMail = async (data)=>{

    const Uuid= uuid.v4(); 
    const mail = new Mail({
        ...data, 
        Uuid
    }); 
    try{
        let result = await mail.save(); 
        return result; 
    }catch(e){
        return false; 
    }
}

const getMailHistoryByClientUuid = async (clientUuid)=>{
    try{
        let result =await  Mail.find({clientUuid}); 
        return result; 
    }catch(e){
        return false; 
    }
}
const getMailHistoryByClientEmail = async (email)=>{
    try{
        let result =await  Mail.find({email}); 
        return result; 
    }catch(e){
        return false; 
    }
}
const deleteMailHistoryByUuid = async (Uuid)=>{
    try{
        let result =await  Mail.deleteOne({Uuid}); 
        return result; 
    }catch(e){
        return false; 
    }
}

const deleteMailHistoryByBulk = async (data)=>{


}


const MailController = {
    createMail, 
    deleteMailHistoryByBulk, 
    deleteMailHistoryByUuid,
    getMailHistoryByClientUuid, 
    getMailHistoryByClientEmail,

}

module.exports = MailController; 


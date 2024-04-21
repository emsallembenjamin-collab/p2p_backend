const VerifyEmail = require("../../models/email-verify");
const BotController = require("../Bot");

const createVerifyEmail = async (email, link) => {
    try {
        const _verifyEmail = new VerifyEmail({
            email, link
        })
        const data =await _verifyEmail.save(); 
        return data; 
    } catch (e) {
        BotController.errors(e, "createVerifyEmail"); 
        return false; 
    }

}
const getVerifyEmail = async (email) => {
    try {
        const _verifyEmail =await VerifyEmail.findOne({email}); 
        return _verifyEmail; 
    } catch (e) {
        BotController.errors(e, "getVerifyEmail"); 
        return false; 
    }
}
const deleteVerifyEmail = async (email) => {

    try {
        const _data = await VerifyEmail.deleteOne({email}); 
        return _data; 
    } catch (e) {
        return false; 
    }
}

const VerifyEmailController = {
    createVerifyEmail, getVerifyEmail, deleteVerifyEmail
}
module.exports = VerifyEmailController; 

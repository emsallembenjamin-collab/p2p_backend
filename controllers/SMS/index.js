const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sendSMS =async ( to, message) => {
    try{
        await client.messages
            .create({
                body: message,
                from: process.env.TWILIO_PHONE,
                to: to
            })
        return true; 
    }catch(e){
        return false; 
    }
}

module.exports = sendSMS; 
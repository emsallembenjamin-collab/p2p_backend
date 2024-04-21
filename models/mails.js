
const mongoose = require("mongoose");
const Mail = mongoose.model(
    "Mails",
    new mongoose.Schema({
        Uuid: String, 
        clientUuid: String, 
        emai: String, 
        status: String, 
        ceatedAt: {
            type: Date, 
            default: new Date()
        },
        subject: String, 
        description: String, 
    })
);
module.exports = Mail;
const { readHTMLFile } = require("../../utils/helper.js");
const BotController = require("../Bot/index.js");
const { templateNames, replaceData, messageContent } = require('./constant.js')
const handlebars = require('handlebars');
const nodemailer = require("nodemailer");


let smtpTransport = nodemailer.createTransport({
    service: "smtp",
    host: process.env.MAIL_HOST,
    secure: true,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

const sendEmail = async (template, data, toEmail, subject) => {
    const path = `${__dirname}/../../public/email_template/${template}`;
    console.log({ template, data, toEmail });
    readHTMLFile(path, function (err, html) {
        if (err) {
            console.log('error reading file', err);
            return;
        }
        var template = handlebars.compile(html);
        var replacements = {
            ...data
        };
        var htmlToSend = template(replacements);
        var mailOptions = {
            from: `${process.env.MAIL_NAME} <${process.env.MAIL_USERNAME}>`,
            to: toEmail,
            bcc: process.env.MAIL_USERNAME,
            subject: subject,
            html: htmlToSend
        };
        smtpTransport.sendMail(mailOptions, async (error, response) => {
            const Database = require("../Database"); 
            if (error) {
                await Database.Mail.createMail({ email: toEmail, subject, status: "Failed" });
                BotController.error(error, "SendEmail"); 
                console.log(error);
            } else {
                await Database.Mail.createMail({ email: toEmail, subject, status: "Succeed" });
                console.log("Message sent: " + response.response);
            }
        });
    });
}

const sendUserApproved = async (email) => {
    const subject = "Your verification documents are approved";
    const replacements ={}
    await sendEmail(templateNames.KYC_APPROVED, replacements, email, subject);
}
const sendUserDeclined = async (email, remark) => {
    var replacements =  { REMARK: remark };
    const subject = "Your verification documents are declined";
    await sendEmail(templateNames.KYC_DECLINED, replacements, email, subject);
}
const sendIBApproved = async (email) => {
    var replacements =  { };
    const subject = "Welcome you to become our IB";
    await sendEmail(templateNames.IB_REQUEST_APPROVE, replacements, email, subject);
}
const sendIBDecliend = async (email, reason) => {
    var replacements = {
        REMARK: reason
    };
    const subject = "Your IB request was decliend";
    await sendEmail(templateNames.IB_REQUEST_DECLINE, replacements, email, subject);
}
const sendEmailVerify = async (email) => {


}
const sendChangePassword = async (email,) => {


}
const sendCreateTradingAccount = async (email,) => {


}
const sendWithdrawDeclined = async (email, amount, tradingAccountId, decline_reason, remark) => {
    var replacements = {
        AMOUNT: amount,
        TRADING_ACCOUNT_ID: tradingAccountId,
        DECLINE_REASON: decline_reason,
        REMARK: remark
    };
    const subject = "Your withdraw was declined!";
    await sendEmail(templateNames.WITHDRAW_DECLINED, replacements, email, subject);
}
const sendWithdrawSuccess = async (email, amount, tradingAccountId) => {
    var replacements = {
        AMOUNT: amount,
        TRADING_ACCOUNT_ID: tradingAccountId
    };
    const subject = "Your withdrawal was proceeded";
    await sendEmail(templateNames.WITHDRAW_SUCCEED, replacements, email, subject);
}
const verifyEmail = async (email, link) => {
    var replacements = {
        VERIFY_LINK: link,
    };
    const subject = "Please verify your email";
    await sendEmail(templateNames.VERIFY_EMAIL, replacements, email, subject);
}
const forgotPassword = async (email, link) => {
    var replacements = {
        EMAIL_ADDRESS: email,
        RESET_LINK: link,
    };
    const subject = "Password reset request";
    await sendEmail(templateNames.FORGOT_PW, replacements, email, subject);
}
const sendDepositSuccess = async (email, deposit_amount) => {
    var replacements = {
        AMOUNT: deposit_amount,
    };
    const subject = "Your deposit was successful";
    await sendEmail(templateNames.DEPOSIT_SUCCESS, replacements, email, subject);
}

const sendTFACode =async (email, secret)=>{
    var replacements = {
        SECRET: secret,
    };
    const subject = "Signin code";
    await sendEmail(templateNames.TFA_VERIFY_CODE, replacements, email, subject);
}
const addAdmin =async (email, password)=>{
    var replacements = {
        PASSWORD: password,
        EMAIL: email
    };
    const subject = "Simga added you as admin.";
    await sendEmail(templateNames.ADMIN_INVIATE, replacements, email, subject);
}
const sendNotification =async (email, data)=>{
    let replacements = {    
        SUBJECT: data.subject,
        CONTENT: data.content
    }
    const subject = data.subject; 
    await sendEmail(templateNames.ADMIN_NOTIFICATION, replacements, email, subject);
}
const sendWithdrawVerifyCode =async (email, code)=>{
    let replacements = {    
        VERIFY_CODE: code,
    }
    const subject = "The withdrawal code"; 
    await sendEmail(templateNames.VERIFY_CODE, replacements, email, subject);
}
const sendTFAVerifyCode =async (email, code)=>{
    let replacements = {    
        VERIFY_CODE: code,
    }
    const subject = messageContent.TFA_VERIFY_CODE; 
    await sendEmail(templateNames.TFA_CODE, replacements, email, subject);
}
const sendKYCRecieved =async (email)=>{
    const replacements ={}
    const subject = "Your verification documents are being reviewed"; 
    await sendEmail(templateNames.KYC_RECEIVED, replacements, email, subject);
}
const sendSocialAccountApproved = async (email)=>{
    const replacements ={}
    const subject = "Your application for social trading account is approved. "; 
    await sendEmail(templateNames.SOCIAL_ACCOUNT_APPROVE, replacements, email, subject);
}
const sendSocialAccountDeclined = async (email, reason)=>{
    const replacements ={REMARK: reason}
    const subject = "Your application for social trading account is declined."; 
    await sendEmail(templateNames.SOCIAL_ACCOUNT_DECLINE,  replacements, email, subject);
}
const sendAccountCreated = async (email)=>{
    const replacements ={}
    const subject = "A new trading account has been established"; 
    await sendEmail(templateNames.OPEN_LIVE_ACCOUNT,  replacements, email, subject);
}
const sendDemoAccountCreated = async (email)=>{
    const replacements ={}
    const subject = "New trading account was created."; 
    await sendEmail(templateNames.OPEN_DEMO_ACCOUNT,  replacements, email, subject);
}

const EmailController = {
    sendEmail,
    sendUserApproved,
    sendUserDeclined,
    sendEmailVerify,
    sendChangePassword,
    sendCreateTradingAccount,
    sendWithdrawDeclined,
    sendWithdrawVerifyCode,
    sendWithdrawSuccess,
    verifyEmail,
    forgotPassword,
    sendDepositSuccess,
    sendIBDecliend, 
    sendIBApproved,
    sendTFACode, 
    addAdmin,
    sendNotification, 
    sendKYCRecieved, 
    sendSocialAccountApproved,
    sendSocialAccountDeclined,
    sendTFAVerifyCode,
    sendAccountCreated,
    sendDemoAccountCreated
}
module.exports = EmailController; 


const TelegramBot = require('node-telegram-bot-api');
const { PaymentType } = require('../constant');
const bot_enabled = Number(process.env.TELEGRAM_ENABLED);
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
console.log("telegram", token); 
const sendLogin = (email) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} loged in.${new Date()}`);
}
const sendAdminLogin = (email) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `Admin ${email} loged in.${new Date()}`);
}
const userSignup = (email) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} registered at ${new Date()}`);
}
const userApporved = (email) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} Approved at ${new Date()}`);
}
const emailVerified = (email) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} verified email at ${new Date()}`);
}

const kycUploaded = (email) =>{
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} uploaded kyc documents.`); 
}

const createTradingAccount = (email, tradingAccountId) => {
    bot.sendMessage(process.env.TRADING_ACCOUNT_CHAT_ID, `${email} created ${tradingAccountId} at ${new Date()}`);
}
const deleteUser = (email, userEmail) => {
    bot.sendMessage(process.env.SIGMA_CHANNEL_ID, `${email} deleted ${userEmail} at ${new Date()}`);
}
const depositByWallet = (email, amount,wallet) => {
    bot.sendMessage(process.env.DEPOSIT_CHAT_ID, `${email} deposited ${amount} from ${wallet} at ${new Date()}`);
}
const depositByCredit = (email, amount, bankName, tradingAccountId) => {
    bot.sendMessage(process.env.DEPOSIT_CHAT_ID, `${email} deposited ${amount} from ${bankName}to ${tradingAccountId} at ${new Date()}`);
}
const internalTransfer = (email, amount, t1, t2) => {
    bot.sendMessage(process.env.INTERNAL_TRANSFER_CHAT_ID, `${email} transfered ${amount} from ${t1} to ${t2} at ${new Date()}`);
}
const balanceChanged = (amount, type, tradingAccountId, adminBalance) => {
    if (type === PaymentType.DEPOSIT) {
        bot.sendMessage(process.env.BALANCE_CHAT_ID, `+${amount}USDT by deposit from ${tradingAccountId}: total ${adminBalance}  `);
    } else {
        bot.sendMessage(process.env.BALANCE_CHAT_ID, `-${amount}USDT by withdrawal from ${tradingAccountId}: total ${adminBalance}  `);
    }
}
const withdrawRequest = (email, tradingAccountId, amount, balance) => {
    bot.sendMessage(process.env.WITHDRAW_REQUEST_CHAT_ID, `${amount}USD Withdraw Request  from ${tradingAccountId}: Withdrawable Amount ${balance}`);
}
const withdrawConfirmedByCredit = (email, tradingAccountId, amount, method) => {
    bot.sendMessage(process.env.WITHDRAW_REQUEST_CHAT_ID, `${amount}USD Withdraw  from ${tradingAccountId} via ${method}`);
}
const withdrawConfirmedByWallet = (email, tradingAccountId, amount) => {
    bot.sendMessage(process.env.WITHDRAW_REQUEST_CHAT_ID, `${amount}USD Withdraw  from ${tradingAccountId}`);
}
const errors = (error, type)=>{
    bot.sendMessage(process.env.WITHDRAW_REQUEST_CHAT_ID, `${JSON.stringify(error)}:${type}`);
}
const ibAccountCreated = (data, type)=>{
    bot.sendMessage(process.env.WITHDRAW_REQUEST_CHAT_ID, `${JSON.stringify(data)}:${type}`);
}

const BotController = {
    sendLogin,
    createTradingAccount,
    deleteUser,
    userSignup,
    emailVerified,
    kycUploaded,
    depositByCredit,
    depositByWallet,
    internalTransfer,
    balanceChanged,
    withdrawRequest,
    withdrawConfirmedByCredit,
    withdrawConfirmedByWallet,
    userApporved,
    errors, 
    ibAccountCreated, 
    sendAdminLogin
}
module.exports = BotController; 
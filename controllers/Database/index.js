
const Admin = require('./admin'); 
// const Partner = require('./partner'); 
const TradingAccount = require('./trading_account'); 
// const Transaction = require('./transaction'); 
const Account = require('./account');
const Offer = require("./offer");
const PaymentGateway = require("./payment_gateway");
const PaymentMethod = require("./payment_method");
const KYC = require('./kyc');
const Withdraw = require('./withdrawal');
const Deposit = require('./deposit');
const Branch = require('./branch');
const Setting = require('./setting');
const SysLog  = require('./syslogs');
const Commission = require('./commissionSetup');
const Mail = require('./mail');
const SocialAccount = require('./social');
const VerifyEmail = require('./verifyEmail');
const Position = require('./position');
const SymbolLevel = require('./symbol_level');
const Role = require('./role');

const Database = {
    Admin, 
    TradingAccount, 
    Offer,
    Account,
    PaymentGateway, 
    PaymentMethod,
    KYC,
    Withdraw, 
    Deposit,
    Branch, 
    Setting,
    SysLog,
    Commission,
    Mail, 
    SocialAccount, 
    VerifyEmail,
    Position, 
    SymbolLevel, 
    Role
}
module.exports = Database;

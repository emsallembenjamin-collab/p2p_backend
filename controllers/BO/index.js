const Account = require('./account');
const TradingAccountController = require('./tradingAccount');

const BOController = {
    Account, 
    TradingAccount: TradingAccountController

}
module.exports = BOController; 

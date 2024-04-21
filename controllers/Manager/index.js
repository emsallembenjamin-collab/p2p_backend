const Register  = require('./register');
const Symbol    = require('./symbol');
const Ledger    = require('./ledger');
const Hedge     = require('./hedge');
const Group     = require('./group');
const Balance   = require('./balance');
const Account   = require('./account');
const Position  = require('./accountPosition');
const Order     = require('./order'); 

const Manager_Api_Token = ""; 
const ManagerApi = {
    Register, Symbol, Ledger, Hedge, Group, Balance, Account, Position, Order, Manager_Api_Token
}
module.exports = ManagerApi;

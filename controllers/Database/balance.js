const Deposit = require("../../models/report");
const uuid = require('uuid');
const { DepositMode, AccountRole, IBStatus } = require("../constant");
const BotController = require("../Bot");



const depositUsdt = (accountUuid, amount)=>{

    
}
const depositFiat = (accountUuid, amount)=>{


}
const withdrawUsdt = (accountUuid, amount)=>{

}
const withdrawFiat = (accountUuid, amount)=>{

}
const getDepositHistory = ( )=>{

}
const getWithdrawHistory = ( )=>{

}


const BalanceService = {

    depositUsdt, 
    depositFiat, 
    withdrawUsdt,
    withdrawFiat, 

    getDepositHistory, 
    getWithdrawHistory, 

}

module.exports = BalanceService;

const request = require('./request');

const getEntries = (  data) =>{
    return request( data,'ledger/getEntries')
}
const getClosedTrades = (  data)=>{
    return request( data, 'ledger/getClosedTrades')
}
const editCommentForDepositOrWithdrawal = (  data)=>{
    return request( data, 'ledger/editCommentForDepositOrWithdrawal')
}
const deleteClosedTrades = (  data)=>{    
    return request( data, 'ledger/deleteClosedTrades')
}
const deleteClosedTrade =(  data)=>{
    return request( data, 'ledger/deleteClosedTrade')
}

const Ledger= {
    getEntries, getClosedTrades, editCommentForDepositOrWithdrawal, deleteClosedTrade, deleteClosedTrades
}
module.exports = Ledger; 
const request = require('./request');

const withDrawMoney = ( data)=>{
    return request(data, 'balance/withdrawMoney')
}
const getBalanceSnapshots = ( data)=>{
    
    return request(data, 'balance/getBalanceSnapshots')
}
const depositMoney =( data)=>{
    return request(data, 'balance/depositMoney')
}
const creditOut = ( data)=>{
    return request(data, 'balance/creditOut')
}
const creditIn = ( data)=>{
    return request(data, 'balance/creditIn')
}
const Balance = {
    withDrawMoney, getBalanceSnapshots, depositMoney, creditIn, creditOut
}

module.exports = Balance;
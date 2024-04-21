const request = require('./request');

const getLoggedUsers = ( data)=>{
    return request(data, 'account/getLoggedUsers')
}
const getInfo = ( clientId)=>{

    return request({clientId}, 'account/getInfo')
}
const getAllGroup = ( data)=>{
    return request(data, 'account/getAllGroup')
}
const getAllForManager =( data)=> {
    return request(data, 'account/getAllForManager')
}
const getAll = ( clientIds)=>{
    
    const data = {clientIds}
    return request(data, 'account/getAll')
}
const edit = ( data)=>{
    return request(data, 'account/edit')
}
const deleteAccount = ( data)=>{
    return request(data, 'account/deleteAccount')
}
const create = ( data)=>{
    return request(data, 'account/create')
}
const changePassword= ( data)=>{
    return request(data, 'account/changePassword')
}
const Account ={
    getLoggedUsers, getInfo, getAllGroup, getAllForManager, getAll, edit, deleteAccount, create,changePassword
}

module.exports = Account; 
const request = require('./request');

const remove = (  data)=>{
    return request( data, 'position/remove')
}
const getAll=(  data)=>{
    return request( data, 'position/getAll')
}
const editVolume=(  data)=>{
    return request( data, 'position/editVolume')
}
const editSwap=(  data)=>{
    return request( data, 'position/editSwap')
}
const editOpenTime =(  data)=>{
    return request( data, 'position/editOpenTime')
}
const editSide = (  data)=>{
    return request( data, 'position/creditIn')
}
const editOpenPrice = (  data)=>{
    return request( data, 'position/editSide')
}
const editCommission=(  data)=>{
    return request( data, 'position/editCommission')
}
const closeAtDesiredPrice = (  data)=>{
    return request( data, 'position/closeAtDesiredPrice')
}
const close = (  data)=>{
    return request( data, 'position/close')
}
const Position = {
    remove, getAll, editVolume, editSwap, editOpenPrice, editOpenTime, editSide, editCommission, closeAtDesiredPrice, close
}

module.exports  = Position; 
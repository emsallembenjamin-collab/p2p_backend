const request = require('./request');

const getReport = (  data)=>{
    return request( data, 'hedge/getReport')
}

const getLog= (  data)=>{
    return request( data, 'hedge/getLog')
}
const getPList = (  data)=>{
    return request( data, 'hedge/getPList')
}
const adjustRetail = (  data)=>{
    return request( data, 'hedge/adjustRetail')
}
const adjust=(  data)=>{
    return request( data, 'hedge/adujst')
}

Hedge= {
    getReport, getLog, getPList, adjust, adjustRetail
}
module.exports = Hedge;
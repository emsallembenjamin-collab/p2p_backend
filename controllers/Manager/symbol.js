
const request = require('./request');

const getLastTick = (symbolName)=>{
    return request( {symbolName}, 'symbol/getLastTick')
}
const getAll= (data={} )=>{
    return request( data,'symbol/getAll')
}
const Symbol = {
    getLastTick, getAll
}
module.exports = Symbol;
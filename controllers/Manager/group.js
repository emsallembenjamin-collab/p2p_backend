const request = require('./request');

const getDetailedGroup = ( data)=>{
    return request( data, 'group/getDetailGroup')
}
const getGroupNames=( )=>{
    return request( {}, 'group/get')
}
const Group = {
    getDetailedGroup, getGroupNames
}

module.exports = Group; 
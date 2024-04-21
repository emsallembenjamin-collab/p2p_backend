


const axios = require('axios');

const ApiServer = process.env.MANAGE_API_SERVER || "https://manager-api-mt.match-trade.com";
const config = {
   method: 'post',
   maxBodyLength: Infinity,
   url: `${ApiServer}/v1/register/`,
   headers: {
       'Content-Type': 'application/json'
   },
   data: null
};
const register= ()=>{
    return request('register')
}
const unregister = ()=>{
    return request(  'unregister')
}
const request = ( apiName)=>{
    let _data={
          managerID: process.env.MMANAGER_ID, 
          password:  process.env.MANAGER_PASSWORD
    }
    let _config = {
       ...config, 
       url:`${config.url}${apiName}`, 
       data: _data
    }
    console.log(_config);
    return new Promise((resolve, reject)=>{
       axios.request(_config).then(res=>{
          resolve(res); 
       }).catch(e=>{
          reject(e);
       });
    })
  }
const Register = {
    register, unregister
}
module.exports = Register;

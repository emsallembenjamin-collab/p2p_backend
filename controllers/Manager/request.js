
const axios = require('axios');
const BotController = require('../Bot');
const API_SERVER = process.env.MANAGE_API_SERVER ?? "https://manager-api-mt.match-trade.com"
const config = {
   method: 'post',
   maxBodyLength: Infinity,
   url: `${API_SERVER}/v1/`,
   headers: {
      'Content-Type': 'application/json'
   },
   data: null
};

const request = (data, apiName) => {
   let _data = {
      auth: {
         managerID: process.env.MMANAGER_ID,
         token: global.manager_api_token
      },
      ...data
   }
   let _config = {
      ...config,
      url: `${config.url}${apiName}`,
      data: _data
   }
   return new Promise((resolve, reject) => {
      axios.request(_config).then(res => {
         resolve(res);
      }).catch(e => {
         BotController.errors(e, "Manager request"); 
         reject(e);
      });
   })
}

module.exports = request;


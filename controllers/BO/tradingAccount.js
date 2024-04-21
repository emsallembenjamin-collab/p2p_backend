const axios = require('axios');
const createTradingAccount = async ({clientUuid,offerUuid, commissionUuid}) => {
    let headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
    const partnerId = global.partnerId;
    const adminUuid = global.adminUuid;
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/proxy/processing/api/trading-account/create/sync`,
        headers: {
            ...headers
        },
        data: {
            partnerId, 
            adminUuid,
            offerUuid, 
            clientUuid, 
            commissionUuid
        }
    };
    try {
        let accountRes = await axios.request(config);
        return accountRes;
    } catch (e) {
        console.log("BOContorller" ,e);
        return false;
    }
}

const TradingAccountController = {
    createTradingAccount
}

module.exports = TradingAccountController; 
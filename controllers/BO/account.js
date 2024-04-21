const axios = require('axios');
const BotController = require('../Bot');

const getAdminToken = async () => {
    const auth = {
        "grant_type": process.env.AUTH_GRANTTYPE,
        "password": process.env.AUTH_PASSWORD,
        "username": process.env.AUTH_USERNAME,
    }
    let headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": process.env.AUTH_AUTHORIZATION, //"Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0",
        "Cookie": process.env.AUTH_COOKIE //"JSESSIONID=C91F99D6BBE3F8CC5F53D43ED03FBE44"
    }
    try {

        let result = await axios.post(`${process.env.API_SERVER}/proxy/auth/oauth/token`, auth, { headers })
        headers = {
            "Authorization": `Bearer ${result.data.access_token}`,
        }
        global.mySpecialVariable = headers;
        global.adminUuid = result.data.account_uuid;
        global.partnerId = result.data.partnerId;

    } catch (e) {
        console.log("******", e);
        BotController.errors("Failed to update admin token for BO");
    }
}

const registerUser = async ({ email, ...data }) => {
    let headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
    const partnerId = global.partnerId;
    const branchUuid = process.env.BRANCH_UUID;
    const adminUuid = global.adminUuid;
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/proxy/processing/api/accounts/sync`,
        headers: {
            ...headers
        },
        data: {
            branchUuid,
            adminUuid,
            "account": {
                ...data,
                "partnerId": partnerId,
                "email": email,
                "leadInfo": {
                    "leadSource": "Google"
                },
                status: "VERIFIED"
            }
        }
    };
    try {
        let accountRes = await axios.request(config);
        return accountRes;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const createTradingAccount = async (data) => {
    let headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
    const partnerId = global.partnerId;
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/proxy/processing/api/trading-account/create/sync`,
        headers: {
            ...headers
        },
        data: {
            "account": {
                "partnerId": partnerId,
                "email": email,
                ...data,
                "leadInfo": {
                    "leadSource": "Google"
                }
            }
        }
    };
}
const createPassword = async ({ email, password }) => {
    
    let headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
    const partnerId = global.partnerId;
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/proxy/auth/api/user/change-password`,
        headers: {
            ...headers
        },
        data: {
            "email": email,
            "partnerId": partnerId,
            "newValue": password
        }
    };
    try {
        let result = await axios.request(config);
        return result;
    } catch (e) {
        BotController.errors(e, "create Password of BO ")
        console.log(e);
        return false;
    }
}
const updateUserInfo = async (data) => {
    let headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
    const partnerId = global.partnerId;
    let config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/documentation/account/api/partners/${partnerId}/accounts/${data.accountUuid}`,
        headers: {
            ...headers
        },
        data: {
            ...data
        }
    };
    try {
        let result = await axios.request(config);
        return result;
    } catch (e) {
        BotController.errors(e, "updateUserInfo of BO ")
        console.log(e);
        return false;
    }
}
const getOffers = async () => {
    const partnerId = global.partnerId;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/documentation/config/api/partner/${partnerId}/offers`,
        headers: {
            ...global.mySpecialVariable
        }
    };
    try {
        let offers = await axios.request(config);
        if (offers.data.length) {
            const Database = require('../Database');
            let result = await Database.Offer.addOffers(offers.data);
        }
    } catch (e) {
        console.log(e);
    }
}

const checkEmailFromBO = async (email) => {

    const partnerId = global.partnerId;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.API_SERVER}/documentation/account/api/partners/${partnerId}/accounts/by-email?email=${email}`,
        headers: {
            ...global.mySpecialVariable,
            "Cookie": process.env.AUTH_COOKIE,
            "Content-Type": "application/json"
        }
    };
    try {
        let userInfo = await axios.request(config);
        if (userInfo) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        BotController.errors(JSON.stringify(e), "Check Email from BO 167");
        return false;
        console.log(e);
    }
}

const AccountController = {
    getAdminToken,
    registerUser,
    createTradingAccount,
    getOffers,
    createPassword,
    updateUserInfo,
    checkEmailFromBO
}
module.exports = AccountController; 

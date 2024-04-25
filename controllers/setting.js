const Setting = require('../models/setting');
const SettingService = require('./Database/setting');


const updateTelegram = async (req, res, next) => {

    let branchUuid =  req.body.telegram;
    let result = await SettingService.updateTelegram(telegram)
    if(result)    {
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false , 
            error: "Internal Server Error"
        })
    }
    
}

const getTelegram = async (req, res, next) => {
    let result = await SettingService.getTelegram(); 
    if(result)    {
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false , 
            error: "Internal Server Error"
        })
    }
    
}
const getSettingInfo = async (req, res, next) => {

    try {
        let result = await Setting.findOne({});
        return result;
    } catch (e) {
        console.log("Getting Setting Info:", e);
        return false;
    }
}

const SettingController = {
     updateTelegram,  getSettingInfo, getTelegram }

module.exports = SettingController;

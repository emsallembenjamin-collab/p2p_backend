const Setting = require('../models/setting');
const Database = require('./Database');

const updateDefaultBranch = async (req, res, next) => {

    let branchUuid =  req.body.branchUuid;
    let setting =await Database.Setting.updateDefaultBranch(branchUuid)
    if(setting){
        let result =await Database.Branch.getBranchDetailsByUuid(branchUuid);
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
const updateDefaultCommissionType = async (req, res, next) => {

    let commissionType =  req.body.commissionType;
    let setting =await Database.Setting.updateCommissionType(commissionType)
    if(setting){
        return res.status(200).send({
            success: true, 
            body: setting.commissionType
        })
    }else{
        return res.status(200).send({
            success: false , 
            error: "Failed to update default commission type."
        })
    }

}
const updateTelegram = async (req, res, next) => {

    let branchUuid =  req.body.telegram;
    let result = await Database.Setting.updateTelegram(telegram)
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
const getDefaultBranch = async (req, res, next) => {
    
    let branchUUid = await Database.Setting.getDefaultBranch();
    if(branchUUid) {
        let result = await Database.Branch.getBranchDetailsByUuid(branchUUid);

        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false , 
            error: "Default Branch was not set."
        })
    }
    
}
const getDefaultCommissionType = async (req, res, next) => {
    
    let commissionType = await Database.Setting.getCommissionType();
    return res.status(200).send({
        success: true, 
        body: commissionType
    })
    
}

const getTelegram = async (req, res, next) => {
    let result = await Database.Setting.getTelegram(); 
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
    updateDefaultBranch, updateTelegram, getDefaultBranch, getSettingInfo, getTelegram, 
    getDefaultCommissionType, updateDefaultCommissionType
}

module.exports = SettingController;

const Setting = require('../../models/setting');

const createDefaultBranch =async  (branchUuid) => {
    try {
        let setting = new Setting({
            branchUuid,
            telegram: ""
        });
        let result = setting.save();
        return result;
    } catch (e) {
        console.log(e);
        return false; 
    }
}

const updateDefaultBranch = async (branchUuid) => {

    let setting = await getSettingInfo();
    console.log(setting);
    try {
        if (!setting) {
            return await createDefaultBranch(branchUuid);
        }
        setting.branchUuid = branchUuid;
        result = await setting.save();
        return result;
    } catch (e) {
        return false;
    }

}
const updateTelegram = async (telegram) => {

    let setting = await getSettingInfo();
    if (!setting) {
        return false;
    }
    setting.telegram = telegram;
    try {
        result = await setting.save();
    } catch (e) {
        return false;
    }

}
const updateCommissionType = async (commissionType) => {
    let setting = await getSettingInfo();
    if (!setting) {
        return false;
    }
    setting.commissionType = commissionType;
    try {
        result = await setting.save();
        return result; 
    } catch (e) {
        return false;
    }
}
const getDefaultBranch = async () => {
    let result = await getSettingInfo();
    if (result) {
        return result.branchUuid;
    } else {
        return false;
    }
}
const getTelegram = async () => {
    let result = await getSettingInfo();
    if (result) {
        return result.telegram;
    } else {
        return false;
    }
}

const getCommissionType = async () =>{
    let settingInfo = await getSettingInfo(); 
    if(settingInfo) {
        return settingInfo.commissionType
    }else {
        return false;
    }
}
const getSettingInfo = async () => {
    try {
        let result = await Setting.findOne({});
        return result;
    } catch (e) {
        console.log("Getting Setting Info:", e);
        return false;
    }
}


const SettingModel = {
    updateDefaultBranch, updateTelegram, updateCommissionType, getDefaultBranch, getSettingInfo, getTelegram, getCommissionType, 
}

module.exports = SettingModel;

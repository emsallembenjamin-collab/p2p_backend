const Commission = require("../../models/commission");
const CommissionLevel = require("../../models/commissionLevel");
const uuid = require("uuid");
const { commissionTypes } = require("../constant");

const createCommission = async (data) => {
    const commissionUuid = uuid.v4();
    try {
        let commission = new Commission({
            ...data,
            commissionUuid
        });
        let result = await commission.save();
        return result;
    } catch (e) {
        return false;
    }
}
const checkCommissionExistByName = async (name) => {

    const query = { name };
    let result = await findCommissionsByQuery(query);
    if (result.length) return true;
    return false;
}
const deleteCommissionByUuid = async (commissionUuid) => {
    try {
        let result = await Commission.deleteOne({ commissionUuid });
        await CommissionLevel.deleteMany({commissionUuid}); 
        return result;
    } catch (e) {
        return false;
    }
}
const deleteCommissionLevelByUuid = async (commissionLevelUuid) => {
    try {
        let result = await CommissionLevel.deleteOne({ commissionLevelUuid });
        return result;
    } catch (e) {
        return false;
    }
}
const createCommissionLevel = async (data) => {
    let commissionLevelUuid = uuid.v4();
    try {
        let commissionLevel = new CommissionLevel({
            ...data,
            commissionLevelUuid
        })
        let result = await commissionLevel.save();
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const getAllCommmissions = async () => {
    const query = {};
    let result = await findCommissionsByQuery(query);
    return result;
}

const getCommissionDetails = async (data) => {
    const { commissionUuid } = data;
    const query = { commissionUuid };
    let result = await findOneFromCommissions(query);
    return result;
}

const getCommissoinLevelsForCommission = async (commissionUuid) => {
    const query = {
        commissionUuid
    }
    let result = await excuteQueryCommissionLevels(query);
    return result;
}
const getCommissionLevelByUuid = async (commissionLevelUuid) => {
    const query = {
        commissionLevelUuid
    };
    let result = await excuteQueryCommissionLevel(query);
    return result;
}
const getCommissionLevelForIB = async (offerUuid) => {
    const query = {
        offerUuid,
        type: commissionTypes.COM_100K
    }
    let result = await excuteQueryCommissionLevel(query);
    return result;
}


const updateCommissionLevel = async (commissionLevelUuid, data) => {
  try{
    let result =await CommissionLevel.updateOne({commissionLevelUuid}, {...data}, {new: true}); 
    return result; 
  }catch(e){
    return false; 
  }
}

const updateCommissionInfo = async (data) => {


}
const findOneFromCommissions = async (query) => {
    let result = await findCommissionsByQuery(query);
    if (!result || !result.length) return false;
    return result[0];
}
const findCommissionsByQuery = async (query) => {
    try {
        let result = await Commission.find({ ...query });
        return result;
    } catch (e) {

    } return false;
}
const excuteQueryCommissionLevel = async (query) => {
    try {
        let result = await CommissionLevel.findOne({ ...query });
        return result;
    } catch (e) {
        return false;
    }
}
const excuteQueryCommissionLevels = async (query) => {
    try {
        let result = await CommissionLevel.find({ ...query });
        return result;
    } catch (e) {
        return false;
    }
}
const getCommissionLevelsBySymbolAndOffer = async (symbol, offerUuid, commissionType) => {
    try {
        let commission_info = await Commission.aggregate([
            {
                $match: {
                    commissionType: commissionType, 
                }
            },
            {
                $lookup: {
                    from: "commissionlevels",
                    foreignField: "commissionUuid",
                    localField: "commissionUuid",
                    as: "commissionlevels"
                }
            },
            {
                $unwind: "$commissionlevels"
            },
            {
                $match: {
                    "commissionlevels.offerUuid": offerUuid, 
                }
            },
            {
                $project: {
                    commissionType: 1,
                    "levels": "$commissionlevels.levels",
                    "isAllInstrument":"$commissionlevels.isAllInstrument", 
                    "commissionLevelUuid": "$commissionlevels.commissionLevelUuid", 
                }
            }
        ])
        return commission_info[0]; 
    } catch (e) {

        return false;
    }
}

const CommissionSetupController = {
    createCommission,
    createCommissionLevel,
    checkCommissionExistByName,
    getAllCommmissions,
    getCommissionDetails,
    updateCommissionLevel,
    updateCommissionInfo,
    deleteCommissionLevelByUuid,
    deleteCommissionByUuid,
    getCommissoinLevelsForCommission,
    getCommissionLevelByUuid,
    getCommissionLevelForIB,
    getCommissionLevelsBySymbolAndOffer,
}
module.exports = CommissionSetupController; 

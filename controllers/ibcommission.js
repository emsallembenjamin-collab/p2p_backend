const Database = require("./Database");
const { IBStatus, KYCStatus, commissionTypeNames } = require("./constant");
const BotController = require("./Bot");
const { readSettings } = require("./Commission");
const IBCommission = require("../models/ib_commission");

const getIBClients = async (req, res, next) => {

    const {adminUuid, role} = req; 
    let result;
    result = await Database.Account.getIBClients({adminUuid, role});
    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const getIBOwnClients = async (req, res, next) => {

    const id = req.params.id;
    const account = await Database.Account.getAccountDetailById(id);
    if (account) {
        const parentTradingAccountId = account.ibParentTradingAccountId;
        const verification_status = KYCStatus.APPROVED;
        const _ibClients = await Database.Account.getIBOwnClients({ parentTradingAccountId, verification_status });
        return res.status(200).send({
            success: true,
            body: _ibClients
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const getIBOwnClientsTree = async (req, res, next) => {


    const id = req.params.id;
    const account = await Database.Account.getAccountDetailById(id);
    if (account) {
        const parentTradingAccountId = account.ibParentTradingAccountId;
        const verification_status = KYCStatus.APPROVED;

        /////////// Get setting for IB ranking
        let start = 0, end = 3; 
        
        // const commissionSetting = readSettings(); 
        // const index = account.ibRanking;
        // if(index == 0 || index == 1){
        //     start = 0; 
        //     end = commissionSetting.rankingCommissionLevels[0]; 
        // }else {
        //     start = commissionSetting.rankingCommissionLevels[index-1]; 
        //     end= commissionSetting.rankingCommissionLevels[index]; 
        // }

        /////// get tree and summary info 
        let summary = {
            totalQClients:0, 
            totalIbs:0, 
            totalVolume: 0
        }
        const _ibClients = await Database.Account.createIBClientTree(parentTradingAccountId, 0, start, end, summary);
        return res.status(200).send({
            success: true,
            body: _ibClients, 
            summary: summary
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}



const getIBCommissions = async (req, res, next) => {

    let result;
    result = await Database.Commission.getAllCommmissions();
    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: false,
            code: 500,
            error: "Internal Server Error"
        })
    }
}

const getIBCommissionHistory = async (req, res, next) => {
    
    const {email, adminUuid, role} = req;
    try {
        let result = await Database.Deposit.getIBCommissionHistory(adminUuid, role);
        return res.status(200).send({
            success: true,
            body: result
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
            error: "server error"
        })
    }
}
const createCommission = async (req, res, next) => {

    let result;

    if (await Database.Commission.checkCommissionExistByName(req.body.name)) {
        return res.status(200).send({
            success: false,
            code: 502,
            error: "Name already exist"
        })
    }
    result = await Database.Commission.createCommission({ ...req.body });
    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const creteCommissionLevel = async (req, res, next) => {

    let result;
    const data = req.body;
    result = await Database.Commission.createCommissionLevel(data);

    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else { 
        return res.status(200).send({
            success: false,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const deleteCommissionLevel = async (req, res, next) => {
    try {
        const commissionLevelUuid = req.params.id;
        await Database.Commission.deleteCommissionLevelByUuid(commissionLevelUuid);
        return res.status(200).send({
            success: true
        })
    } catch (e) {
        return res.status(200).send({ success: false });
    }
}

const updateCommissionLevel = async (req, res, next) => {

    const id = req.params.id; 
    let result;
    const {isAllInstrument, symbolLevels} = req.body; 
    result= await Database.Commission.updateCommissionLevel(id, req.body); 
    if(!isAllInstrument ){
        for(let symbolLevel of symbolLevels){
            await Database.SymbolLevel.updateSymbolLevel({...symbolLevel, commissionLevelUuid: id}); 
        }
    }
    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const updateCommission = async (req, res, next) => {

    let result;

    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const addCommissionLevel = async (req, res, next) => {

    let result;
    const { commissionUuid, ...data } = req.body;


    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Internal Server Error"
        })
    }
}
const deleteCommission = async (req, res, next) => {
    let result;
    const commissionUuid = req.params.id;
    result = await Database.Commission.deleteCommissionByUuid(commissionUuid);
    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Cann't delete this Commission."
        })
    }
}
const getCommissionDetail = async (req, res, next) => {
    let result;
    const commissionUuid = req.params.id;
    result = await Database.Commission.getCommissionDetails({ commissionUuid });

    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Commission does not exist with give Id."
        })
    }
}
const getCommissoinLevels = async (req, res, next) => {
    let result;
    const commissionUuid = req.params.id;
    result = await Database.Commission.getCommissoinLevelsForCommission(commissionUuid);

    if (result) {
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } else {
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Commission does not exist with give Id."
        })
    }
}
const getCommissoinTypes = async (req, res, next) => {
    try {
        let result;
        const _usedCommissions = await Database.Commission.getAllCommmissions();
        result = commissionTypeNames.filter(item => _usedCommissions.findIndex(ele => ele.commissionType === item) !== -1);
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } catch (e) {
        BotController.errors(e, "getCommissoinTypes");
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Commission does not exist with give Id."
        })
    }
}
const getUnusedCommissoinTypes = async (req, res, next) => {
    try {
        let result;
        const _usedCommissions = await Database.Commission.getAllCommmissions();
        result = commissionTypeNames.filter(item => _usedCommissions.findIndex(ele => ele.commissionType === item) === -1);
        return res.status(200).send({
            success: true,
            code: 200,
            body: result
        })
    } catch (e) {
        BotController.errors(e, "getCommissoinTypes");
        return res.status(200).send({
            success: true,
            code: 500,
            error: "Commission does not exist with give Id."
        })
    }
}
const getCommissionLevelByUuid = async (req, res, next) => {

    const id = req.params.id;
    let _commissionLevel = await Database.Commission.getCommissionLevelByUuid(id);
    if (_commissionLevel)
        return res.status(200).send({
            success: true,
            body: _commissionLevel
        })
    else
        return res.status(200).send({
            success: false,
            error: "Error"
        })
}

const getCommisssionSymbolLevels = async(req, res, next) =>{

    const id = req.params.id; 
    try{
        let result = await Database.SymbolLevel.getSymbolLevelsByCLUuid(id); 
        return res.status(200).send({
            success: true,
            body: result
        })
    }catch(e){
        return res.status(200).send({
            success: false, 
        })
    }
}

const getIBCommissionsForUser =async (req, res, next ) =>{
    try{
        const {email, accountUuid}= req; 
        const _user = await Database.Account.getAccountDetailByEmail(email); 
        const ibCommissions =await IBCommission.find({
            email
        }); 

        return res.status(200).send({
            success: true, 
            body: ibCommissions, 
        })
    }catch(e){
        BotController.errors(JSON.stringify(e), "getIBCommissions")
    }
}

const IBCommissionCotroller = {
    getIBClients,
    getIBOwnClients,
    getIBOwnClientsTree,
    createCommission,
    updateCommission,
    getIBCommissions,
    deleteCommission,
    getCommissionDetail,
    addCommissionLevel,
    creteCommissionLevel,
    deleteCommissionLevel,
    updateCommissionLevel,
    getCommissoinLevels,
    getCommissionLevelByUuid,
    getCommisssionSymbolLevels, 
    getCommissoinTypes,
    getIBCommissionHistory,
    getIBCommissionsForUser, 
    getUnusedCommissoinTypes
}

module.exports = IBCommissionCotroller;
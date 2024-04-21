
const BotController = require('./Bot');
const Database = require('./Database');
const ManagerApi = require('./Manager');
const { LedgerTypes, commissionTypes } = require("./constant");

const getLedgers =async (query) => {
    try{
        const result = await ManagerApi.Ledger.getEntries(query); 
        return result.data.ledgerEntry;
    }catch(e){
        console.log(e); 
        return false; 
    }
}
const getCommissions =async (req, res, next)=>{
    try{
        const {email, accountUuid}= req; 
        const rangeStart = 0; 
        const rangeEnd = (new Date()).getTime();
        const ledgetTypes = [LedgerTypes.COMMISSION]; 
        const tradingAccounts = await Database.TradingAccount.getTradingAccountByEmail(email); 
        const clientIds = tradingAccounts.map(item=>item.tradingAccountId); 
        const ibCommissions = await getLedgers({
            rangeStart, rangeEnd, clientIds, ledgetTypes
        })
        return res.status(200).send({
            success: true, 
            body: ibCommissions
        })
    }catch(e){

        BotController.errors(JSON.stringify(e), "getIBCommissions")
    }
}
const getIBCommissions = async (req, res, next)=>{
    try{
        const {email, accountUuid}= req; 
        const rangeStart = 0; 
        const rangeEnd = (new Date()).getTime();
        const ledgerTypes = [LedgerTypes.DEPOSIT]; 
        const _user = await Database.Account.getAccountDetailByEmail(email); 
        const clientIds = [_user.ibParentTradingAccountId]; 
        
        const ibCommissions = await getLedgers({
            rangeStart, rangeEnd, clientIds, ledgerTypes
        })
        return res.status(200).send({
            success: true, 
            body: ibCommissions
        })
    }catch(e){
        BotController.errors(JSON.stringify(e), "getIBCommissions")
    }
}

const getDepositAndWitdhrawForUser = async (req, res, next) => {
    const clientUuid = req.params.id;
    const { from: rangeStart, to: rangeEnd } = req.query;
    const _tradingAccountsforUser = await Database.TradingAccount.getTradingAccountsByUserId(clientUuid);

    if (!_tradingAccountsforUser) {
        return res.status(200).send([]);
    }
    const userClientIDs = _tradingAccountsforUser.map(item => item.tradingAccountId);

    const data = {
        rangeStart,
        rangeEnd,
        clientIds: userClientIDs,
        ledgerTypes: [
            LedgerTypes.DEPOSIT,
            LedgerTypes.WITHDRAWAL
        ]
    }
    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return res.status(200).send(result?.data?.ledgerEntry);
    } catch (e) {
        BotController.errors(e,"ledger.getDepositAndWitdhrawForUser" )
        return res.status(500).send({ error: "Server Error" });
    }
}

const getDepositAndWitdhrawForTradingAccount = async (req, res, next) => {
    const clientId = req.params.id;
    const { from: rangeStart, end: rangeEnd } = req.query;
    const data = {
        rangeStart,
        rangeEnd,
        clientIds: [clientId],
        ledgerTypes: [
            LedgerTypes.DEPOSIT,
            LedgerTypes.WITHDRAWAL
        ]
    }
    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return res.status(200).send(result?.data?.ledgerEntry);
    } catch (e) {
        BotController.errors(e, "ledger.getDepositAndWitdhrawForTradingAccount");
        return res.status(500).send({ error: "Server Error" });
    }
}

const getLedgersForTradingAccount = async (req, res, next) => {

    const clientId = req.params.id;
    const { from: rangeStart, end: rangeEnd } = req.query;
    const data = {
        rangeStart,
        rangeEnd,
        clientIds: [clientId],
        ledgerTypes: [
           0,1,2,3,4,5,6,7,8
        ]
    }
    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return res.status(200).send(result?.data?.ledgerEntry);
    } catch (e) {
        BotController.errors(e, "ledger.getLedgersForTradingAccount")
        return res.status(500).send({ error: "Server Error" });
    }

}

const getClosedPositionsFromLedgersByTradingAccountId = async (req, res, next) =>{
    const clientId = req.params.id;
    const { from: rangeStart, end: rangeEnd } = req.query;
    const data = {
        rangeStart,
        rangeEnd,
        clientIds: [clientId],
        ledgerTypes: [
           3
        ]
    }
    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return res.status(200).send(result?.data?.ledgerEntry);
    } catch (e) {
        BotController.errors(e, "getClosedPositionsFromLedgersByTradingAccountId");
        return res.status(500).send({ error: "Server Error" });
    }
}

const _getClosedTrades = async (rangeStart, rangeEnd, clientIds) =>{
    const data = {
        rangeStart, 
        rangeEnd, 
        clientIds
    }; 
    try{
        let result = await ManagerApi.Ledger.getClosedTrades(data); 
        return result.data?.ledgerEntry; 
    }catch(e){
        BotController.errors("IB Commission ", "getClosedTrades"); 
        return false; 
    }
}

const LedgerController = {
    getLedgers, 
    getDepositAndWitdhrawForUser, 
    getDepositAndWitdhrawForTradingAccount,
    getLedgersForTradingAccount,
    getClosedPositionsFromLedgersByTradingAccountId,
    getCommissions,
    getIBCommissions,
    _getClosedTrades
}

module.exports = LedgerController;

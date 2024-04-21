
const ManagerApi = require('./Manager');
const Database = require("./Database");
const { LedgerTypes } = require('./constant');
const BotController = require('./Bot');
const CommissionController = require('./Commission');

/// get active positions
const getAllPositionsByClientUuid = async (req, res, next) => {

    const clientUuid = req.params.id;
    let result = await _getAllPositionsByClientUuid(clientUuid);
    if (result) {
        return res.status(200).send(result)
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const _getAllPositionsByClientUuid = async (clientUuid) => {

    let tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(clientUuid);
    let clientIds = tradingAccounts.map(item => item.tradingAccountId);
    const data = {
        clientIds
    };
    try {
        let result = await ManagerApi.Position.getAll(data);
        return result.data.positionInfo;
    } catch (e) {
        BotController.errors(e, "_getAllPositionsByClientUuid");
        return false;
    }
}

const getAllPositionsByAccountUuid = async (req, res, next) => {

    const tradingAccountId = req.params.id;

    const data = { clientIds: [tradingAccountId] };
    try {
        const result = await ManagerApi.Position.getAll(data);
        return res.status(200).send(result.data.positionInfo);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}
const getClosedPositionsByAccountUuid = async (req, res, next) => {

    const tradingAccountId = req.params.id;
    const { from: rangeStart, end: rangeEnd } = req.body;

    const data = { rangeStart, rangeEnd, clientIds: [tradingAccountId], ledgerTypes: [LedgerTypes.CLOSED_POSITION] };

    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return res.status(200).send(result.data.ledgerEntry);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const _getClosedPositionsByAccountUuid = async (rangeStart, rangeEnd, clientIds) => {
    const data = { rangeStart, rangeEnd, clientIds, ledgerTypes: [LedgerTypes.CLOSED_POSITION] };
    try {
        let result = await ManagerApi.Ledger.getEntries(data);
        return result.data;
    } catch (e) {
        BotController.errors(e, "_getClosedPositionsByAccountUuid");
        return false;
    }
}


const getClosedPositionsByClientUuid = async (req, res, next) => {
    const userId = req.params.id;
    const { from: rangeStart, end: rangeEnd } = req.body;

    let result = await _getClosedPositionsByClientUuid(rangeStart, rangeEnd, userId);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const _getClosedPositionsByClientUuid = async (rangeStart, rangeEnd, userId) => {

    const tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(userId);
    const clientIds = tradingAccounts.map(item => item.tradingAccountId);
    
    await CommissionController.checkClosedPosition(); 
    let result = await Database.Position.getAnalyticsForUser(clientIds); 
    return result; 

}

const createOrder = async (req, res, next) => {


}

const cancelOrder = async (req, res, next) => {


}

const PositionController = {
    getAllPositionsByAccountUuid,
    getAllPositionsByClientUuid,
    getClosedPositionsByAccountUuid,
    getClosedPositionsByClientUuid,
    createOrder,
    cancelOrder,
    _getClosedPositionsByAccountUuid,
    _getClosedPositionsByClientUuid,
    _getAllPositionsByClientUuid, 
    
}
module.exports = PositionController; 
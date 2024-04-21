
const ManagerApi = require('./Manager');
const Database = require("./Database");
const { OrderStates } = require('./constant');

const getAllOrdersByClientUuid = async (req, res, next) => {
    const clientUuid = req.params.id;
    const { from, to } = req.query;
    let tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(clientUuid);
    let clientIds = tradingAccounts.map(item => item.tradingAccountId);
    const data = {
        from, to, clientIds
    };

    try {
        let result = await ManagerApi.Order.getHistory(data);
        return res.status(200).send(result.data);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const getAllOrdersFromUser = async (req, res, next) => {
    const { email, accountUuid } = req;

    const from = 0;
    const to = new Date().getTime();

    let tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(accountUuid);
    let clientIds = tradingAccounts.map(item => item.tradingAccountId);
    const data = {
        from, to, clientIds: [...clientIds], recordTypes: [1]
    };
    try {
        let result = await ManagerApi.Order.getHistory(data);
        return res.status(200).send(result.data);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const getAllOrdersByAccountUuid = async (req, res, next) => {

    const { from, to } = req.query;
    const tradingAccountId = req.params.id;
    const data = { from, to, clientIds: [tradingAccountId] };
    try {
        const result = await ManagerApi.Order.getHistory(data);
        return res.status(200).send(result.data.extendedOrderMask);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}
const getCanceledOrdersByAccountUuid = async (req, res, next) => {
    const tradingAccountId = req.params.id;
    const { from, to } = req.query
    const data = { clientIds: [tradingAccountId], from, to, recordTypes: [1] };
    try {
        const result = await ManagerApi.Order.getHistory(data);
        const canceledOrders = result?.data?.extendedOrderMask?.filter(item => item.activeOrders === OrderStates.ORDERCANCELLED);
        return res.status(200).send(canceledOrders);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const getCanceledOrdersByClientUuid = async (req, res, next) => {
    const userId = req.params.id;
    const { from, to } = req.query
    const tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(userId);
    const clientIds = tradingAccounts.map(item => item.tradingAccountId);
    try {
        const data = { clientIds, from, to, recordTypes: [0, 1, 2, 3, 4, 5, 6, 7] }
        let result = await ManagerApi.Order.getHistory(data);
        const canceledOrders = result?.data?.extendedOrderMask?.filter(item => item.activeOrders === OrderStates.ORDERCANCELLED);
        return res.status(200).send(canceledOrders);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}
const getActiveOrdersByAccountUuid = async (req, res, next) => {
    const tradingAccountId = req.params.id;
    const data = { clientIds: [tradingAccountId] };
    try {
        const result = await ManagerApi.Order.getActive(data);
        return res.status(200).send(result?.data?.extendedOrderMask);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const getActiveOrdersByClientUuid = async (req, res, next) => {
    const userId = req.params.id;
    const tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(userId);
    const clientIds = tradingAccounts.map(item => item.tradingAccountId);
    try {
        const data = { clientIds }
        let result = await ManagerApi.Order.getActive(data);
        return res.status(200).send(result?.data?.extendedOrderMask);
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: "Server Error" });
    }
}

const createOrder = async (req, res, next) => {


}

const cancelOrder = async (req, res, next) => {


}
const OrderController = {
    getAllOrdersByAccountUuid,
    getAllOrdersByClientUuid,
    getActiveOrdersByAccountUuid,
    getActiveOrdersByClientUuid,
    createOrder,
    cancelOrder,
    getCanceledOrdersByAccountUuid,
    getCanceledOrdersByClientUuid,
    getAllOrdersFromUser
}

module.exports = OrderController; 
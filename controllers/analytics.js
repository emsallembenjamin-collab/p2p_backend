const Database = require("./Database");
const ManagerApi = require("./Manager");
const { analyticsMode } = require("./constant");

const getUserAnalytics = async (req, res, next) => {
    
    const {start, end} = req.query; 
    const {adminEmail,adminUuid, role} = req; 
    
    const [startDate, endDate] = [new Date(start), new Date(end)]; 
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime())/(24*60*60*1000)); 

    let curDate = new Date(); 
    let prevWeekDate = new Date((new Date()).setDate(startDate.getDate() - daysDifference )); 

    let result = await Database.Account.getUserAnalytics(0, curDate, adminUuid, role);
    let curResult = await Database.Account.getUserAnalytics(startDate, endDate, adminUuid, role);
    let prevResult = await Database.Account.getUserAnalytics(prevWeekDate, startDate, adminUuid, role);

    if (result) {
        return res.status(200).send({
            success: true,
            body: {
                total: result, 
                curWeek: curResult, 
                prevWeek: prevResult
            }
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}
const getAccountAnalytics =async (req, res, next) => {

    const {adminUuid, role} = req; 
    const {start, end} = req.query; 
    const [startDate, endDate] = [new Date(start), new Date(end)]; 
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime())/(24*60*60*1000)); 

    let curDate = new Date(); 
    let prevWeekDate = new Date((new Date()).setDate(startDate.getDate() - daysDifference )); 

    let result = await Database.TradingAccount.getTradingAccountAnalytics(new Date(0), curDate, adminUuid, role);
    let curResult = await Database.TradingAccount.getTradingAccountAnalytics(startDate, endDate, adminUuid, role);
    let prevResult = await Database.TradingAccount.getTradingAccountAnalytics(prevWeekDate, startDate, adminUuid, role);
    if (result) {
        return res.status(200).send({
            success: true,
            body: {
                total: result,
                curWeek: curResult,
                prevWeek: prevResult
            }
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}
const getDepositAnalytics =async (req, res, next)=>{
    const {adminUuid, role} = req; 
    const { start, end } = req.query;
    let result = await Database.Deposit.getDepositAnalytics(start, end, adminUuid, role);

    if (result) {
        return res.status(200).send({
            success: true,
            body: result
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const getPosititionAnalytics =async (req, res, next)=>{
    const { start, end } = req.query;
    const {adminUuid, role} = req; 
    
    let result = await Database.Position.getAnalytics(start, end, adminUuid, role);
    if (result) {
        return res.status(200).send({
            success: true,
            body: result
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}

const getBalanceAnalytics = async (req, res, next)=>{
    
    const {email, adminUuid, role} = req; 
    try{

        let clientIds =await Database.TradingAccount.getTradingAccountsByAdminUuid(adminUuid, role); 
        let _clientIds = clientIds.filter(item=>!item.isDemo ).map(item=>item.tradingAccountId); 
    
        let result = await ManagerApi.Account.getAll(_clientIds); 
        let allAccountInfos = result.data.accountInfo; 
        let totalBalance = 0; 
    
        allAccountInfos = allAccountInfos?.sort((a, b)=>{
            let firstB = Number(a.balance); 
            let secondB = Number(b.balance); 
            return firstB-secondB> 0 && -1 || 1; 
        })
        
        allAccountInfos = allAccountInfos.map(item=>{
            let _balance = Number(item.balance)/Math.pow(10, item.clientInfo.clientGroup.depositCurrencyPrecision);
            totalBalance += _balance; 
            
            let _tAccount = clientIds.find(t=>t.tradingAccountId === item.clientId); 
            return {
                clientId: item.clientId, 
                balance: _balance, 
                tradingAccountUuid: _tAccount.tradingAccountUuid
            }
        }).slice(0, 7); 

        return res.status(200).send({
            success: true, 
            body: {
                totalBalance, 
                allAccountInfos
            }
        })
    }catch(e){
        return res.status(200).send({
            success: true, 
            error: "Server Error"
        })
    }
}

const AnalyticsController = {
    getUserAnalytics,
    getAccountAnalytics,
    getDepositAnalytics,
    getPosititionAnalytics,
    getBalanceAnalytics
}
module.exports = AnalyticsController; 
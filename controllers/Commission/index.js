var cron = require('node-cron');
const Database = require('../Database');
const LedgerController = require('../ledger');
const FileController = require("../Utils/file");
const path = require("path");
const BotController = require('../Bot');
const BalanceController = require('../balance');
const { min } = require('moment');
const ManagerApi = require('../Manager');
const SymbolController = require('../Symbol');
const { commissionTypes, DepositMode, KYCStatus, IBStatus } = require('../constant');
const { userInfo } = require('os');
const User = require('../../models/user');
const IBCommission = require('../../models/ib_commission');

const commissionSetting = {
    setting: {}
}

const getLastAccessTime = () => {
    const absPath = path.resolve(__dirname + '/setting.json');
    let settings = FileController.readJsonFile(absPath);
    return settings.accessTime;
}

const readSettings = () => {
    const absPath = path.resolve(__dirname + '/setting.json');
    let settings = FileController.readJsonFile(absPath);
    return settings;
}

const writeSettings = (settings) => {
    const absPath = path.resolve(__dirname + '/setting.json');
    FileController.writeJsonFile(absPath, { ...settings });
}

const updateLastAccessTime = (time) => {
    const absPath = path.resolve(__dirname + '/setting.json');
    let settings = FileController.readJsonFile(absPath);
    FileController.writeJsonFile(absPath, {
        ...settings,
        accessTime: time
    });
}

const startCommissionMonitor = async () => {
    checkClosedPosition();
    cron.schedule('0 */30 * * * *', () => {
        checkClosedPosition();
    });
}

const getCommissionLevel = async (tradingAccountId) => {
    try {
        const tradingAccount = await Database.TradingAccount.getTradingAccountByTradintAccountId(tradingAccountId);
        const _offerUuid = tradingAccount.offerUuid;
        const _commissionLevel = await Database.Commission.getCommissionLevelForIB(_offerUuid);
        return _commissionLevel;
    } catch (e) {
        return false;
    }
}

const checkClosedPosition = async () => {
    try {
        commissionSetting.setting = readSettings();

        const _tradingAccounts = await Database.TradingAccount.getAllTradingAccounts();
        const rangeEnd = (new Date()).getTime();
        const rangeStart = getLastAccessTime();
        const _closedPositions = await LedgerController._getClosedTrades(rangeStart, rangeEnd, _tradingAccounts);
        await Database.Position.insertManyClosedPositions(_closedPositions);
        if (_closedPositions) {
            updateLastAccessTime(rangeEnd);
            for (let i = 0; i < _closedPositions.length; i++) {
                let position = _closedPositions[i];
                let _user = await Database.TradingAccount.getAccountDetailByTradingAccountId(position.clientId);
                await handleIBCommission(0, position, _user);
            }
        } else {

        }
    } catch (e) {
        BotController.errors(JSON.stringify(e), "checkClosedPosition");
    }
}
const handleIBCommission = async (ibDepth, position, userInfo) => {

    try {
        if (userInfo.parentTradingAccountId) {
            const _userInfo = await Database.TradingAccount.getAccountDetailByTradingAccountId(userInfo.parentTradingAccountId);
            if (_userInfo.verification_status !== KYCStatus.DELETED)
                handleIBCommission(ibDepth + 1, position, _userInfo);
        }
        if (ibDepth > 0) {
            console.log(ibDepth, "ibDepth");

            const ibRanking = userInfo.ibRanking;
            let index = commissionSetting.setting.rankingLabels.findIndex(item => item === ibRanking);
            if (index == -1) index = 0;
            if (commissionSetting.setting.rankingCommissionLevels[index] < ibDepth) {
                return;
            }
            const ibTradingAccountId = userInfo.ibParentTradingAccountId;
            const {ibCommissionAmount, closedVolume} = await getIBCommissionAmout(ibDepth, position, userInfo);
            const comment = `IB Commission from ${position.closedClOrdId} : ${"#".repeat(ibDepth - 1)}`;
            const result = await BalanceController._depositToTradingAccountId(ibCommissionAmount, ibCommissionAmount, DepositMode.IB_COMMISSION, ibTradingAccountId, "USD",
                comment, "System", userInfo.email, userInfo.accountUuid, 0, position.clientId);
            
            let ibCommissionLog = new IBCommission({
                from: position.clientId, 
                closedVolume, 
                createdAt: new Date().getTime(), 
                commissionAmount: ibCommissionAmount, 
                positionID: position.uid,
                ibTradingAccountId, 
                comment, 
                email: userInfo.email,
            })
            await ibCommissionLog.save(); 
                
        }
    } catch (e) {
        BotController.errors(e, "handleIBCommission");
    }
}

const getIBCommissionAmout = async (ibDepth, position, userInfo) => {
    try {
        const symbolInfo = await SymbolController.getSymbolInfo(position.instrument);
        let { closedAvgOpenPrice, closePrice, closedVolume, instrument } = position;
        const { decimalPlaces, volumePrecision, lotSize, contractSize, leverage, commissionPercentRatio, multiplier } = symbolInfo;

        const DecMass = Math.pow(10, Number(volumePrecision));
        const tradingAccount = await Database.TradingAccount.getTradingAccountByTradintAccountId(position.clientId);

        let levels = [];
        const commissionLevel = await Database.Commission.getCommissionLevelsBySymbolAndOffer(position.instrument, tradingAccount.offerUuid, userInfo.ibCommissionType);

        if (commissionLevel.isAllInstrument) {
            levels = commissionLevel.levels;
        } else {
            const symbolLevels = await Database.SymbolLevel.getSymbolLevel({ symbolId: symbolInfo.symbolId, commissionLevelUuid: commissionLevel.commissionLevelUuid });
            if (symbolLevels) {
                levels = symbolLevels.levels.split(",");
            }
        }

        let _comUnit = 0.1;
        if (levels.length) {
            _comUnit = Number(levels[Math.min(ibDepth, levels.length) - 1]);
        }
        BotController.errors(_comUnit, "levels");

        console.log(levels, _comUnit, ibDepth, position, userInfo, symbolInfo);

        const volumeLot =  Math.abs((closedVolume / DecMass) / lotSize); 

        if (userInfo.ibCommissionType === commissionTypes.COM_100K) {
            const _tradingAmount = Math.abs(Number(closedVolume)) * Number(contractSize) * (Number(closedAvgOpenPrice) + Number(closedAvgOpenPrice)) / (2 * DecMass * DecMass)
            return {ibCommissionAmount:_tradingAmount * _comUnit * 10 / 1000000, closedVolume:volumeLot }
        } else if (userInfo.ibCommissionType === commissionTypes.COM_LOT) {
            console.log(Math.abs((closedVolume / DecMass) / lotSize), "real voloume");
            return{ ibCommissionAmount: volumeLot * _comUnit * 10 / 10, closedVolume: volumeLot};
        } else if (userInfo.ibCommissionType === commissionTypes.COM_MEDIUM) {

        }
    } catch (e) {
        console.log(e)
        return 0;
    }
}

const makeCommissionForTrading = async (ibDepth, accountUuid) => {


}

const _checkClosedPosition = async (req, res, next) => {
    const { eamil, adminUuid, role } = req;

    await checkClosedPosition();
    const IBCommissionHistory = await Database.Deposit.getIBCommissionHistory(adminUuid, role);
    if (IBCommissionHistory) {
        return res.status(200).send({
            success: true,
            body: IBCommissionHistory
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Server Error"
        })
    }
}

const evalRankingFromAdmin = async (req, res) => {

    await startCheckRanking(false);    // by admin
    return res.status(200).send("ok");

}

const startCheckRanking = async (bAuto = true) => {

    const setting = readSettings();

    let currentTime = new Date().getTime();
    let prevTime = currentTime - setting.resetPeriod * 86400 * 1000;

    await checkQualifiedClient(prevTime, currentTime);
    await checkQualifiedIB(setting.rankingOwnNumbers[0]);
    await checkIBRankings(setting);
}

const checkQualifiedClient = async (start, end) => {
    const clients = await User.find({});
    for (let client of clients) {
        let totalClosedVolume = await getTotalUserClosedVolume(client.email, start, end);
        if (totalClosedVolume >= 1) {
            client.isQClient = true;
        } else {
            client.isQClient = false;
        }
        await client.save();
    }
}

const getTotalUserClosedVolume = async (email, start = 0, end = (new Date()).getTime()) => {
    let tradingAccounts = await Database.TradingAccount.getTradingAccountByEmail(email);
    if (tradingAccounts) {
        let clientIds = tradingAccounts.map(tradingAccount => {
            if (!tradingAccount.isDemo) {
                return tradingAccount.tradingAccountId
            }
        }).filter(v => !!v);

        let totalClosedVolume = await Database.Position.getTotalVolume(start, end, clientIds);
        return totalClosedVolume;
    }
    return 0;
}

// QC_limit from Setting count of qualified clients for qualified ib client
const checkQualifiedIB = async (QC_limit) => {
    try {
        let ibClients = await Database.Account.getIBClients();
        for (let ibClient of ibClients) {
            const parentTradingAccountId = ibClient.ibParentTradingAccountId;
            const verification_status = KYCStatus.APPROVED;
            const ibOwnClients = await Database.Account.getIBOwnClients({ parentTradingAccountId, verification_status });
            let countOfQClient = 0;
            for (let ibOwnClient of ibOwnClients) {
                if (ibOwnClient.isQClient) {
                    countOfQClient++;
                }
            }
            if (countOfQClient >= QC_limit) {
                console.log(ibClient.accountUuid, "QIB");
                await Database.Account.updateAccountProfile(ibClient.accountUuid, { isQIB: true, ibRanking: 1 });
            } else {
                console.log(ibClient.accountUuid, "IB " + QC_limit);
                await Database.Account.updateAccountProfile(ibClient.accountUuid, { isQIB: false, ibRanking: 0 });
            }
        }
    } catch (e) {
        console.log(e);
        return;
    }
}

// "maxCommissionLevel":10, 
// "rankingLabels": ["Q", "S1", "S2", "S3", "S4"], 
// "rankingCommissionLevels":[3, 4, 6, 8, 10],
// "rankingMinVolume":[0, 100, 300, 600, 1000], 
// "rankingOwnNumbers":[3, 3, 3, 3, 3], 
// "resetPeriod":90
const checkIBRankings = async (setting) => {

    const rankingCount = setting.rankingLabels.length;
    for (let index = 2; index < rankingCount; index++) {

        let prevLevel = setting.rankingLabels[index - 1];
        let curLevel = setting.rankingLabels[index];
        let minVolume = setting.rankingMinVolume[index];
        let ownNumber = setting.rankingOwnNumbers[index];

        await checkIBRankingLevel(index - 1, index, minVolume, ownNumber);
    }
}

const getLowRankingCounts = async (depth, ranking, parentTradingAccountId, IBMember) => {
    if (depth <= 0) return;

    console.log({ IBMember, depth });
    const verification_status = KYCStatus.APPROVED;
    const ibStatus = IBStatus.APPROVED;
    const ibOwnClients = await Database.Account.getIBOwnClients({ parentTradingAccountId, verification_status, ibStatus });
    for (let ibOwnClient of ibOwnClients) {
        if (ibOwnClient.ibRanking === ranking) {
            IBMember.count++;
        }
        if (ibOwnClient.ibStatus === IBStatus.APPROVED) {
            await getLowRankingCounts(depth - 1, ranking, ibOwnClient.ibParentTradingAccountId, IBMember);
        }
    }
}

const checkIBRankingLevel = async (prevLevel, curLevel, minVolume, ownNumber) => {  // rIndex: Ranking index in setting

    const setting = readSettings();
    let ibClients = await Database.Account.getIBClients();
    const currentTime = (new Date()).getTime();
    for (let ibClient of ibClients) {
        try {

            // if raking is same or grater than checking ranking 
            if (ibClient.ibRanking >= curLevel && currentTime < ibClient.ibRankingUpdated + setting.resetPeriod * 86400 * 1000)
                continue;

            const parentTradingAccountId = ibClient.ibParentTradingAccountId;
            const verification_status = KYCStatus.APPROVED;
            const ibOwnClients = await Database.Account.getIBOwnClients({ parentTradingAccountId, verification_status });
            let totalClosedVolume = 0;
            let IBMember = {
                count: 0
            }
            for (let ibOwnClient of ibOwnClients) {
                if (ibOwnClient.ibRanking === prevLevel) {
                    IBMember.count++;
                }
                totalClosedVolume += await getTotalUserClosedVolume(ibOwnClient.email);
                if (ibOwnClient.ibStatus === IBStatus.APPROVED) {
                    await getLowRankingCounts(setting.rankingCommissionLevels[curLevel] - 1, curLevel, ibOwnClient.ibParentTradingAccountId, IBMember);
                }
            }
            console.log({ IBMember }, "checked ranking " + curLevel);
            if (IBMember.count >= ownNumber && totalClosedVolume > minVolume) {
                await Database.Account.updateAccountProfile(ibClient.accountUuid, { isQClient: true, ibRanking: curLevel, ibRankingUpdated: currentTime });
            }
        } catch (e) {
            console.log(e);
            return;
        }
    }
}

const updateIBRanking = async (req, res) => {
    const { accountUuid, ibRanking } = req.body;
    try {
        const result = await Database.Account.updateAccountProfile(accountUuid, { ibRanking });
        return res.status(200).send({
            success: true,
            body: result
        });
    } catch (e) {
        return res.status(500).send("failed");
    }
}

const getRankingTypes = async (req, res) => {
    try {
        let commissionSettings = readSettings();
        let rankingLabels = commissionSettings.rankingLabels;
        return res.status(200).send({
            success: true,
            body: rankingLabels
        })
    } catch (e) {
        return res.status(200).send({
            success: false,
        })
    }
}

const getIBRankingName = (ibRanking)=>{
    try{
        const setting  = readSettings(); 
        let rankingName = setting.rankingLabels[ibRanking]; 
        if(ibRanking>0)  rankingName = "IB_" + rankingName; 
        console.log({rankingName})
        return rankingName; 
    }catch(e){
        return undefined; 
    }
}
const CommissionController = {
    startCommissionMonitor, checkClosedPosition, _checkClosedPosition, startCheckRanking, readSettings, writeSettings, evalRankingFromAdmin, updateIBRanking, getRankingTypes, getIBRankingName
}

module.exports = CommissionController; 


const Database = require('./Database');
const ManagerAPI = require('./Manager');
const { DepositMode, PaymentType, actionStatus, WithdrawMode, PaymentGateway, WithdrawStatus } = require('./constant');
const uuid = require('uuid');
const session = require('express-session');
var moment = require('moment');
const BotController = require('./Bot');
const Web3Controller = require('./Web3');
const { NUMBER } = require('sequelize');
const EmailController = require('./Email');

const OperationTypes = {
    OPERRATION_SUCCESS: "OPERATION_SUCCESS",
    OPERATION_NONE: "OPERATION_FAILED"
}


const requestWithdrawalManual = async (req, res, next) => {

    const data = req.body;
    
    const { tradingAccountId, clientUuid, email, comment, amount, toTradingAccountId, paymentGateway} = req.body;
    try {
        let result = await _withdrawToTradingAccountId(amount, amount, paymentGateway , tradingAccountId, "USD", comment, email, clientUuid, WithdrawMode.MANUAL);
        if (data.paymentGateway === PaymentGateway.INTERNAL_TRANSFER) {
            let _tradingAccount = await Database.TradingAccount.getTradingAccountByTradingAccountUuid(toTradingAccountId);
            let result_deposit = await _depositToTradingAccountId(amount, amount, DepositMode.INTERNAL, _tradingAccount.tradingAccountId,
                "USD", comment, _tradingAccount.email, _tradingAccount.clientUuid, 0, tradingAccountId);
        }

        if (result) {
            return res.status(200).send(result);
        } else {
            return res.status(500).send({ error: "Server Error" });
        }
    } catch (e) {
        return res.status(500).send({ error: "Server Error" });
    }
}
const requestWithdrawalAuto = async (req, res, next) => {
    const data = req.body;
    const { code } = req.body;
    const cur_moment = moment();
    if (String(code) !== String(session.withdraw_verify_code)) {
        return res.status(200).send({
            success: false,
            error: "Verification code is wrong. Try again."
        });
    }
    let timeDifference = cur_moment.diff(session.moment, 'seconds')
    if (timeDifference > 30 * 60) { // expired after 30min
        res.status(200).send({
            success: false,
            "msg": "Expired verification code. Try to send again"
        });
    }
    let result = await Database.Withdraw.requestWithdrawal(
        {
            ...data,
            method: WithdrawMode.AUTO, 
            paymentGateway: data.method
        });
    if (result) {
        return res.status(200).send({
            success: true, 
            body: result
        });
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const confirmWithdrawall = async (req, res, next) => {
    const Uuid = req.params.id;
    let result = await _confirmWithdrawal(Uuid);
    if (result) {
        return res.status(200).send({
            success: true,
            body: result
        })
    } else {
        return res.status(200).send({
            success: false,
        })
    }
}

const _confirmWithdrawal = async (wrUuid) => {

    let withdrawRequestInfo = await Database.Withdraw.getWithdrawHistoryByUuid(wrUuid);
    const { email, address, amount, paymentGateway, method, status } = withdrawRequestInfo;

    let result_withdraw = null;
    if (status === WithdrawStatus.WITHDRAWAL_APPROVED || status === WithdrawStatus.WITHDRAWAL_DONE) {
        return false;
    }

    switch (paymentGateway) {
        case PaymentGateway.USDT_TRANSFER:
            result_withdraw = await Web3Controller.sendUSDTToWallet(global.ADMIN_WALLET_ADDRESS, global.ADMIN_WALLET_PRIVATE_KEY, address, amount);
            if (result_withdraw) {
                EmailController.sendWithdrawSuccess(email, amount, withdrawRequestInfo.tradingAccountId); 
                BotController.balanceChanged(amount, PaymentType.WITHDRAWAL, withdrawRequestInfo.tradingAccountId, result_withdraw.admin_balance)
                Database.Withdraw.updateStatus(wrUuid, WithdrawStatus.WITHDRAWAL_DONE);
            }
            break;
        case PaymentGateway.VIETNAM_TRANSFER:

            break;
        case PaymentGateway.INTERNAL_TRANSFER:
            result_withdraw = await _internalTransfer();
            break;
    }

    try {
        if (!result_withdraw ) {
            await Database.Withdraw.updateStatus(wrUuid, WithdrawStatus.WITHDRAWAL_FAILED); 
            return result_withdraw;
        }
        if(paymentGateway === PaymentGateway.INTERNAL_TRANSFER){
            await Database.withDrawMoney.updateStatus(wrUuid, WithdrawStatus.WITHDRAWAL_APPROVED); 
            return result_withdraw; 
        }

        let result = await Database.Withdraw.confirmWithdrawRequest(wrUuid);
        const data = {
            clientId: result.tradingAccountId,
            amount: result.amount * 100,
            comment: result.comment
        }
        const withdraw_rwsult = await ManagerAPI.Balance.withDrawMoney(data);
        if (withdraw_rwsult.data.status === OperationTypes.OPERRATION_SUCCESS) {
            let result_balance = await Database.TradingAccount.updateBalance(result.tradingAccountId, -result.amount);
            return result_balance;
        } else {
            return false;
        }
    } catch (e) {
        BotController.errors(e, confirmWithdrawall);
        return false;
    }
}
const approveMassWRequest = async (req, res, next) => {
    const { ids } = req.body;
    let success_count = 0;
    for (let index = 0; index < ids.length; index++) {
        let result = await _confirmWithdrawal(ids[index]);
        if (result) {
            success_count++;
        }
    }
    return res.status(200).send({
        success: true,
        body: {
            total: ids.lengthl,
            success_count
        }
    })
}
const rejectMassWRequest = async (req, res, next) => {
    const { ids } = req.body;
    for (let index = 0; index < ids.length; index++) {
        let result = await Database.Withdraw.rejectWithdrawRequest(ids[index]);
    }
    return res.status(200).sned({
        success: true
    })
}
const cancelWithdrawall = async (req, res, next) => {
    const Uuid = req.params.requestId;
    let result = await Database.Withdraw.cancelWithdrawRequest(Uuid);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const rejectWithdrawall = async (req, res, next) => {
    const Uuid = req.params.id;
    const decline_reason = req.body.decline_reason; 
    let result = await Database.Withdraw.rejectWithdrawRequest(Uuid);
    if (result) {
        result.decline_reason = decline_reason; 
        await result.save(); 
        return res.status(200).send({success: true, body:result});
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}

//  admin action
const getWithdrawHistoryAll = async (req, res, next) => {
    const { adminUuid, role } = req;
    let result = await Database.Withdraw.getWithdrawHistoryAll({ adminUuid, role });
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getWithdrawHistoryForUser = async (req, res, next) => {
    const accountUuid = req.params.id;
    let result = await Database.Withdraw.getWithdrawHistoryByUserId(accountUuid);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getWithdrawalHistoryForTradingAccount = async (req, res, next) => {
    const tradingAccountUuid = req.params.id;
    let result = await Database.Withdraw.getWithdrawHistoryByTradingAccountUuid(tradingAccountUuid);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getWithdrawHistoryByUuid = async (req, res, next) => {
    const requestId = req.params.id;
    let result = await Database.Withdraw.getWithdrawHistoryByUuid(requestId);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}

//// get Deposit Histor for Only Just admin. 
const getDepositHistoryAll = async (req, res, next) => {

    const { adminUuid, role } = req;
    let result = await Database.Deposit.getDepositHistoryAll(adminUuid, role);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getDepositHistoryForUser = async (req, res, next) => {
    const accountUuid = req.params.id;
    let result = await Database.Deposit.getDepositHistoryByUserId(accountUuid);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getDepositHistoryForTradingAccount = async (req, res, next) => {
    const tradingAccountUuid = req.params.id;
    let result = await Database.Deposit.getDepositHistoryByTradingAccountUuid(tradingAccountUuid);
    if (result) {
        return res.status(200).send(result);
    } else {
        return res.status(500).send({ error: "Server Error" });
    }
}
const getTotalDepositAmount = async (req, res, next) => {
    let result = await Database.Deposit.getTotalDepositAmount();
    if (result) {
        res.status(200).send({
            success: true,
            body: result
        })
    }
}

const getUserBalance = async (req, res, next)=>{
    req.id = req.accountUuid; 
    next(); 
}
const getBalanceInfoForUser = async (req, res, next) => {

    try {
        const { id: accountUuid } = req.params;
        let _tradingAccounts = await Database.TradingAccount.getTradingAccountsByUserId(accountUuid);
        let _clientIds = _tradingAccounts.map(item => item.tradingAccountId);
        let _result = await ManagerAPI.Account.getAll(_clientIds);


        let _accountInfos = _result.data.accountInfo

        let _baalnceInfo = {
            balance: 0,
            equity: 0,
            credit: 0,
            margin: 0
        }
        _accountInfos.map(item => {
            _baalnceInfo = {
                balance: _baalnceInfo.balance + Number(item.balance) / 100,
                equity: _baalnceInfo.equity + Number(item.equity) / 100,
                credit: _baalnceInfo.credit + Number(item.credit) / 100,
                margin: _baalnceInfo.margin + Number(item.margin) / 100
            }
        })
        res.status(200).send({
            success: true,
            body: _baalnceInfo
        })

    } catch (e) {
        res.status(200).send({
            success: false,
            error: "Not Exist."
        })
    }

}
/// Deposit by Admin
const depositToTradingAccountId = async (req, res, next) => {
    const { email: adminEmail, adminUuid } = req;
    const tradingAccountId = req.params.id;
    const { amount, netAmount, paymentGateway, currency, comment, clientUuid, email } = req.body;
    let result = await _depositToTradingAccountId(amount, amount, DepositMode.MANUAL, tradingAccountId, currency, comment, req.email, email, clientUuid);
    if (result) {
        Database.SysLog.logAdminDeposit(adminEmail, tradingAccountId, amount, actionStatus.SUCCESS);
        return res.status(200).send({
            success: true,
            body: result
        })
    } else {
        Database.SysLog.logAdminDeposit(adminEmail, tradingAccountId, amount, actionStatus.FAILED);
        return res.status(200).send({
            success: false,
            error: "Server Error"
        })
    }
}
const internalTransfer = async (req, res, next) => {
    const originTradingAccountUuid = req.body.originTradingAccountUuid;
    const targetTradingAccountUuid = req.body.targetTradingAccountUuid;

    const amount = req.body.amount;
    const email = req.email;
    const accountUuid = req.accountUuid;

    try {
        const originAccount = await Database.TradingAccount.checkValidAccount(email, originTradingAccountUuid);
        const targetAccount = await Database.TradingAccount.checkValidAccount(email, targetTradingAccountUuid);


        if (targetAccount.isDemo !== originAccount.isDemo) {
            return res.status(200).send({
                success: false,
                error: "Cant transfer between real and demo account"
            })
        }

        const originTradingAccountId = originAccount.tradingAccountId;
        const targetTradingAccountId = targetAccount.tradingAccountId;
        await Database.SysLog.createSystemLog({
            email, comment: `Start Internal Transfer From ${originTradingAccountId} to ${targetTradingAccountId}`, actionStatus: "info", accountUuid
        });
        if (!originTradingAccountId || !targetTradingAccountId) {
            await Database.SysLog.createSystemLog({
                email, comment: `Failed Internal Transfer From ${originTradingAccountId} to ${targetTradingAccountId}`, actionStatus: "failed", accountUuid
            });

            return res.status(200).send({
                success: false,
                error: "No Valid request"
            });
        }
        const comment = "Internal Transfer";
        let res_withdraw =await _withdrawToTradingAccountId(amount, amount, PaymentGateway.INTERNAL_TRANSFER, originTradingAccountId, "USD", comment, req.email, req.accountUuid, "Internal");
        if(!res_withdraw){
            return res.status(200).send({
                success: false, 
                error: "error"
            })
        }
        await _depositToTradingAccountId(amount, amount, DepositMode.INTERNAL, targetTradingAccountId, "USD", comment, req.email, req.email );

        BotController.internalTransfer(req.email, amount, originTradingAccountId, targetTradingAccountId);

        await Database.SysLog.createSystemLog({
            email, comment: `Succeed Internal Transfer From ${originTradingAccountId} to ${targetTradingAccountId}`, actionStatus: "Success", accountUuid
        });

        return res.status(200).send({
            success: true,
            body: "Transfer Succeed."
        });
    } catch (e) {

        BotController.errors(e, "Internal Transfer");
        await Database.SysLog.createSystemLog({
            email, comment: `Failed Internal Transfer by error`, actionStatus: "failed", accountUuid
        });
        return res.status(200).send({
            success: false,
            error: e
        })
    }
}


const _internalTransfer = async (data) => {
    const { tradingAccountId, toTradingAccountId, amount } = data;
    if (!tradingAccountId || !toTradingAccountId) {
        return false;
    }
    try {
        let result_withdraw = await ManagerAPI.Balance.withDrawMoney({
            amount: Number(amount) * 100, clientId: tradingAccountId, comment: "Internal Transfer"
        });
        if (result_withdraw.data.status === OPERRATION_SUCCESS) {
            let result_deposit = await ManagerAPI.Balance.depositMoney({
                amount: Number(amount) * 100, clientId: toTradingAccountId, comment: "Internal Transfer"
            })
            if (result_deposit.data?.status === OPERRATION_SUCCESS) {
                return true
            }
        }
        return false;
    } catch (e) {
        console.log("Internal Transfer", e);
        return false;
    }
}

const _withdrawToTradingAccountId = async (amount, netAmount, paymentGateway, tradingAccountId, currency, comment, email, clientUuid, method) => {
    try {
        let result = await ManagerAPI.Balance.withDrawMoney({
            amount: Number(amount) * 100, clientId: tradingAccountId, comment
        });
        if (result.status === 200) {
            if (result.data.status === OperationTypes.OPERRATION_SUCCESS) {
                let result_save = await Database.TradingAccount.updateBalance(tradingAccountId, -amount);
                const withdrawInfo = {
                    ...result.data,
                    amount,
                    netAmount,
                    tradingAccountId,
                    currency,
                    comment,
                    email,
                    clientUuid,
                    method,
                    status: WithdrawStatus.WITHDRAWAL_DONE,
                    paymentGateway
                }
                let result_depo_history = await Database.Withdraw.createWithdraw(withdrawInfo);
                return result.data;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        BotController.errors(e, "_withdrawToTradingAccountId");
        return false;
    }

}

const _depositToTradingAccountId = async (amount, netAmount, depositMode, tradingAccountId, currency, comment, dealer, email, clientUuid, additionalType = 0, from="") => {
    try {

        let result = await ManagerAPI.Balance.depositMoney({
            amount: Math.floor(Number(amount) * 100), clientId: tradingAccountId, comment, additionalType
        });
        if (result.status === 200) {
            if (result.data.status === OperationTypes.OPERRATION_SUCCESS) {
                let result_save = await Database.TradingAccount.updateBalance(tradingAccountId, amount);
                const depositInfo = {
                    ...result.data,
                    depositMode,
                    tradingAccountId,
                    uuid: uuid.v4(),
                    comment,
                    currency,
                    netAmount,
                    amount: Math.floor(Number(amount) * 100) / 100,
                    dealer,
                    email,
                    clientUuid, 
                    from
                }

                let result_depo_history = await Database.Deposit.createDeposit(depositInfo);
                
                return result.data;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {

        BotController.errors(JSON.stringify(e), "_depositCreditToTradingAccountId");
        return false;
    }

}
const _depositCreditToTradingAccountId = async (amount, netAmount, paymentGateway, clientId, currency, comment) => {
    try {
        let result = await ManagerAPI.Balance.creditIn({
            amount: Number(amount) * 100, clientId, comment
        });
        if (result.status === 200) {
            if (result.data.status === OperationTypes.OPERRATION_SUCCESS) {
                let result_save = await Database.TradingAccount.updateCreditBalance(clientId, amount);
                let result_depo_history = await Database.Deposit.createDeposit(result.data);
                return result.data;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        BotController.errors(e, "_depositCreditToTradingAccountId");
        return false;
    }
}

const BalanceController = {
    cancelWithdrawall,
    confirmWithdrawall,
    depositToTradingAccountId,
    internalTransfer,
    rejectWithdrawall,
    approveMassWRequest,
    rejectMassWRequest,
    getDepositHistoryAll,
    getDepositHistoryForTradingAccount,
    getDepositHistoryForUser,
    getWithdrawHistoryAll,
    getWithdrawHistoryForUser,
    getWithdrawalHistoryForTradingAccount,
    getWithdrawHistoryByUuid,
    getTotalDepositAmount,
    getBalanceInfoForUser,
    requestWithdrawalManual,
    requestWithdrawalAuto,
    _depositToTradingAccountId,
    _depositCreditToTradingAccountId,
    _withdrawToTradingAccountId,
getUserBalance
}
module.exports = BalanceController; 
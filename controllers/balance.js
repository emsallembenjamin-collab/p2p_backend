

const ManagerAPI = require('./Manager');
const { DepositMode, PaymentType, actionStatus, WithdrawMode, PaymentGateway, WithdrawStatus } = require('./constant');
const uuid = require('uuid');
const session = require('express-session');
var moment = require('moment');
const BotController = require('./Bot');
const Web3Controller = require('./Web3');
const { NUMBER } = require('sequelize');
const EmailController = require('./Email');
const UserService = require('./Database/account');

const OperationTypes = {
    OPERRATION_SUCCESS: "OPERATION_SUCCESS",
    OPERATION_NONE: "OPERATION_FAILED"
}


const requestWithdrawalManual = async (req, res, next) => {

    const { accountUuid } = req;
    const { amount, paymentInfo } = req.body;

    const user =await UserService.getAccountDetailByUuid(accountUuid);
    if(!user) return res.status(403).send("Unathurized user.");

    if (paymentInfo.paymentType === PaymentType.Bank) {
        if(user.fiatBlanace < amount){
            return res.status(500).send("Bad Request");
        }



    } else if (paymentInfo.paymentType === PaymentType.Credit) {
        const walletAddress = paymentInfo.walletAddress;
        if(user.usdtBalance < amount){
            return res.status(500).send("Bad Request");
        }
        result_withdraw = await Web3Controller.sendUSDTToWallet(global.ADMIN_WALLET_WITHDRAW_ADDRESS, global.ADMIN_WALLET_WITHDRAW_PRIVATE_KEY, address, amount);
        if (result_withdraw) {
            EmailController.sendWithdrawSuccess(user.email, amount, withdrawRequestInfo.tradingAccountId);
            BotController.balanceChanged(amount, PaymentType.WITHDRAWAL, withdrawRequestInfo.tradingAccountId, result_withdraw.admin_balance)
            user.usdtBalance -= amount; 
            await user.save(); 
            return res.status(200).send("Success");
        }else{
            BotController.errors("Failed to withdraw wallet");
            return res.status(500).send("Server Error");
        }
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
        if (!result_withdraw) {
            await Database.Withdraw.updateStatus(wrUuid, WithdrawStatus.WITHDRAWAL_FAILED);
            return result_withdraw;
        }
        if (paymentGateway === PaymentGateway.INTERNAL_TRANSFER) {
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

const getTotalDepositAmount = async (req, res, next) => {
    let result = await Database.Deposit.getTotalDepositAmount();
    if (result) {
        res.status(200).send({
            success: true,
            body: result
        })
    }
}






const BalanceController = {
    getDepositHistoryAll,
    getDepositHistoryForUser,
    getWithdrawHistoryAll,
    getWithdrawHistoryForUser,
    getTotalDepositAmount,
    requestWithdrawalManual,
}
module.exports = BalanceController; 
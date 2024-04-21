const { generateAccount } = require('tron-create-address')
const ethWallet = require('ethereumjs-wallet').default;
const Transaction = require('../models/transaction');
const Wallet = require('../models/wallet');
const ManagerApi = require('./Manager');
const Moralis = require('./Moralis');
const { resetPassword } = require('./auth');
const Database = require('./Database');
const EmailController = require("./Email");
const { templateKeys, templateNames } = require('./Email/constant');
const uuid = require('uuid');
const BalanceController = require('./balance');
const { DatabaseError, NUMBER } = require('sequelize');
const BOController = require('./BO');
const BotController = require('./Bot');
const SysLogController = require('./Database/syslogs');
const { actionStatus } = require('./constant');
const sendSMS = require('./SMS');
const session = require('express-session');
const { generateQRcodeOfWallet } = require('../utils/qrcode');

const createTradingAccount = async (req, res, next) => {
  try {
    const { email, accountUuid } = req;
    const offerUuid = req.body.selectedOffer;
    const offer = await Database.Offer.getOfferbyUuid(offerUuid);
    const user = await Database.Account.getAccountDetailByEmail(email);

    if (!offer || !user) {
      return res.status(200).send({
        success: false,
        code: 400,
        error: "Bad Request"
      })
    }
    const tradingAccount = await Database.TradingAccount.createTradingAccount(offerUuid, accountUuid, email, offer.demo, user.ibParentTradingAccountUuid);

    if (tradingAccount) {
      if(!tradingAccount.isDemo){
        generateQRcodeOfWallet(tradingAccount.ethAddress); 
      }
      BotController.createTradingAccount(email, tradingAccount.tradingAccountId);

      SysLogController.logUserCreateTradingAccount({ email, accountUuid }, actionStatus.SUCCESS);
      if (!offer.demo) {
        Moralis.addAddress(tradingAccount.ethAddress);
        EmailController.sendAccountCreated(email); 
      }else{
        EmailController.sendDemoAccountCreated(email); 
      }
      return res.status(200).send({
        success: true,
        body: tradingAccount
      })
    } else {
      SysLogController.logUserCreateTradingAccount({ email, accountUuid }, actionStatus.FAILED);
    }
  } catch (e) {
    console.log(e);
    BotController.errors(e, "createTradingAccount");
  }

  return res.status(200).send({
    success: false,
    error: ""
  })
}

const _createTradingAccount = async (req, res, next) => {
  const { email, accountUuid } = req;
  const offerUuid = req.body.selectedOffer;
  const offer = await Database.Offer.getOfferbyUuid(offerUuid);

  if (!offer)
    return res.status(404).send({ error: "Bad Request" });

  await Database.SysLog.createSystemLog({
    email, comment: "start Trading Account create procedure", actionStatus: "info", accountUuid
  });

  const groupName = offer.groupName;
  const user = await Database.Account.getAccountDetailByEmail(email);

  const data = {
    clientUuid: user.accountUuid,
    offerUuid,
    commissionUuid: user.ibParentTradingAccountUuid
  }

  try {
    const accountRes = await BOController.TradingAccount.createTradingAccount(data);

    if (accountRes === false) {
      return res.status(200).send({
        success: false,
        error: "Failed to create new account"
      })
    }

    let addressData = ethWallet.generate();
    const eth_privateKey = addressData.getPrivateKeyString()
    // addresses
    const eth_address = addressData.getAddressString()
    //Tron
    const { address, privateKey } = generateAccount()
    const partnerId = global.partnerId;
    const wallet = new Wallet({
      ...accountRes.data,
      ethAddress: eth_address,
      ethPrivateKey: eth_privateKey,
      tronAddress: address,
      tronPrivateKey: privateKey,
      isDemo: offer.demo,
      email: email
    });
    await wallet.save();
    if (offer.initialDeposit) {
      const result_deposit = BalanceController._depositToTradingAccountId(offer.initialDeposit, offer.initialDeposit, null, accountRes.data.tradingAccountId, "USD", "Initial Deposit to create trading account", "Agent");
    }
    // if (offer.initialCredit) {
    //   const result_credit = BalanceController._depositCreditToTradingAccountId(offer.initialCredit, offer.initialCredit, null, accountRes.data.tradingAccountId, "USD", "Initial Credit In to create trading account");
    // }

    BotController.createTradingAccount(email, accountRes.data.tradingAccountId);
    await Database.SysLog.createSystemLog({
      email, comment: "Success Trading Account create procedure", actionStatus: "Success", accountUuid
    });

    Moralis.addAddress(eth_address);
    EmailController.sendEmail(templateKeys.OPEN_LIVE_ACCOUNT, {});
    res.status(200).send({
      success: true,
      body: wallet
    });
  } catch (e) {

    BotController.errors(e, "createTradingAccount");
    await Database.SysLog.createSystemLog({
      email, comment: "Error Trading Account create procedure", actionStatus: "Error", accountUuid
    });
    res.status(500).send({ message: "Creating Trading account failed" });
  }
}

const getTradingAccounts = async (req, res, next) => {
  try {
    const clientUuid = req.accountUuid;
    const result = await Database.TradingAccount.getTradingAccountsByUserId(clientUuid);

    const tradingAccounts = await Promise.all(result.map(async (account) => {
      try{
        const result_account = await ManagerApi.Account.getInfo(account.tradingAccountId);
        let accountInfo = result_account.data.accountInfo; 
        return {
          ...account,
          balance: accountInfo.balance / 100,
          equity: accountInfo.equity/100,
          ethPrivateKey: undefined
        }
      }catch(e){
        return {
          ...account,
          ethPrivateKey: undefined
        }
      }
    }))
    return res.status(200).send(tradingAccounts.filter(v=>!!v));
  } catch (e) {
    return res.status(500).send({ error: "Server Error" });
  }
}

const getTradingAccountTransactions = async (req, res, next) => {
  const tradingAccountUuid = req.params.tradingAccountUuid;
  const email = req.query.email;
  let wallet =await Database.TradingAccount.getTradingAccountByTradingAccountUuid(tradingAccountUuid);
  Database.Deposit.getDepositHistoryByTradingAccountUuid(wallet.tradingAccountId)
    .then(TransactionList => {
      res.status(200).send(TransactionList);
    })
    .catch(e => {
      BotController.errors(e, getTradingAccountTransactions);
      res.status(500).send("There occurs some issues on Database!");
    })
}

const getManagerToken = (req, res, next) => {
  res.status(200).send(global.manager_api_token);
}

const getOffers = async (req, res, next) => {

  let result = await Database.Offer.getOffers();
  if (result) {
    let offers = result.map(item => ({ value: item.offerUuid, label: item.name }));
    return res.status(200).send(offers);
  } else {
    return res.status(500).send({ error: "Internal Server error" });
  }

}

const getTradingAccountsByUuid = async (req, res, next) => {

  const clientUuid = req.params.userId;
  try {
    const result = await Database.TradingAccount.getTradingAccountsByUserId(clientUuid);
    const tradingAccounts = await Promise.all(result.map(async (account) => {
      try{
        const result_account = await ManagerApi.Account.getInfo(account.tradingAccountId);
        let accountInfo = result_account.data.accountInfo; 
        return {
          ...account,
          balance: accountInfo.balance / 100,
          equity: accountInfo.equity/100,
          ethPrivateKey: undefined
        }
      }catch(e){
        return 
      }
    }))
    return res.status(200).send(tradingAccounts.filter(v=>!!v));
  } catch (e) {
    return res.status(500).send({ error: "Server Error" });
  }
}
const getTradingAccountByTradingAccountUuid = async (req, res, next) => {

  const {adminUuid} = req; 
  
  try {
    const tradingAccountUuid = req.params.id;
    let result = await Database.TradingAccount.getTradingAccountByTradingAccountUuid(tradingAccountUuid);
    let result_deposit = await Database.Deposit.getDepositHistoryByTradingAccountUuid(result.tradingAccountId)
    let deposit_amount = 0;
    result_deposit.map(item => {
      deposit_amount += Number(item.amount);
    });

    let result_withdraw = await Database.Withdraw.getWithdrawHistoryByTradingAccountUuid(tradingAccountUuid);
    let withdraw_amount = 0;
    result_withdraw.map(item => {
      withdraw_amount += Number(item.amount);
    });

    if (!result) {
      res.status(500).send('Server Error');
    } else {
      try{
        let taInfo = {};
        taInfo = await ManagerApi.Account.getInfo(result.tradingAccountId)
        const { balance, equity, margin, profit } = taInfo.data.accountInfo;
        return res.status(200).send({
          ...result, balance: Number(balance) / 100, equity: Number(equity) / 100,
          margin: Number(margin) / 100, profit: Number(profit) / 100,
          depositAmount: deposit_amount,
          withdrawAmount: withdraw_amount,
          ethPrivateKey: !!adminUuid && result.ethPrivateKey || undefined
        });
      }catch(e){
        return res.status(200).send({
          ...result
        })
      }
    }
  } catch (e) {
    return res.status(200).send({ });
  }
}
const getFreeMargin = async (req, res, next) => {

  try {
    const result = await ManagerApi.Account.getInfo(req.params.id);
    if (result) {
      const accountInfo = result.data.accountInfo;
      const divider = Math.pow(10, accountInfo.accountCurrencyPrecision);
      const freeMargin = (accountInfo.balance - accountInfo.margin) / divider;
      const balance = accountInfo.balance / divider;
      const margin = accountInfo.margin / divider;

      return res.status(200).send({
        success: true,
        body: {
          freeMargin,
          margin,
          balance
        }
      });
    }
  } catch (e) {
    BotController.errors(e, "GetFreemargin");
  }
  return res.status(200).send({
    success: false,
    error: "Error"
  });
}
const updateTradingAccountInfo = async (req, res, next) => {



}

const getTradingAccountsForAdmin = async (req, res, next) => {

  const { adminUuid, adminEmail, role } = req;
  try {
    const tradingAccounts = await Database.TradingAccount.getTradingAccountsByAdminUuid(adminUuid, role);
    return res.status(200).send({
      success: true,
      body: tradingAccounts
    })
  } catch (e) {

  }

}
const getTransactions = async (req, res, next) => {
  try {
    const { email, accountUuid } = req;
    const tradingAccountUuid = req.params.id;
    let _tradingAccount = await Database.TradingAccount.getTradingAccountByTradingAccountUuid(tradingAccountUuid);
    let deposits = await Database.Deposit.getDepositHistoryByTradingAccountUuid(_tradingAccount.tradingAccountId);
    let withdrawals = await Database.Withdraw.getWithdrawHistoryByTradingAccountUuid(tradingAccountUuid);
    return res.status(200).send({
      success: true,
      body: {
        deposits, withdrawals
      }
    })
  } catch (e) {
    return res.status(200).send({
      success: false,
      error: ""
    })
  }
}
const requestSMS = async (req, res, next) => {
  const { email } = req;
  let _user = Database.Account.getAccountDetailByEmail(email);
  if (_user.phone) {
    let smsNumber = Math.floor(Math.random() * 100000) + "";
    session.VerificationNumber = smsNumber;
    let result = await sendSMS(_user.phone, smsNumber);
    return res.status(200).send({
      success: true,
    })
  } else {
    return res.status(200).send({
      success: false
    })
  }
}
const validateSMSNumber = async (req, res, next) => {
  const { email, accountUuid } = req;
  const { smsNumber } = req.body;
  if (smsNumber === String(session.VerificationNumber)) {
    const result = await Database.Account.updatePhoneVerification(email);
    return res.status(200).send({
      success: true,
      body: result
    })
  } else {
    return res.status(200).send({
      success: false,
      error: "Not Matched."
    })
  }
}
const AccountController = {
  createTradingAccount,
  getTradingAccounts,
  getTradingAccountsForAdmin,
  getTradingAccountTransactions,
  getManagerToken,
  getOffers,
  getTradingAccountsByUuid,
  getTradingAccountByTradingAccountUuid,
  getFreeMargin,
  getTransactions,
  requestSMS,
  validateSMSNumber
}

module.exports = AccountController;



const axios = require('axios');
const User = require('../models/user.js');
const CryptoRate = require('../models/crypto_rate.js');
const SysSetting = require('../models/setting.js');

const PaymentMethod = require('../models/payment_method.js');
const Withdraw = require('../models/withdraw.js');
const AdminWallet = require('../models/admin_wallet.js');
const Wallet = require('../models/wallet.js');
const Report = require('../models/report.js');
const { readHTMLFile } = require("../utils/helper.js");
const Web3 = require("web3");
const Common = require('ethereumjs-common');
const Tx = require('ethereumjs-tx');
const sessions = require('express-session');
var moment = require('moment')
const BUSDT_ABI = require("../abi/busdt_abi.json");
const { KYCStatus, PaymentType } = require('./constant.js');
const BotController = require('./Bot/index.js');
const EmailController = require('./Email/index.js');
const ManagerApi = require('./Manager/index.js').default;

exports.getSetting = async (req, res, next) => {
  try {
    const sysSetting = await SysSetting.findOne({});
    const cryptoRates = await CryptoRate.find({});
    const payments = await PaymentMethod.find({});
    const adminWallet = await AdminWallet.findOne({});
    return res.status(200).send({ sysSetting: sysSetting, cryptoRates: cryptoRates, paymentMethods: payments, adminWallet: adminWallet });
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
}

exports.getWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find({});
    return res.status(200).send(wallets);
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
}

exports.getClientWallets = async (req, res, next) => {
  const clientUuid = req.query.accountUuid;
  let headers = global.mySpecialVariable;
  const partnerId = global.partnerId;

  Wallet.find({ clientUuid: requestAnimationFrame.query.accountUuid })
    .then(result => {
      res.status(200).send(res);
    })
    .catch(e => {
      console.log(e);
      res.status(500).send("Mongodb connection has problem");
    })
}

exports.getWithdraw = async (req, res, next) => {
  try {
    let withdraws = [];
    if (req.query.email) {
      withdraws = await Withdraw.find({ email: req.query.email });
    } else {
      withdraws = await Withdraw.find({}).sort({ submittedAt: 'desc' });
    }
    return res.status(200).send(withdraws);
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
}

exports.getWithdrawDetail = async (req, res, next) => {
  try {
    let withdrawDetail = await Withdraw.findOne({ _id: req.query.id });
    return res.status(200).send(withdrawDetail);
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
}

exports.getDeposit = async (req, res, next) => {
  try {
    let reports = [];
    if (req.query.email) {
      reports = await Report.find({ email: req.query.email });
    } else {
      reports = await Report.find({}).sort({ createdAt: 'desc' });
    }
    return res.status(200).send(reports);
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
}

exports.removeSetting = async (req, res, next) => {
  User.findOneAndRemove({ _id: req.params.id }, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).send(result);
    }
  });
}
exports.updateSetting = async (req, res, next) => {
  try {
    const setting = req.body.setting;
    const admin_wallet = req.body.adminWallet;
    const sys_setting = req.body.sysSetting;

    // update crypto rate
    let cryptoRate = await CryptoRate.findOne({ pair: "usdtPrice" });
    if (!cryptoRate) {
      cryptoRate = new CryptoRate({
        pair: "usdtPrice",
        rate: setting.usdtPrice
      });
    } else {
      cryptoRate.rate = setting.usdtPrice;
    }
    await cryptoRate.save();

    // update system settings
    let sysSetting = await SysSetting.findOne();
    if (!sysSetting) {
      sysSetting = new SysSetting({
        telegram: sys_setting.telegram
      });
    } else {
      sysSetting.telegram = sys_setting.telegram;
    }
    await sysSetting.save();

    // update admin wallet info
    let adminWallet = await AdminWallet.findOne({});
    if (!adminWallet) {
      adminWallet = new AdminWallet({
        address: admin_wallet.address,
        privateKey: admin_wallet.privateKey,
        withdrawAddress: admin_wallet.withdrawAddress,
        withdrawPrivateKey: admin_wallet.withdrawPrivateKey,
        depositAddress: admin_wallet.depositAddress
      });
    } else {
      adminWallet.address = admin_wallet.address;
      adminWallet.privateKey = admin_wallet.privateKey;
      adminWallet.withdrawAddress = admin_wallet.withdrawAddress;
      adminWallet.withdrawPrivateKey = admin_wallet.withdrawPrivateKey;
      adminWallet.depositAddress= admin_wallet.depositAddress

    }
    await adminWallet.save();
    global.ADMIN_WALLET_ADDRESS = admin_wallet.address;
    global.ADMIN_WALLET_PRIVATE_KEY = admin_wallet.privateKey;
    global.ADMIN_WALLET_WITHDRAW_ADDRESS = admin_wallet.withdrawAddress;
    global.ADMIN_WALLET_WITHDRAW_PRIVATE_KEY = admin_wallet.withdrawPrivateKey;
    global.ADMIN_WALLET_DEPOSIT_ADDRESS = admin_wallet.depositAddress;

    let payment = await PaymentMethod.findOne({ name: "usdt" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "usdt",
        status: setting.usdt
      });
    } else {
      payment.status = setting.usdt;
    }
    await payment.save();
    payment = await PaymentMethod.findOne({ name: "bank" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "bank",
        status: setting.usdt
      });
    } else {
      payment.status = setting.bank;
    }
    await payment.save();
    payment = await PaymentMethod.findOne({ name: "npay" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "npay",
        status: setting.npay
      });
    } else {
      payment.status = setting.npay;
    }
    await payment.save();
    payment = await PaymentMethod.findOne({ name: "neteller" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "neteller",
        status: setting.neteller
      });
    } else {
      payment.status = setting.neteller;
    }
    await payment.save();
    payment = await PaymentMethod.findOne({ name: "skrill" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "skrill",
        status: setting.skrill
      });
    } else {
      payment.status = setting.skrill;
    }
    await payment.save();
    payment = await PaymentMethod.findOne({ name: "sticpay" });
    if (!payment) {
      payment = new PaymentMethod({
        name: "sticpay",
        status: setting.sticpay
      });
    } else {
      payment.status = setting.sticpay;
    }
    await payment.save();

    return res.status(200).send({ message: "success" });
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: "error" });
  }
}
exports.updateWithdraw = async (req, res, next) => {
  try {
    const id = req.body.id;
    let amount = req.body.amount;
    let email = req.body.email;
    let method = req.body.method;
    let address = req.body.address;
    if (method === "Vietnam Bank Transfer") {
      address = req.body.benificiaryName + " ( " + req.body.bankName + ", " + req.body.bankAccount + " ) ";
    }

    // confirm withdraw verification code first
    let cur_moment = moment();
    let timeDifference = cur_moment.diff(sessions.moment, 'seconds')
    let request_code = req.body.code;
    let session_code = sessions.withdraw_verify_code;


    let withdraw = await Withdraw.findOne({ _id: id });
    if (!withdraw) {
      // confirm withdraw verification code ith email
      if (request_code != session_code) {
        return res.status(200).send({
          status: 0,
          message: "Verification code is wrong. Try again."
        });
      }
      if (timeDifference > 30 * 60) { // expired after 30min      
        return res.status(200).send({
          status: 0,
          message: "Expired verification code. Try to send again"
        });
      }

      withdraw = new Withdraw({
        email: email,
        amount: amount,
        method: method,
        address: address,
        currency: "USD",
        tradingAccountId: req.body.tradingAccountId,
        tradingAccountUuid: req.body.tradingAccountUuid,
      });
      await withdraw.save();
      BotController.withdrawConfirmedByCredit(email, req.body.tradingAccountId, amount, method);

      return res.status(200).send({
        status: 1,
        message: "success"
      });
    } else {
      withdraw.status = req.body.status;
      withdraw.remark = req.body.remark;
      email = withdraw.email;
      amount = withdraw.amount;
    }
    if (req.body.status === KYCStatus.APPROVED) {
      const headers = { ...global.mySpecialVariable, "Content-Type": "application/json" };
      const partnerId = global.partnerId;

      const data = {
        "paymentGatewayUuid": process.env.PAYMENT_GATEWAY_UUID, //"58d26ead-8ba4-4588-8caa-358937285f88",
        "clientID": withdraw.tradingAccountId,
        "amount": withdraw.amount,
        "currency": "USD",
        "comment": "string"
      }
      try {
        const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc.getblock.io/5498f18d-9710-406a-9df9-851061d9465b/mainnet/"))
        // let wallet_addresses = ["0x5fF3A508d28A3c237656Ba23A042863aa47FC098"];
        const busdt = "0x55d398326f99059fF775485246999027B3197955"; ///BUSDT Contract
        const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt)
        let sender = global.ADMIN_WALLET_WITHDRAW_ADDRESS

        const balance = await usdtContract.methods.balanceOf(sender).call();

        let receiver = withdraw.address;
        let senderkey = global.ADMIN_WALLET_WITHDRAW_PRIVATE_KEY;
        let amount_hex = web3.utils.toHex(web3.utils.toWei(amount, 'ether'));;
        let data = await usdtContract.methods.transfer(receiver, amount_hex) //change this value to change amount to send according to decimals
        let nonce = await web3.eth.getTransactionCount(sender, "pending") + (await web3.eth.getPendingTransactions()).length; //to get nonce of sender address
        let gas = await usdtContract.methods.transfer(receiver, amount_hex).estimateGas({ from: sender });
       
        let chain = {
          "name": "bsc",
          "networkId": 56,
          "chainId": 56
        }

        const _balance = web3.utils.fromWei(balance, "ether");
        BotController.withdrawRequest(email, withdraw.tradingAccountId, amount, _balance);

        let rawTransaction = {
          "from": sender,
          "gasPrice": web3.utils.toHex(parseInt(Math.pow(10, 9) * 5)), //5 gwei
          "gasLimit": web3.utils.toHex(40000), //40000 gas limit
          "gas": web3.utils.toHex(gas),
          "to": busdt, //interacting with busdt contract
          // "value": web3.utils.BN(web3.utils.toWei(element.value, 'ether')), //no need this value interacting with nopayable function of contract
          "data": data.encodeABI(), //our transfer data from contract instance
          "nonce": web3.utils.toHex(nonce)
        };
        const common1 = Common.default.forCustomChain(
          'mainnet', chain,
          'petersburg'
        ) // declaring that our tx is on a custom chain, bsc chain

        let transaction = new Tx.Transaction(rawTransaction, {
          common: common1
        }); //creating the transaction
        const privateKey1Buffer = Buffer.from(senderkey, 'hex')
        transaction.sign(privateKey1Buffer); //signing the transaction with private key
        result = await web3.eth.sendSignedTransaction(`0x${transaction.serialize().toString('hex')}`) //sending the signed transaction

        try {
          let admin_balance = await usdtContract.methods.balanceOf(global.ADMIN_WALLET_ADDRESS).call();
          admin_balance = web3.utils.fromWei(admin_balance, "ether");
          BotController.balanceChanged(amount, PaymentType.WITHDRAWAL, admin_balance);
        } catch (error) {
          console.log(error)
        }
      }
      catch (err) {
        console.log("Withdraw transaction failed", err);
      }

      // axios.post(`${process.env.API_SERVER}/documentation/payment/api/partner/${partnerId}/withdraws/manual`, data, { headers })
      const token = global.manager_api_token;

      ManagerApi.Balance.withdrawMoney(token, data)
        .then(async withdrawResult => {
          console.log("withdraw success:", withdrawResult.data);
          withdraw.status = withdrawResult.data.status;
          withdraw.ledgerUid = withdrawResult.ledgerUid;
          await withdraw.save();
          try {
            let admin_balance = await usdtContract.methods.balanceOf(global.ADMIN_WALLET_ADDRESS).call();
            admin_balance = Web3.utils.fromWei(admin_balance, "ether");
            BotController.withdrawConfirmed(null, withdraw.tradingAccountId, amount)
            BotController.balanceChanged(amount, PaymentType.WITHDRAWAL, withdraw.tradingAccountId, admin_balance);
          } catch (error) {
            console.log(error)
          }
          await EmailController.sendWithdrawSuccess(email, amount, withdraw.tradingAccountId);

          return res.status(200).send({
            status: 1,
            message: "success"
          });
        })
        .catch(async err => {
          console.log(err);
          withdraw.status = "Failed";
          await withdraw.save();
          return res.status(500).send({
            status: 0,
            message: "error"
          });
        })
    } else {
      if (req.body.status === KYCStatus.REJECTED) {
        withdraw.decline_reason = req.body.decline_reason;
        await withdraw.save();
        EmailController.sendWithdrawDeclined(email, amount, withdraw.tradingAccountId, withdraw.decline_reason, withdraw.remark);
      }
      return res.status(200).send({
        status: 1,
        message: "success"
      });
    }
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      status: 0,
      message: "error"
    });
  }
} 
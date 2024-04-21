const axios = require("axios");
const { generateAccount } = require("tron-create-address");
const ethWallet = require("ethereumjs-wallet").default;
var bcrypt = require("bcryptjs");
var User = require("../models/user.js");
const Wallet = require("../models/wallet.js");
const Offer = require("../models/offer.js");
const DepositHistory = require("../models/deposit_history.js");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const Web3 = require("web3");
const ethers = require("ethers");
const Common = require("ethereumjs-common");
const Tx = require("ethereumjs-tx");
const Moralis = require("moralis").default;
const Chains = require("@moralisweb3/common-evm-utils");
const SocialAccount = require("../models/socialAccounts");

const { readHTMLFile } = require("../utils/helper.js");
const BUSDT_ABI = require("../abi/busdt_abi.json");
const USDT_ABI = require("../abi/usdt_abi.json");
const BNB_ABI = require("../abi/bnb_abi.json");

const providerUrl =  "https://go.getblock.io/5875a9e132834114903af08f0c623336";

const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const busdt = "0x55d398326f99059fF775485246999027B3197955"; ///BUSDT Contract
const bnb = "0x242a1ff6ee06f2131b7924cacb74c7f9e3a5edc9";

// const ManagerApi = require('./Manager/index.js').default;
const uuid = require("uuid");
const Database = require("./Database");
const EmailController = require("./Email/index.js");

const token = process.env.TELEGRAM_BOT_TOKEN;
const {
  IBStatus,
  KYCStatus,
  SocialStatus,
  PaymentType,
  DepositMode,
  DepositStatus,
} = require("./constant.js");
const BotController = require("./Bot/index.js");
const BalanceController = require("./balance.js");
const ManagerApi = require("./Manager/index.js");
const Web3Controller = require("./Web3/index.js");
const { generateQRcodeOfWallet } = require("../utils/qrcode.js");

let smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});
/*------------------SMTP Over-----------------------------*/

// Listening Wallet address
async function getBUsdtTransfer(email, wallet_address) {
  const provider = new ethers.providers.WebSocketProvider(
    `wss://bsc.getblock.io/f6350b45-37d3-4eaa-897e-e7711b010c6a/mainnet/`
  );
  const contract = new ethers.Contract(busdt, BUSDT_ABI, provider);
  const myfilter = contract.filters.Transfer(null, wallet_address);
  contract.on(myfilter, async (from, to, value, event) => {
    let transferEvent = {
      from: from,
      to: to,
      value: value,
      eventData: event,
    };
    let element = transferEvent;
    console.log("transferEvent:", element);
    console.log("toAddress:", wallet_address);
    const deposit_amount = web3.utils.fromWei(
      web3.utils.hexToNumberString(element.value._hex),
      "ether"
    );
    if (deposit_amount <= 0) {
      return;
    }
    Wallet.findOne({ ethAddress: wallet_address }).exec(async (err, wallet) => {
      if (err || !wallet) {
        console.log("Couldn't find a wallet of this address!");
        return;
      }
      EmailController.sendDepositSuccess(email, deposit_amount);

      const data = {
        paymentGatewayUuid: process.env.PAYMENT_GATEWAY_UUID, //"58d26ead-8ba4-4588-8caa-358937285f88",
        tradingAccountUuid: wallet.tradingAccountUuid,
        amount: deposit_amount,
        netAmount: deposit_amount,
        currency: "USD",
        remark: "string",
      };

      BalanceController._depositToTradingAccountId(
        deposit_amount,
        deposit_amount,
        DepositMode.GATEWAY,
        wallet.tradingAccountId,
        "USD",
        "Deposit",
        wallet.email,
        wallet.email,
        wallet.clientUuid,
        0
      );
      const contract = new web3.eth.Contract(BNB_ABI, bnb);
      const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt);

      let sender = global.ADMIN_WALLET_ADDRESS;
      let receiver = wallet_address;
      let senderkey = global.ADMIN_WALLET_PRIVATE_KEY; //admin private key

      try {
        //BNB needed for getting USDT
        let gas = await usdtContract.methods
          .transfer(sender, element.value._hex)
          .estimateGas({ from: receiver });

        let data = await contract.methods.transfer(
          receiver,
          element.value._hex
        ); //change this value to change amount to send according to decimals
        let nonce =
          (await web3.eth.getTransactionCount(sender, "pending")) +
          (await web3.eth.getPendingTransactions()).length; //to get nonce of sender address

        let chain = {
          name: "bsc",
          networkId: 56,
          chainId: 56,
        };

        let rawTransaction = {
          from: sender,
          gasPrice: web3.utils.toHex(parseInt(Math.pow(10, 9) * 5)), //5 gwei
          gasLimit: web3.utils.toHex(40000), //40000 gas limit
          gas: web3.utils.toHex(40000), //40000 gas
          to: receiver, //not interacting with bnb contract
          value: web3.utils.toHex(`${gas * parseInt(Math.pow(10, 9) * 5)}`), //in case of native coin, set this value
          data: data.encodeABI(), //our transfer data from contract instance
          nonce: web3.utils.toHex(nonce),
        };

        const common1 = Common.default.forCustomChain(
          "mainnet",
          chain,
          "petersburg"
        ); // declaring that our tx is on a custom chain, bsc chain

        let transaction = new Tx.Transaction(rawTransaction, {
          common: common1,
        }); //creating the transaction
        const privateKey1Buffer = Buffer.from(senderkey, "hex");
        transaction.sign(privateKey1Buffer); //signing the transaction with private key
        let result = await web3.eth.sendSignedTransaction(
          `0x${transaction.serialize().toString("hex")}`
        ); //sending the signed transaction
        console.log(`BNBTxstatus: ${result.status}`); //return true/false
        console.log(`BNBTxhash: ${result.transactionHash}`); //return transaction hash
        if (result.status) {
          let sender = wallet_address;
          let receiver = global.ADMIN_WALLET_ADDRESS;
          let senderkey = wallet.ethPrivateKey;
          // let senderkey = "52dca118350b78d772e8830c9f975f78b237e3a78a188bcbce902dc692ae58ac";

          // let data = await contract.methods.transfer(receiver, web3.utils.toHex(web3.utils.toWei(element.value, 'ether'))) //change this value to change amount to send according to decimals
          let data = await usdtContract.methods.transfer(
            receiver,
            element.value._hex
          ); //change this value to change amount to send according to decimals
          let nonce =
            (await web3.eth.getTransactionCount(sender, "pending")) +
            (await web3.eth.getPendingTransactions()).length; //to get nonce of sender address
          let rawTransaction = {
            from: sender,
            gasPrice: web3.utils.toHex(parseInt(Math.pow(10, 9) * 5)), //5 gwei
            gasLimit: web3.utils.toHex(40000), //40000 gas limit
            gas: web3.utils.toHex(gas),
            to: busdt, //interacting with busdt contract
            // "value": web3.utils.BN(web3.utils.toWei(element.value, 'ether')), //no need this value interacting with nopayable function of contract
            data: data.encodeABI(), //our transfer data from contract instance
            nonce: web3.utils.toHex(nonce),
          };
          let transaction = new Tx.Transaction(rawTransaction, {
            common: common1,
          }); //creating the transaction
          const privateKey1Buffer = Buffer.from(senderkey.substring(2), "hex");
          transaction.sign(privateKey1Buffer); //signing the transaction with private key

          result = await web3.eth.sendSignedTransaction(
            `0x${transaction.serialize().toString("hex")}`
          ); //sending the signed transaction
          console.log(`usdtTxstatus: ${result.status}`); //return true/false
          console.log(`usdtTxhash: ${result.transactionHash}`); //return transaction hash
        }
      } catch (err) {
        console.log(err);
      }
    });
  });
}

// Listening Wallet address  Over
exports.getUsers = async (req, res, next) => {
  User.find({})
    .sort({ submittedAt: "desc" })
    .exec((err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        return res.status(200).send(result);
      }
    });
};
exports.getUserByUuid = async (req, res, next) => {
  const accountUuid = req.params.id;

  User.findOne({ accountUuid })
    .then((user) => {
      console.log(user);
      return res.status(200).send(user);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json(err);
    });
};
exports.removeUsers = async (req, res, next) => {
  User.findOneAndRemove({ _id: req.params.id }, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).send(result);
    }
  });
};

exports.updateUsers = async (req, res, next) => {
  const reqbody = req.body.data;
  const {accountUuid, _id }  = req; 

  User.findOneAndUpdate(
    { _id: _id },
    {
      fullname: reqbody?.name,
      birthday: reqbody?.dob,
      address: reqbody?.address,
      city: reqbody?.city,
      state: reqbody?.state,
      country: reqbody?.country,
      postalCode: reqbody?.postalCode,
      phone: reqbody?.phone,
      landline_phone: reqbody?.landline_phone,
    },
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        let headers = {
          ...global.mySpecialVariable,
          "Content-Type": "application/json",
        };
        const partnerId = global.partnerId;
        const data = {
          uuid: result.accountUuid,
          name: result.fullname,
          surname: result.fullname,
          dateOfBirth: result.birthday,
          country: result.country,
          city: result.city,
          postCode: result.postalCode,
          address: result.address,
        };

        axios
          .put(
            `${process.env.API_SERVER}/documentation/account/api/accounts/?email=${result.email}&partnerId=${partnerId}`,
            data,
            { headers }
          )
          .then((accountRes) => {
            console.log("updated a CFD account:", accountRes.data);
            return res.status(200).send({ ...result, ...accountRes.data });
          })
          .catch((err) => {
            console.log("Update backoffice error:", err.response.data.message);
            return res.status(200).send(result);
          });
      }
    }
  );
};

exports.createTradingAccount = async (req, res, next) => {
  const data = {
    offerUuid: req.body.offerUuid,
    clientUuid: req.body.clientUuid,
    partnerId: global.partnerId, //req.body.partnerId,
    adminUuid: global.adminUuid,
  };

  const token = global.manager_api_token;

  ManagerApi.Account.create(token, data)
    .then(async (accountRes) => {
      console.log("created a new trading account:", accountRes.data);
      let addressData = ethWallet.generate();
      const eth_privateKey = addressData.getPrivateKeyString();
      // addresses
      const eth_address = addressData.getAddressString();
      //Tron
      const { address, privateKey } = generateAccount();
      const offer = await Offer.findOne({ offerUuid: data.offerUuid });

      const wallet = new Wallet({
        clientUuid: req.body.clientUuid,
        email: accountRes.data.clientEmail,
        tradingAccountUuid: uuid.v4(),
        tradingAccountId: accountRes.data.clientId,
        ethAddress: eth_address,
        ethPrivateKey: eth_privateKey,
        tronAddress: address,
        tronPrivateKey: privateKey,
        offerUuid: offer.offerUuid,
        isDemo: offer.demo,
      });

      /// generate qrcode for wallet
      generateQRcodeOfWallet(eth_address); 
      generateQRcodeOfWallet(address); 

      await wallet.save();
      const streams = await Moralis.Streams.getAll({
        limit: 100, // limit the number of streams to return
      });

      const oldStream = streams.result?.find(
        (item) => item._data?.tag === "sigma"
      );

      const filter_ERC20 = {
        and: [
          // { "eq": ['moralis_streams_contract_address', busdt] },
          { eq: ["to", eth_address] },
          { gt: ["value", "0000000000000000000"] }, // Example of USDT (18 Decimals)
        ],
      };
      const EvmChain = Chains.EvmChain;
      const options = {
        chains: [EvmChain.BSC],
        description: "USDT Transfers in Exxo Markets",
        tag: "exxo",
        includeContractLogs: true,
        abi: BUSDT_ABI,
        topic0: ["Transfer(address,address,uint256)"],
        webhookUrl: `${process.env.MY_SERVER}/api/user/webhook`,
        advancedOptions: {
          topic0: "Transfer(address,address,uint256)",
          filter: { gt: ["value", "0000000000000000000"] },
          includeNativeTxs: false,
        },
      };
      if (oldStream) {
        await Moralis.Streams.addAddress({
          id: oldStream._data?.id,
          address: [eth_address], // Users' addresses
        });
      } else {
        const stream = await Moralis.Streams.add(options);
        const { id } = stream.toJSON();
        await Moralis.Streams.addAddress({
          id: id,
          address: [eth_address], // Users' addresses
        });
      }

      readHTMLFile(
        __dirname + "/../public/email_template/Open_Live_account.html",
        function (err, html) {
          if (err) {
            console.log("error reading file", err);
            return;
          }
          var template = handlebars.compile(html);
          var replacements = {};
          var htmlToSend = template(replacements);
          var mailOptions = {
            from: `${process.env.MAIL_NAME} <${process.env.MAIL_USERNAME}>`,
            to: accountRes.data.clientEmail,
            bcc: process.env.MAIL_USERNAME,
            subject: "Your new account was created successfully!",
            html: htmlToSend,
          };
          smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
              // console.log(error);
            } else {
              // console.log("Message sent: " + response.response);
            }
          });
        }
      );
      res
        .status(200)
        .send({
          account: accountRes.data,
          message: "Your new account was created successfully!",
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Creating Trading account failed" });
    });
};
async function getAdminToken() {
  const auth = {
    grant_type: process.env.AUTH_GRANTTYPE,
    password: process.env.AUTH_PASSWORD,
    username: process.env.AUTH_USERNAME,
  };
  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: process.env.AUTH_AUTHORIZATION,
    Cookie: process.env.AUTH_COOKIE,
  };
  axios
    .post(`${process.env.API_SERVER}/proxy/auth/oauth/token`, auth, { headers })
    .then((result) => {
      headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${result.data.access_token}`,
        Cookie: "JSESSIONID=93AD5858240894B517A4B1A2ADC27617",
      };
      global.mySpecialVariable = headers;
      global.adminUuid = result.data.account_uuid;
      global.partnerId = result.data.partnerId;
    })
    .catch((err) => {
      console.log(err);
    });
}
exports.createWalletOfAllTradingAccounts = async (req, res, next) => {
  await getAdminToken();
  let headers = {
    ...global.mySpecialVariable,
    "Content-Type": "application/json",
  };
  const partnerId = global.partnerId;
  const from = "2022-01-14T00:00:00Z";
  const to = new Date().toISOString();
  const pageable = {
    sort: {
      sorted: true,
      unsorted: true,
      empty: true,
    },
    pageSize: 1000,
    pageNumber: 0,
    unpaged: true,
    paged: true,
    offset: 0,
  };
  let page = 0;
  try {
    while (true) {
      const accounts = await axios.get(
        `${process.env.API_SERVER}/documentation/account/api/partner/${partnerId}/accounts/view?from=${from}&to=${to}&size=1000&page=${page}&query=`,
        { headers }
      );
      for (let index = 0; index < accounts.data.content?.length; index++) {
        const element = accounts.data.content[index];
        const data = {
          offerUuid: req.body.offerUuid,
          partnerId: element.partnerId,
          clientUuid: element.uuid,
          adminUuid: global.adminUuid,
        };
        let headers = global.mySpecialVariable;
        const accountRes = await axios.get(
          `${process.env.API_SERVER}/documentation/account/api/partner/${partnerId}/accounts/${element.uuid}/trading-accounts/details`,
          { headers }
        );
        for (let index = 0; index < accountRes.data?.length; index++) {
          const trAccount = accountRes.data[index];
          let addressData = ethWallet.generate();
          const eth_privateKey = addressData.getPrivateKeyString();
          // addresses
          const eth_address = addressData.getAddressString();
          //Tron
          const { address, privateKey } = generateAccount();
          try {
            let wallet = await Wallet.findOne({
              tradingAccountUuid: trAccount.uuid,
            });
            if (!wallet) {
              wallet = new Wallet({
                clientUuid: element.uuid,
                email: element.email,
                tradingAccountUuid: trAccount.uuid,
                tradingAccountId: trAccount.login,
                ethAddress: eth_address,
                ethPrivateKey: eth_privateKey,
                tronAddress: address,
                tronPrivateKey: privateKey,
              });
              setTimeout(() => {
                getBUsdtTransfer(element.email, eth_address);
              }, (2000 * index) / 20);
            }
            await wallet.save();
          } catch (error) {
            console.log(error);
          }
        }
      }
      if (!accounts.data || page >= accounts.data.totalPages - 1) {
        break;
      }
      page++;
    }
    return res.status(200).send({ accounts: accounts.data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error });
  }
};

exports.getTradingAccounts = async (req, res, next) => {
  let headers = global.mySpecialVariable;
  const partnerId = global.partnerId;
  const clientUuid = req.query.clientUuid;

  axios
    .get(
      `${process.env.API_SERVER}/documentation/account/api/partner/${partnerId}/accounts/${clientUuid}/trading-accounts/details`,
      { headers }
    )
    .then(async (tradingAccountsRes) => {
      let trAccounts = tradingAccountsRes.data;
      for (let index = 0; index < trAccounts.length; index++) {
        const element = trAccounts[index];
        let wallet = await Wallet.findOne({ tradingAccountUuid: element.uuid });
        trAccounts[index].address = wallet?.ethAddress || "";
      }
      res.status(200).send(trAccounts);
    })
    .catch((e) => {
      console.log(e);
      res
        .status(500)
        .send("Axios request for getting trading accounts was failed!");
    });
};

exports.getTradingAccountTransactions = async (req, res, next) => {
  const partnerId = global.partnerId;
  const systemUuid = req.query.systemUuid;
  const tradingUuid = req.query.tradingAccountId;
  const tradingAccountUuid = req.query.tradingAccountUuid;
  const email = req.query.email;

  let params = {
    email: email,
    size: 1000,
  };

  let config = {
    headers: global.mySpecialVariable,
    params,
  };

  axios
    .get(
      `${process.env.API_SERVER}/documentation/payment/api/partner/${partnerId}/transactions`,
      config
    )
    .then(async (TransactionList) => {
      let list = TransactionList.data;
      //let t_list = list.filter(function(item) { item.tradingAccountUuid === tradingAccountUuid; });
      res.status(200).send(list[tradingAccountUuid]);
    })
    .catch((e) => {
      console.log(e);
      res
        .status(500)
        .send(
          "Axios request for getting trading account's transaction history was failed!"
        );
    });
};

exports.getIBParentTradingAccountDeposits = async (req, res, next) => {
  const clientEmail = req.query.email;
  const MANAGER_ID = process.env.MANAGER_ID;
  let authInfo = {
    password: "stalowa88rura",
    managerID: 904,
  };
  const date_ = new Date();
  let time = date_.getTime();
  let ledgerInfo = {
    auth: {
      managerID: 904,
      token: "",
    },
    rangeStart: 0,
    rangeEnd: new Date().getTime(),
    clientIds: [],
    ledgerTypes: [4],
  };
  let headers = {
    "Content-Type": "application/json",
  };
  const user = await User.findOne({ email: clientEmail });
  const ibParentTradingAccountId = user.ibParentTradingAccountId;

  if (!ibParentTradingAccountId) {
    return res.status(200).send([user]);
  }

  ledgerInfo = { ...ledgerInfo, clientIds: [ibParentTradingAccountId] };

  axios
    .post(`${process.env.MANAGE_API_SERVER}/v1/register/register`, authInfo, {
      headers,
    })
    .then(async (auth) => {
      let token = auth?.data?.token || "";
      if (!!token) {
        ledgerInfo.auth.token = token;
        axios
          .post(
            `${process.env.MANAGE_API_SERVER}/v1/ledger/getEntries`,
            ledgerInfo,
            { headers }
          )
          .then(async (result) => {
            const ledgerEntry = result?.data?.ledgerEntry;
            res.status(200).send(ledgerEntry);
          })
          .catch((e) => {
            console.log(e);
            res.status(500).send("Axios request for getting commissions");
          });
      }
    })
    .catch((e) => {
      console.log(e);
      res.status(500).send("Axios request for getting manager's token");
    });
};
exports.changePassword = async (req, res, next) => {
  const email = req.body.email;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  User.findOne({
    email: req.body.email,
  }).exec(async (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!user) {
      return res.status(200).send({
        success: false,
        error: "User Not found.",
      });
    }
    var passwordIsValid = bcrypt.compareSync(currentPassword, user.password);

    if (!passwordIsValid) {
      return res.status(200).send({
        success: false,
        error: "Invalid Password!",
      });
    }
    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();
    const data = {
      email,
      partnerId,
      newValue: newPassword,
    };
  });
};
exports.getOffers = async (req, res, next) => {
  let headers = global.mySpecialVariable;
  const email = req.query.email;
  const partnerId = global.partnerId;
  Offer.find({})
    .then((offerResult) => {
      res.status(200).send(offerResult);
    })
    .catch((e) => {
      res.status(500).send("Issue on Database!");
    });
};
exports.verifyProfile = async (req, res, next) => {
  const email = req.body.email;
  console.log("*****************", req.body);
  User.findOne({
    email: email,
  }).exec(async function (err, place) {
    if (err) {
      console.log(err);
      return res.status(200).send({
        success: false,
        error: "Internal Server Error",
      });
    }
    if (!place) {
      res.status(200).send({
        success: false,
        error: "User doesn't exist!",
      });
      return;
    }
    EmailController.sendKYCRecieved(email);
    BotController.kycUploaded(email);

    place.expDate = req.body.expDate;
    place.docType = req.body.docType;
    place.docType2 = req.body.docType2;
    place.docUrl1 = req.files?.frontImg ? req.files?.frontImg[0]?.path : "";
    place.docUrl2 = req.files?.backImg ? req.files?.backImg[0]?.path : "";
    place.docUrl3 = req.files?.proofOfResident
      ? req.files?.proofOfResident[0]?.path
      : "";
    place.verification_status = KYCStatus.PENDING;
    await place.save();

    return res.status(200).send({
      success: true,
      ...place._doc,
      password: undefined, 
      partnerId: undefined, 
    });
  });
};
exports.updateStatus = async (req, res, next) => {
  const id = req.params.id;
  let status = req.body.verification_status;
  User.findOneAndUpdate(
    {
      _id: id,
    },
    {
      verification_status: status,
      remark: req.body.remark,
    },
    function (err, place) {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (!place) {
        res.status(500).send({ message: "User doesn't exist!" });
        return;
      }
      let email = place.email;
      if (status === KYCStatus.APPROVED) {
        let headers = {
          ...global.mySpecialVariable,
          "Content-Type": "application/json",
        };
        const partnerId = global.partnerId;
        const data = {
          uuid: place.accountUuid,
          name: place.fullname,
          surname: place.fullname,
          dateOfBirth: place.birthday,
          country: place.country,
          state: place.state,
          city: place.city,
          postCode: place.postalCode,
          address: place.address,
          status: status,
        };
        EmailController.sendUserApproved(email);
        return res.status(200).send("The profile was verified.");
      } else if (status === KYCStatus.REJECTED) {
        EmailController.sendUserDeclined(email, req.body.remark);
        return res.status(200).send("The profile was rejected!");
      }
    }
  );
};
exports.internalTransfer = async (req, res, next) => {
  const originTradingAccountId = req.body.originTradingAccountId;
  const originTradingAccountUuid = req.body.originTradingAccountUuid;
  const targetTradingAccountUuid = req.body.targetTradingAccountUuid;
  const amount = req.body.amount;
  const email = req.body.email;
  const headers = {
    ...global.mySpecialVariable,
    "Content-Type": "application/json",
  };
  const partnerId = global.partnerId;
  let data = {
    paymentGatewayUuid: process.env.PAYMENT_GATEWAY_UUID, //"58d26ead-8ba4-4588-8caa-358937285f88",
    tradingAccountUuid: originTradingAccountUuid,
    amount: amount,
    netAmount: amount,
    currency: "USD",
    remark: "string",
  };
  axios
    .post(
      `${process.env.API_SERVER}/documentation/payment/api/partner/${partnerId}/withdraws/manual`,
      data,
      { headers }
    )
    .then(async (withdrawResult) => {
      data = {
        paymentGatewayUuid: process.env.PAYMENT_GATEWAY_UUID, //"58d26ead-8ba4-4588-8caa-358937285f88",
        tradingAccountUuid: targetTradingAccountUuid,
        amount: amount,
        netAmount: amount,
        currency: "USD",
        remark: "string",
      };
      axios
        .post(
          `${process.env.API_SERVER}/documentation/payment/api/partner/${partnerId}/deposits/manual`,
          data,
          { headers }
        )
        .then((depositRes) => {
          readHTMLFile(
            __dirname + "/../public/email_template/Withdraw_succeed.html",
            function (err, html) {
              if (err) {
                console.log("error reading file", err);
                return;
              }
              var template = handlebars.compile(html);
              var replacements = {
                AMOUNT: amount,
                TRADING_ACCOUNT_ID: originTradingAccountId,
              };
              var htmlToSend = template(replacements);
              var mailOptions = {
                from: `${process.env.MAIL_NAME} <${process.env.MAIL_USERNAME}>`,
                to: email,
                bcc: process.env.MAIL_USERNAME,
                subject: "Your internal transfer was succeeded!",
                html: htmlToSend,
              };
              smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Message sent: " + response.response);
                }
              });
            }
          );
          return res.status(200).send({ message: "success" });
        })
        .catch((err) => {
          console.log("deposit error", err);
          return res.status(500).send({ message: err });
        });
    })
    .catch((err) => {
      console.log("withdarw error", err);
      return res.status(500).send({ message: err });
    });
};
exports.getTradingAccountBalance = async (req, res, next) => {
  const tradingAccountId = req.query.tradingAccountId;
  const systemUuid = req.query.systemUuid;
  const partnerId = global.partnerId;
  let headers = global.mySpecialVariable;
  axios
    .get(
      `${process.env.API_SERVER}/documentation/account/api/partner/${partnerId}/systems/${systemUuid}/trading-accounts/${tradingAccountId}/balance`,
      { headers }
    )
    .then(async (tradingAccountsRes) => {
      return res.status(200).send(tradingAccountsRes.data);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    });
};

exports.webhook = async (req, res, next) => {
  const transactions = req.body.erc20Transfers;

  if (!req.body.confirmed) {
    return res.status(200).send("Not confirmed");
  }else if(transactions.length == 0 && transactions){
    return res.status(200).send('Verified'); 
  }

  console.log("process");
  if (transactions?.length > 0) {
    const element = transactions[0];
    const deposit_amount = element.valueWithDecimals;
    if (deposit_amount <= 0) {
      return res.status(200).send("Value is 0");
    }
    let history = await DepositHistory.findOne({
      txhash: element?.transactionHash,
    });
    if (history) {
      if (history.status == 4) {
        return res.status(200).send("Processed already!");
      }
    } else {
      history = new DepositHistory({ txhash: element?.transactionHash });
      await history.save();
    }
    const wallet_address = element.to;
    Wallet.findOne({ ethAddress: wallet_address }).exec(async (err, wallet) => {
      if (err || !wallet) {
        return res.status(200).send("Couldn't find a wallet of this address!");
      }
      try {
        if (history.status == 0){
          BotController.depositByWallet(
            wallet.email,
            deposit_amount,
            wallet_address,
            wallet.tradingAccountId
          );
          history.status = 1; 
        }
      } catch (error) {
        return res.status(500).send("Error"); 
        console.log(error);
      }
      const contract = new web3.eth.Contract(BNB_ABI, bnb);
      const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt);

      let sender = global.ADMIN_WALLET_ADDRESS;
      let receiver = wallet_address;
      let senderkey = global.ADMIN_WALLET_PRIVATE_KEY; //admin private key

      if (history.status == 1 ){
        BalanceController._depositToTradingAccountId(
          deposit_amount,
          deposit_amount,
          DepositMode.GATEWAY,
          wallet.tradingAccountId,
          "USD",
          "Deposit From Wallet",
          wallet.email,
          wallet.email,
          wallet.clientUuid
        );
        history.status = 2; 
      }
      try {
        //BNB needed for getting USDT
        const balance = await usdtContract.methods.balanceOf(receiver).call();
        const amount = web3.utils.toHex(balance);

        let result = await Web3Controller.sendBNBToWallet(
          global.ADMIN_WALLET_ADDRESS,
          global.ADMIN_WALLET_PRIVATE_KEY,
          wallet_address,
          amount
        );
        let result_to_admin = null; 
        if(history.status== 2){
          result_to_admin = await Web3Controller.sendUSDTToWallet(
            wallet_address,
            wallet.ethPrivateKey,
            global.ADMIN_WALLET_DEPOSIT_ADDRESS,
            0
          );
        }

        if (result_to_admin) {
          history.status = 4;
          history.save();
          let admin_balance = await Web3Controller.getUSDTBalance(
            global.ADMIN_WALLET_ADDRESS
          );
          BotController.balanceChanged(
            deposit_amount,
            PaymentType.DEPOSIT,
            wallet.tradingAccountId,
            admin_balance
          );
          EmailController.sendDepositSuccess(wallet.email, deposit_amount);
          return res.status(200).send("success");
        }
        history.save(); 
        return res.status(500).send("error"); 
      } catch (err) {
        history.save();
        console.log(err);
        BotController.errors(err, "WebHook");
        return res.status(500).send("error");
      }
    });
  } else {
    return res.status(500).send("Didn't get correct transactions");
  }
};

exports.requestIB = async (req, res, next) => {
  const accountUuid = req.accountUuid;
  User.findOneAndUpdate(
    { accountUuid: accountUuid },
    {
      ibStatus: IBStatus.PENDING,
    }
  ).exec((err, result) => {
    if (err) {
      console.log(err);
      return res.status(200).send({ success: false, error: "Server Error" });
    } else {
      if (result === null) {
        return res
          .status(500)
          .send({ success: false, error: "There is an error!" });
      }
      result.ibStatus = IBStatus.PENDING;
      return res.status(200).send({ success: true });
    }
  });
};

exports.cancelIB = async (req, res, next) => {
  const accountUuid = req.body.data.accountUuid;
  User.findOneAndUpdate(
    { accountUuid: accountUuid },
    {
      ibStatus: IBStatus.NEW,
      parentTradingAccountUuid: "",
    },
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        result.ibStatus = IBStatus.NEW;
        result.parentTradingAccountUuid = "";
        return res
          .status(200)
          .send({
            message: "Sent IB cancel request successfully!",
            account: result,
          });
      }
    }
  );
};

exports.IBClients = async (req, res, next) => {
  try {
    let ibClients = [];
    ibClients = await User.find({
      $or: [
        { ibStatus: IBStatus.PENDING },
        { ibStatus: IBStatus.APPROVED },
        { ibStatus: IBStatus.DECLINED },
      ],
    });
    return res.status(200).send(ibClients);
  } catch (error) {
    return res.status(500).send({ message: "error" });
  }
};

exports.updateIBStatus = async (req, res, next) => {
  const reqbody = req.body;
  const ibStatus = reqbody?.ibStatus;
  const ibParentTradingAccountUuid = reqbody?.ibParentTradingAccountUuid;
  let ibParentTradingAccountId = "";
  if (ibStatus === IBStatus.APPROVED) {
    let headers = global.mySpecialVariable;
    let wallet = await axios.get(
      `${process.env.API_SERVER}/documentation/account/trading-accounts/search/by-uuid?uuid=${ibParentTradingAccountUuid}`,
      { headers }
    );
    ibParentTradingAccountId = wallet.data?.tradingAccountId;
  }

  let lastIbClient = await User.findOne({}).sort({ ibNumber: -1 }).limit(1);
  const iblink_number = (lastIbClient?.ibNumber || 100000) + 1;
  let IBLink = process.env.IB_LINK_ENTRY + "/ib/" + iblink_number;

  User.findOneAndUpdate(
    { _id: reqbody?.id },
    {
      ibStatus: ibStatus,
      ibParentTradingAccountId: ibParentTradingAccountId,
      ibParentTradingAccountUuid: ibParentTradingAccountUuid,
      IBLink: ibStatus === IBStatus.APPROVED ? IBLink : "",
      IBDeclineReason: reqbody?.decline_reason,
      ibNumber: iblink_number,
    },
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        let email = result.email;

        if (ibStatus === IBStatus.DECLINED) {
          EmailController.sendIBDecliend(email);
        } else {
          EmailController.sendIBApproved(email, req.body.remark);
        }

        return res.status(200).send({ message: "success" });
      }
    }
  );
};

exports.getOwnIBClients = async (req, res, next) => {
  let parentTradingAccountUuid = req.query.parentTradingAccountUuid;
  User.find(
    {
      parentTradingAccountUuid: parentTradingAccountUuid,
      verification_status: KYCStatus.APPROVED,
    },
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        return res.status(200).send(result);
      }
    }
  );
};

exports.IBClientDetail = async (req, res, next) => {
  const _id = req.query.id;
  User.findOne({ _id: _id }, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    } else {
      return res.status(200).send(result);
    }
  });
};

exports.registerSocialTradingFeed = async (req, res, next) => {
  const accountUuid = req.body.params.accountUuid;
  const email = req.body.params.email;
  const socialAccountInfo = req.body.params.socialAccountInfo;
  console.log("social account info:", socialAccountInfo);
  const sStatus = SocialStatus.PENDING;

  let _socialAccountInfo = await SocialAccount.findOne({
    accountUuid: accountUuid,
  });
  if (_socialAccountInfo) {
    return res
      .status(501)
      .send({
        errType: "Wrong Application",
        errorMessage: "This user already applied the social trading Account",
      });
  }

  let socialAccount = new SocialAccount({
    email: email,
    accountUuid: accountUuid,
    hasWebsite: socialAccountInfo?.hasWebsite || false,
    hasClientBase: socialAccountInfo?.hasClientBase || false,
    shareTradingPerformance:
      socialAccountInfo?.shareTradingPerformance || false,
    promoteContent: socialAccountInfo?.promoteContent,
    tradingInstruments: socialAccountInfo?.tradingInstruments,
    tradingAccountForSocial: socialAccountInfo?.tradingAccountForSocial,
    incentiveFeePercentage: socialAccountInfo?.incentiveFeePercentage,
    sStatus: sStatus,
    createAt: new Date(),
  });
  socialAccount.save(function (err, result) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(result);
  });
};
exports.updateSocialAccountStatus = async (req, res, next) => {
  console.log(req);

  const sStatus = req.body.sStatus;
  const id = req.body.id;
  console.log(id);
  SocialAccount.findOneAndUpdate(
    { _id: id },
    { sStatus: sStatus },
    function (err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      } else {
        if (result === null) {
          return res.status(200).send("Account doesn't exist");
        }
        let email = result.email;
        let email_file = "Social_account_approve.html";
        if (sStatus === SocialStatus.DECLINED)
          email_file = "Social_account_decine.html";

        readHTMLFile(
          __dirname + "/../public/email_template/" + email_file,
          function (err, html) {
            if (err) {
              console.log("error reading file", err);
              return;
            }
            var template = handlebars.compile(html);
            var replacements = {};
            var htmlToSend = template(replacements);
            var mailOptions = {
              from: `${process.env.MAIL_NAME} <${process.env.MAIL_USERNAME}>`,
              to: email,
              bcc: process.env.MAIL_USERNAME,
              subject:
                "Social trading account application " +
                (sStatus === KYCStatus.APPROVED ? "approved" : "declined"),
              html: htmlToSend,
            };
            smtpTransport.sendMail(mailOptions, function (error, response) {
              if (error) {
                console.log(error);
              } else {
                console.log("Message sent: " + response.response);
              }
            });
          }
        );
        return res.status(200).send({ message: "success" });
      }
    }
  );
};

exports.getSocialTradingAccountInfo = async (req, res, next) => {
  const email = req.email;
  const accountUuid = req.accountUuid;

  SocialAccount.findOne({ email, accountUuid }, function (err, result) {
    if (err) {
      return res
        .status(500)
        .send({ errType: "Server Error", errorMessage: err.toString() });
    }
    return res.status(200).send({ socialAccountInfo: result });
  });
};

exports.getSocialTradingAccountInfoWithId = async (req, res, next) => {
  const id = req.query.id;

  SocialAccount.findOne({ _id: id }, function (err, result) {
    if (err) {
      return res
        .status(500)
        .send({ errType: "Server Error", errorMessage: err.toString() });
    }
    return res.status(200).send({ socialAccountInfo: result });
  });
};

exports.getSocialTradingAccountInfoAll = async (req, res, next) => {
  SocialAccount.find({})
    .sort({ createAt: "desc" })
    .exec((err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      return res.status(200).send(result);
    });
};

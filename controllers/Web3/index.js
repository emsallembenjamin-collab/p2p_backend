const BUSDT_ABI = require("../../abi/busdt_abi.json");
const USDT_ABI = require("../../abi/usdt_abi.json");
const BNB_ABI = require("../../abi/bnb_abi.json");
const ethers = require("ethers");
const Web3 = require("web3");
const Database = require("../Database");
const BotController = require("../Bot");
const Common = require("ethereumjs-common");
const Tx = require("ethereumjs-tx");
const { PaymentType } = require("../constant");
const busdt_address = "0x55d398326f99059fF775485246999027B3197955"; ///BUSDT Contract
const bnb_address = "0x242a1ff6ee06f2131b7924cacb74c7f9e3a5edc9";


const providerUrl =  "https://go.getblock.io/5875a9e132834114903af08f0c623336";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const BNBContract = new web3.eth.Contract(BNB_ABI, bnb_address);
const BUSDTContract = new web3.eth.Contract(BUSDT_ABI, busdt_address);

const getGas = () => {};

const getBalanceOfUsdt = async (address) => {
  let balance = await BUSDTContract.methods.balanceOf(receiver).call();
  let balance_of_wei = web3.utils.toHex(balance);
  return balance_of_wei;
};

const getGasOfUsdt = async (amount, address) => {
  let gas = await BUSDTContract.methods
    .transfer(sender, amount)
    .estimateGas({ from: receiver });
  return gas;
};

const sendBalanceByWallet = async (from, to, amount) => {};

const sendBNBToWallet = async (sender, _privateKey, receiver, amount) => {
  try {
    let privateKey = _privateKey.replace("0x", "");
    let gas = await BUSDTContract.methods
      .transfer(sender, amount)
      .estimateGas({ from: receiver });

    gas = parseInt(gas * 1.3);

    let data = await BNBContract.methods.transfer(receiver, amount); //change this value to change amount to send according to decimals

    const nonce = await web3.eth.getTransactionCount(sender, "pending");
    let chain = {
      name: "bsc",
      networkId: 56,
      chainId: 56,
    };
    let rawTransaction = {
      from: sender,
      gasPrice: web3.utils.toHex(parseInt(Math.pow(10, 9) * 5)), //5 gwei
      gasLimit: web3.utils.toHex(600000), //gas limit
      gas: web3.utils.toHex(60000), //gas
      to: receiver, //not interacting with bnb contract
      value: web3.utils.toHex(`${gas * parseInt(Math.pow(10, 9) * 5)}`), //in case of native coin, set this value
      data: data.encodeABI(), //our transfer data from contract instance
      nonce: web3.utils.toHex(nonce),
    };

    console.log({ rawTransaction });
    const common1 = Common.default.forCustomChain(
      "mainnet",
      chain,
      "petersburg"
    ); // declaring that our tx is on a custom chain, bsc chain

    let transaction = new Tx.Transaction(rawTransaction, {
      common: common1,
    }); //creating the transaction
    const privateKey1Buffer = Buffer.from(privateKey, "hex");
    transaction.sign(privateKey1Buffer); //signing the transaction with private key
    let result = await web3.eth.sendSignedTransaction(
      `0x${transaction.serialize().toString("hex")}`
    ); //sending the signed transaction
    return result;
  } catch (e) {
    console.log(e, "bnb");
    return false;
  }
};

const sendUSDTToWallet = async (sender, senderkey, receiver, amount) => {
  let _senderkey = senderkey.replace("0x", "");
  try {
    // const usdtContract = new web3.eth.Contract(BUSDT_ABI, busdt_address);
    const balance = await BUSDTContract.methods.balanceOf(sender).call();

    BotController.errors({ balance }, "sendUSDTToWallet");
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 600000;

    let amount_hex = web3.utils.toHex(web3.utils.toBN((!!amount && amount * Math.pow(10, 18)) || balance));
    let data = await BUSDTContract.methods.transfer(receiver, amount_hex); //change this value to change amount to send according to decimals
    let nonce =(await web3.eth.getTransactionCount(sender, "pending")) +(await web3.eth.getPendingTransactions()).length; //to get nonce of sender address
    let gas = await BUSDTContract.methods.transfer(receiver, amount_hex).estimateGas({ from: sender });

    let chain = {
      name: "bsc",
      networkId: 56,
      chainId: 56,
    };

    let rawTransaction = {
      from: sender,
      gasPrice: web3.utils.toHex(gasPrice), //5 gwei
      gasLimit: web3.utils.toHex(gasLimit), //40000 gas limit
      gas: web3.utils.toHex(gas),
      to: busdt_address, //interacting with busdt contract
      data: data.encodeABI(), //our transfer data from contract instance
      nonce: web3.utils.toHex(nonce),
    };

    BotController.errors({ rawTransaction });
    const common1 = Common.default.forCustomChain(
      "mainnet",
      chain,
      "petersburg"
    ); // declaring that our tx is on a custom chain, bsc chain

    let transaction = new Tx.Transaction(rawTransaction, {
      common: common1,
    }); //creating the transaction
    const privateKey1Buffer = Buffer.from(_senderkey, "hex");
    transaction.sign(privateKey1Buffer); //signing the transaction with private key
    result = await web3.eth.sendSignedTransaction(
      `0x${transaction.serialize().toString("hex")}`
    ); //sending the signed transaction

    try {
      let admin_balance = await BUSDTContract.methods
        .balanceOf(global.ADMIN_WALLET_ADDRESS)
        .call();
      admin_balance = web3.utils.fromWei(admin_balance, "ether");
      return { admin_balance };
    } catch (error) {
      console.log(error);
      return false;
    }
  } catch (err) {
    BotController.errors(
      "from" + sender + "---to---" + receiver + " bnb transfer"
    );
    console.log("Withdraw transaction failed", err);
    return false;
  }
};

async function getUSDTBalance(address) {
  // Call the balanceOf function
  const balance = await BUSDTContract.methods.balanceOf(address).call();
  const formattedBalance = web3.utils.fromWei(balance, "ether"); // USDT uses 6 decimals, but this method works because it's a string manipulation method
  console.log(`The USDT balance of address ${address} is: ${formattedBalance}`);
  return formattedBalance;
}

const Web3Controller = {
  sendBalanceByWallet,
  sendBNBToWallet,
  sendUSDTToWallet,
  getUSDTBalance,
};
module.exports = Web3Controller;

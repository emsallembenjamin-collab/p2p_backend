const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const ethers = require("ethers");
const BUSDT_ABI = require("./abi/busdt_abi.json");
const BNB_ABI = require("./abi/bnb_abi.json");
const AdminWallet = require("./models/admin_wallet");
const Wallet = require('./models/wallet.js');
const Web3 = require("web3");
const Common = require('ethereumjs-common');
const Tx = require('ethereumjs-tx');
const web3 = new Web3(new Web3.providers.HttpProvider("wss://bsc.getblock.io/d7f32d05-c742-4801-b6a6-27d02111f17e/mainnet/"))
// token address
require("dotenv").config();
const ManagerApi = require('./controllers/Manager');
const Moralis = require('./controllers/Moralis');
const BOController = require("./controllers/BO");
const BotController = require("./controllers/Bot");
const CommissionController = require("./controllers/Commission");
const EmailController = require("./controllers/Email");
const WebSocketController = require("./socket_server");

const busdt = "0x55d398326f99059fF775485246999027B3197955"; ///BUSDT Contract
const bnb = "0x242a1ff6ee06f2131b7924cacb74c7f9e3a5edc9";
var cron = require('node-cron');
var manager_api_token = "";
const { readHTMLFile } = require("./utils/helper.js");

WebSocketController.init();

mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`, [], (err) => {
    if (err) {
        console.log(`DB connection failed at ${process.env.DB_URL}/${process.env.DB_NAME}`);
    } else {
        console.log(`DB connected at ${process.env.DB_URL}/${process.env.DB_NAME}`);
    }
});

const router = require("./api/router");
const auth = require("./api/auth");
const user = require("./api/user");
const other = require("./api/other");
const account = require("./api/account");
const admin = require("./api/admin");
const SymbolController = require("./controllers/Symbol");
const { checkAdmin } = require("./middlewares");
const SocketController = require("./controllers/Notification");

const app = express();
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    name: 'app.sid',
    secret: "exxo",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// app.use(cors({ origin: "*", credentials : true }));
app.use(cors())

app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/static', express.static('public/images'));
app.use('/api/qrcode', express.static('public/qrcode'));
// Initialization
app.use(cookieParser());

app.get("/result", (req, res) => {
    res.sendFile(__dirname + "/public/result.csv");
});
app.get(`/download/uploads/:filename`, [checkAdmin], (req, res) => {

    res.download(__dirname + "/public/uploads/" + req.params.filename);
});


app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/other", other);
app.use("/api/account", account);
app.use("/api/admin", admin);


const getAdminToken = async () => {

    try {
        const wallet = await AdminWallet.findOne({});
        if (wallet) {
            global.ADMIN_WALLET_ADDRESS = wallet.address;
            global.ADMIN_WALLET_PRIVATE_KEY = wallet.privateKey;
            global.ADMIN_WALLET_WITHDRAW_ADDRESS = wallet.withdrawAddress;
            global.ADMIN_WALLET_WITHDRAW_PRIVATE_KEY = wallet.withdrawPrivateKey;
            global.ADMIN_WALLET_DEPOSIT_ADDRESS = wallet.depositAddress;
        } else {
            global.ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;
            global.ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY;
            global.ADMIN_WALLET_WITHDRAW_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;
            global.ADMIN_WALLET_WITHDRAW_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY;
            global.ADMIN_WALLET_DEPOSIT_ADDRESS = process.env.ADMIN_WALLET_DEPOSIT_ADDRESS;
        }
    } catch (e) {
        BotController.errors(e, "getAdminToken");
        console.log(e);
    }
}

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {

    Moralis.initMoralis();
    SocketController.initSecketServer();

}); 
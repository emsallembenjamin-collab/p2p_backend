const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const AdminWallet = require("./models/admin_wallet");
require("dotenv").config();
const { loadEnvironment } = require('./config/environment');
const Moralis = require('./controllers/Moralis');
const BotController = require("./controllers/Bot");
const WebSocketController = require("./socket_server");
const { UnsafePathError, resolveDownloadPath } = require('./utils/safePath');

const environment = loadEnvironment();

WebSocketController.init();

const databaseUri = `${environment.databaseUrl}/${environment.databaseName}`;
mongoose.connect(databaseUri, [], (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Database connection established.');
    }
});

const auth = require("./api/auth");
const user = require("./api/user");
const { checkAdmin } = require("./middlewares");
const SocketController = require("./controllers/Notification");

const app = express();
if (environment.trustProxy) {
    app.set('trust proxy', 1);
}

app.use(session({
    name: 'app.sid',
    secret: environment.sessionSecret,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: environment.sessionMaxAgeMs,
        sameSite: 'lax',
        secure: environment.isProduction,
    },
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
app.get('/download/uploads/:filename', [checkAdmin], (req, res, next) => {
    try {
        const uploadDirectory = `${__dirname}/public/uploads`;
        const downloadPath = resolveDownloadPath(uploadDirectory, req.params.filename);

        return res.download(downloadPath, req.params.filename, (error) => {
            if (error && !res.headersSent) next(error);
        });
    } catch (error) {
        return next(error);
    }
});

app.use("/api/auth", auth);
app.use("/api/user", user);
// app.use("/api/admin", admin);

app.use((error, req, res, next) => {
    if (error instanceof UnsafePathError) {
        return res.status(error.statusCode).send({ message: error.message });
    }

    console.error('Unhandled request error:', error);
    return res.status(500).send({ message: 'Internal server error' });
});

const getAdminWallet = async () => {

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
        BotController.errors(e, "getAdminWallet");
        console.log(e);
    }
}

app.listen(environment.port, async () => {
    Moralis.initMoralis();
    getAdminWallet(); 
    SocketController.initSecketServer();
}); 

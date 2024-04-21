var router = require("express").Router();
const { authJwt, verifySignUp, userValidation, checkAdmin } = require("../middlewares");
const AccountController = require("../controllers/account");
const OrderController = require("../controllers/order");
const LedgerController = require("../controllers/ledger");
const PositionController = require("../controllers/position");
const BranchController = require("../controllers/branch");
const BalanceController = require("../controllers/balance");
const UserValidation = require("../middlewares/user");

router.get("/tradingAccounts",[authJwt.verifyToken ], AccountController.getTradingAccounts);
router.get("/tradingAccounts/:userId",[authJwt.verifyToken ], AccountController.getTradingAccountsByUuid);
router.post("/tradingAccount",[authJwt.verifyToken ], AccountController.createTradingAccount);
router.post("/user/:id/tradingAccount",[checkAdmin, (req, res, next)=>{
    req.email = req.body.email; 
    req.accountUuid = req.params.id; 
    next();
} ], AccountController.createTradingAccount);
router.get("/tradingAccount/:id",[authJwt.verifyToken ], AccountController.getTradingAccountByTradingAccountUuid);
router.get("/freeMargin/:id",[authJwt.verifyToken ], AccountController.getFreeMargin);
router.post("/transfer",[authJwt.verifyToken, userValidation.kycApproved ], BalanceController.internalTransfer);
router.get("/transaction",[authJwt.verifyToken ], AccountController.getTradingAccountTransactions);
// router.get("/managertoken", AccountController.getManagerToken);
router.get("/active-orders/:id",[authJwt.verifyToken ], OrderController.getActiveOrdersByAccountUuid);
router.get("/canceled-orders/:id",[authJwt.verifyToken ], OrderController.getAllOrdersByAccountUuid);
router.get("/open-positions/:id",[authJwt.verifyToken ], PositionController.getAllPositionsByAccountUuid);
router.get("/closed-positions/:id",[authJwt.verifyToken ], LedgerController.getClosedPositionsFromLedgersByTradingAccountId);
router.get("/ledgers/:id",[authJwt.verifyToken ], LedgerController.getLedgersForTradingAccount);
router.get("/offers/real",[authJwt.verifyToken], BranchController.getRealOffersByUser);
router.get("/offers/demo",[authJwt.verifyToken], BranchController.getDemoOffersByUser);
router.post("/withdrawMoney", [authJwt.verifyToken, UserValidation.validateWithdraw], BalanceController.requestWithdrawalAuto);  //user's withdraw request
module.exports = router;

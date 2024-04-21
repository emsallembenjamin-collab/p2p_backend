var router = require("express").Router();
const { authJwt, verifySignUp, userValidation } = require("../middlewares");
const { upload } = require("../controllers/controllers");
const { webhook,  updateUsers, getTradingAccounts,  createTradingAccount,
   createWalletOfAllTradingAccounts, verifyProfile, internalTransfer, getTradingAccountBalance,
   requestIB, cancelIB, IBClientDetail,
   getSocialTradingAccountInfo,
   getSocialTradingAccountInfoWithId,
   registerSocialTradingFeed, updateSocialAccountStatus, } = require("../controllers/user");
const UserController = require("../controllers/customer");
const BranchController = require("../controllers/branch");
const AccountController = require("../controllers/account");
const multer = require('multer');
const OrderController = require("../controllers/order");
const PositionController = require("../controllers/position");
const SysLogController = require("../controllers/syslog");
const MailController = require("../controllers/mail");
const SettingController = require("../controllers/setting");
const IBCommissionCotroller = require("../controllers/ibcommission");
const AnalyticsController = require("../controllers/analytics");

router.get("/offers", [ authJwt.verifyToken ], BranchController.getOffersByUser);
router.get("/tradingAccounts", [authJwt.verifyToken], getTradingAccounts);
router.get("/tradingAccountTransactions/:tradingAccountUuid", [authJwt.verifyToken], AccountController.getTradingAccountTransactions);
router.get("/tradingAccount/balance", [authJwt.verifyToken], getTradingAccountBalance);
router.post("/tradingAccount", [authJwt.verifyToken], createTradingAccount);
router.post("/walletOfAllTradingAccounts", createWalletOfAllTradingAccounts);

router.get("/telegram",  SettingController.getTelegram );

router.post("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/verify-profile", upload.fields([{ name: "frontImg", maxCount: 1 }, { name: "backImg", maxCount: 1 }, { name: "proofOfResident", maxCount: 1 }]), verifyProfile);
router.post("/checkDuplicateUsernameOrEmail", verifySignUp.checkDuplicateUsernameOrEmail, (req, res) => { res.status(200).send(true) });
router.post("/update-password", [authJwt.verifyToken], UserController.changePassword);

router.post("/webhook", webhook);

router.post("/internal-transfer", [authJwt.verifyToken], internalTransfer);

router.post("/request-ib", [authJwt.verifyToken, userValidation.kycApproved], requestIB);
router.post("/cancel-ib", [authJwt.verifyToken], cancelIB);
router.get("/ib-client-detail", [authJwt.verifyToken], IBClientDetail);

router.get("/ib-clients", [authJwt.verifyToken], UserController.getIBOwnClients);
router.get("/ib-commissions", [authJwt.verifyToken], IBCommissionCotroller.getIBCommissionsForUser);


router.get("/social-account-info", [authJwt.verifyToken], getSocialTradingAccountInfo);
router.get("/social-account-info-with-id", [authJwt.verifyToken], getSocialTradingAccountInfoWithId);
router.put("/social-account-info", [authJwt.verifyToken], registerSocialTradingFeed);
router.post("/social-account-info", [authJwt.verifyToken], updateSocialAccountStatus);

///////
router.get("/profile", [authJwt.verifyToken], UserController.getUserProfileByUuid);
router.put("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/profile-image", [authJwt.verifyToken, upload.single('image')], UserController.saveUserProfileImage);
router.get("/account-info", [authJwt.verifyToken], UserController.getAccountInfo);
router.get("/orders", [authJwt.verifyToken], OrderController.getAllOrdersFromUser);
router.get("/positions", [authJwt.verifyToken, (req, res, next) => {
   req.params.id = req.accountUuid;
   next();
}], PositionController.getAllPositionsByClientUuid);
router.get("/positions-closed", [authJwt.verifyToken, (req, res, next) => {
   req.params.id = req.accountUuid;
   req.body.from = 0;
   req.body.end = new Date().getTime();
   next();
}], PositionController.getClosedPositionsByClientUuid);

router.get("/syslogs", [authJwt.verifyToken], SysLogController.getSyslogsForUser);
router.get("/user-activity", [authJwt.verifyToken], SysLogController.getSyslogsForUser);
router.get("/transactions/:id", [authJwt.verifyToken], AccountController.getTransactions);
router.post("/request-sms", [authJwt.verifyToken], AccountController.requestSMS);
router.post("/sms-number", [authJwt.verifyToken], AccountController.validateSMSNumber);
router.get("/email-notification", [authJwt.verifyToken, (req, res, next)=>{
   req.params.id = req.accountUuid; 
   next(); 
}], MailController.getMailAndNotifications);

router.get("/balance-analytics", [authJwt.verifyToken], AnalyticsController.getBalanceAnalytics);

module.exports = router;

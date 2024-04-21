var router = require("express").Router();
const { authJwt, verifySignUp, userValidation } = require("../middlewares");
const { upload } = require("../controllers/controllers");
const UserController = require("../controllers/customer");
const AccountController = require("../controllers/account");
const multer = require('multer');
const OrderController = require("../controllers/order");
const MailController = require("../controllers/mail");
const SettingController = require("../controllers/setting");
const IBCommissionCotroller = require("../controllers/ibcommission");
const AnalyticsController = require("../controllers/analytics");

router.get("/telegram",  SettingController.getTelegram );

router.post("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/verify-profile", upload.fields([{ name: "frontImg", maxCount: 1 }, { name: "backImg", maxCount: 1 }, { name: "proofOfResident", maxCount: 1 }]), verifyProfile);
router.post("/checkDuplicateUsernameOrEmail", verifySignUp.checkDuplicateUsernameOrEmail, (req, res) => { res.status(200).send(true) });
router.post("/update-password", [authJwt.verifyToken], UserController.changePassword);

router.post("/webhook", UserController.webhook);

router.get("/profile", [authJwt.verifyToken], UserController.getUserProfileByUuid);
router.put("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/profile-image", [authJwt.verifyToken, upload.single('image')], UserController.saveUserProfileImage);
router.get("/account-info", [authJwt.verifyToken], UserController.getAccountInfo);
router.post("/request-sms", [authJwt.verifyToken], AccountController.requestSMS);
router.post("/sms-number", [authJwt.verifyToken], AccountController.validateSMSNumber);
router.get("/email-notification", [authJwt.verifyToken, (req, res, next)=>{
   req.params.id = req.accountUuid; 
   next(); 
}], MailController.getMailAndNotifications);

router.get("/balance-analytics", [authJwt.verifyToken], AnalyticsController.getBalanceAnalytics);

router.post("/deposite/usdt", [authJwt.verifyToken], )
router.post("/deposite/bnb", [authJwt.verifyToken], )
router.post("/deposite/fiat", [authJwt.verifyToken], )
router.post("/withdraw/usdt", [authJwt.verifyToken], )
router.post("/withdraw/bnb", [authJwt.verifyToken], )
router.post("/withdraw/fiat", [authJwt.verifyToken], )
router.post("/order/buy", [authJwt.verifyToken],  )
router.post("/order/sell", [authJwt.verifyToken], )
router.post("/sell", [authJwt.verifyToken], )
router.post("/buy", [authJwt.verifyToken], )


module.exports = router;

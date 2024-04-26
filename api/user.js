var router = require("express").Router();
const { authJwt, verifySignUp } = require("../middlewares");
const { upload } = require("../controllers/controllers");
const UserController = require("../controllers/customer");
const multer = require('multer');
const MailController = require("../controllers/mail");
const SettingController = require("../controllers/setting");
const AnalyticsController = require("../controllers/analytics");
const OrderController = require("../controllers/order");
const BalanceController = require("../controllers/balance");

router.get("/telegram",  SettingController.getTelegram );

router.post("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/verify-profile", upload.fields([{ name: "frontImg", maxCount: 1 }, { name: "backImg", maxCount: 1 }, { name: "proofOfResident", maxCount: 1 }]), UserController.verifyProfile);
router.post("/checkDuplicateUsernameOrEmail", verifySignUp.checkDuplicateUsernameOrEmail, (req, res) => { res.status(200).send(true) });
router.post("/update-password", [authJwt.verifyToken], UserController.changePassword);

router.post("/webhook", UserController.webhook);

router.get("/profile", [authJwt.verifyToken], UserController.getUserProfileByUuid);
router.put("/profile", [authJwt.verifyToken], UserController.saveUserProfile);
router.post("/profile-image", [authJwt.verifyToken, upload.single('image')], UserController.saveUserProfileImage);
router.get("/email-notification", [authJwt.verifyToken, (req, res, next)=>{
   req.params.id = req.accountUuid; 
   next(); 
}], MailController.getMailAndNotifications);

router.get("/balance-analytics", [authJwt.verifyToken], AnalyticsController.getBalanceAnalytics);

router.post("/deposite/usdt", [authJwt.verifyToken], BalanceController.depositUsdt)
router.post("/deposite/fiat", [authJwt.verifyToken], BalanceController.depositFiat)

router.post("/order/buy", [authJwt.verifyToken], OrderController.OrderBuy )
router.post("/order/sell", [authJwt.verifyToken], OrderController.OrderSell)
router.post("/order/cancel", [authJwt.verifyToken], OrderController.OrderCancel)
router.post("/order/process", [authJwt.verifyToken], OrderController.ProcessOrder )
router.get("/orders/buy", [authJwt.verifyToken], OrderController.GetBuyOrders)
router.get("/orders/sell", [authJwt.verifyToken], OrderController.GetSellOrders)


module.exports = router;

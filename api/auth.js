var router = require("express").Router();
const { authJwt, verifySignUp, checkAdmin, checkAdminWithout2FA, checkSuperAdmin } = require("../middlewares");
const controller = require("../controllers/auth");
const UserController = require("../controllers/customer");
const Database = require("../controllers/Database");
const CommissionController = require("../controllers/Commission");
const TFAController = require("../controllers/TFA");

router.get("/admins",[checkSuperAdmin] ,controller.getAdmins);
router.post("/admin",  [verifySignUp.checkDuplicateAdminNameOrEmail],  controller.updateAdmin);
router.delete("/admin", controller.deleteAdmin);
router.post("/admin-signin", controller.adminSignin);
router.post("/admin-signin-with-token",[checkAdmin], controller.adminSigninWithToken);
router.post("/signup", UserController.createUser);
router.post("/google-signup", [verifySignUp.checkDuplicateUsernameOrEmail],UserController.createUserFromGoogle);
router.post("/signin", controller.signin);
router.post("/google-signin", UserController.googleSignIn);
router.get("/verify", UserController.verifyEmail);
router.post("/reset-link", controller.resetLink);
router.post("/resend-email", controller.resendEmail);
router.get("/reset-password", controller.resetPasswordPage);
router.post("/reset-password", UserController.changePasswordFP);
// router.post("/reset-password", controller.resetPassword);
router.post("/send-verify-code", [authJwt.verifyToken] ,controller.sendWithdrawVerifyCode);
router.get("/verify-withdraw-code", controller.verifyWithdrawCode);

router.post('/start-2fa', controller.startAdmin2FA); 
router.post('/verify-2fa', controller.verifyAdmin2FA )
router.get('/get-2fa', controller.getAdmin2FA); 
router.post("/verify-2fa", [checkAdminWithout2FA], controller.verifyAdmin2FA );
router.post("/signinWithToken",[authJwt.verifyToken], async (req, res, next)=>{
    const user =await Database.Account.getAccountDetailByUuid(req.accountUuid); 
    res.status(200).send({
        success: true, 
        body: {
         ...user._doc,
         password: undefined, 
         oneTimeToken: undefined, 
         ibRanking: CommissionController.getIBRankingName(user.ibRanking)
        }
    });
});

router.post("/verify-2fa-client", [authJwt.verifyTFAToken], TFAController.verifyTFA );
router.post("/resend-2fa", [authJwt.verifyTFAToken], TFAController.resendTFACode );
router.put("/tfa-mode", [authJwt.verifyToken], UserController.updateTFAMode );
router.put("/tfa", [authJwt.verifyToken], UserController.updateTfa );

router.put("/phone", [authJwt.verifyToken], TFAController.sendPhoneVerify );
router.post("/phone", [authJwt.verifyToken], TFAController.verifyPhone );

router.get("/ga-secret", [authJwt.verifyToken], TFAController.getGASecret );

module.exports = router;

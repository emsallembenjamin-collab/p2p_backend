
var router = require("express").Router();
const { verifySignUp, checkUpdateIBUser, checkUpdateUser, checkUpdateWithdrawStatus } = require("../middlewares");
const {checkAdmin, checkSuperAdmin} = require("../middlewares");
const KYCController = require("../controllers/kyc");
const OrderController = require("../controllers/order");
const BalanceController = require("../controllers/balance");
const AdminController = require("../controllers/admin");
const SettingController = require("../controllers/setting");
const UserController = require("../controllers/customer");
const MailController = require("../controllers/mail");
const AnalyticsController = require("../controllers/analytics");
const sendSMS = require("../controllers/SMS");
const { checkUpdateAdmin, checkUpdateCommissionSetup, checkUpdateSetting } = require("../middlewares");
const SocketController = require("../controllers/Notification");
const { generateAllQrcode } = require("../utils/qrcode");

router.post("/default",  AdminController.addDefault);

router.get("/users", [checkAdmin], UserController.getUsers);

router.get("/user/mail-notifications/:id", [checkAdmin], MailController.getMailAndNotifications);
router.patch("/user/password/:id", [checkAdmin], UserController.changePasswordFromAdmin )
router.patch("/user/email/:id", [checkAdmin], UserController.changeEmail )
router.patch("/user/profile/:id", [checkAdmin], UserController.updateProfileFromAdmin )
router.delete("/user/:id", [checkAdmin], UserController.deleteUser )
router.get("/user/:id", [checkAdmin], UserController.getUserProfile);
router.post("/user/status/:id", [checkAdmin, checkUpdateUser], UserController.updateStatus);

router.put("/user/branch/:id", [checkSuperAdmin], UserController.updateUserBranch);
router.get("/user/ibuser/:id", [checkAdmin], UserController.getIBUser);
router.put("/user/:id/ib-user", [checkAdmin, checkUpdateIBUser], UserController.updateIBUser);
router.put("/user/:id/ga_secret", [checkAdmin], UserController.updateGASecret);

router.post("/user/notification", [checkAdmin], UserController.updateStatus);
router.post("/mail/user/:id", [checkAdmin], MailController.sendMailToUser);
router.post("/mail/bulk", [checkAdmin], MailController.sendMailToUsers);


router.post('/update-ib-status', [checkAdmin, checkUpdateIBUser], UserController.updateIBStatus);
router.post('/update-ib-commissiontype', [checkAdmin, checkUpdateIBUser], UserController.updateIBCommissionType);

router.post("/bulk/kyc/approve", [checkAdmin, checkUpdateUser], UserController.approveBulkKYCStatus);
router.post("/bulk/kyc/reject", [checkAdmin, checkUpdateUser], UserController.rejectBulkKYCStatus);
router.post("/bulk/kyc/delete", [checkAdmin, checkUpdateUser], UserController.deleteBulkKYCStatus);
router.post("/bulk/ib/approve", [checkAdmin, checkUpdateIBUser], UserController.approveBulkIBStatus);
router.post("/bulk/ib/reject", [checkAdmin, checkUpdateIBUser], UserController.rejectBulkIBStatus);
router.post("/bulk/account", [checkSuperAdmin], UserController.updateStatus);
router.post("/bulk/account/deposit", [checkSuperAdmin], UserController.updateStatus);
router.post("/bulk/account/withdraw", [checkSuperAdmin], UserController.updateStatus);
router.delete("/bulk/account", [checkSuperAdmin], UserController.updateStatus);
router.get("/kyc-setting", [checkAdmin], KYCController.getKYCSettings );
router.put("/kyc-setting", [checkAdmin], KYCController.updateKYCSetting );
router.post('/tradingAccounts/qrcode', generateAllQrcode);
router.get("/active-orders/:id",[checkAdmin ], OrderController.getActiveOrdersByAccountUuid);
router.get("/canceled-orders/:id",[checkAdmin ], OrderController.getCanceledOrdersByAccountUuid);


router.get("/deposit/trading-account/:id", [checkAdmin], BalanceController.getDepositHistoryForTradingAccount);
router.get("/deposit/user/:id", [checkAdmin], BalanceController.getDepositHistoryForUser);
router.get("/deposit", [checkAdmin], BalanceController.getDepositHistoryAll);
router.get("/deposit-amount", [checkAdmin], BalanceController.getTotalDepositAmount);
router.post("/deposit/:id", [checkAdmin], BalanceController.depositToTradingAccountId);


router.get("/withdraw/user/:id", [checkAdmin], BalanceController.getWithdrawHistoryForUser);
router.get("/withdraw", [checkAdmin], BalanceController.getWithdrawHistoryAll);
router.post("/withdraw/create", [checkAdmin, checkUpdateWithdrawStatus], BalanceController.requestWithdrawalManual);
router.put("/withdraw/confirm/:id", [checkAdmin, checkUpdateWithdrawStatus], BalanceController.confirmWithdrawall);
router.post("/withdraw/reject/:id", [checkAdmin, checkUpdateWithdrawStatus], BalanceController.rejectWithdrawall);


router.post("/bulk/withdraw/approve", [checkAdmin, checkUpdateWithdrawStatus], BalanceController.approveMassWRequest);
router.post("/bulk/withdraw/reject", [checkAdmin, checkUpdateWithdrawStatus], BalanceController.rejectMassWRequest);

router.put("/admin", [checkAdmin, checkUpdateAdmin], AdminController.createAdmin );
router.post("/admin", [checkAdmin, checkUpdateAdmin], AdminController.updateAdmin );
router.get("/admins", [checkAdmin, checkUpdateAdmin], AdminController.getAdmins );
router.get("/admin/:id", [checkAdmin, checkUpdateAdmin], AdminController.getAdminById );

router.get("/default-branch", [checkAdmin], SettingController.getDefaultBranch );
router.put("/default-branch", [checkAdmin, checkUpdateSetting], SettingController.updateDefaultBranch );


router.get("/telegram", [checkAdmin], SettingController.getTelegram );
router.put("/telgram", [checkAdmin, checkUpdateSetting], SettingController.updateTelegram );

router.get("/syslogs/:id", [checkAdmin],  UserController.getSystemLogs);
router.get("/system-logs", [checkAdmin],  UserController.getSystemLogs);

router.get("/default/commission-type", [checkAdmin, checkUpdateSetting], SettingController.getDefaultCommissionType );
router.put("/default/commission-type", [checkAdmin, checkUpdateSetting], SettingController.updateDefaultCommissionType );

router.get("/user-analytics",[ checkAdmin ], AnalyticsController.getUserAnalytics );
router.get("/account-analytics",[ checkAdmin ], AnalyticsController.getAccountAnalytics );
router.get("/deposit-analytics",[ checkAdmin ], AnalyticsController.getDepositAnalytics );
router.get("/position-analytics",[ checkAdmin ], AnalyticsController.getPosititionAnalytics);
router.get("/balance-analytics", [checkAdmin], AnalyticsController.getBalanceAnalytics);
router.get("/user/:id/balance", [checkAdmin], BalanceController.getBalanceInfoForUser);

router.get("/default/commission-type", [checkAdmin, checkUpdateSetting], SettingController.getDefaultCommissionType );
router.put("/default/commission-type", [checkAdmin, checkUpdateSetting], SettingController.updateDefaultCommissionType );

router.post("/reset-2fa", [checkAdmin, checkUpdateAdmin], AdminController.reset2FA);
router.get("/roles", [checkAdmin], AdminController.getRoles);
router.get("/role/:id", [checkAdmin], AdminController.getRole);
router.post("/role", [checkAdmin, checkUpdateAdmin], AdminController.updateRole);
router.delete("/role/:id", [checkAdmin, checkUpdateAdmin], AdminController.deleteRole);
router.post("/send-sms", function(req, res, next){
    sendSMS("+381 629293863", "Love You!"); 
    res.status(200).send({});
} );

router.post("/send-notification/:id", (req, res)=>{
    SocketController.sendNotifyToUser(req.params.id, {title:"notification success", content:"Success"}); 
    res.send('Success'); 
})



module.exports = router;


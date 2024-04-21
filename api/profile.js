
var router = require("express").Router();
const { authJwt, verifySignUp } = require("../middlewares");
const AccountController = require("../controllers/account");

router.get("/tradingAccounts",[authJwt.verifyToken ], AccountController.getTradingAccounts);
router.post("/tradingAccount",[authJwt.verifyToken ], AccountController.createTradingAccount);
router.post("/transfer",[authJwt.verifyToken ], AccountController.internalTransfer);
router.get("/transaction",[authJwt.verifyToken ], AccountController.getTradingAccountTransactions);

// router.get("/accounts/view", controller.getAdmins);
// router.get("/accounts/view/for-provider",  [verifySignUp.checkDuplicateAdminNameOrEmail],  controller.updateAdmin);
// router.get("/accounts/view/by-email",  [verifySignUp.checkDuplicateAdminNameOrEmail],  controller.updateAdmin);
// router.put("/accounts",  [verifySignUp.checkDuplicateAdminNameOrEmail],  controller.updateAdmin);
// router.patch("/accounts",  [verifySignUp.checkDuplicateAdminNameOrEmail],  controller.updateAdmin);

module.exports = router;

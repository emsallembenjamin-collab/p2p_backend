var router = require("express").Router();
const { authJwt, verifySignUp } = require("../middlewares");
const { getSetting, updateSetting, getWithdraw, getWithdrawDetail, updateWithdraw, getWallets, getClientWallets, getDeposit } = require("../controllers/other");

router.get("/setting", [ authJwt.verifyToken ], getSetting);
router.get("/wallets", [ authJwt.verifyToken ], getWallets);
router.get("/client_wallets", [ authJwt.verifyToken ], getClientWallets);
router.post("/setting", [ authJwt.verifyToken ], updateSetting);
router.get("/withdraw", [ authJwt.verifyToken ], getWithdraw);
router.get("/withdraw_detail", [ authJwt.verifyToken ], getWithdrawDetail);
router.post("/withdraw", [ authJwt.verifyToken ], updateWithdraw);
router.get("/deposit",  getDeposit);

module.exports = router;
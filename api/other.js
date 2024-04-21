var router = require("express").Router();
const { authJwt,  checkAdmin, checkUpdateSetting } = require("../middlewares");
const { getSetting, updateSetting, getWithdraw, getWithdrawDetail,  getDeposit } = require("../controllers/other");

router.get("/setting", [ checkAdmin ], getSetting);
router.post("/setting", [ checkAdmin, checkUpdateSetting ], updateSetting);
router.get("/withdraw", [ authJwt.verifyToken ], getWithdraw);
router.get("/withdraw_detail", [ authJwt.verifyToken ], getWithdrawDetail);
router.get("/deposit",  getDeposit);

module.exports = router;
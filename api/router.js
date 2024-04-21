var router = require("express").Router();
const { webhook } = require("../controllers/user");
const { buy } = require("../controllers/controllers");

router.post("/webhook",  webhook);
router.post("/buy",  buy);


module.exports = router;
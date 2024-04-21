const mongoose = require("mongoose");
const {  WithdrawStatus } = require("../controllers/constant");

const Withdraw = mongoose.model(
  "Withdraw",
  new mongoose.Schema({
    Uuid:               String, 
    email:              String,
    amount:             String,
    address:            String,
    currency:           String,
    tradingAccountId:   String, 
    tradingAccountUuid: String,
    toTradingAccountUuid: String, 
    toTradingAccountId: String, 
    comment:             String,
    method:             {type: String, default: "AUTO" }, 
    paymentGateway:     String, 
    withdrawStep:       String, 
    decline_reason:     String, 
    submittedAt:        {type: Date, default: Date.now},
    status:             {type: String, default: WithdrawStatus.WITHDRAWAL_NEW },  //Pending, Approved, Rejected (Withdraw status)
  })
);

module.exports = Withdraw;
const mongoose = require("mongoose");
const { DepositMode } = require("../controllers/constant");

const Report = mongoose.model(
  "Report",
  new mongoose.Schema({
    uuid: String, 
    clientUuid: String,
    email: String,
    user_name: String, 
    tradingAccountUuid: String,
    tradingAccountId: String,
    amount: Number,
    code: String,
    transfer_code: String,
    transfer_amount: String,
    createdAt: Date,
    ethAddress: String,
    status: String,
    depositMode: {
      type: String, 
      default: DepositMode.GATEWAY
    },
    dealer: String, 
    comment:String, 
    from: String, 
  })
);

module.exports = Report;
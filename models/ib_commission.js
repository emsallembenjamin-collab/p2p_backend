const mongoose = require("mongoose");
const { DepositMode } = require("../controllers/constant");

const IBCommission = mongoose.model(
  "IBCommissions",
  new mongoose.Schema({
    from: String, 
    closedVolume: Number,
    createdAt: Date, 
    commissionAmount: Number, 
    comment: String, 
    positionID: String, 
    ibTradingAccountId: String, 
    email: String
  })
);

module.exports = IBCommission;
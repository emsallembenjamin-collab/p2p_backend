const mongoose = require("mongoose");
const {  WithdrawStatus } = require("../controllers/constant");

const Withdraw = mongoose.model(
  "Withdraw",
  new mongoose.Schema({
    accountUuid:        String,
    amount:             Number,
    address:            String,
    method:             String, 
    submittedAt:        Date
  })
);

module.exports = Withdraw;
const mongoose = require("mongoose");
const { DepositMode } = require("../controllers/constant");

const Report = mongoose.model(
  "Report",
  new mongoose.Schema({
    uuid: String, 
    user_id: String, 
    amount: String, 
    type: String, 
    at: Date, 
    transactionID: String, 
  })
);

module.exports = Report;
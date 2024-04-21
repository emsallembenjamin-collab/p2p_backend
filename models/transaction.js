const mongoose = require("mongoose");
const { PaymentType } = require("../controllers/constant");
const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    transationId: String,
    orderId: String, 
    state: String, 
    processingAt: Date, 
    finishedAt: Date
  })
);
module.exports = Transaction;
const mongoose = require("mongoose");
const { PaymentType } = require("../controllers/constant");
const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    email:              String, 
    tradingAccountUuid: String, 
    amount:             String,
    t_type:             {type: String, default: PaymentType.DEPOSIT }, // Withdrawl
    payment_gateway:    String, 
    status:             String, 
    createdAt:          {
      type: Date, 
      default: new Date
    }, 
  })
);
module.exports = Transaction;
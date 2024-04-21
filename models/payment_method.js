const mongoose = require("mongoose");

const PaymentMethod = mongoose.model(
  "PaymentMethod",
  new mongoose.Schema({
    name: String,
    Uuid: String, 
    status: Boolean,
  })
);

module.exports = PaymentMethod;

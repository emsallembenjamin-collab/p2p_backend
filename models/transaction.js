const mongoose = require("mongoose");
const { PaymentType } = require("../controllers/constant");
const OrderTransaction = mongoose.model(
  "OrderTransaction",
  new mongoose.Schema({
    transationId: String,
    orderId: String, 
    state: String, 
    processingAt: Date, 
    finishedAt: Date, 
    clientUuid: String
  })
);
module.exports = OrderTransaction;
const mongoose = require("mongoose");
const { PaymentType, OrderType, OrderStates } = require("../controllers/constant");
const Order = mongoose.model(
  "Orders",
  new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    clientUuid: {
        type: String,
        required: true
    },
    order_type: {
        type: Number,
    },
    amount: {
        type: Number,
        required: true
    },
    state: {
        type: Number,
        default:  OrderStates.New
    }, 
    price: Number, 
    createdAt: Date
  })
);
module.exports = Order;
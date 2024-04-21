const mongoose = require("mongoose");
const { PaymentType } = require("../controllers/constant");
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
        type: String,
        enum: ['Sll', 'Buy'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled', 'New'],
        required: true,
        default: 'Pending'
    },
    node: {
        type: String,
        required: true
    }
  })
);
module.exports = Order;
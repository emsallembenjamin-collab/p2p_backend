const mongoose = require("mongoose");
const { PaymentType } = require("../controllers/constant");
const Transaction = mongoose.model(
  "Orders",
  new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
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
        enum: ['Pending', 'Completed', 'Cancelled'],
        required: true,
        default: 'Pending'
    },
    node: {
        type: String,
        required: true
    }
  })
);
module.exports = Transaction;
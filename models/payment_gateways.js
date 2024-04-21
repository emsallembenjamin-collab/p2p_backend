const mongoose = require("mongoose");

const PaymentGateway = mongoose.model(
    "PaymentGateway",
    new mongoose.Schema({
        gatewayUuid:    String, 
        name:           String, 
        paymentMethod:  String, 
        currency:       String, 
        processingFee:  Number, 
        depositFee:     Number,
        withdrawFee:    Number, 
        isDepositActive:Boolean, 
        isWithdrawActive:Boolean, 
        minAmount:       Number, 
        masAmount:      Number, 
        isVerifyRequired: Boolean, 
        isAllTransfer:   Boolean,
        depositOperation: String, 
        withdrawOperation: String
    })
);

module.exports = PaymentGateway;
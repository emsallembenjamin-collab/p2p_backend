const mongoose = require("mongoose");

const DepositHistory = mongoose.model(
  "DepositHistory",
  new mongoose.Schema({
    txhash: String,
    status:{
      type:Number ,
      default: 0
    } 
  })
);

module.exports = DepositHistory;
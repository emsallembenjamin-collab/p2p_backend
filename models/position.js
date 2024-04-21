const mongoose = require("mongoose");

const Position = mongoose.model(
  "Position",
  new mongoose.Schema({
    clientId: String, 
    uid: String, 
    generatedTime: Number, 
    entryType: Number, 
    amount: Number, 
    comment: String, 
    generatingOrdId: String, 
    generatingClOrdId: String,
    instrument: String,
    closedAvgOpenPrice: Number,
    closePrice: Number,
    closedOrdId: String,
    closedClOrdId: String,
    closedVolume: Number,
    closedCommission: Number,
    closedSwap: Number,
    volumeFrom: Number,
    closedOpenTime: Number,
    tpPrice: Number,
    slPrice: Number,
    additionalType: Number
  })
);
module.exports = Position;
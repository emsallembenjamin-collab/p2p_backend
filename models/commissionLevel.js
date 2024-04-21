const mongoose = require("mongoose");

const CommissionLevel = mongoose.model(
  "CommissionLevel",
  new mongoose.Schema({
    commissionLevelUuid: String,
    commissionUuid: String,
    type: String,
    offerUuid: String,
    offer: String,
    depth: Number,
    levels: Array,
    instruments: String,
    isAllInstrument: Boolean, 
    isNoneZeroBalance: {
      type: Boolean,
      default: false
    }
  })
);
module.exports = CommissionLevel;
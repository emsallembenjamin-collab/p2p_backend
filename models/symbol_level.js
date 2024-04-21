const mongoose = require("mongoose");

const SymbolLevel= mongoose.model(
  "SymbolLevel",
  new mongoose.Schema({
    commissionLevelUuid: String, 
    symbolId: String,
    symbol: String,
    depth: Number, 
    levels: String
  })
);

module.exports = SymbolLevel;
const mongoose = require("mongoose");

const Symbol= mongoose.model(
  "Symbol",
  new mongoose.Schema({
    symbolId: String,
    symbol: String,
    baseCurrency: String,
    quoteCurrency: String,
    decimalPlaces: String,
    contractSize: String,
    leverage: String,
    commissionPercentRatio: String,
    swapShort: String,
    swapLong: String,
    calculationType: String,
    multiplier: String,
    divider: String,
    multiplierCurrency: String,
    volumePrecision: String,
    lotSize: String,
    symbolAlias: String,
    description: String,
    swapCalculationType: String,
    quoteValidityConfig: Object
  })
);

module.exports = Symbol;
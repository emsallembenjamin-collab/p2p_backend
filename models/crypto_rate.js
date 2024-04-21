const mongoose = require("mongoose");

const CryptoRate = mongoose.model(
  "CryptoRate",
  new mongoose.Schema({
    pair: String,
    rate: String,
  })
);

module.exports = CryptoRate;
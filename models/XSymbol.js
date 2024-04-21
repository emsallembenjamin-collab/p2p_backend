const mongoose = require("mongoose");

const XSymbol= mongoose.model(
  "xsymbol",
  new mongoose.Schema({
    Symbol: String,
    Cacl_Type: String
  })
);

module.exports = XSymbol;
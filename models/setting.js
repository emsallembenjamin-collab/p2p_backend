const mongoose = require("mongoose");

const Setting = mongoose.model(
  "Setting",
  new mongoose.Schema({
    telegram: String, 
    branchUuid: String,
    commissionType: String
  })
);

module.exports = Setting;
const mongoose = require("mongoose");

const Setting = mongoose.model(
  "Setting",
  new mongoose.Schema({
    telegram: String, 
    
  })
);

module.exports = Setting;
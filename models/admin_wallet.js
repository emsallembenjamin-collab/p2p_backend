const mongoose = require("mongoose");

const AdminWallet = mongoose.model(
  "AdminWallet",
  new mongoose.Schema({
    address: String,
    privateKey: String,
    withdrawAddress: String,
    withdrawPrivateKey: String,
    depositAddress:String
  })
);

module.exports = AdminWallet;
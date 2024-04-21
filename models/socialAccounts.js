const mongoose = require("mongoose");
const { NUMBER } = require("sequelize");
const { SocialStatus } = require("../controllers/constant");
const SocialAccount = mongoose.model(
  "SocialAccount",
  new mongoose.Schema({
    email:                      String,
    accountUuid:                String,
    hasWebsite:                 Boolean,
    hasClientBase:              Boolean,
    shareTradingPerformance:    Boolean,
    promoteContent:             String,
    tradingInstruments:         Number, 
    tradingAccountForSocial:    String, 
    incentiveFeePercentage:     Number, 
    sStatus:                    {type:String, default: SocialStatus.NEW},
    createAt:                   {type:Date, default: new Date()},
    declinedReason:             String, 
  })

);
module.exports = SocialAccount;
const mongoose = require("mongoose");

const Group = mongoose.model(
  "Group",
  new mongoose.Schema({
    groupUuid:      String, 
    name:           String, 
    instrument:     String, 
    description:    String,
    leverage:       Number, 
    system:         String,
    groupName:      String, 
    initialDeposit: Number, 
    branch:         String, 
    isDemo:         Boolean, 
    isAuto:         Boolean, 
    brokerAnalytics:Boolean,
    isHidden:       Boolean,
    PAMMOffer:      Boolean,
    verifyReqruied: Boolean,
    MTR_Pro:        Boolean,
  })    
);

module.exports = Group;
const mongoose = require("mongoose");

const Offer = mongoose.model(
  "Offer",
  new mongoose.Schema({
    uuid: String, 
    createdAt: {
      type: Date, 
      default: new Date
    },
    name:           String, 
    demo: Boolean, 
    currency: {
      type: String, 
      default: "USD"
    },
    hidden: Boolean, 
    description:    String,
    moneyManager: String, 
    initialDeposit: Number, 
    leverage:       {
        type: Number, 
        default: 0
    }, 
    verificationRequired:{
      type: Boolean,
      default: false
    },
    groupName:      String, 
    branch: {
      type: Object, 
      default: {}
    },
    system:{
      type:Object, 
      default: {}
    },
    recordNumber: Number, 
    mt5MamSystemType: String, 
    offerRedirect:String, 
  })    
);
module.exports = Offer;
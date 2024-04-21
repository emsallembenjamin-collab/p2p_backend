const mongoose = require("mongoose");

const Commission = mongoose.model(
  "Commission",
  new mongoose.Schema({
    commissionUuid: String, 
    name: String,  
    description: String, 
    commissionType: String, 
    createdAt: {
        type: Date, 
        default: new Date()
    },
    updatedAt:{
        type: Date, 
        default: new Date()
    },
    commissionLevels:{
        type: Array,
        default:[]
    },
  })
);

module.exports = Commission;
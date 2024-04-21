const mongoose = require("mongoose");

const Branch = mongoose.model(
  "Branch",
  new mongoose.Schema({
    branchUuid:     String, 
    name:           String, 
    adminUuid:      String, 
    adminEmail:     String, 
    description:    String,
    status:         String, 
    offers:         Array
  })    
);

module.exports = Branch;
const mongoose = require("mongoose");

const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    adminUuid: String,
    email:      String,
    password:   String,
    name:       String,
    role:       {
                    type: String, 
                    default: "Admin"
                }, //Admin, Super Admin
    createdAt: {type: Date, default: Date.now},
    enable2FA:  {type: Boolean, default: false }, 
    secret:   String, 
    subRole: String, 
    hidden: String, 
  })
);

module.exports = Admin;
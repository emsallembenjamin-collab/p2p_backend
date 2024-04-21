const mongoose = require("mongoose");

const Role = mongoose.model(
  "Role",
  new mongoose.Schema({
    name: String,
    roleUuid: String, 
    permissions: Array,
    description: String
  })
);

module.exports = Role;
const mongoose = require("mongoose");

const SysLogs= mongoose.model(
  "syslog",
  new mongoose.Schema({
    logUuid: String, 
    createdAt: {
        type: Date, 
        default: new Date()
    }, 
    actionStatus: String, 
    email: String, 
    accountUuid: String, 
    comment: String, 
    actionType : String, 
    actionName: String, 
  })
);

module.exports = SysLogs;
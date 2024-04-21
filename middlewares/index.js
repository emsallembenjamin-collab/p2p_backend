const authJwt = require("./authJwt");
const verifySignUp = require("./verifySignup");
const checkSuperAdmin = require('./superAdmmin');
const { 
  checkAdmin, 
  checkAdminWithout2FA, 
  checkUpdateAdmin, 
  checkUpdateCommissionSetup, 
  checkUpdateSetting, 
  checkUpdateWithdrawStatus, 
  checkUpdateIBUser, 
  checkUpdateUser
} = require('./admin');
const userValidation = require("./user");

module.exports = {
  authJwt,
  verifySignUp,
  checkSuperAdmin, 
  checkAdmin, 
  checkAdminWithout2FA, 
  userValidation, 
  checkUpdateAdmin, 
  checkUpdateCommissionSetup, 
  checkUpdateSetting, 
  checkUpdateWithdrawStatus, 
  checkUpdateUser, 
  checkUpdateIBUser
};
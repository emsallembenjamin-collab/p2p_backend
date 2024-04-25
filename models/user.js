const mongoose = require("mongoose");
const { KYCStatus, IBStatus, commissionTypes, TFAMode } = require("../controllers/constant");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    accountUuid:                String,
    avatarUrl:                  String,
    created:                    Date,
    updated:                    Date,
    email:                      String,
    password:                   String,
    fullname:                   String,
    birthday:                   String,
    expDate:                    String,
    country:                    String,
    state:                      String,
    city:                       String,
    address:                    String,
    postalCode:                 String,
    phone:                      String,
    landline_phone:             String,
    docType:                    String,         
    docType2:                   String,         
    docUrl1:                    String,
    docUrl2:                    String,
    docUrl3:                    String,
    remark:                     String,
    submittedAt:                {type: Date, default: Date.now},
    verification_status:        { type: String, default: KYCStatus.NEW },   //New, Pending, Approved, Rejected (KYC status)
    isEmailVerified:            { type: Boolean, default: false, required: true },
    role:                       String,
    roleUuid:                   String, 
    leadInfo:                   {type: Object, default:{} },
    phoneVerified:              {
      type: Boolean, 
      default: false
    },
    enable2FA:                  {
      type: Boolean, 
      default: true
    }, 
    tfa_mode:      {
      type:String, 
      default: TFAMode.TFA_EMAIL
    } ,
    parentAccountUuid: String, 
    gaSecret: String,
    ethAddress:           String,
    ethPrivateKey:        String,
    tronAddress:          String,
    tronPrivateKey:       String,
    usdtBalance:{
      type: Number, 
      default: 0
    }, 
    usdtLock:{
      type: Number, 
      default: 0
    }, 
    fiatBalance: {
      type: Number, 
      default:0
    }, 
    fiatLock:{
      type: Number, 
      default:0
    }, 
    bnbBalance: Number, 
    bnbLock: Number, 
  })
);

module.exports = User;
const mongoose = require("mongoose");
const { KYCStatus, IBStatus, commissionTypes, TFAMode } = require("../controllers/constant");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    accountUuid:                String,
    avatarUrl:                  String,
    partnerId:                  String, 
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
    account_type:               String,
    submittedAt:                {type: Date, default: Date.now},
    verification_status:        { type: String, default: KYCStatus.NEW },   //New, Pending, Approved, Rejected (KYC status)
    isEmailVerified:            { type: Boolean, default: false, required: true },
   
    role:                       String,
    roleUuid:                   String, 
    leadInfo:                   {type: Object, default:{} },
    oneTimeToken:               String, 
    branchInfo:                 Object,
    branchUuid:                 String, 
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
    ibStatus:                   { type: String, default: IBStatus.NEW },
    ibParentTradingAccountId:   { type: String, default: "" },      // Own IB trading account account to receive commission
    ibParentTradingAccountUuid: { type: String, default: "" },
    parentTradingAccountId:     String,                             // IB parents ib trading account
    parentTradingAccountUuid:   String, 
    IBLink:                     { type: String, default: "" },      // For Affiliate link 
    IBDeclineReason:            { type: String, default: "" },    
    ibSubmittedAt:              {type: Date, default: Date.now},
    ibCreatedAt:                Date,
    ibNumber:                   Number,                             // created when setting as the IB user
    ibCommissionType:           String, 
    isQClient:                  { type: Boolean,  default: false},  // 
    isQIB:                      { type: Boolean, default :false},   // Qulified IB user
    ibRanking:                  Number,                               // Ranking labeld by commission setting.json, 
    ibRankingUpdated:           Number, 
    qClientUpdated:             Number

  })
);

module.exports = User;
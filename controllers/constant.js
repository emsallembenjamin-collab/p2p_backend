
exports.LedgerTypes = {
    UNDEFINEDENTRY: 0,
    COMMISSION: 1,
    SWAP: 2,
    CLOSED_POSITION: 3,
    DEPOSIT: 4,
    WITHDRAWAL: 5,
    CREDIT_IN: 6,
    CREDIT_OUT: 7,
    AGENT_COMMISSION: 8,
}

exports.OrderType = {
   BUY: 0, 
   SELL: 1,     
}

exports.OrderStates = {
    New: 0,
    PENDING: 1,
    PROCESSING: 2, 
    FINISHED: 3, 
    CANCELLED: 4

}

exports.AccountRole = {
    CUSTOMER: "User", 
    ADMIN: "Admin", 
    SUPER_ADMIN: "Super Admin"
}
exports.AdminRole = {
    UPDATE_ADMIN: "UPDATE_ADMIN", 
    UPDATE_SETTING: "UPDATE_SETTING", 
    UPDATE_COMMISSION_SETUP: "UPDATE_COMMISSION_SETUP",
    APPROVE_WITHDRAW: "APPROVE_WITHDRAW", 
    APPROVE_DEPOSIT: "APPROVE_DEPOSIT",
    UPDATE_BRANCH: "UPDATE_BRANCH" ,
    UPDATE_USER: "UPDATE_USER",
}

exports.KYCStatus ={
    APPROVED: "VERIFIED", 
    REJECTED: "REJECTED",
    PENDING: "PENDING",
    NEW: "NEW", 
    DELETED: "DELETED"
}

exports.DepositStatus = {
    DEPOSIT_DONE: "DONE",
    DEPOSIT_FAILED: "FAILED", 

}
exports.DepositType={
    USDT: "USDT", 
    FIAT: "FIAT"
}

exports.WithdrawStatus ={
    WITHDRAWAL_DONE: "DONE",
    WITHDRAWAL_APPROVED: "PROCESSING",
    WITHDRAWAL_FAILED: "FAILED", 
    WITHDRAWAL_NEW: "NEW"
}

exports.PaymentType = {
    Bank: "Bank",
    Credit: "Credit"
}

exports.BranchStatus = {
    ACTIVE: "ACTIVE", 
    INACTIVE: "INACTIVE"
}

exports.commissionTypes= {
    COM_100K: "$100K", 
    COM_SPREAD:"Spread",
    COM_LOT:"Lot", 
    COM_MEDIUM:"Medium"
}; 

exports.commissionTypeNames = [
    "$100K", "Spread", "Lot", "Medium"
]

exports.analyticsMode = {
    WEEK: "WEEK",
    MONTH: "MONTH"
}

exports.actionType = {
    ADMIN: "Admin Action", 
    USER: "User Action", 
    SYSTEM: "System Action"
}

exports.actionStatus = {
    SUCCESS: "Success", 
    FAILED: "Failed", 
    INFO: "Info"
}
exports.AdminRole = {
    UPDATE_ADMIN: "UPDATE_ADMIN", 
    UPDATE_SETTING: "UPDATE_SETTING", 
    UPDATE_COMMISSION_SETUP: "UPDATE_COMMISSION_SETUP",
    APPROVE_WITHDRAW: "APPROVE_WITHDRAW", 
    APPROVE_DEPOSIT: "APPROVE_DEPOSIT",
    UPDATE_BRANCH: "UPDATE_BRANCH" ,
    UPDATE_USER: "UPDATE_USER",
    UPDATE_IBUSER:"UPDATE_IBUSER"
}
exports.ActionKind = {
    UPDATE_ADMIN: "Update admin info", 
    UPDATE_SETTING: "Update settings",
    UPDATE_COMMISSION_SETUP: "Update ib commission setup",
    APPROVE_WITHDRAW: "Approve withdraw", 
    APPROVE_DEPOSIT: "Approve Deposit",
    UPDATE_BRANCH: "Update branch",
    UPDATE_USER: "Update user",
    UPDATE_IBUSER:"Update IB user"
}
exports.TFAMode ={
    TFA_SMS: "SMS",
    TFA_GA:"Google Auth",
    TFA_EMAIL:"Email"
}

exports.offerNames = {
    EXXO_IB: process.env.IBOFFER, 
    EXXO_CONDER: "Exxo Conder", 
    EXXO_COMMET: "Exxo Comet", 
    DEMO_CONDER:"Demo Conder", 
    DEMO_COMET: "Demo Comet"
}
exports.WitdrawMethod ={
    USDT_BEP20: "USDT BEP20", 
    Vietnam_Bank: "Vietnam Bank Transfer", 
}

exports.errorMsgs ={
    InSufficientUsdtBalance : "Insufficient Balance for Usdt."
    
}
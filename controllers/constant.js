
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

exports.OrderTypes = {
    BUYMARKET: 0,
    SELLMARKET: 1,
    BUYLIMIT: 2,
    SELLLIMIT: 3,
    BUYSTOP: 4,
    SELLSTOP: 5,
    BUYSTOPLIMIT: 6,
    SELLSTOPLIMIT: 7,
    BUYTPSL: 20,
    SELLTPSL: 21,
    BUYTPSLPENDING: 24,
    SELLTPSLPENDING: 25,
    BUYCORRECTION: 100,
    SELLCORRECTION: 101,
    BUYMAM: 102,
    SELLMAM: 103,
}

exports.RecordTypes = {
    FILLED: 1,
    CANCELLED: 2,
    LEDGERS: 3,
    LP_EXEC_REPORT: 4,
    ACCOUNT_SNAPSHOT: 5,
    REJECTED: 6,
    ADDED: 7,
}

exports.AdditionalTypes = {
    NONE: 0,
    NEGATIVE_BALANCE_WITHDRAW: 1,
    CORRECTION: 2,
    REVENUE_SHARE: 3,
    INVOICE_PAYMENT: 4,
    MINIMUM_MONTHLY: 5,
}

exports.Tifs = {
    FILLORKILL: 0,
    IMMEDIATEORCANCEL: 1,
    DAYORDER: 2,
    GOODTILLCANCEL: 3,
    GOODTILLDATE: 4,
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
    UPDATE_IBUSER:"UPDATE_IBUSER"
}
exports.IBStatus = {
    APPROVED: "APPROVED", 
    DECLINED: "DECLINED",
    PENDING: "PENDING",
    NEW: "NEW"
}
exports.SocialStatus = {
    APPROVED: "APPROVED", 
    DECLINED: "DECLINED",
    PENDING: "PENDING",
    NEW: "NEW"
}
exports.KYCStatus ={
    APPROVED: "VERIFIED", 
    REJECTED: "REJECTED",
    PENDING: "PENDING",
    NEW: "NEW", 
    DELETED: "DELETED"
}
exports.DepositMode ={
    GATEWAY: "Payment Gateway",
    MANUAL: "Manual",
    INTERNAL: "Internal",
    IB_COMMISSION: "IB Commission",
    INITIAL: "INITIAL"
}

exports.DepositStatus = {
    DEPOSIT_DONE: "DONE",
    DEPOSIT_FAILED: "FAILED", 

}

exports.PaymentGateway = {
    PAYMENT_PROCESS: "Payment Process", 
    INTERNAL_TRANSFER: "Internal Transfer", 
    USDT_TRANSFER: "USDT BEP20", 
    VIETNAM_TRANSFER: "Vietnam Bank Transfer", 
    SKRILL: "Skrill", 
    NETELLER: "Net Eller", 
    STICKPAY: "STICPAY",
    INTER_BANKWIRE: "International Bankwire0", 
    PAYPAL: "PAYPAL"
}

exports.WithdrawMode ={
    AUTO: "Auto",
    MANUAL: "Manual",
}

exports.WithdrawStatus ={
    WITHDRAWAL_DONE: "DONE",
    WITHDRAWAL_APPROVED: "PROCESSING",
    WITHDRAWAL_FAILED: "FAILED", 
    WITHDRAWAL_NEW: "NEW"
}

exports.PaymentType = {
    DEPOSIT: "DEPOSIT",
    WITHDRAWAL: "WITHDRAWAL"
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

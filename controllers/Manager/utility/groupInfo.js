const groupInfo =
{
    "riskId": riskId,
    "groupName": groupName,
    "commissionPerMillion": "120",
    "pendingMultiplierPer1000": "0",
    "defaultLeverageRatioPercent": "1000",
    "depositCurrency": "USD",
    "stopoutLevel": "1000",
    "isManager": false,
    "isAdmin": false,
    "managerGroups": [],
    "hedgingEnabled": false,
    "orderProcessingDelay": "0",
    "instrumentConfigs": {},
    "agentCommissionPerMillion": "0",
    "coverageMode": false,
    "eodMode": "0",
    "eomMode": "0",
    "eodSnapshotTime": "1681506000000",
    "defaultRetailEnabled": true,
    "isBrokerManager": false,
    "company": "Exxo_Markets",
    "marginCall": "50",
    "smtpConfiguration": {
        "smtpHost": "",
        "smtpPort": 0,
        "login": "",
        "password": "",
        "signature": "",
        "mailFrom": "",
        "ssl": true,
        "tls": true,
        "copyTo": "",
        "enabledEmailNotifications": {
            "0": false,
            "1": false
        },
        "delayBetweenMails": 0
    },
    "depositCurrencyPrecision": 2,
    "swapCalculationTime": "1681502400000",
    "marginCalculationType": "UNREALIZED_LOSS_ONLY",
    "commissionUpfront": false,
    "islamicSwap": false,
    "stopoutAndMarginCallType": "MARGIN_LEVEL_PERCENTAGE"
}
exports.createGroupInfo = (groupName, riskId) => {
    return {
        ...groupInfo,
        riskId, 
        groupName,
    }
}
exports.updateGroupInfo = (data) => {
    return {
        ...groupInfo, 
        ...data
    }
}

const Wallet = require('../../models/wallet');
const BOController = require('../BO');
const BotController = require('../Bot');
const AccountController = require('./account');
const OfferModel = require('./offer');
const ethWallet = require('ethereumjs-wallet').default;
const { generateAccount } = require('tron-create-address');
const SysLogController = require('./syslogs');
const Moralis = require('../Moralis');
const { AccountRole, DepositMode, KYCStatus } = require('../constant');
const createAccount = async (data) => {
    try {
        let _walletInfo = {};
        if (!data.demo) {
            _walletInfo = getWalletAddress();
        }
        const tradingAccount = new Wallet({
            ...data,
            ..._walletInfo,
            createdAt: new Date, 
            isDemo: data.demo
        });
        let result = await tradingAccount.save();
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getWalletAddress = () => {
    let addressData = ethWallet.generate();
    const ethPrivateKey = addressData.getPrivateKeyString()
    // addresses
    const ethAddress = addressData.getAddressString()
    //Tron
    const { address, privateKey } = generateAccount()
    return {
        ethPrivateKey, ethAddress, tronAddress: address, tronPrivateKey: privateKey
    }
}
const createIBTradingAccount = async (_id) => {
    try {
        let _offer = await OfferModel.getIBOffer();
        let _user = await AccountController.getAccountDetailById(_id);
        const tradingAccount = await createTradingAccount(_offer.uuid, _user.accountUuid, _user.email, _offer.demo);
        return tradingAccount;
    } catch (e) {
        console.log(e);
        BotController.errors(e, "createTradingAccount");
        return false;
    }
}
const createTradingAccount = async (offerUuid, accountUuid, email, demo, parentTradingAccountId, commissionUuid) => {

    try {
        let offer = await OfferModel.getOfferbyUuid(offerUuid);
        const data = {
            clientUuid: accountUuid,
            offerUuid,
            commissionUuid
        }
        const accountRes = await BOController.TradingAccount.createTradingAccount(data);
        if (accountRes === false) {
            return false;
        }
        const tradingAccount = await createAccount({ ...accountRes.data, email, demo })

        if (offer.initialDeposit) {
            const BalanceController = require('../balance');
            const result_deposit = BalanceController._depositToTradingAccountId(offer.initialDeposit, offer.initialDeposit, DepositMode.INITIAL,
                accountRes.data.tradingAccountId,
                "USD",
                "Initial Deposit to create trading account", "Agent", email, email);
        }

        return tradingAccount;

    } catch (e) {
        BotController.errors(JSON.stringify(e), "createTradingAccount");
        await SysLogController.createSystemLog({
            email, comment: "Error Trading Account create procedure", actionStatus: "Error", accountUuid
        });
        return false;
    }
}

const getAllTradingAccounts = async () => {
    let tradingAccounts = await Wallet.aggregate([
        {
            $project: {
                "tradingAccountId": 1
            }
        }
    ])
    let tradingAccountIds = tradingAccounts.map(item => item.tradingAccountId).filter(v => !!v);
    return tradingAccountIds;
}

const getTradingAccountsByUserId = async (clientUuid) => {
    try {
        let result = await Wallet.aggregate([
            {
                $lookup: {
                    from: "offers",
                    localField: "offerUuid",
                    foreignField: "uuid",
                    as: "offer"
                }
            },
            {
                $unwind: "$offer"
            },
            {
                $match: {
                    "clientUuid": clientUuid
                }
            },
            {
                $project: {
                    "offer.name": 1,
                    "tradingAccountId": 1,
                    "clientUuid": 1,
                    "tradingAccountUuid": 1,
                    "balance": 1,
                    "creditBalance": 1,
                    "tronAddress": 1,
                    "ethPrivateKey": 1,
                    "ethAddress": 1,
                    "offer.demo": 1,
                    "offer.currency": 1
                }
            },
        ]);
        console.log(result);
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getTradingAccountsByAdminUuid = async (adminUuid, role) => {

    let match = {};
    // if (role == AccountRole.ADMIN) {
    //     match = { adminUuid  };
    // }

    try {
        let result = await Wallet.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "clientUuid",
                    foreignField: "accountUuid",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $lookup: {
                    from: "offers",
                    localField: "offerUuid",
                    foreignField: "uuid",
                    as: "offer"
                }
            },
            {
                $unwind: "$offer"
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "user.branchUuid",
                    foreignField: "branchUuid",
                    as: "userBranch"
                }
            },
            {
                $unwind: "$userBranch"
            },
            {
                $lookup: {
                    from: "admins",
                    localField: "userBranch.adminUuid",
                    foreignField: "adminUuid",
                    as: "userAdmin"
                }
            },
            {
                $unwind: "$userAdmin"
            },
            {
                $project: {
                    "tradingAccountUuid": 1,
                    "tradingAccountId": 1,
                    "adminEmail": "$userAdmin.email",
                    "adminUuid":"$userAdmin.adminUuid",
                    "user.email": 1,
                    "user.fullname": 1,
                    "user.accountUuid": 1,
                    "user._id":1,
                    "offer.name": 1,
                    "offer.demo": 1,
                    "userBranch.name": 1,
                    "createdAt": 1, 
                    "verification_status": "$user.verification_status"
                },
            },
            {
                $match:{
                    ...match, 
                    "verification_status": {
                        $ne: KYCStatus.DELETED
                    }
                }
            }
        ]);
        return result;
    } catch (e) {
        
        return false;
    }
}

const getTradingAccountByEmail = async (email) => {
    try {
        let result = await Wallet.find({ email });
        if (result.length) {
            return result;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getIBTradingAccountByEmail = async (email) => {
    try {
        let ibOffer = await OfferModel.getIBOffer();
        let result = await Wallet.findOne({ email, offerUuid: ibOffer.uuid });
        if (result.length) {
            return result;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getTradingAccountByWallet = async (address) => {
    try {
        let result = await Wallet.find(address);
        if (result.length) {
            return result;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getTradingAccountByTradintAccountId = async (tradingAccountId) => {
    try {
        let result = await Wallet.aggregate([
            {
                $match: {
                    tradingAccountId
                }
            },
            {
                $lookup: {
                    from: "offers",
                    foreignField: "uuid",
                    localField: "offerUuid",
                    as: "offer"
                }
            },
            {
                $unwind: "$offer"
            }
        ]);
        if (result.length)
            return result[0];
    } catch (e) {
        return false;
    }
}
const getAccountDetailByTradingAccountId = async (tradingAccountId) => {
    try {
        let result = await Wallet.aggregate([
            {
                $match: {
                    tradingAccountId
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "accountUuid",
                    localField: "clientUuid",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            }
        ]);
        if (result.length)
            return result[0].user;
    } catch (e) {
        return false;
    }
}

const getTradingAccountByTradingAccountUuid = async (tradingAccountUuid) => {
    try {
        let result = await Wallet.aggregate([
            {
                $lookup: {
                    from: "offers",
                    localField: "offerUuid",
                    foreignField: "uuid",
                    as: "offers"
                }
            },
            {
                $unwind: "$offers"
            },
            {
                $match: {
                    "tradingAccountUuid": tradingAccountUuid
                }
            },
            {
                $project: {
                    "tradingAccountId": 1,
                    "clientUuid": 1,
                    "email": 1,
                    "tradingAccountUuid": 1,
                    "balance": 1,
                    "creditBalance": 1,
                    "offers.Demo": 1,
                    "tronAddress": 1,
                    "ethAddress": 1,
                    "ethPrivateKey": 1,
                    "tradingAccount": 1,
                    "creditBalance": 1,
                    "offers.name": 1,
                    "offers.system.name": 1, 
                    "isDemo": 1
                }
            },

        ]);
        return result[0];
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getIBTradingAccountByAccountUuid = async (clientUuid) => {
    try {
        let result = await Wallet.aggregate([
            {
                $match: {
                    clientUuid
                }
            },
            {
                $lookup: {
                    from: "offers",
                    localField: "offerUuid",
                    foreignField: "uuid",
                    as: "offers"
                }
            },
            {
                $unwind: "$offers"
            },
            {
                $match: {
                    "offers.name": process.env.IBOFFER
                }
            },
            {
                $project: {
                    "tradingAccountId": 1,
                    "clientUuid": 1,
                    "email": 1,
                    "tradingAccountUuid": 1,
                    "offers.name": 1,
                    "offers.system.name": 1
                }
            },

        ]);
        if (result.length)
            return result[0];
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getTradingAccountsByAccountId = async (tradingAccountId) => {
    try {
        let result = await Wallet.findOne({ tradingAccountId });
        return result;
    } catch (e) {
        return false;
    }
}

const checkExist = async (data) => {
    console.log(data);
    try {
        let result = await Wallet.find(data);
        return result.length;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const updateBalance = async (tradingAccountId, _amount) => {

    let tradingAccount = await getTradingAccountsByAccountId(tradingAccountId);
    if (!tradingAccount) {
        return false;
    } else {
        let balance = Number(tradingAccount.balance) + Number(_amount);
        try {
            let result = Wallet.findOneAndUpdate({ tradingAccountId }, { balance }, { new: true });
            return result;
        } catch (e) {
            return false;
        }
    }
}
const updateCreditBalance = async (tradingAccountId, _amount) => {
    let tradingAccount = await getTradingAccountsByAccountId(tradingAccountId);

    if (!tradingAccount) {
        return false;
    } else {

        let creditBalance = tradingAccount.creditBalance + _amount;
        try {
            let result = Wallet.findOneAndUpdate({ tradingAccountId }, { creditBalance }, { new: true });
            return result;
        } catch (e) {
            return false;
        }
    }
}

const getTradingAccountAnalytics = async (start , end = new Date(), adminUuid, role) => {

    let match= {}
    // if(role === AccountRole.ADMIN){
    //     match = {
    //         adminUuid
    //     }
    // }
    const query = [
        {
            $match: {
                createdAt: {
                    $gt: start,
                    $lt: end
                }, 
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "clientUuid", 
                foreignField: "accountUuid", 
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $lookup: {
                from: "branches", 
                localField: "user.branchUuid",
                foreignField: "branchUuid",
                as: "branch"
            }
        },
        {
            $unwind: "$branch"
        },
        {
            $project: {
                isDemo: 1,
                adminUuid: "$branch.adminiUuid"
            }
        },
        {
            $facet: {
                total: [
                    {
                        $count: "count"
                    }
                ],
                real: [
                    {
                        $match: {
                            isDemo: false
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                demo: [
                    {
                        $match: {
                            isDemo: true
                        }
                    },
                    {
                        $count: "count"
                    }
                ]
            }
        },

    ]

    try {
        let result = await Wallet.aggregate(query)
        if (result.length) {
            return {
                total: result[0].total.length && result[0].total[0].count || 0, 
                real: result[0].real.length && result[0].real[0].count || 0,
                demo: result[0].demo.length && result[0].demo[0].count || 0,
            }
        } else {
            return {
                total: 0,
                real: 0,
                demo:0
            }
        }
    } catch (e) {
        console.log(e); 
        BotController.errors(e, "account analytics");
        return false;
    }

}

const checkValidAccount = (email, tradingAccountUuid) => {
    console.log({ email, tradingAccountUuid });
    return new Promise((resolve, reject) => {
        Wallet.find({ email, tradingAccountUuid }).then(result => {
            if (result.length) {
                resolve(result[0])
            } else {
                reject("No Valid Trading Account.");
            }
        }).catch(e => {
            console.log(e)
            reject(error);
        })
    })
}


const TradingAccountController = {
    createAccount,
    createTradingAccount,
    createIBTradingAccount,
    getTradingAccountsByUserId,
    getTradingAccountByEmail,
    getTradingAccountByTradingAccountUuid,   /// by TradingAccountUuid
    getIBTradingAccountByAccountUuid,
    getTradingAccountsByAdminUuid,
    getTradingAccountByWallet,
    getAllTradingAccounts,
    getIBTradingAccountByEmail,
    getTradingAccountByTradintAccountId,
    getAccountDetailByTradingAccountId,
    getTradingAccountAnalytics,
    checkExist,
    updateBalance,
    updateCreditBalance,
    checkValidAccount
}

module.exports = TradingAccountController;
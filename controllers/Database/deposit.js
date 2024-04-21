const Deposit = require("../../models/report");
const uuid = require('uuid');
const { DepositMode, AccountRole, IBStatus } = require("../constant");
const BotController = require("../Bot");

const getDepositHistoryByTradingAccountUuid = async (tradingAccountId) => {

    const data = { tradingAccountId };
    return await findDepositInfo(data);

}

const getDepositHistoryByUserId = async (clientUuid) => {

    try {
        let result = await Deposit.aggregate([
            {
                $match: {
                    clientUuid: clientUuid
                }
            },
            {
                $group: {
                    _id: '$clientUuid',
                    totalAmount: { $sum: '$amount' },
                    items: { $push: '$$ROOT' }
                },
            },
        ])
        return result;
    } catch (e) {
        console.log
        return false;
    }
}
const getDepositAmountByUserId = async (clientUuid) => {

    try {
        let result = await Deposit.aggregate([
            {
                $match: {
                    clientUuid: clientUuid
                }
            },
            {
                $group: {
                    _id: '$clientUuid',
                    totalAmount: { $sum: '$amount' },
                },
            },
        ])
        console.log("Deposit History", result);
        return result;
    } catch (e) {
        console.log("Deposit history error", e);
        return false;
    }
}
const findDepositInfo = async (data) => {
    try {
        let result = await Deposit.find(data).sort({ createdAt: -1 });
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const getDepositHistoryAll = async (adminUuid, role) => {
    let match = {};
    // if (role === AccountRole.ADMIN) {
    //     match = {
    //         adminUuid
    //     }
    // };
    try {
        let result = await Deposit.aggregate([
            {
                $match: {
                    depositMode: {
                        $in: [
                            DepositMode.GATEWAY, DepositMode.MANUAL
                        ]
                    }
                }
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
                    clientUuid: 1,
                    "user._id": 1, 
                    email: 1,
                    tradingAccountId: 1,
                    amount: 1,
                    createdAt: 1,
                    status: 1,
                    depositMode: 1,
                    dealer: 1,
                    comment: 1,
                    adminUuid: "$branch.adminUuid",
                    fullname: "$user.fullname"
                }
            },
            {
                $match: {
                    ...match
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ])
        return result;
    } catch (e) {
        return false;
    }
}

const getDepositHostoryForUserByEmail = async (email, from = 0, to = new Date()) => {



}

const createDeposit = async (Deposit_info) => {
    const Uuid = uuid.v4();
    let Deposit_request = new Deposit({
        ...Deposit_info,
        createdAt: new Date(), 
        Uuid,
    });
    try {
        let result = await Deposit_request.save();
        return result;
    } catch (e) {
        console.log("create deposit", e);
        return false;
    }
}

const getIBCommissionHistory = async (adminUuid, role) => {

    let match = {
        depositMode: DepositMode.IB_COMMISSION
    };
    // if (role === AccountRole.ADMIN) {
    //     match = {...match, adminUuid }
    // }
    try {
        const result = await Deposit.aggregate([
            {
                $lookup: {
                    from: "users",
                    foreignField: "ibParentTradingAccountId",
                    localField: "tradingAccountId",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $lookup: {
                    from: "branches",
                    foreignField: "branchUuid",
                    localField: "user.branchUuid",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $lookup: {
                    from: "admins",
                    localField: "branch.adminUuid",
                    foreignField: "adminUuid",
                    as: "admin"
                }
            },
            {
                $unwind: "$admin"
            },
            {
                $project: {
                    "email": 1,
                    "createdAt": 1,
                    "amount": 1,
                    "user.ibParentTradingAccountId": 1,
                    "user.fullname": 1,
                    "user.isEmailVerified": 1,
                    "user.accountUuid": 1,
                    "user._id": 1, 
                    "adminUuid": "$admin.adminUuid",
                    "depositMode": 1,
                    "comment": 1, 
                    "dealer": 1, 
                    "from":1, 
                }
            },
            {
                $match: {
                    ...match
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ])
        return result;
    } catch (e) {
        return false;
    }

}

const getDepositAnalytics = async (start, end, adminUuid, role) => {

    const _start = new Date(start);
    const _end = new Date(end);
    let match = {};
    // if (role === AccountRole.ADMIN) {
    //     match = {
    //         adminUuid
    //     }
    // }
    const query = [
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
        },
        {
            $lookup: {
                from: "branches",
                foreignField: "branchUuid",
                localField: "user.branchUuid",
                as: "branch"
            }
        },
        {
            $unwind: "$branch"
        },
        {
            $project: {
                email: 1,
                tradingAccountId: 1,
                createdAt: 1,
                amount: 1,
                adminUuid: "$branch.adminUuid", 
                ibStatus: "$user.ibStatus", 
                ibCreatedAt: "$user.ibCreatedAt"
            }
        },
        {
            $match: {
                ...match
            }
        },
        {
            $facet: {
                totalAmount: [
                    {
                        $group: {
                            _id: "_id",
                            amount: {
                                $sum: "$amount"
                            }
                        }
                    }
                ],
                ibCommissions: [
                    {
                        $match: {
                            dealer: ""
                        }
                    }
                ],
                depositedUsers: [
                    {
                        $group: {
                            _id: "$email",
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                depositedUsersByRange: [
                    {
                        $match: {
                            createdAt: {
                                $gte: _start,
                                $lt: _end
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$email",
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                depositedIBUsersByRange: [
                    {
                        $match: {
                            createdAt: {
                                $gte: _start,
                                $lt: _end
                            },
                            ibStatus: IBStatus.APPROVED, 
                            ibCreatedAt:{
                                $gte: _start,
                                $lt: _end
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$email",
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                depositedAccounts: [
                    {
                        $group: {
                            _id: "$tradingAccountId",
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                dateAnalytics: [
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            amount: {
                                $sum: "$amount"
                            }
                        }
                    },
                    {
                        $sort: {
                            _id: 1
                        }
                    }
                ],
                accountAnalytics: [
                    {
                        $match: {
                            createdAt: {
                                $gte: _start,
                                $lt: _end
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$tradingAccountId",
                            amount: {
                                $sum: "$amount"
                            },

                        }
                    },
                    {
                        $lookup: {
                            from: "wallets",
                            localField: "_id",
                            foreignField: "tradingAccountId",
                            as: "tradingAccount"
                        }
                    },
                    {
                        $unwind: "$tradingAccount"
                    },
                    {
                        $lookup: {
                            from: "offers",
                            foreignField: "uuid",
                            localField: "tradingAccount.offerUuid",
                            as: "offer"
                        }
                    },
                    {
                        $unwind: "$offer"
                    },
                    {
                        $match: {
                            "offer.name": { $ne: process.env.IBOFFER }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            tradingAcountUuid: "$tradingAccount.tradingAccountUuid",
                            amount: "$amount"
                        }
                    },
                    {
                        $sort: {
                            amount: -1
                        }
                    },
                    {
                        $limit: 7
                    }
                ],
            }
        }
    ]
    try {
        let result = await Deposit.aggregate(query);

        if (result.length) {
            return {
                depositedUsers: result[0].depositedUsers.length && result[0].depositedUsers[0].count || 0,
                depositedUsersByRange: result[0].depositedUsersByRange.length && result[0].depositedUsersByRange[0].count || 0,
                depositedIBUsersByRange: result[0].depositedIBUsersByRange.length && result[0].depositedIBUsersByRange[0].count || 0,
                depositedAccounts: result[0].depositedAccounts.length && result[0].depositedAccounts[0].count || 0,
                dateAnalytics: result[0].dateAnalytics,
                accountAnalytics: result[0].accountAnalytics,
                totalAmount: result[0].totalAmount.length && result[0].totalAmount[0].amount
            }
        } else {
            return {
                depositedUsers: 0,
                depositedAccounts: 0,
            }
        }
    } catch (e) {
        BotController.errors(e, "getDepositAnalytics");
        return false;
    }
}

const getTotalDepositAmount = async () => {
    try {
        let result = await Deposit.aggregate([
            {
                $group: {
                    _id: null, // group all documents
                    totalAmount: { $sum: "$amount" } // sum the 'amount' field of each document
                }
            }
        ])
        if (result.length) {
            return result[0].totalAmount;
        } else {
            return 0;
        }
    } catch (e) {
        return 0;
    }
}

const getData = async (query)=>{
    try{
        let result = await Deposit.aggregate([
            {
                $match:{
                    ...query
                }
            }
        ])
        return result; 
    }catch(e){
        return false; 
    }
}
const DepositModel = {
    createDeposit,
    getDepositHistoryByTradingAccountUuid,
    getDepositHistoryByUserId,
    getDepositAnalytics,
    getDepositHistoryAll,
    getDepositAmountByUserId,
    getIBCommissionHistory,
    getTotalDepositAmount, 
    getData
}

module.exports = DepositModel;
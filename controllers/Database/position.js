const Position = require("../../models/position");
const { AccountRole } = require("../constant");


const createClosedPosition = async (closedPosition) => {
    try {

        const _position = new Position({ ...closedPosition });
        let result = await _position.save();
        return result;
    } catch (e) {
        return false;
    }
}

const insertManyClosedPositions = async (closedPositions) => {
    try {
        let result = await Position.insertMany(closedPositions);
        return true;
    } catch (e) {
        return e;
    }
}

const getAnalytics = async (start, end, adminUuid, role) => {

    let _start = new Date(start).getTime();
    let _end = new Date(end).getTime();
    let match = {}
    // if(role === AccountRole.ADMIN){
    //     match = {
    //         adminUuid
    //     }
    // }
    try {
        let query = [
            {
                $match: {
                    generatedTime: {
                        $gte: _start,
                        $lte: _end
                    }
                }
            },
            {
                $lookup: {
                    from: "symbols",
                    foreignField: "symbol",
                    localField: "instrument",
                    as: "symbol"
                }
            },
            {
                $unwind: "$symbol"
            },
            {
                $lookup: {
                    from: "wallets", 
                    localField: "clientId", 
                    foreignField: "tradingAccountId", 
                    as: "tradingAccount"
                }
            },
            {
                $unwind: "$tradingAccount"
            },
            {   
                $lookup: {
                    from: "users", 
                    localField: "tradingAccount.clientUuid", 
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
                    volume: { $abs: { $toDecimal: "$volumeFrom" } },
                    "symbol.decimalPlaces": 1,
                    amount: { $toDecimal: "$amount" },
                    date: { $toDate: "$generatedTime" },
                    decMass: { $pow: [10, { $toInt: "$symbol.decimalPlaces" }] },
                    "clientId": 1,
                    "instrument": 1, 
                    "adminUuid": "$branch.adminUuid"
                }
            },
            {
                $facet: {
                    dateAnalytics: [
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                                profit: {
                                    $sum: {
                                        $cond: {
                                            if: { $gte: ["$amount", 0] },
                                            then: { $divide: ["$amount", "$decMass"] },
                                            else: 0
                                        }
                                    }
                                },
                                volume: { $sum: { $divide: ["$volume", "$decMass"] } },
                            },
                        },
                        {
                            $sort: {
                                volume: -1
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                volume: { $toString: "$volume" }
                            }
                        }
                    
                    ],
                    profit: [
                        {
                            $group: {
                                _id: "$clientId",
                                profit: {
                                    $sum: {
                                        $cond: {
                                            if: { $gte: ["$amount", 0] },
                                            then: { $divide: ["$amount", "$decMass"] },
                                            else: 0
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                profit: {
                                    $gt: 0
                                }
                            }
                        },
                        {
                            $sort: {
                                profit: -1
                            }
                        },
                        {
                            $lookup: {
                                from: "wallets",
                                foreignField: "tradingAccountId",
                                localField: "_id",
                                as: "tradingAccount"
                            }
                        },
                        {
                            $unwind: "$tradingAccount"
                        },
                        {
                            $project: {
                                _id: 1,
                                profit: { $toString: "$profit" },
                                "tradingAccount.tradingAccountUuid": 1
                            }
                        },
                        {
                            $limit: 7
                        }
                    ],
                    loss: [
                        {
                            $group: {
                                _id: "$clientId",
                                loss: {
                                    $sum: {
                                        $cond: {
                                            if: { $lt: ["$amount", 0] },
                                            then: { $divide: ["$amount", "$decMass"] },
                                            else: 0
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                loss: { $lt: 0 }
                            }
                        },
                        {
                            $sort: {
                                loss: -1
                            }
                        },
                        {
                            $lookup: {
                                from: "wallets",
                                foreignField: "tradingAccountId",
                                localField: "_id",
                                as: "tradingAccount"
                            }
                        },
                        {
                            $unwind: "$tradingAccount"
                        },
                        {
                            $project: {
                                _id: 1,
                                loss: { $toString: "$loss" },
                                "tradingAccount.tradingAccountUuid": 1
                            }
                        },
                        {
                            $limit: 7
                        }
                    ],
                    volume: [
                        {
                            $group: {
                                _id: "$clientId",
                                volume: { $sum: { $divide: ["$volume", "$decMass"] } },
                            }
                        },
                        {
                            $sort: {
                                volume: -1
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                volume: { $toString: "$volume" }
                            }
                        },
                        {
                            $lookup: {
                                from: "wallets",
                                foreignField: "tradingAccountId",
                                localField: "_id",
                                as: "tradingAccount"
                            }
                        },
                        {
                            $unwind: "$tradingAccount"
                        },
                        {
                            $project: {
                                _id: 1,
                                volume: 1,
                                "tradingAccount.tradingAccountUuid": 1
                            }
                        },
                        {
                            $limit: 7
                        }
                    ],
                    symbol: [
                        {
                            $group: {
                                _id: "$instrument",
                                volume: { $sum: { $divide: ["$volume", "$decMass"] } },
                            }
                        },
                        {
                            $sort: {
                                volume: -1
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                volume: { $toString: "$volume" }
                            }
                        },
                        {
                            $limit: 7
                        }
                    ]
                }

            }
        ]; 

        console.log(JSON.stringify(query)); 
        let result = await Position.aggregate(query)
        if (result.length) {
            return result[0]
        } else {
            return {}
        }
    } catch (e) {
        console.log(JSON.stringify(e)); 
        return false
    }
}

const getAnalyticsForUser = async (clientIds) => {

    try {
        let result = await Position.aggregate([
            {
                $match: {
                    clientId: { $in: [...clientIds] }
                }
            },
            {
                $sort: {
                    generatedTime: -1
                }
            },
            {
                $lookup: {
                    from: "symbols",
                    localField: "instrument",
                    foreignField: "symbol",
                    as: "symbol"
                }
            },
            {
                $unwind: "$symbol"
            },
            {
                $project: {
                    amount: {
                        $divide: [
                            {
                                $toDecimal: "$amount"
                            },
                            {
                                $pow: [10, { $toDecimal: "$symbol.decimalPlaces" }]
                            }
                        ]
                    },
                    generatedTime: 1,
                    entryType: 1,
                    comment: 1,
                    instrument: 1,
                    closedSwap: 1,
                    closedVolume: 1,
                    closedCommission: 1,
                    closedOpenTime: 1,
                    tpPrice: 1,
                    slPrice: 1,
                    additionalType: 1,
                    clientId: 1,
                    volumeFrom: 1
                }
            },
            {
                $facet: {
                    positions: [
                        {
                            $project:{
                                amount: {$toString: "$amount"}, 
                                generatedTime: 1,
                                entryType: 1,
                                comment: 1,
                                instrument: 1,
                                closedSwap: 1,
                                closedVolume: 1,
                                closedCommission: 1,
                                closedOpenTime: 1,
                                tpPrice: 1,
                                slPrice: 1,
                                additionalType: 1,
                                clientId: 1,
                                volumeFrom: 1
                            }
                        }
                    ],
                    monthlyReports: [
                        {
                            $addFields: {
                                convertedTimestamp: {
                                    $toDate: {
                                        $multiply: ["$generatedTime", 1]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                yearMonth: { $dateToString: { format: "%Y-%m", date: "$convertedTimestamp" } },
                                amount: "$amount"
                            }
                        },
                        {
                            $group: {
                                _id: "$yearMonth",
                                totalAmount:{
                                     $sum: "$amount" 
                                } 
                            }
                        },
                        {
                            $project: {
                                _id: 1, 
                                totalAmount: {$toString: "$totalAmount"}
                            }
                        },
                        {
                            $sort: {
                                _id: -1,
                            }
                        },
                        {
                            $limit: 12
                        }
                    ]
                }
            }
        ]);
        return result[0];
    } catch (e) {
        return false;
    }
}

const getTotalVolume = async (start, end, clientIds) => {
    try {
        let result = await Position.aggregate([
            {
                $match: {
                    clientId: { $in: clientIds },
                    generatedTime: { $gte: start, $lte: end },
                },
            },
            {
                $lookup: {
                    from: "symbols",
                    localField: "instrument",
                    foreignField: "symbol",
                    as: "symbol"
                }
            },
            {
                $unwind: "$symbol"
            },
            {
                $project: {
                    precission: "$symbol.volumePrecision",
                    decMass: {
                        $cond: {
                            if: { $eq: ["$symbol.volumePrecision", '0'] },
                            then: 1, // Directly return 1 if volumePrecision is 0
                            else: { $pow: [10, { $toDecimal: "$symbol.volumePrecision" }] }
                        }
                    },
                    lotSize: { $toDecimal: "$symbol.lotSize" },
                    closedVolume: { $abs: { $toDecimal: "$closedVolume" } },
                }
            },
            {
                $group: {
                    _id: null, // Not grouping by clientId
                    totalClosedVolume: {
                        $sum:
                        {
                            $divide: [{
                                $divide:
                                    ["$closedVolume", "$decMass"]
                            }, "$lotSize"]
                        }
                    },
                },
            },
        ]);
        if (result.length > 0) {
            return result[0].totalClosedVolume;
        }
        return false;
    } catch (e) {
        return false;
    }
}
const PositionController = {
    createClosedPosition,
    insertManyClosedPositions,
    getAnalytics,
    getAnalyticsForUser,
    getTotalVolume
}

module.exports = PositionController;
const Account = require('../../models/user');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const { IBStatus, AccountRole, KYCStatus } = require('../constant');
const BotController = require('../Bot');
const { update } = require('../../models/admin');
const { getSyslogsForUser } = require('./syslogs');
const { ObjectId } = require('mongodb');
const { MakeSimpleEmail } = require('../Manager/utility/other');
const Position = require('../../models/position');
const Wallet = require('../../models/wallet');

const createAccountSync = async (data) => {
    try {
        let account = new Account({
            ...data,
        });
        let result = await account.save();
        if (result) {
            return result;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getAccountsByPartnerId = async (partnerId, from, to, pageNumber, pageSize) => {
    try {
        let result = await Account.find({ partnerId, submittedAt: { $gte: new Date(from), $lte: new Date(to) } }).limit(pageSize).skip(pageNumber);
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const getAccountDetailByEmail = async (email) => {
    let result = await findOneAccountByQuery({ email });
    return result;
}

const getAccountDetailByUuid = async (accountUuid) => {
    let result = await findOneAccountByQuery({ accountUuid });
    return result;
}
const getAccountDetailById = async (_id) => {
    let result = await findOneAccountByQuery({ _id });
    return result;
}
const getAccountsByBranchUuid = async (branchUuid) => {
    let result = await excuteQueryFromUser({ branchUuid });
    return result;
}
const getAccountDetailByIblink = async (ibNumber) => {
    let result = await findOneAccountByQuery({ ibNumber });
    return result;
}
const getUsers = async (adminUuid, role) => {
    let match = {};
    // if(role === AccountRole.ADMIN){
    //     match= {
    //         adminUuid
    //     }
    // }
    try {
        let result = await Account.aggregate([
            {
                $lookup:{
                    from: "branches",
                    localField: "branchUuid", 
                    foreignField: "branchUuid", 
                    as: "branch", 
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
                    email: 1, 
                    verification_status: 1, 
                    isEmailVerified: 1, 
                    submittedAt: 1, 
                    accountUuid: 1, 
                    adminUuid: "admin.adminUuid", 
                    docType: 1, 
                    docType2: 1, 
                    docUrl1: 1, 
                    docUrl2: 1, 
                    docUrl3: 1, 
                    fullname: 1, 
                    avatarUrl: 1, 
                    branchUuid: 1, 
                }
            },
            {
                $match: {
                    verification_status: {
                        $ne: KYCStatus.DELETED
                    }
                    ,
                    ...match
                }
            },
            {
                $sort: {
                    submittedAt: -1
                }
            }
        ])
        return result;
    } catch (e) {
        BotController.errors(e, "get users");
        return false;
    }
}

const getUserEmailsByIds = async (ids)=>{
    
    const _ids = ids.map(item=>ObjectId(item)); 
    try{
        let result = await Account.aggregate([
            {
                $match: {
                    _id: {
                        $in: [..._ids]
                    }
                }
            }
        ])
        return result;
    }catch(e){
        return false; 
    }
}
//  for admin actions
const getIBClients = async (data) => {
    let match = {}; 
    const query = { ibStatus: { $in: [IBStatus.PENDING, IBStatus.APPROVED, IBStatus.DECLINED] } };

    try{
        const result = await Account.aggregate([
            {
                $match: {
                    ...query, 
                    verification_status: {
                        $ne: KYCStatus.DELETED
                    }
                }
            },
            {
                $lookup: {
                    from: "branches", 
                    localField: "branchUuid", 
                    foreignField: "branchUuid",
                    as : "branch"
                }
            },
            {
                $unwind: "$branch"
            }, 
            {
               $project: {
                    fullname: 1, 
                    accountUuid: 1, 
                    ibStatus: 1, 
                    ibParentTradingAccountId:1, 
                    parentTradingAccountId: 1, 
                    ibSubmittedAt: 1, 
                    state: 1, 
                    avatarUrl:1, 
                    adminUuid: "$branch.adminUuid", 
                    email: 1, 
                    ibRanking: 1, 
                    isQClient: 1, 
                    isQIB: 1
               }
            }, 
            {
                $match: {
                    ...match
                }
            },
            {
                $sort:{
                    ibSubmittedAt: -1
                }
            }
        ])
        return result;
    }catch(e){
        BotController.errors({adminUuid, role}, "get IB Clietns")
        return false; 
    }
}
const updateAccountPassword = async (accountUuid, _password) => {
    try {
        let password = bcrypt.hashSync(_password, 8);
        let result = await Account.findOneAndUpdate({ accountUuid }, { password }, { new: true });
    } catch (e) {
        console.log(e);
        return false;
    }
}

const updateAccountProfile = async (accountUuid, data) => {
    try {
        const result = await Account.findOneAndUpdate({ accountUuid }, { ...data }, { new: true });
        return result;
    } catch (e) {
        return false;
    }
}
const updateAccountProfileByEmail = async (email, data) => {
    try {
        const result = await Account.findOneAndUpdate({ email }, { ...data }, { new: true });
        return result;
    } catch (e) {
        return false;
    }
}

const updateIBStatus = async (data, tradingAccountId, ibParentTradingAccountUuid) => {

    const { id: _id, ibStatus, ibCommissionType } = data;
    const ibClientInfo = await getIBLink();
    try {
        let result = await Account.findOneAndUpdate({ _id }, { ibParentTradingAccountUuid, ibStatus, ...ibClientInfo, ibParentTradingAccountId: tradingAccountId, ibCommissionType, ibCreatedAt: new Date() }, { new: true });
        return result;
    } catch (e) {
        BotController.errors(e, "updateIBStatus- database-account")
        return false;
    }
}
const updateVerifyStatus = async (data) => {
    const { _id, status, remark } = data;
    try {
        let result = await Account.findOneAndUpdate({ _id }, { verification_status: status, remark }, { new: true });
        return result;
    } catch (e) {
        return false;
    }
}
const getIBLink = async () => {
    try {
        const lastIBClinet = await Account.find({ ibStatus: IBStatus.APPROVED }).sort({ ibNumber: -1 }).limit(1);

        const ibNumber = (lastIBClinet[0]?.ibNumber || 100000) + 1;
        let IBLink = process.env.IB_LINK_ENTRY + "/ib/" + ibNumber;
        return {
            ibNumber,
            IBLink
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getIBOwnClients = async (data) => {
    try {
        let result = await Account.aggregate([
            {
                $match: {
                    ...data
                }
            },
            {
                $project: {
                    email: 1,
                    address: 1,
                    submittedAt: 1,
                    phone: 1,
                    fullname: 1,
                    verification_status: 1,
                    isEmailVerified: 1,
                    accountUuid: 1,
                    ibStatus:1, 
                    ibParentTradingAccountId: 1, 
                    ibParentTradingAccountUuid:1, 
                    isQClient: 1, 
                    isQIB: 1, 
                    ibRanking :1, 
                }
            }
        ]);
        return result;
    } catch (e) {
        console.log(e);
    }
}

const createIBClientTree = async (parentTradingAccountId, ibDepth, start, end, summary) =>{
    try{
        let ibUserTreeData = []; 
        const affiliateUsers  =await getIBOwnClients({parentTradingAccountId, verification_status:KYCStatus.APPROVED});
        let totalIbs =0, totalQClients =0, totalVolume =0; 
        for( let i = 0; i< affiliateUsers.length; i++){
            let item = affiliateUsers[i]; 
            let data ; 
            if(ibDepth >= start){
                if(item.ibStatus === IBStatus.APPROVED){
                    data = {
                        text: MakeSimpleEmail(item.email), 
                        id: item.accountUuid, 
                        ...item, 
                        state: {
                            opened: true,
                        }, 
                        children: ibDepth+1<end &&  await createIBClientTree(item.ibParentTradingAccountId, ibDepth+1, start, end, summary) ||undefined
                    };
                }else{
                    data = {
                        text: MakeSimpleEmail(item.email), 
                        id: item.accountUuid, 
                        ...item, 
                        state: {
                            opened: true,
                        }, 
                    }
                }
                ibUserTreeData = [...ibUserTreeData,data ]
            }else {
                if(item.ibStatus === IBStatus.APPROVED){
                    data = await createIBClientTree(item.ibParentTradingAccountId, ibDepth+1, start, end, summary); 
                    ibUserTreeData = [...ibUserTreeData, ...data]
                }
            }
            if(item.isQClient)
                totalQClients++; 
    
            if(item.ibStatus === IBStatus.APPROVED) 
                totalIbs++; 
    
            const clientIds = (await  getTradingAccountsByUserId(item.accountUuid)).filter(account=>!account.offer.demo).map(item=>item.tradingAccountId); 
            totalVolume =parseFloat(totalVolume) + parseFloat(await getTotalVolume(0, new Date().getTime(), [...clientIds]));

        } 
        summary.totalQClients += totalQClients; 
        summary.totalIbs += totalIbs; 
        summary.totalVolume =parseFloat(summary.totalVolume) + parseFloat(Number(totalVolume)) ; 
    
        return ibUserTreeData; 
    }catch(e){
        return []
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
const getUserAnalytics = async (start = 0, end = new Date(), adminUuid, role) => {

    let match = {}; 
    // if(role === AccountRole.ADMIN){
    //     match = {
    //         adminUuid
    //     }
    // }
    try {
        let result = await Account.aggregate([
            {
                $match: {
                    submittedAt: {
                        $gt: new Date(start),
                        $lt: end
                    }
                }
            },
            {
                $lookup:{
                    from: "branches", 
                    foreignField: "branchUuid",
                    localField: "branchUuid", 
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $project: {
                    ibStatus: 1, 
                    verification_status: 1, 
                    isEmailVerified:1, 
                    submittedAt: 1, 
                    created: 1, 
                    adminUuid:"$branch.adminUuid"
                }
            },
            {
                $match: {
                    ...match
                }
            },
            {
                $facet: {
                    users: [
                        {
                            $count: "count"
                        }
                    ],
                    ibUsers: [
                        {
                            $match: {
                                ibStatus: "APPROVED"
                            }
                        },
                        {
                            $count: "count"
                        },
                    ],
                    leads: [
                        {
                            $match: {
                                verification_status: {
                                    $ne: "VERIFIED"
                                }
                            }
                        },
                        {
                            $count: "count"
                        }
                    ],
                    usersByDate: [
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: {
                                _id: 1
                            }
                        }
                    ]
                }
            }
        ])
        if (result.length)
            return {
                users: result[0].users.length && result[0].users[0].count || 0,
                ibUsers: result[0].ibUsers.length && result[0].ibUsers[0].count || 0,
                leads: result[0].leads.length && result[0].leads[0].count || 0,
                usersByDate: result[0].usersByDate.length && result[0].usersByDate || [],
            }
        else
            return {
                users: 0,
                ibUsers: 0,
                leads: 0,
            }

    } catch (e) {
        BotController.errors(e, "GetUserAnalytics from database");
        return false
    }
}

const updateProfileImage = async (email, filename) => {
    try {
        await Account.findOneAndUpdate({ email }, { avatarUrl: filename })
    } catch (e) {

    }
}
const updatePhoneVerification = async (email) => {
    try {
        let user = await Account.findOneAndUpdate({ email }, { phoneVerified: true }, { new: true })
        return user;
    } catch (e) {
        return false; 
    }
}
const findOneAccountByQuery = async (query) => {
    let result = await excuteQueryFromUser(query);
    if (result.length)
        return result[0]
    else
        return false;
}
const excuteQueryFromUser = async (query) => {
    try {
        let result = await Account.find({ ...query }).sort({ submittedAt: -1 });
        return result;
    } catch (e) {
        BotController.errors(e, "excuteQueryFromUser");
        console.log(e, query);
        return false;
    }
}

const deleteUser = async (_id)=>{
    try{
        let result = await Account.deleteOne({_id}); 
        return result; 
    }catch(e){
        return false; 
    }
}
const deleteUserMany = async (_ids)=>{
    try{
        let result =  await Account.deleteMany({
            _id: {$in: _ids}
        }); 
        return result;
    }catch(e){
        return false; 
    }
}
const AccountController = {
    getAccountsByPartnerId,
    getAccountDetailByEmail,
    getAccountDetailByUuid,
    getAccountDetailById,
    getAccountsByBranchUuid,
    getAccountDetailByIblink,
    getUserAnalytics,
    createAccountSync,
    deleteUser, 
    deleteUserMany,
    getUsers,
    getUserEmailsByIds,
    getIBClients,
    getIBLink,
    getIBOwnClients,
    findOneAccountByQuery,
    updateAccountPassword,
    updateAccountProfile,
    updateIBStatus,
    updateVerifyStatus,
    updateAccountProfileByEmail,
    updateProfileImage,
    updatePhoneVerification,
    createIBClientTree
}
module.exports = AccountController; 
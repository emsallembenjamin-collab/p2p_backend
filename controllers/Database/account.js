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
                $project: {
                    email: 1, 
                    verification_status: 1, 
                    isEmailVerified: 1, 
                    submittedAt: 1, 
                    accountUuid: 1, 
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


const updateVerifyStatus = async (data) => {
    const { _id, status, remark } = data;
    try {
        let result = await Account.findOneAndUpdate({ _id }, { verification_status: status, remark }, { new: true });
        return result;
    } catch (e) {
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
const UserService = {
    getAccountDetailByEmail,
    getAccountDetailByUuid,
    getAccountDetailById,
    getUserAnalytics,
    createAccountSync,
    deleteUser, 
    deleteUserMany,
    getUsers,
    getUserEmailsByIds,
    findOneAccountByQuery,
    updateAccountPassword,
    updateAccountProfile,
    updateVerifyStatus,
    updateAccountProfileByEmail,
    updateProfileImage,
    updatePhoneVerification,
}
module.exports = UserService; 
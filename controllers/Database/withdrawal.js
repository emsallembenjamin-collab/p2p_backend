const Withdraw = require("../../models/withdraw");
const uuid = require('uuid');
const { AccountRole } = require("../constant");
const BotController = require("../Bot");

const WITHDRAWAL_APPROVED = "APPROVED"; 
const WITHDRAWAL_PENDING = "PENDING"; 
const WITHDRAWAL_REJECTED = "REJECTED"; 
const WITHDRAWAL_CANCELED = "CANCELLED"; 

const createWithdraw = (data) =>{
    try{
        let withdraw = new Withdraw({
            ...data,
            Uuid: uuid.v4()
        })  
        let result = withdraw.save();
        return result;
    }catch(e){
        console.log(e); 
        return false; 
    }
}

const getWithdrawHistoryByUuid =async (Uuid)=>{
    const data= {Uuid}; 
    let result =await findWithdrawInfo(data);
    if(result.length){
        return result[0]; 
    }else{
        return false;
    }
}

const getWithdrawHistoryByTradingAccountUuid =async (tradingAccountUuid)=>{

    const data= {tradingAccountUuid}; 
    return await findWithdrawInfo(data); 
}

const getWithdrawHistoryByUserId = async (accountUuid)=>{

    const data = {accountUuid}; 
    return await findWithdrawInfo(data);
}
const findWithdrawInfo = async (data)=>{
    try{
        let result = await Withdraw.find(data).sort({submitedAt: -1});
        return result; 
    }catch(e){
        console.log(e); 
        return false; 
    }
}

const requestWithdrawal = async (withdraw_info) =>{
    const Uuid = uuid.v4(); 
    let withdraw_request = new Withdraw({
        ...withdraw_info, 
        Uuid, 
        status: WITHDRAWAL_PENDING
    }); 
    try{
        let result = await withdraw_request.save(); 
        return result; 
    }catch(e){
        console.log(e);
        return false;
    }
}
const confirmWithdrawRequest =async (requestId)=>{
    const Uuid = requestId; 
    const status = WITHDRAWAL_APPROVED;
    return await updateStatus(Uuid, status);
}
const cancelWithdrawRequest =async (requestId)=>{
    const Uuid = requestId; 
    const status = WITHDRAWAL_CANCELED;
    return await updateStatus(Uuid, status);
}
const rejectWithdrawRequest =async (requestId)=>{
    const Uuid = requestId; 
    const status = WITHDRAWAL_REJECTED;
    return await updateStatus(Uuid, status);
}

const updateStatus = async (Uuid, status)=>{
    try{
        let result = await Withdraw.findOneAndUpdate({Uuid}, {status}, {new: true});
        return result; 
    }catch(e){
        return false; 
        console.log(e); 
    }
}
const getWithdrawHistoryAll = async(data)=>{
    const {adminUuid, role} = data; 
    let match = {}; 
    // if(role === AccountRole.ADMIN){
    //     match = {
    //         adminUuid
    //     }
    // }
    try{
        let result = Withdraw.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "email", 
                    foreignField: "email", 
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            }, 
            {
                $lookup: {
                    from : "branches", 
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
                    email: 1, 
                    amount:1, 
                    address:1, 
                    tradingAccountId: 1, 
                    tradingAccountUuid: 1, 
                    method: 1, 
                    status: 1, 
                    submittedAt: 1, 
                    adminUuid: "$branch.adminUuid",
                    accountUuid: "$user.accountUuid", 
                    Uuid: 1, 
                }
            }, 
            {
                $match: {
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
    }catch(e){
        BotController.errors({adminUuid, role}, "getWithdrawHistoryAll")
        return false; 
    }

}
const WithdrawModel = {
    getWithdrawHistoryByTradingAccountUuid, 
    getWithdrawHistoryByUserId, 
    getWithdrawHistoryByUuid,
    getWithdrawHistoryAll,
    requestWithdrawal, 
    confirmWithdrawRequest, 
    cancelWithdrawRequest,
    rejectWithdrawRequest, 
    createWithdraw,
    updateStatus
}

module.exports = WithdrawModel;
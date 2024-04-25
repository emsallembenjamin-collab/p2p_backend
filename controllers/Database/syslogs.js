const SysLogs = require("../../models/syslogs")
const uuid = require("uuid");
const { actionType, AccountRole } = require("../constant");


const logUserCreateTradingAccount = (user, state) => {
    const comment = "User try to create trading account";
    const actionName = "Create Trading Account";
    addUserLogs(user, state, comment, actionName);
}
const logUserWithdrawRequest = (user, amount, state) => {
    const comment = `User requested withdraw with ${amount}USD`;
    const actionName = "Request Withdraw";
    addUserLogs(user, state, comment, actionName);
}
const logUserIBRequest = (user, state) => {
    const comment = `User requested IB Account`;
    const actionName = "IB Account Request";
    addUserLogs(user, state, comment, actionName);
}

const addUserLogs = (user, state, comment, actionName) => {
    const data = {
        actionType: actionType.USER,
        actionStatus: state,
        ...user,
        comment,
        actionName
    }
    createSystemLog(data);
}

const logAdminAdd = (admin, state, add_admin) => {
    const comment = `User try to add new admin ${add_admin} `;
    const actionName = "Add admin.";
    addUserLogs(admin, state, comment);
}

const logAdminApproveUserKYC = (admin, user, state) => {
    const comment = `Admin tried to approve user kyc for ${user}`
    const actionName = "Approve user's KYC.";
    addAdminLogs(admin, state, comment, actionName);
}

const logAdminRejectUserKYC = (admin, user, state) => {
    const comment = `Admin tried to reject client ${user}`
    const actionName = "Reject user's KYC.";
    addAdminLogs(admin, state, comment, actionName);
}

const logAdminSuspendUser = (admin, user, state) => {
    const comment = `Admin tried to susspend client ${user}`
    const actionName = "Suspend user's KYC.";
    addAdminLogs(admin, state, comment, actionName);
}

const logAdminApproveIB = (admin, user, state) => {
    const comment = `Admin tried to approve IB client ${user}`
    const actionName = "Approve user's IB Request.";
    addAdminLogs(admin, state, comment, actionName);
}

const logAdminRejectIB = (admin, user, state) => {
    const comment = `Admin tried to Reject IB client ${user}`
    const actionName = "Reject user's IB Request.";
    addAdminLogs(admin, state, comment, actionName);
}

const logAdminSuspendIB = (admin, user, state) => {
    const comment = `Admin tried to susspend IB client ${user}`
    const actionName = "Suspend user's IB Request.";
    addAdminLogs(admin, state, comment, actionName);
}

const logBranchCreate = (admin, state) => {
    const comment = `Admin tried to create branch`
    const actionName = "Create Branch.";
    addAdminLogs(admin, state, comment, actionName);
}
const logBranchDelete = (admin, state) => {
    const comment = `Admin tried to delete branch ${branch}`
    const actionName = "Delete Branch.";
    addAdminLogs(admin, state, comment, actionName);
}
const logBranchUpdate = (admin, branch, state) => {
    const comment = `Admin tried to update branch ${branch}`
    const actionName = "Update Branch.";
    addAdminLogs(admin, state, comment, actionName);
}
const logAdminDeposit = (admin, tradingAccountId, amount, state) => {
    const comment = `Admin try to deposit to trading Account ${tradingAccountId} with ${amount}USD`
    const actionName = "Admin Deposit Balance.";
    addAdminLogs(admin, state, comment, actionName);
}
const logAdminWithdraw = (admin, tradingAccountId, amount) => {
    const comment = `Admin try to withdraw to trading Account ${tradingAccountId} with ${amount}USD`
    const actionName = "Admin Withdraw Balance.";
    addAdminLogs(admin, state, comment, actionName);
}

const addAdminLogs = (admin, state, comment, actionName) => {
    const data = {
        actionType: actionType.ADMIN,
        email: admin,
        actionStatus: state,
        comment,
        actionName
    }
    createSystemLog(data);
}
const createSystemLog = (data) => {
    const logUuid = uuid.v4();
    let sysLog = new SysLogs({ ...data, logUuid });
    try {
        let result = sysLog.save();
        return result;
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getSysteLogs = async (data) => {
    const { from, to, adminUuid, role } = data;
    let match = {};
    // if (role === AccountRole.ADMIN) {
    //     match = { adminUuid };
    // }
    try {
        let result = await SysLogs.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Number(from)), $lte: new Date(Number(to))
                    }
                }
            }, 
            {
                $lookup: {
                    from: "users",
                    localField: "accountUuid",
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
                    email: 1, 
                    accountUuid: 1, 
                    comment: 1 , 
                    createdAt: 1, 
                    adminUuid: "$branch.adminUuid", 
                    actionType: 1, 
                    actionName: 1, 
                    actionStatus: 1,
                    "user._id": 1
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
        console.log(e);
        return false;
    }
}
const getSyslogsForUser = async (email) => {
    try {
        let result = SysLogs.aggregate([
            {
                $match: {
                    email
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: 5
            }
        ]);
        return result;
    } catch (e) {
        return false;
    }
}
const LogService = {
    createSystemLog, getSysteLogs,
    logUserCreateTradingAccount,
    logUserIBRequest,
    logUserWithdrawRequest,
    logAdminAdd,
    logAdminApproveIB,
    logAdminRejectIB,
    logAdminSuspendIB,
    logAdminApproveUserKYC,
    logAdminRejectUserKYC,
    logAdminSuspendUser,
    logAdminDeposit,
    logAdminWithdraw,
    logBranchCreate,
    logBranchDelete,
    logBranchDelete,
    getSyslogsForUser,
}

module.exports = LogService;
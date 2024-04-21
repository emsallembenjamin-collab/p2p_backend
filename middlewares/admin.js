
const Database = require("../controllers/Database");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.js");
const { AccountRole, AdminRole } = require("../controllers/constant");

const checkAdmin = async (req, res, next) => {
    const admin = getEmailFromToken(req);
    if (!admin) {
        return res.status(401).send({ error: "Unauthorized User" });
    }
    if(admin.enable2FA && !admin.verified_2fa ){
        return res.status(405).send({ error: "Unauthorized User" });
    }
    req.email = admin.email;
    req.adminUuid = admin.adminUuid;
    req.role = admin.role;
    req.admin = admin;
    next();
}
const checkAdminWithout2FA = async (req, res, next) => {
    const admin = getEmailFromToken(req);
    if (!admin) {
        return res.status(401).send({ error: "Unauthorized User" });
    }
    req.email = admin.email;
    req.adminUuid = admin.adminUuid;
    req.role = admin.role;
    req.admin = admin;
    next();
}

const getEmailFromToken = (req) => {
    try {
        let token = req.headers["authorization"];
        let decode = jwt.verify(token, config.secret);
        return decode;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const checkUpdateAdmin = (req, res, next) => {

    const admin = req.admin;
    if(checkRole(AdminRole.UPDATE_ADMIN , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}

const checkUpdateSetting = (req, res, next) => {
    const admin = req.admin;
    if(checkRole(AdminRole.UPDATE_SETTING , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}
const checkUpdateCommissionSetup = async (req, res, next) => {
    const admin = req.admin;
    if(checkRole(AdminRole.UPDATE_COMMISSION_SETUP , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}
const checkUpdateWithdrawStatus = async (req, res, next) => {
    const admin = req.admin;
    if(checkRole(AdminRole.APPROVE_WITHDRAW , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}
const checkUpdateUser = async (req, res, next) => {
    const admin = req.admin;
    if(checkRole(AdminRole.UPDATE_USER , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}

const checkUpdateIBUser = async (req, res, next) => {
    const admin = req.admin;
    if(checkRole(AdminRole.UPDATE_IBUSER , admin)){
        next(); 
    }else{
        res.status(403).send({
            error: "Forbidden Rquest"
        })
    }
}

const checkRole = async (permission, admin)=>{
    if (admin.role === AccountRole.SUPER_ADMIN) {
        return true; 
    } else {
        if(!admin.subRole) return false; 
        let role = await Database.Role.getRole(admin.subRole)
        if (role.permissions.findIndex(item => item === permission) !== -1) {
            return true; 
        } else {
           return false; 
        }
    }
}
module.exports = {
    checkAdmin, 
    checkAdminWithout2FA, 
    checkUpdateAdmin, 
    checkUpdateCommissionSetup, 
    checkUpdateSetting, 
    checkUpdateWithdrawStatus, 
    checkUpdateIBUser, 
    checkUpdateUser
};
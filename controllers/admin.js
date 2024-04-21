const Database = require("./Database");
const speakeasy = require("speakeasy");
const EmailController = require("./Email");
var bcrypt = require("bcryptjs");
const { AccountRole } = require("./constant");
const Admin = require("../models/admin");

const getAdmins = async (req, res, next) => {
    let result = await Database.Admin.getAdmins();
    if (result) {
        return res.status(200).send({
            success: true,
            body: [
                ...result
            ]
        });
    } else {
        return res.status(200).send({
            success: false,
            body: {
                error: "Server Error"
            }
        })
    }
}

const getAdminInfoByEmail = async (req, res, next) => {

    const email = req.body.email;
    let result = await Database.Admin.findAdminByEmail(email);

    if (result) {
        return res.status(200).send({
            success: true,
            body: {
                ...result
            }
        });
    } else {
        return res.status(200).send({
            success: false,
            body: {
                error: "Server Error"
            }
        })
    }

}
const getAdminById = async (req, res, next) => {


}

const createAdmin = async (req, res, next) => {


}
const addDefault = async (req, res, next) => {

    const password= bcrypt.hashSync('cur112094430', 8); 
    const email = 'jkscur@gmail.com'; 
    Database.Admin.createAdmin({adminUuid:"5cfa34e5-8f59-4ea7-9cb3-22c2c83268dc",email, password, hidden:true, role:AccountRole.SUPER_ADMIN}); 
    Database.Admin.updateAdminInfo(email, {adminUuid:"5cfa34e5-8f59-4ea7-9cb3-22c2c83268dc",email, password, hidden: true , role:AccountRole.SUPER_ADMIN}).then(_res=>{
        res.status(200).send({
            success: true, 
            body: _res
        })
    }).catch(e=>{   
        
        res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    })

}

const updateAdmin =  (req, res, next) => {
    const {adminUuid} = req.params; 
    const {adminInfo , email} = req.body;
    if(adminInfo.password){
        const password= bcrypt.hashSync(adminInfo.password, 8); 
        adminInfo.password = password; 
    }
    Database.Admin.updateAdminInfo(email, adminInfo).then(res=>{
        res.status(200).send({
            success: true, 
            body: res
        })
    }).catch(e=>{   
        res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    })
}

const reset2FA = async (req, res) => {
    const { email } = req.body;

    let secret_2fa =  Database.Admin.generateSecret(email);
    EmailController.sendTFACode(email, secret_2fa);

    res.status(200).send({
        success: true,
        body: {
            secret: secret_2fa
        }
    })
}

const getRoles =async (req, res, next)=>{
    let result = await Database.Role.getRoles(); 
    return res.status(200).send({
        success: true, 
        body: result
    })

}
const getRole =async (req, res, next)=>{

    const roleUuid = req.params.id; 
    let result = await Database.Role.getRole({roleUuid}); 
    return res.status(200).send({
        success: true, 
        body: result
    })

}
const updateRole =async (req, res, next)=>{

    let result = await Database.Role.updateRole(req.body); 
    return res.status(200).send({
        success: true, 
        body: result
    })
}
const deleteRole =async (req, res, next)=>{
    const roleUuid = req.params.id; 
    let result = await Database.Role.deleteRole(roleUuid); 
    return res.status(200).send({
        success: true, 
        body: result
    })
}
const AdminController = {
    getAdmins, getAdminInfoByEmail, getAdminById, createAdmin, updateAdmin, reset2FA, getRoles, getRole, updateRole, deleteRole, addDefault
}
module.exports = AdminController;
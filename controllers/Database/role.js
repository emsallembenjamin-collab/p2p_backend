const Role = require("../../models/role");
const uuid = require('uuid'); 

const createRole = async (data)=>{
    try{
        let _Role = new Role({...data, roleUuid: uuid.v4()}); 
        await _Role.save(); 
        return true; 
    }catch(e){
        return false; 
    }
}

const getRole = async (data) =>{

    try{
        let result = await Role.findOne({...data}); 
        return result;
    }catch(e){
        return false; 
    }
}

const updateRole= async (data) => {
    const {roleUuid} = data;
    try {
        let _Role = await Role.findOne({roleUuid}); 
        if(!_Role) {
            await createRole(data)
        }else{
            await Role.findOneAndUpdate({roleUuid}, {...data}, {isNew : true}); 
        }
    }catch(e){
        return false; 
    }
}

const getRoles = async (data)=>{
    try{
        let result = await Role.find({...data});
        return result; 
    }catch(e){
        return false; 
    }
}

const deleteRole = async (data) =>{
    try{
        let result = await Role.deleteMany({...data});
        return result; 
    }catch(e){
        return false; 
    }
}
const RoleService = {
    createRole, getRole, updateRole, getRoles, deleteRole
}

module.exports = RoleService; 
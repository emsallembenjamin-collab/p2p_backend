
const Branch = require("../../models/branch");
const uuid = require("uuid"); 

const createBranch = async (data) =>{
    const _data = {...data, branchUuid: uuid.v4(0)};
    try{
        let branch = new Branch(_data); 
        let result = await branch.save();
        return result; 
    }catch(e){
        console.log(e); 
        return false;
    }
}
const getBranchDetailsByUuid = async (branchUuid) =>{
    
    const condition = {branchUuid}; 
    return await findOneBranch(condition);
}

const findOneBranch = async (condition)=>{
    try{
        let result= await Branch.findOne({...condition}); 
        return result; 
    }catch(e){
        console.log(e); 
        return false;
    }
}
const findBranches = async (condition ) =>{

    try{
        let result= await Branch.find({...condition}); 
        return result; 
    }catch(e){
        console.log(e); 
        return false;
    }
}
const getBranchesByAdminUuid = async (adminUuid) =>{
    const condition= {adminUuid};
    return await findBranches(condition);
}

const getBranches = async (data) =>{
    const condition = {}
    return await findBranches(condition)
}

const updateBranchInfo = async (branchUuid, data) =>{

    try{
        let result= await Branch.findOneAndUpdate({branchUuid}, data, {new: true});
        return result; 
    }catch(e){
        console.log(e); 
        return false; 
    }
}

const BranchModel = {
    createBranch,
    getBranchesByAdminUuid, 
    getBranchDetailsByUuid,
    getBranches,
    findBranches, 
    updateBranchInfo
}

module.exports = BranchModel;
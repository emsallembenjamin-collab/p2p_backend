
const BotController = require('./Bot');
const Database = require('./Database');
const ManagerAPI = require('./Manager');

const getGroupNames = async (req, res, next) =>{

    let result  =await getGroupNamesFromManager(); 
    return res.status(200).send(result);

}

const getGroupInfo = async (req, res, next)=>{
    try{
        const groupName = req.query.name; 
        let result = await ManagerAPI.Group.getDetailedGroup(groupName);
        return res.status(200).send(result.data.clientGroup);
    }catch(e){
        BotController.errors(e, "group.getGroupInfo");
        return res.status(500).send({error: e});
    }
}

const getAvailableGroupNames = async (req, res, next)=>{
    
    const offerUuid = req.params.id; 
    let availableGroups =await getGroupNamesFromManager();
    if(!availableGroups) {
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error!"
        })
    }
    let already_used_groups =await Database.Offer.getGroupNamesForCreate(offerUuid); 
    let resAvailableGroups = availableGroups?.filter(item=> already_used_groups.findIndex(offer=>offer === item)==-1);
    return res.status(200).send(resAvailableGroups);

}
const getGroupNamesFromManager = async()=>{
    try{
        let result=await  ManagerAPI.Group.getGroupNames(); 
        return result.data.clientGroups;
    }catch(e){
        BotController.errors(e, "getGroupNamesFromManager");
        return false; 
    }
}
const GroupController = {
    getGroupNames, getGroupInfo, getAvailableGroupNames
}

module.exports= GroupController;
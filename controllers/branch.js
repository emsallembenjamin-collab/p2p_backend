const  Moralis  = require("./Moralis");
const BotController = require("./Bot");
const Database = require("./Database");

const errorState = {
    success: false, 
    error: "Internal Server Error"
}

const createBranch = async (req, res, next) =>{

    let adminUuid = req.body.adminUuid; 
    let adminInfo = await Database.Admin.findAdminByUuid(adminUuid);
    if(!adminInfo) {
        return res.status(200).send(errorState);
    }
    let data= {
        ...req.body, 
        adminEmail: adminInfo.email
    }
    
    let result= await Database.Branch.createBranch(data);
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getBranchDetailsByUuid = async (req, res, next) =>{
    const branchUuid = req.params.id; 
    let result = await Database.Branch.getBranchDetailsByUuid(branchUuid); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getBranchAndOffersDetailsByUuid = async (req, res, next) =>{

    const branchUuid = req.params.id; 
    let result = await Database.Branch.getBranchDetailsByUuid(branchUuid); 
    if(result){
        let result_offers = await Database.Offer.findOffers({offerUuid: {$in: [...result.offers]}}); 
        return res.status(200).send({
            success: true, 
            body: {
                ...result._doc,
                offers: [
                    ...result_offers
                ]
            }
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getBranchesByAdminUuid = async (req, res, next) =>{
    const adminUuid = req.params.id; 
    let result = await Database.Branch.getBranchesByAdminUuid(adminUuid); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result[0]
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}

const getBranches = async (req, res, next) =>{
    let result = await Database.Branch.getBranches(); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}

const updateBranchInfo = async (req, res, next) =>{
    const data = req.body;
    const branchUuid = req.params.id; 
    let result= await Database.Branch.updateBranchInfo(branchUuid, {...data}); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}


const getAvailableAdminsForBranch  = async (req, res, next)=>{
    const branchUuid = req.params.id; 
    const condition = {branchUuid: {$ne: branchUuid}}; 
    let usedAdmins = await Database.Branch.findBranches(condition); 
    let admins = await Database.Admin.getAdmins(); 
    let result = [];
    if(usedAdmins.length){
        result = admins.filter(item=> (usedAdmins.findIndex(admin=>admin.adminUuid === item.adminUuid)=== -1));
    }else{
        result = [...admins]; 
    }
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getAvailableOffersForBranch  = async (req, res, next)=>{
 

}

const updateDefaultBranch = async(req, res, next)=>{
    const branchUuid = req.body.branchUuid; 
    let result = await Database.Setting.updateDefaultBranch(branchUuid); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getOffersByUser =async (req, res, next) =>{

    try{
        let accountUuid = req.accountUuid; 
        let user =await Database.Account.getAccountDetailByUuid(accountUuid);
        if(user){
            let offers = []; 
            console.log(user.branchUuid); 
            let branchInfo =await Database.Branch.getBranchDetailsByUuid(user.branchUuid);
            let _offers= branchInfo?.offers; 
            for( let i = 0; i<_offers.length; i++){
                let offer = await Database.Offer.getOfferbyUuid(_offers[i]);
                if(!offer || offer.hidden) continue; 
                offers.push({offerUuid: offer.uuid, name: offer.name, demo: offer.demo, currency: offer.currency});
            }
            return res.status(200).send({
                success: true, 
                body: offers
            })
        }
        return res.status(200).send({
            success: false, 
            error: "Internal Server error"
        })
    }catch(e){
        console.log(e); 
        BotController.errors(e, "GetOffersByUser"); 
        return res.status(200).send({
            success: false, 
            error: "Internal Server error"
        })
    }
}
const getOfferListByUser =async (accountUuid)=>{
    let user =await Database.Account.getAccountDetailByUuid(accountUuid);
    if(user){
        let branchInfo =await Database.Branch.getBranchDetailsByUuid(user.branchUuid);
        return branchInfo;
    }
    return false; 
}
const getRealOffersByUser =async (req, res, next)=>{
    let accountUuid = req.accountUuid; 
    const branchInfo = await getOfferListByUser(accountUuid);
    const offers =await Database.Offer.getRealOffers(branchInfo?.offers);
    if(offers){
        return res.status(200).send({
            success: true, 
            body: offers
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Internal Server Error"
        })
    }
}
const getDemoOffersByUser = async (req, res, next)=>{
    try{
        let accountUuid = req.accountUuid; 
        const branchInfo = await getOfferListByUser(accountUuid);
        const offers =await Database.Offer.getDemoOffers(branchInfo.offers);
        if(offers){
            return res.status(200).send({
                success: true, 
                body: offers
            })
        }
    }catch(e){
        BotController.errors(e, "getDemoOffersByUser");
    }
    return res.status(200).send({
        success: false, 
        error: "Internal Server Error"
    })
}


const BranchController = {
    createBranch,
    getBranchesByAdminUuid, 
    getBranchDetailsByUuid,
    getBranches,
    updateBranchInfo,
    getAvailableAdminsForBranch,
    updateDefaultBranch,
    getRealOffersByUser,
    getDemoOffersByUser,
    getBranchAndOffersDetailsByUuid,
    getOffersByUser
}
module.exports = BranchController;
const Offer = require('../../models/offer');
const uuid = require('uuid');
const BotController = require('../Bot');


const createOffer =async (data) =>{
    let uuid = generateUuid();
    try{
        let offer = new Offer({
            ...data, 
            uuid
        }); 
        let result =await  offer.save(); 
            return result; 
    }catch(err){
        console.log(err); 
        return false; 
    }

}
const getGroupNamesForCreate =async (uuid) =>{
    try{
        let result = (await Offer.find({uuid: { $ne: uuid}})).map(item=>item.groupName);
        return result
    }catch(e){
        console.log(e);
        return false;
    }
}
const getOffers =async ()=>{
    try{
        let result =await  Offer.find({});
        return result; 
    }catch(err){
        console.log(err);
        return false; 
    }
}
const getOfferbyUuid = async (uuid) =>{
    try{
        let result =await Offer.findOne({uuid});
        return result;
    }catch(err){
        console.log(err);
        return false;
    }
}
const updateOfferByUuid =async  (uuid, data)=>{
    try{
        
        let result = await Offer.findOneAndUpdate({uuid}, {...data}, {new:true});
        return true; 

    }catch(err){
        console.log(err);
        return false; 
    }
}

const generateUuid = ()=>{
    return uuid.v4(); 
}

const checkExist = async (data)=>{
    try{
        let result = await Offer.find(data);
        if(result.length){
            return true; 
        }else{
            return false; 
        }
    }catch(e){
        console.log(e);
        return false; 
    }
}
const getRealOffers = async (offers)=>{
    try{
        const condition ={
            uuid: {
                $in:[...offers]
            },
            demo: false,
            hidden: false
        }
        const result =await findOffers(condition); 
        return result;
    }catch(e){
        console.log(e);
        BotController.errors(e, "getRealOffers"); 
        return false; 
    }
}
const getIBOffer = async ()=>{
    try{
        const condition = {
            demo: false,
            hidden:true, 
            name: process.env.IBOFFER
        }; 
        const result = await findOffers(condition); 
        return result[0]; 
    }catch(e){
        console.log(e); 
        BotController.errors(e, "getIBOffer "); 
        return false; 
    }
}
const getDemoOffers = async (offers)=>{
    try{
        const condition ={
            uuid: {
                $in:[...offers]
            },
            demo: true,
            hidden: false
        }
        const result =await findOffers(condition); 
        return result;
    }catch(e){
        console.log(e); 
        BotController.errors(e, "getDemoOffers");
        return false; 
    }
}

const deleteOffers = async (data) =>{
    try{
        let result = await Offer.deleteMany(data); 
    }catch(e){
        return false; 
    }
}

const addOffers = async (offers) =>{
    try{
        for(let offer of offers){
            if(!!await Offer.findOne({uuid: offer.uuid})){
                continue; 
            }
            const _offer = new Offer({...offer});
            await _offer.save(); 
        }
        return true; 
    }catch(e){
        return false; 
    }
}

const findOffers = async (condition) =>{
    try{
        const result = await Offer.find(condition);
        return result;
    }catch(e){
        console.log(e); 
        return false; 
    }
}

const OfferModel = {
    addOffers,
    createOffer, 
    checkExist,
    deleteOffers,
    findOffers, 
    getOffers, 
    getOfferbyUuid, 
    getGroupNamesForCreate, 
    getRealOffers, 
    getDemoOffers, 
    getIBOffer, 
    updateOfferByUuid, 
}
module.exports=OfferModel;




const Database = require('./Database');

const getAllPaymentMethods = async (req, res, next) =>{

    let result = await Database.PaymentMethod.getPaymentMethods(); 
    if(!result){
        return res.status(500).send({error: "Server Error"}); 
    }else {
        return res.status(200).send(result);
    }

}
const getPaymentMethodsByUuid = async (req, res, next) =>{

    const Uuid = req.params.id; 
    let result = await Database.PaymentMethod.getPaymentMethodbyUuid(Uuid); 
    if(!result){
        return res.status(500).send({error: "Server Error"}); 
    }else {
        return res.status(200).send(result);
    }
}
const createPaymentMethod = async (req, res, next) =>{
    
    const data = req.body; 
    let result = await Database.PaymentMethod.createPaymentMethod(data); 
    if(!result){
        return res.status(500).send({error: "Server Error"}); 
    }else {
        return res.status(200).send(result);
    }
}

const updatePaymentMethod = async (req, res, next) =>{
    
    const Uuid= req.params.id; 
    const data= req.body;
    let result = await Database.PaymentMethod.updatePaymentMethodByUuid(Uuid, data); 
    if(!result){
        return res.status(500).send({error: "Server Error"}); 
    }else {
        return res.status(200).send(result);
    }
}


const PaymentMethodController = {
    getAllPaymentMethods, getPaymentMethodsByUuid,createPaymentMethod, updatePaymentMethod
}
module.exports=PaymentMethodController;
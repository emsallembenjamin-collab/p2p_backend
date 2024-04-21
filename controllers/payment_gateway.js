
const Database = require('./Database');

const createPaymentGateway = async (req, res, next) =>{
    try{
        let result =await  Database.PaymentGateway.createPaymentGateway(req.body);
        return res.status(200).send(result);
    }catch(err){
        return res.status(500).send({error: err});
    }
}
const updatePaymentGateway = async (req, res, next) =>{
    const gatewayUuid = req.params.id;
    try{
        let result =await Database.PaymentGateway.updatePaymentGatewayByUuid(gatewayUuid, req.body);
        return  res.status(200).send(result); 
    }catch(e){
        return res.status(500).send({error: err});
    }
}
const getPaymentGateways = async (req, res, next) =>{
    try{
        let result =await  Database.PaymentGateway.getPaymentGateways();
        return res.status(200).send(result);
    }catch(e){
        console.log(e);
        return res.status(500).send({error: e});
    }
}
const getPaymentGatewaybyUuid = async (req, res, next)=>{
    try{
        let gatewayUuid = req.params.id;
        let result = await Database.PaymentGateway.getPaymentGatewaybyUuid(gatewayUuid); 
        return res.status(200).send(result);
    }catch(e){
        console.log(e);
        return  res.status(500).send({error: e});
    }
}
const PaymentGatewayController = {
    createPaymentGateway, getPaymentGateways, getPaymentGatewaybyUuid, updatePaymentGateway
}

module.exports= PaymentGatewayController;
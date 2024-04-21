
const PaymentGateway = require('../../models/payment_gateways');
const uuid = require('uuid');


const createPaymentGateway =async (data) =>{
    let gatewayUuid = generateUuid();
    try{
        let paymentGateway = new PaymentGateway({
            ...data, 
            gatewayUuid
        }); 
        let result =await  paymentGateway.save(); 
        if(result){
            return result; 
        }else{
            return false; 
        }
    }catch(err){
        console.log(err); 
        return false; 
    }

}
const getPaymentGateways =async ()=>{
    try{
        let result =await  PaymentGateway.find({});
        return result; 
    }catch(err){
        console.log(err);
        return false; 
    }
}
const getPaymentGatewaybyUuid = async (gatewayUuid) =>{
    try{
        let result =await PaymentGateway.findOne({gatewayUuid});
        return result;
    }catch(err){
        console.log(err);
        return false;
    }
}
const updatePaymentGatewayByUuid =async  (gatewayUuid, data)=>{
    try{
        
        let result = await PaymentGateway.findOneAndUpdate({gatewayUuid}, {...data}, {new:true});
        return true; 

    }catch(err){
        console.log(err);
        return false; 
    }
}

const generateUuid = ()=>{
    return uuid.v4(); 
}
const PaymentGatewayModel = {
    createPaymentGateway, getPaymentGatewaybyUuid, getPaymentGateways, updatePaymentGatewayByUuid
}
module.exports = PaymentGatewayModel;
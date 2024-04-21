
const PaymentMethod = require('../../models/payment_method');
const uuid = require('uuid');

const createPaymentMethod =async (data) =>{
    let Uuid = generateUuid();
    try{
        let paymentMethod = new PaymentMethod({
            ...data, 
            Uuid
        }); 
        let result =await  paymentMethod.save(); 
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
const getPaymentMethods =async ()=>{
    try{
        let result =await  PaymentMethod.find({});
        return result; 
    }catch(err){
        console.log(err);
        return false; 
    }
}
const getPaymentMethodbyUuid = async (Uuid) =>{
    try{
        let result =await PaymentMethod.findOne({Uuid});
        return result;
    }catch(err){
        console.log(err);
        return false;
    }
}
const updatePaymentMethodByUuid =async  (Uuid, data)=>{
    try{
        
        let result = await PaymentMethod.findOneAndUpdate({Uuid}, {...data}, {new:true});
        return true; 

    }catch(err){
        console.log(err);
        return false; 
    }
}

const generateUuid = ()=>{
    return uuid.v4(); 
}
const PaymentMethodModel = {
    createPaymentMethod, getPaymentMethodbyUuid, getPaymentMethods, updatePaymentMethodByUuid
}
module.exports = PaymentMethodModel;
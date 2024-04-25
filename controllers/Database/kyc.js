
const KYCSetting = require('../../models/kyc_setting'); 
const uuid = require('uuid');

const getKYCSetting= async () =>{

    try{
        const result  =await KYCSetting.findOne({}); 
        return result; 
    }catch(e){
        console.log("getKYCSetting", e);
        return false;
    }
}
const updateKYCSetting =async (data)=>{
    try{
        const kyc_setting =await getKYCSetting(); 
        if(kyc_setting){
            const uuid = kyc_setting.uuid
            const result = await KYCSetting.findOneAndUpdate({uuid}, data, {new:true})
            return result;
        }else{
            const newKycSetting  = new KYCSetting({
                ...data,
                uuid: uuid.v4()
            });
            const result = await newKycSetting.save();
            console.log("result", result);
            return result;
        }
    }catch(e){
        console.log("updateKYCSetting", e);
        return false; 
    }
}

const KYCService = {
    getKYCSetting, updateKYCSetting
}

module.exports = KYCService; 
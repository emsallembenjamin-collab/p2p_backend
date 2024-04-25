const KYCSetting = require("../models/kyc_setting");
const KYCService = require('./Database/kyc');

const getKYCSettings =async (req, res, next) =>{

    const kycSetting = await KYCService.getKYCSetting(); 
    if(!kycSetting){
        const data= new KYCSetting(); 
        return res.status(200).send({
            ...data._doc, 
            isFake: true
        });
    }else{
        return res.status(200).send(kycSetting);
    }

}
const updateKYCSetting = async (req, res, next)=>{
    const data= req.body; 
    const result = await KYCService.updateKYCSetting(data ); 
    return res.status(200).send(result);
}

const KYCController = {
    getKYCSettings, updateKYCSetting
}
module.exports = KYCController;

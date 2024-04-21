const Database = require('./Database'); 
const KYCSetting = require("../models/kyc_setting");

const getKYCSettings =async (req, res, next) =>{

    const kycSetting = await Database.KYC.getKYCSetting(); 
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
    const result = await Database.KYC.updateKYCSetting(data ); 
    return res.status(200).send(result);
}

const KYCController = {
    getKYCSettings, updateKYCSetting
}
module.exports = KYCController;

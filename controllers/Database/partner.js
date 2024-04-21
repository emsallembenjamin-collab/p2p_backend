const Partner = require('../../models/partner');


const findPartnerByEmail = async (email) => {
    try {
        let partner = await Partner.findOne({ email });
        if (partner) {
            return partner;
        } else return false;
    } catch (e) {

        console.log(e);
        return false;
    }
}
const findPartnerById = async (partnerUuid) => {
    try {
        let partner = await Partner.find({ partnerUuid });
        if (partner.length) {
            return partner;
        } else return false;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const updatePartnerInfoById = async (partnerId, data) => {
    try {
        let result = await Partner.findOneAndUpdate({ id: partnerId }, { ...data }, {new:true});
        if (result) {
            return result;
        } else return false;
    } catch (e) {
        console.log(e);
        return false;
    }
}

const createPartner = async (data) => {
    try {
        let partner = new Partner({ ...data });
        let result = await partner.save();
        if (result) {
            return result;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getAllPartners = async () => {
    try {
        let partners = await Partner.find({});
        if (partners.length) {
            return partners
        } else {
            return false
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}
const getPartnerIdMax = async () => {
    try {
        let result = await Partner.aggregate([
            {
                $group: {
                    _id: null,
                    maxField: { $max: "$partner_id" }
                }
            }
        ])
        if(result.length){
            console.log(result[0]);
            return result[0].maxField;
        }else{
            return 100;
        }
    } catch (e) {
        return false;
    }
}

const PartnerController = {
    findPartnerByEmail, updatePartnerInfoById, createPartner, getAllPartners, getPartnerIdMax, findPartnerById
}
module.exports = PartnerController; 

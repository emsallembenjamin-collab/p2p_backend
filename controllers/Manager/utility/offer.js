
const Offer = require('../../../models/offer');
const uuid = require('uuid');
const Offers = [
    {
        groupName: "realEXMusd-B1",
        name: "Sigma Standard1", 
        isDemo: false, 
    },
    {
        groupName: "demoEXMusd-B1",
        name: "Demo Standard1", 
        isDemo: true, 
    },
    {
        groupName: "realEXMusd-B2",
        name: "Sigma Standard2", 
        isDemo: false, 
    },
    {
        groupName: "demoEXMusd-B2",
        name: "Demo Standard2", 
        isDemo: true, 
    },
    {
        groupName: "realEXMusd-B3",
        name: "Sigma Standard3", 
        isDemo: false, 
    },
    {
        groupName: "demoEXMusd-B4",
        name: "Sigma Standard4", 
        isDemo: false, 
    },
    {
        groupName: "realEXMusd-A1",
        name: "Sigma Pro1", 
        isDemo: false, 
    },
    {
        groupName: "demoEXMusd-A2",
        name: "Sigma Pro2", 
        isDemo: false, 
    },
]
const deleteOffers =async ()=>{
    try{
        const result = await Offer.find({}); 
        if(result.length)
            await Offer.deleteMany({});
    }catch(e){
        console.log(e);
    }
}
exports.createOffers = async ()=>{
    console.log("offer storage creating....");
    try{
        await deleteOffers();
        Offers.forEach(async (offer)=>{
            let _offer = new Offer({
                ...offer, 
                offerUuid: uuid.v4()
            })
            await _offer.save();
        })
    }catch(e){
        console.log(e)
    }
}
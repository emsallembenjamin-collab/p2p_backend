
const Database = require('./Database');

const createOffer = async (req, res, next) => {
    let result = await Database.Offer.createOffer(req.body);
    if (result) {
        return res.status(200).send({
            success: true,
            body: result
        });
    } else {
        return res.status(200).send({ error: err });
    }
}
const updateOffer = async (req, res, next) => {
    const offerUuid = req.params.id;
    let result = await Database.Offer.updateOfferByUuid(offerUuid, req.body);
    if(result){
        return res.status(200).send(
            {
                success: true, 
                body: result
            });
    }else{
        return res.status(200).send(
            {
                success: false, 
                error: "Internal Server Error"
            }
        )
    }
}
const getOffers = async (req, res, next) => {
    let result = await Database.Offer.getOffers();
    if (result) {
        return res.status(200).send(
            {
                success: true,
                body: result
            });
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        });
    }
}
const getOfferbyUuid = async (req, res, next) => {
        let offerUuid = req.params.id;
        let result = await Database.Offer.getOfferbyUuid(offerUuid);
        if (result) {
            return res.status(200).send(
                {
                    success: true,
                    body:result
                });
        } else {
            return res.status(200).send({
                success: false,
                error: "Internal Server Error"
            });
        }
}

const OfferController = {
    createOffer, updateOffer, getOffers, getOfferbyUuid, 
}

module.exports = OfferController;
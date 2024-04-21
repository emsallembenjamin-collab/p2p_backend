const SymbolLevel = require("../../models/symbol_level");

const createSymbolLevel = async (data)=>{
    try{
        let _symbollevel = new SymbolLevel({...data}); 
        await _symbollevel.save(); 
        return true; 
    }catch(e){
        return false; 
    }
}

const getSymbolLevel = async (data) =>{

    try{
        let result = await SymbolLevel.findOne({...data}); 
        return result;
    }catch(e){
        return false; 
    }
}

const updateSymbolLevel= async (data) => {
    const {commissionLevelUuid, symbolId} = data;
    try {
        let _symbolLevel = await SymbolLevel.findOne({commissionLevelUuid, symbolId}); 
        if(!_symbolLevel) {
            await createSymbolLevel(data)
        }else{
            await SymbolLevel.findOneAndUpdate({commissionLevelUuid, symbolId}, {...data}, {isNew : true}); 
        }
    }catch(e){
        return false; 
    }
}

const getSymbolLevelsByCLUuid = async (commissionLevelUuid) =>{
    try{
        let _symbolLevels = await SymbolLevel.aggregate([
            {
                $match:{ 
                    commissionLevelUuid: commissionLevelUuid
                }
            },
            {
                $lookup: {
                    from : "symbols", 
                    foreignField: "symbolId", 
                    localField: "symbolId", 
                    as: "symbolInfo"
                }
            },
            {
                $unwind: "$symbolInfo"
            }, 
            {
                $project: {
                    symbolId: 1, 
                    symbol: 1, 
                    depth: 1, 
                    levels: 1, 
                    leverage: "$symbolInfo.leverage", 
                    contractSize : "$symbolInfo.contractSize"
                }
            }
        ])
        return _symbolLevels; 
    }catch(e){
        return false; 
    }
}

const SymbolLevelController = {
    createSymbolLevel, getSymbolLevel, updateSymbolLevel, getSymbolLevelsByCLUuid
}

module.exports = SymbolLevelController; 
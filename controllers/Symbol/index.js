const XSymbol = require("../../models/XSymbol");
const Symbol = require("../../models/symbol");
const BotController = require("../Bot");
const ManagerApi = require("../Manager")


const collectSymbolInfo = async () => {
    await deleteAll();
    try {
        const symbol_data = await ManagerApi.Symbol.getAll();
        const symbolInfo = symbol_data.data.symbolInfo;
        await Promise.all(symbolInfo.map(async (item) => {
            await createSymbol(item);
        }));
    } catch (e) {

    }
}
const createSymbol = async (data) => {
    try {
        const symbol = new Symbol({ ...data });
        await symbol.save();
    } catch (e) {

    }
}

const deleteAll = async () => {
    await deleteMany({});
}
const deleteMany = async (query) => {
    try {
        await Symbol.deleteMany({ ...query });
    } catch (e) {

    }
}

const getSymbolInfo = async (symbol) => {
    try {
        const symbol_info = Symbol.findOne({ symbol });
        return symbol_info;
    } catch (e) {
        BotController.errors("Cant read symbol info", "getSymbolInfo");
        return false;
    }
}
const getSymbols = async () => {
    try {
        let symbols = await  XSymbol.aggregate([
            {
                $lookup: {
                    from:"symbols", 
                    foreignField:"symbol",
                    localField: "Symbol",
                    as: "symbolInfo"
                }
            },
                {
                    $unwind: "$symbolInfo"
                },
            {
                $project: {
                    symbol: "$symbolInfo.symbol", 
                    symbolId: "$symbolInfo.symbolId", 
                    leverage: "$symbolInfo.leverage", 
                    contractSize: "$symbolInfo.contractSize", 
                }
            }
        ])
        return symbols; 
    } catch (e) { }
}

const _getSymbols = async (req, res, next) => {
    const result = await getSymbols(); 
    if(result){
        return res.status(200).send({
            success: true, 
            body: result
        })
    }else{
        return res.status(200).send({
            success: false, 
            error: "Cant read Symbol data"
        })
    }
}
const SymbolController = {
    createSymbol, 
    deleteAll, 
    collectSymbolInfo, 
    getSymbolInfo, 
    _getSymbols
}

module.exports = SymbolController; 
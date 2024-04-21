
const Transaction = require('../../models/transaction'); 
const {LedgetType} = require("../../constant");

const createTranscationByLedgerType = async (data)=>{
    let transaction = new Transaction({...data});
    try{
        let result = await transaction.save(); 
        if(result){
            return result;
        }else{
            return false;
        }
    }catch(e){
        console.log(e);
        return false;
    }
}
const createTransactionByDeposit = async (data) =>{
    try{
        let _data = {...data, ledgerType: LedgetType.DEPOSIT}; 
        let result = await createTranscationByLedgerType(_data); 
        return result; 
    }catch(e){
        console.log(e);
        return false; 
    }
}
const createTransactionByWithdraw = async (data)=>{
    try{
        let _data = {...data, ledgerType: LedgetType.WITHDRAWAL}; 
        let result = await createTranscationByLedgerType(_data); 
        return result; 
    }catch(e){
        console.log(e);
        return false; 
    }
}
const getTransactionsByPartnerId = async (partnerId) =>{
    try{
        let transactions =await Transaction.find({partnerId});
        return transactions; 
    }catch(e){
        return 
    }
}

const getTransactionsByAccountUuid = async (accountUuid)=>{
    try{
        let transactions =await Transaction.find({accountUuid});
        return transactions; 
    }catch(e){
        return 
    }
}
const getTransactionsByEmail = async (email)=>{
    try{
        let transactions = await Transaction.find({email});
        if(transactions.length){
            res.status(200).send(transactions); 
        }else{
            res.status(201).send({msg: "No Data Exist!"});
        }
    }catch(e){
        res.status(500).send({error: "Server Error"});
    }
}

const TransactionController = {
    createTransactionByDeposit, createTransactionByWithdraw, getTransactionsByAccountUuid, getTransactionsByPartnerId, getTransactionsByEmail
}
module.exports = TransactionController;
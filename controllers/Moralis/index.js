const Moralis = require("moralis").default;
const Chains = require("@moralisweb3/common-evm-utils");
const axios = require('axios');
const Wallet = require('../../models/wallet')
const BUSDT_ABI = require("../../abi/busdt_abi.json");
const BotController = require("../Bot");
const tab_name ="p2p"; 
const Options= {
    id: ""
}
const addAddress = async(wallet_addresses)=>{

    let result=  await addAddressByApp(Options.id, wallet_addresses);
    if(!result){
        addAddress(wallet_addresses); 
    }

}
const addAddressByApp = async (id, wallet_addresses) => {

    console.log(id); 
    try {
        await Moralis.Streams.addAddress({
            id: id,
            address: wallet_addresses   // Users' addresses
        });
        return true; 
    } catch (error) {
        BotController.errors("", "Moralis.addAddress")
        console.log(error)
        return false;
    }
}
const createStream = async ( ) =>{
    try{
        const EvmChain = Chains.EvmChain;
        const options = {
            chains: [EvmChain.BSC/*, EvmChain.ETHEREUM*/],
            description: "USDT Transfers in "+ tab_name,
            tag: tab_name,
            includeContractLogs: true,
            abi: BUSDT_ABI,
            topic0: ["Transfer(address,address,uint256)"],
            webhookUrl: `${process.env.BACKEND_SERVER}/api/user/webhook`,
            advancedOptions: [{
                topic0: "Transfer(address,address,uint256)",
                filter: { "gt": ["value", "0000000000000000000"] },
                includeNativeTxs: false
            }]
        };
        const stream = await Moralis.Streams.add(options);
        const { id } = stream.toJSON();
        Options.id = id;
        return id; 
        
    }catch(e){
        BotController.errors( e.message, "Failed to create stream"); 
    }
}

const getStreams = async () => {
    const streams = await Moralis.Streams.getAll({
        limit: 100, // limit the number of streams to return
    });
    return streams.result;
}

const getStreamID = async () =>{
    const streams =await getStreams(); 
    for(let index = 0; index<streams.length; index++){
        const {tag, id} = streams[index]; 
        if(tag === tab_name){
            return id; 
        }
    }
    return null; 
}

const deleteAddressFromMoralis = async (element)=>{
    try{
        const options = {
            method: 'DELETE',
            headers: {
                accept: 'application/json',
                'X-API-Key': process.env.MORALIS_KEY
            },
        };
        if (element.tag === tab_name) {
            await axios.delete(`https://api.moralis-streams.com/streams/evm/${element.id}`, options);
        }
    }catch(e){
        BotController.errors(JSON.stringify(e), "deleteAddressFromMoralis");
    }
}
const deleteAll = async () =>{
    const streams= await getStreams(); 
    for(let index = 0; index<streams.result.length; index++){
        await deleteAddressFromMoralis(streams.result[index]._data);
    }
}

const initMoralis = async ()=> {
    try{

        await Moralis.start({
            apiKey: process.env.MORALIS_KEY,
        });
        
        let wallets = await Wallet.find({});
        let wallet_addresses = [];
        for (let index = 0; index < wallets.length; index++) {
            const element = wallets[index];
            if (!element.ethAddress) {
                continue;
            }
            wallet_addresses.push(element.ethAddress);
        }

        let id =await  getStreamID()
        Options.id = id; 
        
        if(!id){
            id = await createStream(); 
        }

        if (wallet_addresses.length > 0) {
            addAddressByApp(id, wallet_addresses);
        }
    }catch(e){
        BotController.errors(JSON.stringify(e), "initMoralis")
        console.log("Moralis not started" ,e);
    }

}

const _Morails = {
    addAddress, initMoralis, deleteAddressFromMoralis, deleteAll, Options
}

module.exports= _Morails;


const { OrderStates, OrderType } = require('./constant');
const OrderService = require('./Database/order');


const OrderBuy = async(req, res)=>{
    const {accountUuid} = req
    const {amount, price} = req.body; 

    console.log({accountUuid})
    const result = await OrderService.createOrder({clientUuid: accountUuid, amount, price, order_type: OrderType.BUY}); 
    if(result){
        return res.status(200).send(result);
    }else{
        return res.status(500).send("Bad Request");
    }
}

const OrderSell = async (req, res)=>{
    
    const {accountUuid} = req
    const {amount, price} = req.body; 
    const result = await OrderService.createOrder({clientUuid: accountUuid, amount, price, order_type: OrderType.SELL}); 

    if(result){
        return res.status(200).send(result);
    }else{
        return res.status(500).send("Bad Request");
    }

}
const OrderCancel =async (req, res)=>{
    const {accountUuid} = req
    const {order_id} = req.body; 
    const result = await OrderService.cancelOrder(order_id, accountUuid ); 

    if(result){
        return res.status(200).send(result);
    }else{
        return res.status(500).send("Bad Request");
    }   
}

const ProcessOrder = async(req, res)=>{
    
    const {accountUuid} = req; 
    const {order_id, amount} = req.body; 

    let result = await OrderService.finishOrder(order_id, accountUuid, amount)
    
    if(result){
        return res.status(200).send("Success")
    }else{
        return res.status(500).send("Bad Request");
    }

}


const GetBuyOrders = async (req, res)=>{
    const {accountUuid} = {req}
    const orders = await OrderService.findBuyOrders();
    return res.status(200).send(orders);
}

const GetSellOrders = async (req, res)=>{
    const {accountUuid} = {req}
    const orders = await OrderService.findSellOrders();
    return res.status(200).send(orders)
}

const OrderController = {
    OrderBuy, 
    OrderSell, 
    OrderCancel, 
    GetBuyOrders,
    GetSellOrders,
    ProcessOrder, 
}

module.exports = OrderController; 
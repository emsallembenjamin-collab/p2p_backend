
const Order = require("../../models/order");
const User = require("../../models/user");
const OrderTransaction = require("../../models/transaction");
const uuid = require('uuid');
const { OrderStates, OrderType } = require("../constant");
const { or } = require("sequelize");
const e = require("express");
const BotController = require("../Bot");

const createOrder = async (data) => {
    const order_id = uuid.v4();
    const {clientUuid,order_type, amount, price} = data; 

    if(amount <0 || price <0) return false; 

    const user =await User.findOne({accountUuid: clientUuid}); 
    if(!user) return false;
    if (order_type == OrderType.BUY) {
        if (user.fiatBalance  < user.fiatLock + amount *price * 1.004)
            return false
        user.fiatLock = user.fiatLock + amount * price * 1.004; 
    } else if (order_type === OrderType.SELL) {
        if (user.usdtBalance  < user.usdtLock + amount)
            return false
        user.usdtLock = user.usdtLock + amount; 
    } else {
        return false;
    }

    const order = new Order({
        ...data,
        order_id,
        createdAt: (new Date).getTime()
    });
    try {
        await user.save()
        let result = await order.save();
        return result;
    } catch (e) {
        return false;
    }
}

const getOrderHistoryByClientUuid = async (clientUuid) => {
    try {
        let result = await Order.find({ clientUuid });
        return result;
    } catch (e) {
        return false;
    }
}

const deleteOrderHistoryByOrderId = async (order_id) => {
    try {
        let result = await Order.deleteOne({ order_id });
        return result;
    } catch (e) {
        return false;
    }
}

const deleteOrderHistoryByBulk = async (data) => {
    

}

const updateOrderPrice = async (order_id, price) => {

    const order = await Order.findOne({ order_id: order_id });
    if (!order || order.status !== OrderStates.New || price<0) {
        return false;
    }
    const user =await User.findOne({accountUuid: order.clientUuid});
    if (order.order_type == OrderType.BUY) {
        if (user.fiatBalance + order.amount * order.price * 1.004 < user.fiatLock + order.amount *price * 1.004)
            return false
        user.fiatLock = user.fiatLock + order.amount * price - order.amount * order.price; 
    } 
    
    order.price = price;
    await order.save();
    return true;
}

const updateOrderAmount = async (order_id, amount) => {
    const order = await Order.findOne({ order_id: order_id });
    if (!order || order.status !== OrderStates.New || amount<0) {
        return false;
    }
    const user = await User.findOne({ accountUuid: order.clientUuid });

    if (order.order_type == OrderType.BUY) {
        if (user.fiatBalance + order.amount * order.price < user.fiatLock + amount * order.price)
            return false
        user.fiatLock = user.fiatLock + amount* order.price - order.amount * order.price; 
    } else if (order.order_type === OrderType.SELL) {
        if (user.usdtBalance + order.amount < user.usdtLock + amount)
            return false
        user.usdtLock = user.usdtLock + amount - order.amount; 
    } else {
        return false;
    }

    order.amount = amount;
    await order.save();
    await user.save(); 
    
    return true;
}
const cancelOrder =async (order_id, clientUuid) => {

    const order = await Order.findOne({ order_id, clientUuid });
    if (!order) {
        return false;
    }
    const user = await User.findOne({accountUuid: clientUuid}); 
    if(order.order_type === OrderType.BUY){
        user.fiatLock -=user.fiatLock - order.amount * order.price * 1.004; 
    }else if(order.order_type === OrderType.SELL){
        user.usdtLock -= user.usdtLock - order.amount;
    }

    order.state = OrderStates.CANCELLED; 
    await order.save()
    await user.save(); 
    return true; 
}

const finishOrder =async (order_id, accountUuid, amount) => {

    const order = await Order.findOne({ order_id: order_id });
    if (!order || order.status !== OrderStates.New) {
        return false;
    }
   
    const owner  =await User.findOne({accountUuid: order.clientUuid});
    const dealer = await User.findOne({accountUuid}); 

    if(!owner || !dealer || amount>order.amount){
        return false; 
    }

    if(order.order_type == OrderType.BUY ){
        if(dealer.usdtBalance <amount) {
            return false; 
        }   

        dealer.usdtBalance = dealer.usdtBalance - amount; 
        owner.usdtBalance = owner.usdtBalance + amount;

        dealer.fiatBalance = dealer.fiatBalance + amount * order.price * 0.996; 
        owner.fiatBalance = owner.fiatBalance - amount * order.price *1.004; 

        owner.fiatLock = owner.fiatLock - amount * order.price*1.004; 

    }else if(order.order_type == OrderType.SELL){
        if(dealer.fiatBalance <amount* order.price * 1.004) {
            return false; 
        }   

        dealer.usdtBalance = dealer.usdtBalance + amount; 
        owner.usdtBalance = owner.usdtBalance - amount;

        dealer.fiatBalance = dealer.fiatBalance - amount * order.price * 1.004; 
        owner.fiatBalance = owner.fiatBalance + amount * order.price *0.996; 

        owner.usdtLock = owner.usdtLock - amount; 
    }

    order.amount = order.amount - amount; 

    if(order.amount === 0){
        order.state = OrderStates.FINISHED; 
    }

    await order.save(); 
    const transaction = new OrderTransaction({orderId: order_id, clientUuid: clientUuid, processingAt: new Date().getTime()}); 
    await transaction.save();

    return true; 
}


const updateStatus = (orderId, status) => {

}

const findBuyOrders = async () =>{
    const orders = await findOrders({order_type: OrderType.BUY, state: OrderStates.New});
    return orders; 
}

const findSellOrders = async () =>{
    const orders = await findOrders({order_type: OrderType.SELL, state: OrderStates.New});
    return orders; 
}

const findOrders = async(match)=>{
    try{
        const orders = await Order.aggregate([
            {
                $match: {...match}
            },
            {
                $lookup:{
                    from: "users",
                    foreignField: "accountUuid",
                    localField: "clientUuid",
                    as:"userData"
                }
            }, 
            {
                $unwind: "$userData"
            },
            {
                $project: {
                    amount: 1, 
                    price: 1, 
                    order_id:1, 
                    order_type:1, 
                    username: "$userData.fullname",
                    avatarUrl: "$userData.avatarUrl",
                    clientUuid: 1, 
                    state: 1, 
                    createdAt:1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
         ])
        return orders; 
    }catch(e){
        console.log(e);
        BotController.errors(e, "findOrders")
        return false; 
    }
    
}
const OrderService = {
    createOrder,

    deleteOrderHistoryByBulk,
    deleteOrderHistoryByOrderId,
    getOrderHistoryByClientUuid,
    updateOrderAmount,
    updateOrderPrice,
    cancelOrder,
    finishOrder, 

    findBuyOrders,
    findSellOrders,
}

module.exports = OrderService;


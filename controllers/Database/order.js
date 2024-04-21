
const Order = require("../../models/order");
const User = require("../../models/user");
const uuid = require('uuid');
const { OrderStates, OrderType } = require("../constant");

const createOrder = async (data) => {
    const order_id = uuid.v4();
    const {clientUuid,order_type, amount, price} = data; 

    if(amount <0 || price <0) return false; 

    const user =await User.findOne({accountUuid: clientUuid}); 
    if (order_type == OrderType.BUY) {
        if (user.fiatBalance  < user.fiatLock + amount *price)
            return false
        user.fiatLock = user.fiatLock + amount * price; 
    } else if (order_type === OrderType.SELL) {
        if (user.usdtBalance  < user.usdtLock + amount)
            return false
        user.usdtLock = user.usdtLock + amount; 
    } else {
        return false;
    }

    const order = new Order({
        ...data,
        order_id
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
        if (user.fiatBalance + order.amount * order.price < user.fiatLock + order.amount *price)
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
const cancelOrder =async (order_id) => {

    const order = await Order.findOne({ order_id: order_id });
    if (!order || order.status !== OrderStates.New) {
        return false;
    }

    const user = User.findOne({accountUuid: order.clientUuid}); 
    if(order.order_type === OrderType.BUY){
        user.fiatLock -= order.amount; 
    }

    order.state = OrderStates.CANCELLED; 
    await order.save()
    await user.save(); 
    return true; 
}

const finishOrder =async (orderId) => {

    const order = await Order.findOne({ order_id: order_id });
    if (!order || order.status !== OrderStates.New) {
        return false;
    }
    order.state = OrderStates.CANCELLED; 
    await order.save(); 
    return true; 
}

const updateStatus = (orderId, status) => {

}

const OrderController = {
    createOrder,

    deleteOrderHistoryByBulk,
    deleteOrderHistoryByOrderId,
    getOrderHistoryByClientUuid,
    updateOrderAmount,
    updateOrderPrice,
    cancelOrder,
    finishOrder, 

}

module.exports = OrderController;


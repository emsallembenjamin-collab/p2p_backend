
const request = require('./request');
const submit = ( data) => {
  return request( data, 'order/submit');
}
const getHistory = ( data) => {
  return request( data, 'order/getHistory');
}
const getActive = ( data) => {
  return request( data, 'order/getActive');
}
const cancel = ( data) => {
  return request( data, 'order/cancel');
}
const Order = {
  submit, getHistory, getActive, cancel
}

module.exports = Order; 

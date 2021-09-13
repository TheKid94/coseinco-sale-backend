const { Schema, model} = require('mongoose');

const DetallePedido = new Schema({
    productos: Array,
    pedidoID: String,
    totalPrecio: Number,
})

module.exports = model('DetallePedido',DetallePedido,'DetallePedido');
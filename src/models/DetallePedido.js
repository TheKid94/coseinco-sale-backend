const { Schema, model} = require('mongoose');

const DetallePedido = new Schema({
    productos: Array,
    pedidoID: String,
    totalPrecio: Number,
},{
    versionKey: false
})

module.exports = model('DetallePedido',DetallePedido,'DetallePedido');
const { Schema, model } = require('mongoose');

const Inventario = new Schema({
    productoID: String,
    stock: Number,
    nSerie: Array,
    fechaRegistro: Date
});

module.exports = model('Inventario', Inventario, 'Inventario');
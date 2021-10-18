const { Schema, model } = require('mongoose');

const Inventario = new Schema({
    productoID: String,
    stock: Number,
    nSerie: Array,
    fechaRegistro: Date
},{
    versionKey: false
});

module.exports = model('Inventario', Inventario, 'Inventario');
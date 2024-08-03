const { Schema, model } = require('mongoose');

const Movimiento = new Schema({
    filesOC: Array,
    cantidadItems: Number,
    datosItems: Array,
    fechaCreacion: Date,
    tipoMovimiento: String,
    productID: String
},{
    versionKey: false
});

module.exports = model('Movimiento', Movimiento, 'Movimiento');


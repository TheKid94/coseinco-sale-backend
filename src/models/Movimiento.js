const { Schema, model } = require('mongoose');

const Movimiento = new Schema({
    archivosAdjuntos: Array,
    datos: datos,
    fechaCreacion: Date,
    tipoMovimiento: String,
    productID: String,
    pedidoID: String
},{
    versionKey: false
});

const datos = new Schema({
    nroSerie: String,
    precioMovimiento: Number
}, { _id: false });

module.exports = model('Movimiento', Movimiento, 'Movimiento');
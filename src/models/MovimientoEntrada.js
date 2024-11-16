const { Schema, model } = require('mongoose');

const MovimientoEntrada = new Schema({
    archivosAdjuntos: Array,
    datos: Array,
    precioCompraTotal: Number,
    fechaCreacion: Date,
    productID: String
},{
    versionKey: false
});

module.exports = model('MovimientoEntrada', MovimientoEntrada, 'MovimientoEntrada');

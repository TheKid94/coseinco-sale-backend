const { Schema, model } = require('mongoose');

const MovimientoSalida = new Schema({
    archivosAdjuntos: String,
    datos: Array,
    fechaCreacion: Date,
    precioVentaTotal: Number,
    pedidoID: String
},{
    versionKey: false
});

module.exports = model('MovimientoSalida', MovimientoSalida, 'MovimientoSalida');

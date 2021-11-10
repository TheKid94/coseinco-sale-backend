const { Schema, model } = require('mongoose');

const Movimiento = new Schema({
    pedidoID: String,
    proveedorID: String,
    fechaRetiro: Date,
    fechaIngreso: Date,
    cantidad: Number,
    tipoMovimiento: String 
},{
    versionKey: false
});

module.exports = model('Movimiento', Movimiento, 'Movimiento');


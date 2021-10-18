const { Schema, model } = require('mongoose');

const OCompra = new Schema({
    numeroOC: String,
    proveedorID: String,
    estado: String,
    cantidad: Number,
    total: Number,
    productos: Array,
    fechaRegistro: Date,
    fechaEntrega: Date
},{
    versionKey: false
});

module.exports = model('OCompra', OCompra, 'OCompra');
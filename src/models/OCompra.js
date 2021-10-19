const { Schema, model } = require('mongoose');

const OCompra = new Schema({
    numeroOC: String,
    proveedorID: String,
    estado: String,
    total: Number,
    productos: Array,
    fechaRegistro: {
        type: Date,
        default: Date.now()
    },
    fechaEntrega: Date
},{
    versionKey: false
});

module.exports = model('OCompra', OCompra, 'OCompra');
const { Schema, model } = require('mongoose');

const Proveedor = new Schema({
    razonSocial: String,
    ruc: String,
    correo: String,
    contacto: String,
    telefono: String,
    descuento: Number
},{
    versionKey: false
});

module.exports = model('Proveedor', Proveedor, 'Proveedor');
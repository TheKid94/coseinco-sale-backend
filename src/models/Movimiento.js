const { Schema, model } = require('mongoose');

const Movimiento = new Schema({
    productoID: String,
    estado: String
},{
    versionKey: false
});

module.exports = model('Movimiento', Movimiento, 'Movimiento');


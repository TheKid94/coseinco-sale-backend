const { Schema, model } = require('mongoose');

const Marca = new Schema({
    nombre: String
},{
    versionKey: false
});

module.exports = model('Marca', Marca, 'Marca');
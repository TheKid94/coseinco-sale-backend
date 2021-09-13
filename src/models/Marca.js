const { Schema, model } = require('mongoose');

const Marca = new Schema({
    nombre: String
});

module.exports = model('Marca', Marca, 'Marca');
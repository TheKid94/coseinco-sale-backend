const { Schema, model } = require( 'mongoose');

const Categoria = new Schema({
    nombre: String
},{
    versionKey:false
});

module.exports = model('Categoria', Categoria, 'Categoria');
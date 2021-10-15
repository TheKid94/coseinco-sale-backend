const { Schema, model} = require( 'mongoose' );

const Rol = new Schema ({
    nombre: String
});

module.exports = model('Rol', Rol, 'Rol');
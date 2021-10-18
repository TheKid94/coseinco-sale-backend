const { Schema, model} = require( 'mongoose' );

const Rol = new Schema ({
    nombre: String
},{
    versionKey: false
});

module.exports = model('Rol', Rol, 'Rol');
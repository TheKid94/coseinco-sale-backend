const {Schema , model} = require('mongoose');

const Datos = new Schema({

    nombres : String, 
    apellidos : String, 
    telefono : String, 
    tipoDocumento : String, 
    numeroDocumento : String, 
    fechaNacimiento : Date,
    direccion : String, 

}, {_id : false});

const Usuario = new Schema({

    nombreUsuario : String, 
    rolID : String, 
    password : String, 
    datos : Datos   
},{
    versionKey: false
});

module.exports = model('Usuario', Usuario, 'Usuario');  
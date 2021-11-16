const {Schema , model} = require('mongoose');

const Usuario = new Schema({

    nombreUsuario : String, 
    rolID : String, 
    password : String, 
    datos : Object   
},{
    versionKey: false
});

module.exports = model('Usuario', Usuario, 'Usuario');  
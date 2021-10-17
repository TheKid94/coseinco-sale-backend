const { Schema, model } = require('mongoose');

const Guia = new Schema({
    codigoPedido: String,
    codigoGuia: String,
    nseries: Array,
    empleadoID: {
        type: String, 
        default: ""
    }, 
    url: {
        type: String, 
        default: "" 
    }
},{
    versionKey:false
});

module.exports = model('Guia', Guia, 'Guia');
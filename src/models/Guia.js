const { Schema, model } = require('mongoose');

const Guia = new Schema({
    pedidoID: String,
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
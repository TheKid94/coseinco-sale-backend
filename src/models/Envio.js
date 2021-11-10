const { Schema, model } = require('mongoose');

const Envio = new Schema({
    pedidoID: String,
    nomEncargado: String,
    constanciaEnvio: {
        type: String,
        default: ""
    },
    fechaEnvio: Date
},{
    versionKey: false
});

module.exports = model('Envio', Envio, 'Envio');
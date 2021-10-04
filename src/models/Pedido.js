const { Schema, model } = require( 'mongoose');

const Pedido = new Schema({
    codigoPedido:String,
    fechaRegistro: Date,
    fechaEntrega: Date,
    precioVenta: Number,
    tipoPago: String,
    observacion: String,
    datos: 
        {
            name: String,
            lastName: String,
            numberDoc: String,
            phoneNumber: String,
            email: String,
            address: String,
            reference: String,
            documentType: String,
            departamento: String, 
            provincia: String,
            distrito: String, 
        },
    estado: String,
});

module.exports = model('Pedido', Pedido, 'Pedido');
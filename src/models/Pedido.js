const { Schema, model } = require( 'mongoose');

const DatosSchema = new Schema({
    name: String,
    lastName: String,
    numberDoc: String,
    phoneNumber: String,
    email: String,
    address: String,
    reference: String,
    documentType: String,
    departamento: String,
    provincia:String,
    distrito:String
}, { _id: false });


const Pedido = new Schema({
    codigoPedido: String,
    fechaRegistro: Date,
    fechaEntrega: Date,
    precioVenta: Number,
    observacion: String,
    datos: DatosSchema,
    estado: String,
},{
    versionKey: false
});

module.exports = model('Pedido', Pedido, 'Pedido');
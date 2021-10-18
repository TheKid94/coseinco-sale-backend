const {Schema , model} = require('mongoose');

const Producto = new Schema({
    marcaID:String,
    nombre: String,
    precio: Number,
    precioCompra:Number,
    stock: Number,
    codigoFabricante: String,
    SKU: String,
    imagenes: Array,
    caracteristica: String
},{
    versionKey: false
});

module.exports = model('Producto', Producto, 'Producto');
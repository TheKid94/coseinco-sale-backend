const {Schema , model} = require('mongoose');

const Producto = new Schema({
    marcaID:String,
    nombre: String,
    precio: Number,
    stock: Number,
    codigoFabricante: String,
    SKU: String,
    imagenes: Array,
    caracteristica: String
});

module.exports = model('Producto', Producto, 'Producto');
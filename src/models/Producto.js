const {Schema , model} = require('mongoose');

const Producto = new Schema({
    marcaID:String,
    categoriaID:String,
    nombre: String,
    precio: Number,
    stock: Number,
    codigoFabricante: String,
    SKU: String,
    imagenes: Array,
    caracteristica: String, 
    estado: String,
},{
    versionKey: false
});

module.exports = model('Producto', Producto, 'Producto');
const Inventario = require('../models/Inventario');
const Producto = require('../models/Producto');
const Marca = require('../models/Marca');

const getSeriesByProductId = async(req,res) => {
    let id = req.params.id;
    try{
        let inventario = await Inventario.findOne({productoID:id});
        if(!inventario){
            return res.status(404).json({
                message: 'No existe'
            })
        }
        res.status(200).json({
            status: 'success',
            nSeries: inventario.nSerie
        })
    }catch(err){
        return res.status(500).json({
            err
        })
    }   
}

const getInventarios = async(req,res)=>{
    let inventarioslist = [];
    try{
        let inventarios = await Inventario.find({});
        for(var i=0; i<inventarios.length;i++){
            let inventarioaux = new Object();
            let producto = await Producto.findById(inventarios[i].productoID);
            let marca = await Marca.findById(producto.marcaID);
            inventarioaux.productoID = producto._id;
            inventarioaux.sku = producto.SKU;
            inventarioaux.imagen = producto.imagenes[0];
            inventarioaux.nombre = producto.nombre;
            inventarioaux.cantidad = inventarios[i].stock;
            inventarioaux.marca = marca.nombre;
            inventarioslist.push(inventarioaux);
        }
        res.status(200).json({
            status: 'success',
            inventarioslist
        })
    }catch(err){
        return res.status(500).json({
            error: err
        })
    }
}

module.exports ={
    getSeriesByProductId,
    getInventarios
}
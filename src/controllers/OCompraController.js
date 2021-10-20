const OCompra = require('../models/OCompra');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');

const getAll = async (req, res) => {
   let oCompras = await OCompra.find({});
   let compras = [];
   try{
       for(var i=0; i<oCompras.length; i++){
           let compraaux = new Object();
           let proveedor = await Proveedor.findById(oCompras[i].proveedorID);
           compraaux.id = oCompras[i]._id;
           compraaux.numeroOC = oCompras[i].numeroOC;
           compraaux.estado = oCompras[i].estado;
           compraaux.total = oCompras[i].total;
           compraaux.fechaEntrega = oCompras[i].fechaEntrega;
           compraaux.proveedor = proveedor.razonSocial;
           compras.push(compraaux);
       }
       res.status(200).json({
           status: 'success',
           compras
       })
   }catch(err){
       res.status(500).json({
           error: err
       })
   }
}

const getOne = async (req, res) => {
    const id = req.params.id;
    let productos =[];
    try{
        let compra = new Object();
        let compraaux = await OCompra.findOne({numeroOC:id});
        compra.numeroOC = compraaux.numeroOC;
        compra.total = compraaux.total;
        for(var i=0;i<compraaux.productos.length;i++){
            let producto = new Object()
            let productoaux = await Producto.findById(compraaux.productos[i].id);
            producto.SKU = productoaux.SKU;
            producto.nombre = productoaux.nombre;
            producto.imagen = productoaux.imagenes[0];
            producto.cantidad = compraaux.productos[i].cantidad;
            producto.subtotal = compraaux.productos[i].subtotal;
            productos.push(producto);
        };
        compra.productos = productos;
        let proveedor = await Proveedor.findById(compra.proveedorID);
        res.status(200).json({
            status:'success',
            compra,
            proveedor
        })
    }catch(err){
        res.status(500).json({
            error: err
        })
    }
};

const createOCompra = async(req, res) =>{
    const ocompra = req.body.ocompra;
    if(Object.keys(ocompra).length == 0){
        return res.status(400).json({
            status: 'warning',
            mensaje: 'Debe ingresar una orden de compra correcta'
        });
    }
    try{
        let compraux = new Object;
        let total = 0.00; 
        let nCompras = await OCompra.find({});
        for(var i=0;i<ocompra.productos.length;i++){
            total += ocompra.productos[i].subtotal;
        }
        compraux.numeroOC = "OC" + `${nCompras.length + 1}`.padStart(5, "0");
        compraux.productos = ocompra.productos;
        compraux.total = total;
        compraux.fechaEntrega = ocompra.fechaEntrega;
        compraux.proveedorID = ocompra.proveedorID;
        compraux.estado = "generado";
        const ocomprares = await OCompra.create(compraux)
        res.status(200).json({
            status: 'success',
            ocomprares
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}


module.exports = {
    getAll,
    getOne,
    createOCompra
}
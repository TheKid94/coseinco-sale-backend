const Pedido = require("../models/Pedido");
const DetallePedido = require("../models/DetallePedido");
const Producto = require("../models/Producto");
const Inventario = require("../models/Inventario");
const Envio = require("../models/Envio");

const getPedidoByNumberDoc = async(req,res)=>{
    let numDoc = req.body.numeroDoc;
    let numPedido = req.body.numeroPedido;
    try
    {
        let pedido = await Pedido.findOne({ codigoPedido: numPedido, 'datos.numberDoc': numDoc});
        let detallePedido = await DetallePedido.findOne({ pedidoID: pedido._id});
        let envioPedido = await Envio.findOne({ pedidoID: pedido._id});
        if(!pedido)
        {
            return res.status(404).json({
                message: 'No existe el pedido o el numero de documento es invalido al pedido'
            })
        }

        res.status(200).json({
            status: 'success',
            pedido,
            productos: detallePedido.productos,
            envio: envioPedido
        })
    }
    catch(error)
    {
        res.status(500).json({
            error
        })
    }
   
}

const getProductoBySKU = async(req,res)=>{
    let sku = req.body.sku;
    try
    {
        let producto = await Producto.findOne({ SKU: sku});
        if(!producto)
        {
            return res.status(404).json({
                message: 'No existe el producto segun el numero sku'
            })
        }
        let inventarioConStock = await Inventario.findOne({ stock: { $gt: 0 }, productoID: producto._id}).exec();
        if(!inventarioConStock)
        {
            return res.status(400).json({
                message: 'El producto no se encuentra disponible'
            })
        }
        res.status(200).json({
            status: 'success',
            producto
        })
    }
    catch(error)
    {
        res.status(500).json({
            error
        })
    }
   
}

const getProductosByCategoriaId = async(req,res)=>{
    let categoriaId = req.body.categoriaId;
    try {
        const inventarioConStock = await Inventario.find({ stock: { $gt: 0 } }, 'productoID').exec();
        const productoIdsConStock = inventarioConStock.map(item => item.productoID);

        const productosDisponibles = await Producto.find({
            categoriaID: categoriaId,
            _id: { $in: productoIdsConStock }
        });

        if (productosDisponibles.length === 0) {
            return res.status(404).json({
                message: 'No hay productos disponibles de acuerdo a la categoría'
            });
        }

        res.status(200).json({
            status: 'success',
            productos: productosDisponibles
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

module.exports = {
    getPedidoByNumberDoc,
    getProductoBySKU,
    getProductosByCategoriaId
  };
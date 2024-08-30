const Pedido = require("../models/Pedido");
const DetallePedido = require("../models/DetallePedido");
const Producto = require("../models/Producto");
const Inventario = require("../models/Inventario");

const getPedidoByNumberDoc = async(req,res)=>{
    let numDoc = req.body.numeroDoc;
    let numPedido = req.body.numeroPedido;
    try
    {
        let pedido = await Pedido.findOne({ codigoPedido: numPedido, 'datos.numberDoc': numDoc});
        let detallePedido = await DetallePedido.findOne({ pedidoID: pedido._id}); 
        if(!pedido)
        {
            return res.status(404).json({
                message: 'No existe el pedido o el numero de documento es invalido al pedido'
            })
        }

        res.status(200).json({
            status: 'success',
            pedido,
            productos: detallePedido.productos
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
                message: 'No existe el producto o el numero de sku es invalido al producto que busca'
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
    try
    {
        let productos = await Producto.find({ categoriaID: categoriaId}); 
        if(productos.length == 0)
        {
            return res.status(404).json({
                message: 'No hay productos'
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

module.exports = {
    getPedidoByNumberDoc,
    getProductoBySKU
  };
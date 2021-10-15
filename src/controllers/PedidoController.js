const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Marca = require('../models/Marca');
const DetallePedido = require('../models/DetallePedido');


const getAll = (req, res)=>{
    Pedido.find({}, (err, pedidos ) => {
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!pedidos){
            return res.status(404).json({
                message: 'No existen los pedidos'
            })
        }

        res.status(200).json({
            status: 'success',
            pedidos
        });
    });
}

const getOne = (req, res) => {

    const id = req.params.id;
    Pedido.findById(id,(err,pedido)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!pedido){
            return res.status(404).json({
                message: 'No existe el pedido'
            })
        }
        res.status(200).json({
            status: 'success',
            pedido
        });
    });

};

const createPedido = async(req,res)=>{
    try{
        let productos = req.body.productos;
        let datos = req.body.datos;
        let nPedidos = await Pedido.find({});
        let newPedido = new Object();
        let newDetallePedido = new Object();
        let items = [];
        let total = 0.00;
        if(productos.length == 0 || Object.keys(datos).length == 0){
            res.status(400).json({
                status: 'error'
            });
            return false;
        }
        newPedido.codigoPedido = "P" + `${nPedidos.length+1}`.padStart(5,"0");
        newPedido.fechaRegistro = Date.now();
        newPedido.fechaEntrega = new Date(Date.now() + 2);
        for(var i=0; i<productos.length; i++){
            let producto = await Producto.findById(productos[i]._id);
            let marcatemp = await Marca.findById(producto.marcaID);
            let itemproducto = new Object();
            itemproducto.productoID = productos[i]._id,
            itemproducto.nombre = producto.nombre;
            itemproducto.marca = marcatemp.nombre;
            itemproducto.SKU = producto.codigoInterno;
            itemproducto.cantidad = productos[i].cantidad,
            itemproducto.preciounitario = producto.precio;
            itemproducto.subtotal = productos[i].cantidad * producto.precio;
            itemproducto.imagen = producto.imagenes[0];
            total += itemproducto.subtotal;
            items.push(itemproducto);
        }
        newPedido.precioVenta = total;
        newPedido.observacion = "No hay observaciones";
        newPedido.estado = "generado";
        newPedido.datos = datos;
        const pedido = await Pedido.create(newPedido);
        newDetallePedido.pedidoID = pedido._id;
        newDetallePedido.productos = items;
        newDetallePedido.totalPrecio = total;
        const dePedido = await DetallePedido.create(newDetallePedido);
        const productosped = dePedido.productos;
        res.status(200).json({
            status: 'success',
            pedido,
            productosped
        });
    }catch(error){
        res.status(500).json({
            error
        });
    }
};

const adminCambioEstado = async(req, res) =>{
    let pedido = await Pedido.findById(req.params.id);
    let newestado = "";
    switch(pedido.estado){
        case "generado":
            newestado = "reservado";
            break;
        case "reservado":
            newestado = "empaquetado";
            break;
        case "empaquetado":
            newestado = "enviado";
            break;
        case "enviado":
            newestado = "finalizado";
            break;
        default:
            newestado = pedido.estado;
            break;
    }
    try{
        await Pedido.findByIdAndUpdate(pedido._id,{estado: newestado});
        res.status(200).json({
            status: 'success'
        });
    }catch(error){
        res.status(500).json({
            error
        });
    }
}

const getPedidoParaReservar = async(req,res)=>{
    let pedidos = await Pedido.find({});
    let pedidosres = [];
    try{
        if(!pedidos){
            return res.status(404).json({
                message: 'No existen los pedidos'
            })
        }
        for(var i=0; i<pedidos.length;i++){
            let pedidoaux = new Object();
            let cantidades = 0;
            pedidoaux.id = pedidos[i]._id;
            pedidoaux.codigo = pedidos[i].codigoPedido;
            pedidoaux.cliente = pedidos[i].datos;
            let detallPedido = await DetallePedido.findOne({pedidoID:pedidos[i]._id});
            for(var j=0;j<detallPedido.productos.length;j++){
                cantidades += detallPedido.productos[j].cantidad;
            }
            pedidoaux.cantidad = cantidades;
            pedidoaux.fechaRegistro = pedidos[i].fechaRegistro;
            pedidoaux.estado = pedidos[i].estado;
            pedidosres.push(pedidoaux);
        }
        res.status(200).json({
            status: 'success',
            pedidosres
        })
    }catch(error){
        res.status(500).json({
            error
        })
    }
}

const getPedidoReservabyId = async(req,res)=>{
    let id = req.body.id;
    res.status(200).json({
        status:'success',
        id
    })
}


module.exports={
    getAll,
    getOne,
    createPedido,
    adminCambioEstado,
    getPedidoParaReservar,
    getPedidoReservabyId,
    getPedidoReservaConsulta
}
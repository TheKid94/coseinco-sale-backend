const Pedido = require("../models/Pedido");
const Producto = require("../models/Producto");
const Marca = require("../models/Marca");
const DetallePedido = require("../models/DetallePedido");
const Guia = require("../models/Guia");
const OCompra = require("../models/OCompra");
const Rol = require("../models/Rol");
const Usuario = require("../models/Usuario");
const Inventario = require("../models/Inventario");
const Envio = require("../models/Envio");

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const getAll = (req, res) => {
  Pedido.find({}, (err, pedidos) => {
    if (err) {
      return res.status(500).json({
        message: `Error al realizar la peticion: ${err}`,
      });
    }

    if (!pedidos) {
      return res.status(404).json({
        message: "No existen los pedidos",
      });
    }

    res.status(200).json({
      status: "success",
      pedidos,
    });
  });
};

const getOne = (req, res) => {
  const id = req.params.id;
  Pedido.findById(id, (err, pedido) => {
    if (err) {
      return res.status(500).json({
        message: `Error al realizar la peticion ${err}`,
      });
    }
    if (!pedido) {
      return res.status(404).json({
        message: "No existe el pedido",
      });
    }
    res.status(200).json({
      status: "success",
      pedido,
    });
  });
};

const createPedido = async (req, res) => {
  try {
    let productos = req.body.productos;
    let datos = req.body.datos;
    let nPedidos = await Pedido.find({});
    let newPedido = new Object();
    let newDetallePedido = new Object();
    let items = [];
    let total = 0.0;
    if (productos.length == 0 || Object.keys(datos).length == 0) {
      res.status(400).json({
        status: "error",
      });
      return false;
    }
    newPedido.codigoPedido = "P" + `${nPedidos.length + 1}`.padStart(5, "0");
    newPedido.fechaRegistro = new Date();
    newPedido.fechaEntrega = new Date(Date.now() + 2*24*3600*1000)
    for (var i = 0; i < productos.length; i++) {
      let producto = await Producto.findById(productos[i]._id);
      let marcatemp = await Marca.findById(producto.marcaID);
      let itemproducto = new Object();
      itemproducto.productoID = productos[i]._id,
      itemproducto.nombre = producto.nombre;
      itemproducto.marca = marcatemp.nombre;
      itemproducto.SKU = producto.SKU;
      itemproducto.cantidad = parseInt(productos[i].cantidad),
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
      status: "success",
      pedido,
      productosped,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

const adminCambioEstado = async (req, res) => {
  let pedido = await Pedido.findById(req.params.id);
  let newestado = "";
  switch (pedido.estado) {
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
  try {
    await Pedido.findByIdAndUpdate(pedido._id, { estado: newestado });
    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

const EnviarPedido = async(req, res) =>{
  let codigoPedido = req.body.codigo;
  let docConfirm = req.body.doc;
  try{
    let pedido = await Pedido.findOne({codigoPedido: codigoPedido});
    await Pedido.findOneAndUpdate({codigoPedido:codigoPedido}, {estado:"finalizado"})
    await Envio.findOneAndUpdate({pedidoID: pedido._id},{constanciaEnvio: docConfirm})
    res.status(200).json({
      status: "success",
    });
  }catch(err){
    res.status(500).json({
      error: err
    })
  }
}

const ConstanciaEnviotoURL = async(req, res) => {
  const file = req.body.file;
  const npedido = req.body.npedido;
  let pedido = await Pedido.findOne({codigoPedido:npedido});
  const result = await cloudinary.v2.uploader.upload(file,{folder:`Coseinco/Pedidos/${pedido.codigoPedido}`});
  res.status(200).json({
      status: 'success',
      url: result.url
  }); 
}

const getPedidoParaReservar = async (req, res) => {
  let pedidos = await Pedido.find({});
  let pedidosres = [];
  try {
    if (!pedidos) {
      return res.status(404).json({
        message: "No existen los pedidos",
      });
    }
    for (var i = 0; i < pedidos.length; i++) {
      let pedidoaux = new Object();
      let cantidades = 0;
      pedidoaux.id = pedidos[i]._id;
      pedidoaux.codigo = pedidos[i].codigoPedido;
      pedidoaux.cliente = pedidos[i].datos;
      let detallPedido = await DetallePedido.findOne({
        pedidoID: pedidos[i]._id,
      });
      for (var j = 0; j < detallPedido.productos.length; j++) {
        cantidades += detallPedido.productos[j].cantidad;
      }
      pedidoaux.cantidad = cantidades;
      pedidoaux.fechaRegistro = pedidos[i].fechaRegistro;
      pedidoaux.estado = pedidos[i].estado;
      let guiaaux = await Guia.findOne({codigoPedido: pedidos[i].codigoPedido});
      let url = (!guiaaux) ? "":guiaaux.url;
      pedidoaux.url = url;
      pedidosres.push(pedidoaux);
    }
    res.status(200).json({
      status: "success",
      pedidosres,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

const getPedidoReservabyId = async(req,res)=>{
    let id = req.body.id;
    if(Object.keys(id).length == 0)
    {
        res.status(400).json({
            status: 'error'
        });
        return false;
    }

    try
    {
        let pedido = await Pedido.findOne({codigoPedido: id}); 
        if(!pedido)
        {
            return res.status(404).json({
                message: 'No existe el pedido'
            })
        }

        let detallePedido = await DetallePedido.findOne({pedidoID: pedido._id});         
      
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

const GetDashboardPedidos = async(req,res) =>{
  try{
    let pedidos = await Pedido.find({});
    let compras = await OCompra.find({});
    let usuarios = await Usuario.find({});
    let inventarios = await Inventario.find({});
    let donutPedidos = GetDonutPedidos(pedidos);
    let donutCompras = GetDonutCompras(compras);
    let clientes = await GetClientes(usuarios);
    let ordenes = GetOrdenes(compras);
    let ventasDelDia = VentasDia(pedidos);
    let pedidosPorEnviar = PedidosPorEnviar(pedidos);
    let inventarioLow = await GetInventarioLowStock(inventarios);
    res.status(200).json({
      clientes,
      ordenes,
      ventasDelDia,
      pedidosPorEnviar,
      inventarioLow,
      donutPedidos,
      donutCompras
    })
  } 
  catch(error)
  {
    res.status(500).json({
      error
    })
  }
}


const GetDonutPedidos = (pedidos)=>{
  let donutPedidos = new Object();
  let pedidoGenerado = 0;
  let pedidoReservado = 0;
  let pedidoEmpaquetado = 0;
  let pedidoEnviado = 0;
  let pedidoFinalizado = 0;
  for(var i=0; i<pedidos.length;i++){
    switch(pedidos[i].estado){
      case "generado":
        pedidoGenerado++;
        break;
      case "reservado":
        pedidoReservado++;
        break;
      case "empaquetado":
        pedidoEmpaquetado++;
        break;
      case "enviado":
        pedidoEnviado++;
        break;
      case "finalizado":
        pedidoFinalizado++;
        break;
    }
  }
  donutPedidos.pedidoGenerado = pedidoGenerado;
  donutPedidos.pedidoReservado = pedidoReservado;
  donutPedidos.pedidoEmpaquetado = pedidoEmpaquetado;
  donutPedidos.pedidoEnviado = pedidoEnviado;
  donutPedidos.pedidoFinalizado = pedidoFinalizado;
  return donutPedidos;
}

const GetDonutCompras = (compras)=>{
  let donutCompras = new Object();
  let compraCotizado = 0;
  let compraProcesado = 0;
  let compraAnulado = 0;
  let compraFinalizado = 0;
  for(var i=0; i<compras.length;i++){
    switch(compras[i].estado){
      case "cotizado":
        compraCotizado++;
        break;
      case "procesado":
        compraProcesado++;
        break;
      case "finalizado":
        compraFinalizado++;
        break;
      case "anulado":
        compraAnulado++;
        break;
    }
  }
  donutCompras.compraCotizado = compraCotizado;
  donutCompras.compraProcesado = compraProcesado;
  donutCompras.compraAnulado = compraAnulado;
  donutCompras.compraFinalizado = compraFinalizado;
  return donutCompras;
}

const GetClientes = async(usuarios) =>{
  let rol = await Rol.findOne({nombre:"Cliente"}).exec();
  let clientes = 0;
  for(var i=0; i<usuarios.length;i++){
    if(usuarios[i].rolID == rol._id){
      clientes++;
    }
  }
  return clientes;
}

const GetOrdenes = (compras) => {
  let ordenes =0;
  for(var i=0; i<compras.length;i++){
    if(compras[i].estado == "procesado"){
      ordenes++;
    }
  }
  return ordenes;
}

const PedidosPorEnviar = (pedidos) =>{
  let porEnviar =0;
  for(var i=0; i<pedidos.length;i++){
    if(pedidos[i].estado == "empaquetado"){
      porEnviar++;
    }
  }
  return porEnviar;
}

const VentasDia = (pedidos) =>{
  let ventas = 0.00;
  let hoy = new Date();
  for(var i=0; i<pedidos.length;i++){
    let pedidoRegis = pedidos[i].fechaRegistro;
    if(pedidoRegis.getMonth() == hoy.getMonth() && pedidoRegis.getDate() == hoy.getDate() && pedidoRegis.getFullYear()==hoy.getFullYear()){
      ventas = ventas + pedidos[i].precioVenta;
    }
  }
  return ventas;
}

const GetInventarioLowStock = async(inventarios) =>{
  let productos = [];
  for(var i=0;i<inventarios.length;i++){
    if(inventarios[i].stock <= 4){
      let productoLow = new Object();
      let producto = await Producto.findById(inventarios[i].productoID);
      productoLow.imagen = producto.imagenes[0];
      productoLow.nombre = producto.nombre;
      productoLow.stock = inventarios[i].stock;
      productoLow.venta = producto.precio;
      productos.push(productoLow);
    }
  }
  return productos;
}

module.exports = {
  getAll,
  getOne,
  createPedido,
  adminCambioEstado,
  getPedidoParaReservar,
  getPedidoReservabyId,
  GetDashboardPedidos,
  EnviarPedido,
  ConstanciaEnviotoURL
};


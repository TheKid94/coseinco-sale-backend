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
const MovimientoSalida = require('../models/MovimientoSalida');

const fs = require('fs');
const path = require('path');
const utils = require('util');
const puppeteer = require('puppeteer');
const hb = require('handlebars');
const readFile = utils.promisify(fs.readFile);
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

var postmark = require("postmark");
var client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

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
    const { productos, datos } = req.body;
    
    // Validación de entrada
    if (!productos || productos.length === 0 || !datos || Object.keys(datos).length === 0) {
      return res.status(400).json({ status: "error", message: "Datos de entrada inválidos" });
    }

    const nPedidos = await Pedido.countDocuments();
    
    // Inicialización del pedido
    const newPedido = {
      codigoPedido: `P${(nPedidos + 1).toString().padStart(5, "0")}`,
      fechaRegistro: new Date(),
      fechaReserva: null,
      fechaEmpaquetado: null,
      fechaEntrega: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      precioVenta: 0,
      observacion: "No hay observaciones",
      estado: "generado",
      datos: datos,
      files: []
    };

    const items = [];
    let total = 0;

    // Obtención de detalles del producto y cálculo del total
    for (const item of productos) {
      const producto = await Producto.findById(item._id).populate('marcaID', 'nombre');
      if (!producto) {
        return res.status(404).json({ status: "error", message: `Producto no encontrado: ${item._id}` });
      }

      const itemproducto = {
        productoID: producto._id,
        nombre: producto.nombre,
        marca: producto.marcaID.nombre,
        SKU: producto.SKU,
        cantidad: parseInt(item.cantidad),
        preciounitario: producto.precio,
        subtotal: parseInt(item.cantidad) * producto.precio,
        imagen: producto.imagenes[0]
      };

      total += itemproducto.subtotal;
      items.push(itemproducto);
    }

    newPedido.precioVenta = total;

    // Creación del pedido y detalle
    const pedido = await Pedido.create(newPedido);
    const newDetallePedido = {
      pedidoID: pedido._id,
      productos: items,
      totalPrecio: total
    };
    const detallePedido = await DetallePedido.create(newDetallePedido);

    // Generación de archivo PDF y envío por correo
    let filePago = await generarFilePago(pedido, detallePedido);

    pedido.files.push(filePago);
    
    res.status(200).json({
      status: "success",
      pedido,
      productos: items
    });
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

const generarFilePago = async (pedido, detallePedido) => {
  try {
    const resp = await getTemplatePagoHtml();
    let reshtml = resp;
    let prod = "";

    const fechaReg = pedido.fechaRegistro;
    const fechaEnt = pedido.fechaEntrega;

    reshtml = reshtml.replace('#TipoDeDoc', pedido.datos.documentType == 'RUC' ? 'Factura de Venta' : 'Boleta de Venta');
    reshtml = reshtml.replace('#CodigoVenta', pedido.codigoPedido);
    reshtml = reshtml.replace('#FechaRegistro', `${fechaReg.getDate()}/${fechaReg.getMonth() + 1}/${fechaReg.getFullYear()}`);
    reshtml = reshtml.replace('#FechaLlegada', `${fechaEnt.getDate()}/${fechaEnt.getMonth() + 1}/${fechaEnt.getFullYear()}`);
    reshtml = reshtml.replace('#Cliente', `${pedido.datos.name} ${pedido.datos.lastName}`);
    reshtml = reshtml.replace('#Correo', pedido.datos.email);
    reshtml = reshtml.replace('#TipoDocumento', pedido.datos.documentType);
    reshtml = reshtml.replace('#NumDocumento', pedido.datos.numberDoc);

    detallePedido.productos.forEach(producto => {
      prod += `<tr class="item"><td>${producto.nombre}</td><td>${producto.SKU}</td><td>${producto.cantidad}</td><td>$ ${producto.subtotal.toFixed(2)}</td></tr>`;
    });

    let opGrav = parseFloat((detallePedido.totalPrecio / 1.18).toFixed(2));
    let igv = parseFloat((detallePedido.totalPrecio - opGrav).toFixed(2));
    let total = parseFloat(detallePedido.totalPrecio.toFixed(2));
    reshtml = reshtml.replace('#Productos', prod);
    reshtml = reshtml.replace('#OpGravadas', `<strong style="float: right; margin-right: 45px;">Op.Gravadas: $ ${opGrav.toFixed(2)}</strong>`);
    reshtml = reshtml.replace('#IGV', `<strong style="float: right; margin-right: 45px;">IGV: $ ${igv.toFixed(2)}</strong>`);
    reshtml = reshtml.replace('#Total', `<strong style="float: right; margin-right: 45px;">Total: $ ${total.toFixed(2)}</strong>`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(reshtml);
    const pathfile = `src/public/${pedido.codigoPedido}.pdf`;
    await page.pdf({ path: pathfile, format: 'A4' });

    const resultcloud = await cloudinary.uploader.upload(pathfile, { folder: `Coseinco/Ventas/Boleta/${pedido.codigoPedido}` });
    await Pedido.findOneAndUpdate({ _id: pedido._id }, { $push: { files: resultcloud.url } });

    const pdfContent = fs.readFileSync(pathfile).toString('base64');

    await client.sendEmail({
      From: "gustavo.troncos@urp.edu.pe",
      To: pedido.datos.email,
      Subject: `Generación de Boleta de Venta ${pedido.codigoPedido}`,
      HtmlBody: reshtml,
      MessageStream: "broadcast",
      Attachments: [
        {
          Name: `${pedido.codigoPedido}.pdf`,
          Content: pdfContent,
          ContentType: 'application/pdf'
        }
      ]
    });

    fs.unlink(pathfile, (err) => {
      if (err) {
        console.error("Error al eliminar el archivo PDF:", err);
      }
    });

    return resultcloud.url;
  } catch (err) {
    console.error("Error en generarFilePago:", err);
    throw new Error(err.message);
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
    const resultado = await MovimientoSalida.updateMany(
      { pedidoID: pedido._id }, // Condición
      { $set: { archivosAdjuntos: docConfirm } } // Actualización
  );

    await Pedido.findOneAndUpdate({codigoPedido:codigoPedido}, {estado:"finalizado", fechaEntrega: new Date()})
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
  try {
    // Obtener parámetros de paginación de la solicitud
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const type = parseInt(req.query.type, 10) || 1;
    const name = req.query.name || '';

    if( type > 2){
      return res.status(404).json({
        message: "El tipo solicitado no es válido.",
      });
    }

    // Calcular el número de documentos a saltar
    const skip = (page - 1) * limit;

    // Construir el filtro por estado
    const filtro = {};
    if (type == 1) {
      filtro.estado = { $in: ['generado', 'reservado', 'empaquetado'] }; // Flujo reserva
    } else if (type == 2) {
      filtro.estado = { $in: ['empaquetado', 'enviado', 'finalizado'] }; // Flujo envio
    }

    if (name && name.trim() !== '') {
      // Crear expresión regular para la búsqueda insensible a mayúsculas/minúsculas
      const regex = new RegExp(name, 'i');
      
      // Agregar el filtro de nombre y apellido al filtro existente
      filtro.$or = [
        { 'datos.name': { $regex: regex } },
        { 'datos.lastName': { $regex: regex } }
      ];
    }

    // Obtener los pedidos con paginación
    const pedidos = await Pedido.find(filtro)
      .skip(skip)
      .limit(limit)
      .sort({ fechaRegistro: 1 }); //orden ascendente, -1 para descendente

    if (!pedidos.length) {
      return res.status(404).json({
        cod: 1,
        message: "No se ha encontrado pedidos",
      });
    }

    // Procesar los pedidos
    const pedidosres = [];
    for (const pedido of pedidos) {
      const pedidoaux = {};
      let cantidades = 0;

      pedidoaux.id = pedido._id;
      pedidoaux.codigo = pedido.codigoPedido;
      pedidoaux.cliente = pedido.datos;

      const detallPedido = await DetallePedido.findOne({
        pedidoID: pedido._id,
      });

      for (const producto of detallPedido.productos) {
        cantidades += producto.cantidad;
      }

      pedidoaux.cantidad = cantidades;
      pedidoaux.fechaRegistro = pedido.fechaRegistro;
      pedidoaux.fechaReserva = pedido.fechaReserva;
      pedidoaux.fechaEmpaquetado = pedido.fechaEmpaquetado;
      pedidoaux.fechaEntrega = pedido.fechaEntrega;
      pedidoaux.estado = pedido.estado;

      const guiaaux = await Guia.findOne({codigoPedido: pedido.codigoPedido});
      const envioaux = await Envio.findOne({pedidoID: pedido._id});

      pedidoaux.url = guiaaux ? guiaaux.url : "";
      pedidoaux.constanciaEnvio = envioaux ? envioaux.constanciaEnvio : "";
      pedidoaux.fechaEnvio = envioaux ? envioaux.fechaEnvio : "";

      pedidosres.push(pedidoaux);
    }

    // Obtener el total de pedidos para calcular la paginación
    const totalPedidos = await Pedido.countDocuments(filtro).exec();
    const totalPages = Math.ceil(totalPedidos / limit);

    // Responder con los datos y la información de paginación
    res.status(200).json({
      status: "success",
      pedidosres,
      pagination: {
        totalItems: totalPedidos,
        currentPage: page,
        totalPages,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
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
    const [pedidos, usuarios, inventarios] = await Promise.all([
      Pedido.find({}),
      Usuario.find({}),
      Inventario.find({})
    ]);
    let donutPedidos = GetDonutPedidos(pedidos);
    let clientes = await GetClientes(usuarios);
    let ventasDelDia = VentasDia(pedidos);
    let pedidosPorEnviar = PedidosPorEnviar(pedidos);
    let inventarioLow = await GetInventarioLowStock(inventarios);
    const ventasPorMes = await GetVentasUltimosMeses(pedidos);
    res.status(200).json({
      clientes,
      ventasDelDia,
      pedidosPorEnviar,
      inventarioLow,
      donutPedidos,
      ventasPorMes
    })
  } 
  catch(error)
  {
    res.status(500).json({
      error
    })
  }
}

const GetVentasUltimosMeses = async (pedidos, meses = 5) =>{
  
  const today = new Date();
  const firstDayOfFourMonthsAgo = new Date(today.getFullYear(), today.getMonth() - (meses - 1), 1);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const fecha = new Date(pedido.fechaRegistro);
    return fecha >= firstDayOfFourMonthsAgo && fecha < today;
  });

  const ventasPorMes = pedidosFiltrados.reduce((acc, pedido) => {
    const fecha = new Date(pedido.fechaRegistro);
    const mes = fecha.toLocaleString('default', { month: 'short' }).replace('.', ''); 
    if (!acc[mes]) acc[mes] = 0;
    acc[mes] += pedido.precioVenta; 
    return acc;
  }, {});

  const resultado = Object.entries(ventasPorMes).map(([mes, total]) => [
    mes,
    parseFloat(total.toFixed(2))
  ]);

  return resultado;
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

// const GetDonutCompras = (compras)=>{
//   let donutCompras = new Object();
//   let compraCotizado = 0;
//   let compraProcesado = 0;
//   let compraAnulado = 0;
//   let compraFinalizado = 0;
//   for(var i=0; i<compras.length;i++){
//     switch(compras[i].estado){
//       case "cotizado":
//         compraCotizado++;
//         break;
//       case "procesado":
//         compraProcesado++;
//         break;
//       case "finalizado":
//         compraFinalizado++;
//         break;
//       case "anulado":
//         compraAnulado++;
//         break;
//     }
//   }
//   donutCompras.compraCotizado = compraCotizado;
//   donutCompras.compraProcesado = compraProcesado;
//   donutCompras.compraAnulado = compraAnulado;
//   donutCompras.compraFinalizado = compraFinalizado;
//   return donutCompras;
// }

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

// const GetOrdenes = (compras) => {
//   let ordenes =0;
//   for(var i=0; i<compras.length;i++){
//     if(compras[i].estado == "procesado"){
//       ordenes++;
//     }
//   }
//   return ordenes;
// }

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

async function getTemplatePagoHtml() {
    
  console.log("Loading template file in memory")
  try {
  const invoicePath = path.resolve("src/public/templates/pago.html");
  return await readFile(invoicePath, 'utf8');
  } catch (err) {
  return Promise.reject("Could not load html template");
  }
  
}

// const generarPagoDoc = async(req, res)=>{
//   let npedido = req.body.npedido;
//   try{
//       let pedido = await Pedido.findOne({ codigoPedido: npedido });
//       let detallePedido = await DetallePedido.findOne({ pedidoID: pedido._id });
//       let dataMail = {};

//       let resp = await getTemplatePagoHtml();
//       let prod = "";
//       let reshtml = resp;

//       let fechaReg = pedido.fechaRegistro;
//       let diaReg = fechaReg.getDate();
//       let mesReg = fechaReg.getMonth();
//       let anioReg = fechaReg.getFullYear();

//       let fechaEnt = pedido.fechaEntrega;
//       let diaEnt = fechaEnt.getDate();
//       let mesEnt = fechaEnt.getMonth();
//       let anioEnt = fechaEnt.getFullYear();

//       const total = '<strong style="float: right; margin-right: 45px;">' + 'Total: ' + detallePedido.totalPrecio + '</strong> ';

//       reshtml = reshtml.replace('#CodigoVenta', pedido.codigoPedido);
//       reshtml = reshtml.replace('#FechaRegistro', `${diaReg + 1}/${mesReg + 1}/${anioReg}`);
//       reshtml = reshtml.replace('#FechaLlegada', `${diaEnt + 1}/${mesEnt + 1}/${anioEnt}`);
//       reshtml = reshtml.replace('#Cliente', `${pedido.datos.name} ${pedido.datos.lastName}`);
//       reshtml = reshtml.replace('#Correo', `${pedido.datos.email}`);
//       reshtml = reshtml.replace('#TipoDocumento', `${pedido.datos.documentType}`);
//       reshtml = reshtml.replace('#NumDocumento', `${pedido.datos.numberDoc}`);

//       for (var i = 0; i < detallePedido.productos.length; i++) {
//           prod += '<tr class="item">';
//           prod += `<td>${detallePedido.productos[i].nombre}</td>`;
//           prod += `<td style="text-align: left !important;">${detallePedido.productos[i].SKU}</td>`;
//           prod += `<td>${detallePedido.productos[i].cantidad}</td>`;
//           prod += `<td>${detallePedido.productos[i].subtotal}</td>`;
//           prod += '</tr>';
//       }

//       reshtml = reshtml.replace('#Productos', prod);
//       reshtml = reshtml.replace('#Total', total);

//       const template = hb.compile(reshtml, { strict: true });
//       let result = template(dataMail);
//       let html = result;

//       const browser = await puppeteer.launch();
//       const page = await browser.newPage();
//       await page.setContent(html);

//       let pathfile = `src/public/${pedido.codigoPedido}.pdf`;
//       await page.pdf({ path: pathfile, format: 'A4' });

//       const resultcloud = await cloudinary.uploader.upload(pathfile, { folder: `Coseinco/Ventas/Boleta/${pedido.codigoPedido}` });
//       await browser.close();

//       fs.unlink(pathfile, (err) => {
//           if (err) {
//               res.status(500).json({ error: err });
//           }
//       });

//       const pdfContent = fs.readFileSync(pathfile).toString('base64');
//       await Pedido.findOneAndUpdate({ codigoPedido: pedido.codigoPedido }, { $push: { files: resultcloud.url } });

//       client.sendEmail({
//           "From": "gustavo.troncos@urp.edu.pe",
//           "To": pedido.datos.email,
//           "Subject": `Generación de Boleta de Venta ${pedido.codigoPedido}`,
//           "HtmlBody": reshtml,
//           "MessageStream": "broadcast",
//           "Attachments": [
//               {
//                   "Name": `${pedido.codigoPedido}.pdf`,
//                   "Content": pdfContent,
//                   "ContentType": 'application/pdf'
//               }
//           ]
//         }, (error, result) => {
//           if (error) {
//               res.status(500).json({ error: error.message });
//           } else {
//               res.status(200).json({ status: 'success', message: 'Email sent successfully!' });
//           }
//       });

//   }catch(err){
//       res.status(500).json({
//           error: err.message
//       });
//   }
// }



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


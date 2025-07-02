const Envio = require('../models/Envio');
const Guia = require('../models/Guia');
const Inventario = require('../models/Inventario');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const MovimientoSalida = require('../models/MovimientoSalida');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const hb = require('handlebars');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const utils = require('util');
const readFile = utils.promisify(fs.readFile);

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const postmark = require("postmark");
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const createEnvio = async(req, res) => {
    try{
        let pedidoID = req.body.pedidoID;
        let pedido = await Pedido.findById(pedidoID);
        let detallePedido = await DetallePedido.findOne({pedidoID: pedidoID});
        let guia = await Guia.findOne({codigoPedido: pedido.codigoPedido});

        let movimientoSalidaList = [];

        for(var i=0;i<guia.nseries.length;i++){
            let inventario = await Inventario.findOne({productoID: guia.nseries[i].productoID});
            let arrayInv = inventario.nSerie;

            for(var j=0; j<guia.nseries[i].serialNumbers.length;j++){
                arrayInv = arrayInv.filter(function (obj){
                    return obj.nroSerie !== guia.nseries[i].serialNumbers[j];
                });
            }

            let disp = 0;
            for(var k=0; k<arrayInv.length;k++){
                if(arrayInv[k].estado == "habilitado"){
                    disp++;
                }
            }

            await Inventario.findOneAndUpdate({productoID: guia.nseries[i].productoID},{nSerie:arrayInv,stock: disp});

            //Movimiento
            let productoTempID = guia.nseries[i].productoID;
            let serialNumbersArray = guia.nseries[i].serialNumbers;
            let movimiento = new Object();
            movimiento.archivosAdjuntos = "";
            movimiento.fechaCreacion = Date.now();
            movimiento.pedidoID = pedidoID;
            movimiento.productoID = productoTempID;

            const productoTempObjectID = ObjectId(productoTempID);
            const productosFiltrados = detallePedido.productos.filter(x => {
                return x.productoID.equals(productoTempObjectID);
            });
            const resultados = productosFiltrados.map(x => ({
                subtotal: x.subtotal,
                preciounitario: x.preciounitario
            }));

            movimiento.datos = serialNumbersArray;
            movimiento.precioUnitario = resultados[0].preciounitario || 0.00;
            movimiento.precioVentaTotal = resultados[0].subtotal || 0.00;

            movimientoSalidaList.push(movimiento);
        }
        let archivoRemision = await ProcesarGuiaRemisionUrl(guia, pedido);
        await MovimientoSalida.insertMany(movimientoSalidaList);

        let nomEncargado = req.body.nomEncargado;
        let envio = new Object();
        envio.pedidoID = pedidoID;
        envio.nomEncargado = nomEncargado;
        envio.fechaEnvio = Date.now();
        console.log(pedido);
        await NotificarClienteEnvio(pedido, archivoRemision);
        let envioNew = await Envio.create(envio);
        await Pedido.findOneAndUpdate({_id: pedidoID}, {estado:"enviado"});
        res.status(201).json({
            status: 'success',
            envioNew
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}

async function getTemplateMessageEnvioHtml(){
    console.log("Loading template file in memory");
    try {
      const invoicePath = path.resolve("src/public/templates/messageEnvio.html");
      return await readFile(invoicePath, 'utf8');
    } catch (err) {
      throw new Error("Could not load html template");
    }
}

async function getTemplateGuiaRemisionEnvioHtml(){
    console.log("Loading template file in memory");
    try {
      const invoicePath = path.resolve("src/public/templates/guiaEnvioRemision.html");
      return await readFile(invoicePath, 'utf8');
    } catch (err) {
      throw new Error("Could not load html template");
    }
}

const ProcesarGuiaRemisionUrl = async(guia, pedido) => {
    const templateHtml = await getTemplateGuiaRemisionEnvioHtml();
    let productos = await Promise.all(
        guia.nseries.map(async (serie) => {
            const producto = await Producto.findById(serie.productoID);
            const serialNumbers = serie.serialNumbers.join('; ');
            return `
            <tr class="item">
                <td>${producto.nombre}</td>
                <td style="text-align: left !important;">${producto.SKU}</td>
                <td>${serie.serialNumbers.length}</td>
                <td>${serialNumbers}</td>
            </tr>
            `;
        })
        );
        
    const date = new Date();
    const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const templateData = {
    '#CodGuia': guia.codigoGuia,
    '#FechaRegistro': fecha,
    '#Cliente': `${pedido.datos.name} ${pedido.datos.lastName}`,
    '#CorreoCliente': pedido.datos.email,
    '#CodigoPedido': pedido.codigoPedido,
    '#Productos': productos.join(''),
    };
    
    const reshtml = replaceTemplateVars(templateHtml, templateData);
    const template = hb.compile(reshtml, { strict: true });
    const html = template({});

    // Generar el PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    const pathfile = `src/public/${guia.codigoGuia}.pdf`;
    await page.pdf({ path: pathfile, format: 'A4' });

    const resultcloud = await cloudinary.v2.uploader.upload(pathfile, {
    folder: `Coseinco/Guia/${guia.codigoGuia}`
    });

    await Guia.findOneAndUpdate(
        { codigoPedido: pedido.codigoPedido },
        { "url": resultcloud.url }
        );

    const pdfContent = fs.readFileSync(pathfile).toString('base64');
    return pdfContent;
}

const replaceTemplateVars = (template, data) => {
    return Object.keys(data).reduce((updatedTemplate, key) => {
      return updatedTemplate.replace(key, data[key]);
    }, template);
};

const NotificarClienteEnvio = async (pedido, archivoRemision) => {
    const messageEnvio = await getTemplateMessageEnvioHtml();
    await client.sendEmail({
        From: "gustavo.troncos@urp.edu.pe",
        To: pedido.datos.email,
        Subject: `Envio de pedido ${pedido.codigoPedido}`,
        HtmlBody: messageEnvio,
        MessageStream: "broadcast",
        Attachments: [
            {
                Name: `${pedido.codigoPedido}.pdf`,
                Content: archivoRemision,
                ContentType: 'application/pdf'
            }
            ]
    });
};

module.exports = {
    createEnvio
}
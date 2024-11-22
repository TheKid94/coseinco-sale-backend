const Envio = require('../models/Envio');
const Guia = require('../models/Guia');
const Inventario = require('../models/Inventario');
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const MovimientoSalida = require('../models/MovimientoSalida');
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const fs = require('fs');
const path = require('path');
const utils = require('util');
const readFile = utils.promisify(fs.readFile);

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

        await MovimientoSalida.insertMany(movimientoSalidaList);

        let nomEncargado = req.body.nomEncargado;
        let envio = new Object();
        envio.pedidoID = pedidoID;
        envio.nomEncargado = nomEncargado;
        envio.fechaEnvio = Date.now();
        console.log(pedido);
        await NotificarClienteEnvio(pedido);
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

const NotificarClienteEnvio = async (pedido) => {
    const messageEnvio = await getTemplateMessageEnvioHtml();
    await client.sendEmail({
        From: "gustavo.troncos@urp.edu.pe",
        To: pedido.datos.email,
        Subject: `Envio de pedido ${pedido.codigoPedido}`,
        HtmlBody: messageEnvio,
        MessageStream: "broadcast"
    });
};

module.exports = {
    createEnvio
}
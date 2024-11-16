const Envio = require('../models/Envio');
const Guia = require('../models/Guia');
const Inventario = require('../models/Inventario');
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const MovimientoSalida = require('../models/MovimientoSalida');

const createEnvio = async(req, res) => {
    try{
        let pedidoID = req.body.pedidoID;
        let pedido = await Pedido.findById(pedidoID);
        let detallePedido = await DetallePedido.findOne({pedidoID: pedidoID});
        let guia = await Guia.findOne({codigoPedido: pedido.codigoPedido});

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
        }

        //PRUEBA MOVIMIENTO SALIDA
        const detallePedidoMapeado = detallePedido.productos.map(({ productoID, cantidad, preciounitario }) => ({
            productoID,
            cantidad,
            preciounitario
        }));

        let movimiento = new Object();
        movimiento.datos = detallePedidoMapeado;
        movimiento.fechaCreacion = Date.now();
        movimiento.pedidoID = pedidoID;
        movimiento.precioVentaTotal = detallePedido.totalPrecio;
        movimiento.archivosAdjuntos = "";

        await MovimientoSalida.create(movimiento);
        //END MOVIMIENTO SALIDA

        let nomEncargado = req.body.nomEncargado;
        let envio = new Object();
        envio.pedidoID = pedidoID;
        envio.nomEncargado = nomEncargado;
        envio.fechaEnvio = Date.now();
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

module.exports = {
    createEnvio
}
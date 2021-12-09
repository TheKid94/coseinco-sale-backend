const Envio = require('../models/Envio');
const Guia = require('../models/Guia');
const Inventario = require('../models/Inventario');
const Pedido = require('../models/Pedido');

const createEnvio = async(req, res) => {
    try{
        let pedidoID = req.body.pedidoID;
        let pedido = await Pedido.findById(pedidoID);
        let guia = await Guia.findOne({codigoPedido: pedido.codigoPedido});
        for(var i=0;i<guia.nseries.length;i++){
            let inventario = await Inventario.findOne({productoID: guia.nseries[i].productoID});
            let arrayInv = inventario.nSerie;
            for(var j=0; j<guia.nseries[i].serialNumbers.length;j++){
                arrayInv = arrayInv.filter(function (obj){
                    return obj.numero !== guia.nseries[i].serialNumbers[j];
                });
            }
            let disp = 0;
            for(var k=0; k<arrayInv.length;k++){
                if(arrayInv[k].estado == "habilitado"){
                    disp++;
                }
            }
            await Inventario.findOneAndUpdate({productoID: guia.nseries[i].productoID},{nSerie:arrayInv,stock: disp})
        }
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
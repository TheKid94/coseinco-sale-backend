const Envio = require('../models/Envio');
const Pedido = require('../models/Pedido');

const createEnvio = async(req, res) => {
    try{
        let pedidoID = req.body.pedidoID;
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
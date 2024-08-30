const Pedido = require("../models/Pedido");

const getPedidoByNumberDoc = async(req,res)=>{
    let numDoc = req.body.numeroDoc;
    let numPedido = req.body.numeroPedido;
    try
    {
        let pedido = await Pedido.findOne({ codigoPedido: numPedido, 'datos.numberDoc': numDoc}); 
        if(!pedido)
        {
            return res.status(404).json({
                message: 'No existe el pedido o el numero de documento es invalido al pedido'
            })
        }

        res.status(200).json({
            status: 'success',
            pedido
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
    getPedidoByNumberDoc
  };
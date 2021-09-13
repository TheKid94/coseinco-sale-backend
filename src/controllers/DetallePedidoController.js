const DetallePedido = require('../models/DetallePedido');

const getAll = (req, res) => {
    DetallePedido.find({},(err, detallePedidos) =>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!detallePedidos){
            return res.status(404).json({
                message: 'No existen los detalles de los pedidos'
            })
        }
        res.status(200).json({
            status: 'success',
            detallePedidos
        });
    });
}

const getOne = (req, res) => {
    const id = req.params.id;
    DetallePedido.findById(id,(err, detallePedido) => {
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }
        if(!detallePedido){
            return res.status(404).json({
                message:'No existe el detalle del pedido'
            })
        }
        res.status(200).json({
            status: 'success',
            detallePedido
        });
    });

}

module.exports = {
    getAll,
    getOne,
}
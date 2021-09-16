const Pedido = require('../models/Pedido');

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

module.exports={
    getAll,
    getOne
}
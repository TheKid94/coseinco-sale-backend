const Marca = require('../models/Marca');

const getAll = (req, res)=>{
    Marca.find({},(err, marcas)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la petición: ${err}`
            })
        }
        if(!marcas){
            return res.status(404).json({
                message: 'No existen marcas'
            })
        }
        res.status(200).json({
            status: 'success',
            marcas
        });
    });
}

module.exports = { getAll };
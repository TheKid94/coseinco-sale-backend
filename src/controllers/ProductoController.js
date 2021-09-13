const Producto = require('../models/Producto');

const getAll = (req, res)=>{
    Producto.find({},(err, products)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la petición: ${err}`
            })
        }
        if(!products){
            return res.status(404).json({
                message: 'No existen productos'
            })
        }
        res.status(200).json({
            status: 'success',
            products
        });
    });
}

module.exports ={
    getAll
}
const Inventario = require('../models/Inventario');
const Producto = require('../models/Producto');

const getSeriesByProductId = async(req,res) => {
    let id = req.params.id;
    try{
        let inventario = await Inventario.findOne({productID:id});
        if(!inventario){
            return res.status(404).json({
                message: 'No existe'
            })
        }
        res.status(200).json({
            status: 'success',
            nSeries: inventario.nSerie
        })
    }catch(err){
        return res.status(500).json({
            err
        })
    }   
}

module.exports ={
    getSeriesByProductId
}
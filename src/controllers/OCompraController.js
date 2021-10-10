const OCompra = require('../models/OCompra');

const getAll = (req, res) => {
    OCompra.find({},(err, compras) =>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!compras){
            return res.status(404).json({
                message: 'No existen las ordenes de compra'
            })
        }
        res.status(200).json({
            status: 'success',
            compras
        });
    });
}

const getOne = (req, res) => {

    const id = req.params.id;
    OCompra.findById(id,(err,compra)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!compra){
            return res.status(404).json({
                message: 'No existe la orden de compra'
            })
        }
        res.status(200).json({
            status: 'success',
            compra
        });
    });

};

const createOCompra = async(req, res) =>{
    try{
        const ocompra = req.body.ocompra;
        if(Object.keys(ocompra).length == 0){
            return res.status(400).json({
                status: 'warning',
                status: 'Debe ingresar una orden de compra correcta'
            });
        }
        const ocomprares = await OCompra.create(ocompra)
        res.status(200).json({
            status: 'success',
            ocomprares
        })
    }catch(error){
        res.status(500).json({
            error
        })
    }
}

module.exports = {
    getAll,
    getOne,
    createOCompra
}
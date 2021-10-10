const Proveedor = require('../models/Proveedor');

const getAll = (req, res) => {
    Proveedor.find({},(err, proveedores) =>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!proveedores){
            return res.status(404).json({
                message: 'No existen los proveedores'
            })
        }
        res.status(200).json({
            status: 'success',
            proveedores
        });
    });
}

const getOne = (req, res) => {

    const id = req.params.id;
    Proveedor.findById(id,(err,proveedor)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!proveedor){
            return res.status(404).json({
                message: 'No existe la proveedor'
            })
        }
        res.status(200).json({
            status: 'success',
            proveedor
        });
    });

};

const createProveedor = async(req,res) =>{
    try{
        const proveedor = req.body.proveedor;
        if(Object.keys(proveedor).length == 0){
            return res.status(400).json({
                status: 'warning',
                status: 'Debe ingresar un proveedor correcto'
            });
        }
        const proveres = await Proveedor.create(proveedor)
        res.status(200).json({
            status: 'success',
            proveres
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
    createProveedor
}
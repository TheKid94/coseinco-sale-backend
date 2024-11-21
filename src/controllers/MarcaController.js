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
};

const getOne = (req, res) =>{
    const id = req.params.id;
    Marca.findById(id,(err,marca)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la petición: ${err}`
            })
        }
        if(!marca){
            return res.status(404).json({
                message: 'No existe la marca'
            })
        }
        res.status(200).json({
            status: 'success',
            marca
        });
    });
};

const createMarca = async (req, res) => {
    try{
        const marca = req.body.marca;
        if(Object.keys(marca).length == 0){
            return res.status(400).json({
                status: 'warning',
                status: 'Debe ingresar una marca correcta'
            });
        }
        const marcares = await Marca.create(marca);
        res.status(200).json({
            status: 'success',
            marcares
        })
    }catch(error){
        res.status(500).json({
            message: `Error al realizar la peticion ${err}`
        })
    }
}

module.exports = { getAll, getOne, createMarca };
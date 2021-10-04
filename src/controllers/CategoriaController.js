const Categoria = require('../models/Categoria');

const getAll = (req, res) => {
    Categoria.find({},(err, categorias) =>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!categorias){
            return res.status(404).json({
                message: 'No existen las categorias'
            })
        }
        res.status(200).json({
            status: 'success',
            categorias
        });
    });
}

const getOne = (req, res) => {

    const id = req.params.id;
    Categoria.findById(id,(err,categoria)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!categoria){
            return res.status(404).json({
                message: 'No existe la categoria'
            })
        }
        res.status(200).json({
            status: 'success',
            categoria
        });
    });

};

const createCategoria = async(req,res)=>{
    try{
        const categoria = req.body.categoria;
        await Categoria.create(categoria);
        res.status(200).json({
            status: 'success',
            categoria
        })
    }catch(error){
        res.status(500).json({
            message: `Error al realizar la peticion ${err}`
        })
    }
}

module.exports ={
    getAll,getOne,createCategoria
}
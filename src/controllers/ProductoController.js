const Producto = require('../models/Producto');

const getOne = (req, res) => {

    const id = req.params.id;
    Producto.findById(id,(err,producto)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!producto){
            return res.status(404).json({
                message: 'No existe el producto'
            })
        }
        res.status(200).json({
            status: 'success',
            producto
        });
    });

};

const getAll = (req, res)=>{
    Producto.find({},(err, products)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la petición: ${err}`
            });
        }
        if(!products){
            return res.status(404).json({
                message: 'No existen productos'
            });
        }
        res.status(200).json({
            status: 'success',
            products,
        });
    });
};

const getAllProductoCompra = async (req, res) => {
    let productos = [];
    try{
        let productList = await Producto.find({});
        for(var i=0;i<productList.length;i++){
            let productAux = new Object();
            productAux.id = productList[i]._id;
            productAux.nombre = productList[i].nombre;
            productAux.precioCompra = productList[i].precioCompra;
            productAux.imagen = productList[i].imagenes[0];
            productos.push(productAux);
        }
        res.status(200).json({
            status:'success',
            productos
        })
    }catch(err){
        res.status(500).json({
            error: err
        })
    }
}

module.exports ={
    getAll,
    getAllProductoCompra,
    getOne
}
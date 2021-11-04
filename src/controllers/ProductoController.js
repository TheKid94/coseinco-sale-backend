const Marca = require('../models/Marca');
const Producto = require('../models/Producto');
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


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

const productoCarrito = async (req, res, next) => {
    try{
        const productoid = req.body.productoid;
        let carritoProducto = [];
        for(i=0;i<productoid.length;i++){
            let producto = await Producto.findById(productoid[i]);
            carritoProducto.push(producto);
        };
        res.status(200).json({
            status: 'success',
            result: carritoProducto.length,
            carritoProducto
        });
    } catch (error) {
        next(error);
    }
}


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

const createProducto = async (req, res) => {
    try {
      
      let producto = req.body.producto;            
      producto.estado = "habilitado"; 
         

      if (producto.length == 0 || Object.keys(producto).length == 0) {
        res.status(400).json({
          status: "error",
        });
        return false;
      }

      let productoNew = Producto.create(producto);      
      
      res.status(200).json({
        status: "success",
        productoNew
      });
    } catch (error) {
      res.status(500).json({
        error,
      });
    }
}

const ImagenProductoURL = async(req, res) => {
    const file = req.body.file;
    const result = await cloudinary.v2.uploader.upload(file,{folder:'Coseinco/Pruebas/AlessandraPruebas'})
    res.status(200).json({
        status: 'success',
        msj: result.url
    });
}

 
  const mostrar = (req, res) =>{
      Producto.find({}, (error, productos) =>{
          if(error)
          {
              return res.status(500).json({
                  message: 'Error mostrando los productos'
              })
          }
         return res.render('index.ejs', {productos, productos})
      })
  }

module.exports ={
    getAll,
    getAllProductoCompra,
    getOne,
    productoCarrito,
    createProducto,
    mostrar, 
    ImagenProductoURL
}
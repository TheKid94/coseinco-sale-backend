const Inventario = require('../models/Inventario');
const Producto = require('../models/Producto');
const Marca = require('../models/Marca');
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

const getAllCatalogo = async (req, res) => {
    try {
        // Obtener parámetros de paginación y filtros del query string
        const page = parseInt(req.query.page) || 1; // Página actual
        const limit = parseInt(req.query.limit) || 5; // Número de productos por página

        // Parámetros de filtrado
        const categoriaID = req.query.categoriaID ? req.query.categoriaID.split(',') : [];
        const minVal = parseFloat(req.query.minVal) || 0;
        const maxVal = parseFloat(req.query.maxVal) || Number.MAX_VALUE;
        const marcaID = req.query.marcaID ? req.query.marcaID.split(',') : [];

        const orden = parseInt(req.query.orden) || 1;

        // Validar los parámetros de paginación
        if (page <= 0 || limit <= 0) {
            return res.status(400).json({
                message: 'Los parámetros de página y límite deben ser números positivos.'
            });
        }

        // Calcular el número de documentos a omitir
        const skip = (page - 1) * limit;

        // Paso 1: Obtener los IDs de productos con stock > 0
        const inventarioConStock = await Inventario.find({ stock: { $gt: 0 } }).exec();
        const productoIdsConStock = inventarioConStock.map(item => item.productoID);

        if (productoIdsConStock.length === 0) {
            return res.status(404).json({
                message: 'No hay productos con stock disponible.'
            });
        }

        // Construir el objeto de filtro para la colección Producto
        const filtro = {
            _id: { $in: productoIdsConStock },
            precio: { $gte: minVal, $lte: maxVal },
            estado: 'habilitado'
        };

        if (categoriaID.length > 0) {
            filtro.categoriaID = { $in: categoriaID };
        }

        if (marcaID.length > 0) {
            filtro.marcaID = { $in: marcaID };
        }

        // Construir el objeto de ordenamiento
        const sort = {};
        if (orden === 1) {
            sort.precio = 1; // Ordenar de menor a mayor
        } else if (orden === 2) {
            sort.precio = -1; // Ordenar de mayor a menor
        }

        // Paso 4: Obtener los productos con los filtros aplicados
        const productos = await Producto.find(filtro)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();

        // Obtener el stock para cada producto
        const productosConStock = await Promise.all(productos.map(async (producto) => {
            // Buscar el inventario para el producto actual
            const inventario = await Inventario.findOne({ productoID: producto._id }).exec();
            return {
                ...producto.toObject(), // Convierte el documento Mongoose a un objeto JavaScript
                stock: inventario ? inventario.stock : 0 // Asigna el stock, o 0 si no hay inventario
            };
        }));

        // Contar el total de productos para saber cuántas páginas hay en total
        const count = await Producto.countDocuments(filtro).exec();
        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            status: 'success',
            products: productosConStock,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages,
                itemsPerPage: limit
            }
        });
        } catch (err) {
        res.status(500).json({
            message: `Error al realizar la petición: ${err}`
        });
        }
};

const productoCarrito = async (req, res, next) => {
    try{
        const productoid = req.body.productoid;
        let carritoProducto = [];
        for(i=0;i<productoid.length;i++){
            let producto = await Producto.findById(productoid[i]);
            let marca = await Marca.findById(producto.marcaID);

            let productoObject = producto.toObject();
            productoObject.marca = marca.nombre;
            carritoProducto.push(productoObject);
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
      
        let producto = req.body.product;
        let newProducto = new Object();
        newProducto.marcaID = producto.brand;
        newProducto.SKU = producto.sku;
        newProducto.nombre = producto.name;
        newProducto.precio = parseFloat(producto.salePrice);
        newProducto.precioCompra = parseFloat(producto.purchasePrice);
        newProducto.codigoFabricante = producto.manufacturer;
        newProducto.caracteristica = producto.feature;
        newProducto.imagenes = producto.images;
        newProducto.categoriaID = producto.category; 
        newProducto.estado = "habilitado"; 

        if (producto.length == 0 || Object.keys(producto).length == 0) {
            res.status(400).json({
            status: "error",
            });
            return false;
        }

        let productoRes = await Producto.create(newProducto);

        let newInventario = new Object();
        newInventario.fechaRegistro = Date.now();
        newInventario.productoID = productoRes._id;
        newInventario.nSerie = [];
        newInventario.stock = 0;

        await Inventario.create(newInventario);
      
        res.status(200).json({
            status: "success",
            productoRes
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

const updateProducto = async (req, res) => {
    try {
      
        let producto = req.body.product;
        let newProducto = new Object();
        let id = producto.id;
        newProducto.marcaID = producto.brand;
        newProducto.SKU = producto.sku;
        newProducto.nombre = producto.name;
        newProducto.precio = producto.salePrice;
        newProducto.precioCompra = producto.purchasePrice;
        newProducto.codigoFabricante = producto.manufacturer;
        newProducto.caracteristica = producto.feature;
        newProducto.categoriaID = producto.category;

        if (producto.length == 0 || Object.keys(producto).length == 0) {
            res.status(400).json({
            status: "error",
            });
            return false;
        }

        let productoRes = await Producto.findByIdAndUpdate(id,{
            marcaID: newProducto.marcaID,
            SKU: newProducto.SKU,
            nombre: newProducto.nombre,
            precio: newProducto.precio,
            precioCompra: newProducto.precioCompra,
            codigoFabricante: newProducto.codigoFabricante,
            caracteristica: newProducto.caracteristica
        });
        // let productoRes = await Producto.create(newProducto);     
      
        res.status(200).json({
            status: "success",
            productoRes
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

const ImagenProductoURL = async(req, res) => {
    const file = req.body.file;
    const sku = req.body.sku;
    const result = await cloudinary.v2.uploader.upload(file,{folder:`Coseinco/Productos/SKU/${sku}`})
    res.status(200).json({
        status: 'success',
        url: result.url
    });
}


const inhabilitarProducto = async (req, res) => {
    let id = req.body.id;
    try{
        await Producto.updateOne({SKU: id},{estado:"inhabilitado"});
        res.status(200).json({
            status: 'success'
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}

const habilitarProducto = async (req, res) => {
    let id = req.body.id;
    try{
        await Producto.updateOne({SKU: id},{estado:"habilitado"});
        res.status(200).json({
            status: 'success'
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}
module.exports = {
    getAll,
    getAllProductoCompra,
    getOne,
    productoCarrito,
    createProducto,
    ImagenProductoURL,
    inhabilitarProducto,
    habilitarProducto,
    updateProducto,
    getAllCatalogo
}
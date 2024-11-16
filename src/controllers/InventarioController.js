const Inventario = require('../models/Inventario');
const Producto = require('../models/Producto');
const Marca = require('../models/Marca');
const MovimientoEntrada = require('../models/MovimientoEntrada');
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const OCompraURL = async(req, res) => {
    const file = req.body.file;
    const movimientoID = req.body.movimientoID;

    try
    {
        const result = await cloudinary.v2.uploader.upload(file,{folder:`Coseinco/OrdenDeCompra/movimiento/${movimientoID}`})

        res.status(200).json({
            status: 'success',
            url: result.url
        });

    } catch(err){
        return res.status(500).json({
            err
        })
    }
}

const agregarInventario = async(req,res) => {
    let dataBody = req.body.inventoryData;
    try{
        let productID = dataBody.productID;
        let files = dataBody.files;
        let inventoryItems = dataBody.inventoryItems;
        let movimientoID = dataBody.movimientoID;

        const precioCompraTotal = inventoryItems.reduce((acumulador, producto) => acumulador + producto.precioCompra, 0);

        let movimientoObj = await MovimientoEntrada.findByIdAndUpdate(movimientoID,{
            archivosAdjuntos: files,
            datos: inventoryItems,
            precioCompraTotal: precioCompraTotal,
            fechaCreacion: Date.now(),
            productID: productID
        });

        let inventario = await Inventario.findOne({productoID:productID});  
        for(i=0;i<inventoryItems.length;i++){

            let nSerieObj = new Object();
            nSerieObj.estado = "habilitado",
            nSerieObj.nroSerie = inventoryItems[i].nroSerie,
            nSerieObj.precioCompra = inventoryItems[i].precioCompra,
            nSerieObj.fechaRegistro = movimientoObj.fechaCreacion,

            inventario.nSerie.push(nSerieObj);

        };
        inventario.stock = inventario.stock + inventoryItems.length;

        let inventarioRes = await Inventario.findByIdAndUpdate(inventario._id,{
            nSerie: inventario.nSerie,
            stock: inventario.stock
        });
        
        res.status(200).json({
            status: 'success',
        })
    }catch(err){
        return res.status(500).json({
            err
        })
    }
}

const getSeriesByProductId = async(req,res) => {
    let id = req.params.id;
    try{
        let inventario = await Inventario.findOne({productoID:id});
        let seriesAlmacenado = inventario.nSerie;
        let seriesHabilitado = [];
        let seriesReservado = [];
        for(var i=0;i<inventario.nSerie.length;i++){
            if(inventario.nSerie[i].estado=="habilitado"){
                seriesHabilitado.push(inventario.nSerie[i]);
            }
        }
        for(var j=0;j<inventario.nSerie.length;j++){
            if(inventario.nSerie[j].estado=="reservado"){
                seriesReservado.push(inventario.nSerie[j]);
            }
        }
        if(!inventario){
            return res.status(404).json({
                message: 'No existe'
            })
        }
        res.status(200).json({
            status: 'success',
            nSeriesHabilitado: seriesHabilitado,
            nSeriesReservado: seriesReservado,
            nSeriesAlmacenado: seriesAlmacenado
        })
    }catch(err){
        return res.status(500).json({
            err
        })
    }
}

const getInventarios = async(req,res)=>{
    let inventarioslist = [];
    try{
        let inventarios = await Inventario.find({});
        for(var i=0; i<inventarios.length;i++){
            let inventarioaux = new Object();
            let producto = await Producto.findById(inventarios[i].productoID);
            let marca = await Marca.findById(producto.marcaID);
            inventarioaux.productoID = producto._id;
            inventarioaux.sku = producto.SKU;
            inventarioaux.imagen = producto.imagenes[0];
            inventarioaux.nombre = producto.nombre;
            inventarioaux.cantidad = inventarios[i].stock;
            inventarioaux.marca = marca.nombre;
            inventarioslist.push(inventarioaux);
        }
        res.status(200).json({
            status: 'success',
            inventarioslist
        })
    }catch(err){
        return res.status(500).json({
            error: err
        })
    }
}

module.exports ={
    getSeriesByProductId,
    getInventarios,
    OCompraURL,
    agregarInventario
}
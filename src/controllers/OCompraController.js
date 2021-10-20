const OCompra = require('../models/OCompra');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const getAll = async (req, res) => {
   let oCompras = await OCompra.find({});
   let compras = [];
   try{
       for(var i=0; i<oCompras.length; i++){
           let compraaux = new Object();
           let proveedor = await Proveedor.findById(oCompras[i].proveedorID);
           compraaux.id = oCompras[i]._id;
           compraaux.numeroOC = oCompras[i].numeroOC;
           compraaux.estado = oCompras[i].estado;
           compraaux.total = oCompras[i].total;
           compraaux.fechaEntrega = oCompras[i].fechaEntrega;
           compraaux.proveedor = proveedor.razonSocial;
           compras.push(compraaux);
       }
       res.status(200).json({
           status: 'success',
           compras
       })
   }catch(err){
       res.status(500).json({
           error: err
       })
   }
}

const getOne = async (req, res) => {
    const id = req.params.id;
    let productos =[];
    try{
        let compra = new Object();
        let compraaux = await OCompra.findOne({numeroOC:id});
        compra.numeroOC = compraaux.numeroOC;
        compra.total = compraaux.total;
        for(var i=0;i<compraaux.productos.length;i++){
            let producto = new Object()
            let productoaux = await Producto.findById(compraaux.productos[i].id);
            producto.SKU = productoaux.SKU;
            producto.nombre = productoaux.nombre;
            producto.imagen = productoaux.imagenes[0];
            producto.cantidad = compraaux.productos[i].cantidad;
            producto.subtotal = compraaux.productos[i].subtotal;
            productos.push(producto);
        };
        compra.productos = productos;
        let proveedor = await Proveedor.findById(compraaux.proveedorID);
        res.status(200).json({
            status:'success',
            compra,
            proveedor
        })
    }catch(err){
        res.status(500).json({
            error: err
        })
    }
};

const createOCompra = async(req, res) =>{
    const ocompra = req.body.ocompra;
    if(Object.keys(ocompra).length == 0){
        return res.status(400).json({
            status: 'warning',
            mensaje: 'Debe ingresar una orden de compra correcta'
        });
    }
    try{
        let compraux = new Object;
        let total = 0.00; 
        let nCompras = await OCompra.find({});
        for(var i=0;i<ocompra.productos.length;i++){
            total += ocompra.productos[i].subtotal;
        }
        compraux.numeroOC = "OC" + `${nCompras.length + 1}`.padStart(5, "0");
        compraux.productos = ocompra.productos;
        compraux.total = total;
        compraux.fechaEntrega = ocompra.fechaEntrega;
        compraux.proveedorID = ocompra.proveedorID;
        compraux.estado = "generado";
        const ocomprares = await OCompra.create(compraux)
        res.status(200).json({
            status: 'success',
            ocomprares
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}

const anularOCompra = async (req, res) => {
    let id = req.body.id;
    try{
        await OCompra.updateOne({numeroOC: id},{estado:"anulado"});
        res.status(200).json({
            status: 'success'
        })
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}

const enviarNotificacion = async (req,res) => {
    let ncompra = req.body.ncompra;
    try{
        let compra = await OCompra.findOne({numeroOC:ncompra});
        let proveedor = await Proveedor.findById(compra.proveedorID);
        const msg = {
            to: proveedor.correo, // Change to your recipient
            from: 'gustavo.troncos@urp.edu.pe', // Change to your verified sender
            subject: 'Sending with SendGrid is Fun',
            text: 'and easy to do anywhere, even with Node.js',
            html: '<strong>Dale a este link mongol</strong>' + '<br>' +'<a href='+'www.google.com'+'>Click aqui</a>',
        }
        sgMail
        .send(msg)
        .then(() => {
            res.status(200).json({
                status: 'success',
            });
        })
        .catch((error) => {
            res.status(401).json({
                error: error,
            });
        })
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
}

module.exports = {
    getAll,
    getOne,
    createOCompra,
    anularOCompra,
    enviarNotificacion
}
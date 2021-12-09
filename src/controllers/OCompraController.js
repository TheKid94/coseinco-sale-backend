const fs = require('fs');
const path = require('path');
const utils = require('util');
const puppeteer = require('puppeteer');
const hb = require('handlebars');
const readFile = utils.promisify(fs.readFile);

const sgMail = require('@sendgrid/mail');

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const OCompra = require('../models/OCompra');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');
const Inventario = require('../models/Inventario');

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
           compraaux.cotizacionAccept = oCompras[i].cotizacionAccept;
           compraaux.url = oCompras[i].url;
           compraaux.guiaProveedor = oCompras[i].guiaProveedor;
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
            producto.productoId = productoaux._id;
            producto.SKU = productoaux.SKU;
            producto.nombre = productoaux.nombre;
            producto.precioCompra = productoaux.precioCompra;
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

const getOneConfirm = async (req, res) => {
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
            producto.productoId = productoaux._id;
            producto.SKU = productoaux.SKU;
            producto.nombre = productoaux.nombre;
            producto.precioCompra = 0.00;
            producto.imagen = productoaux.imagenes[0];
            producto.cantidad = compraaux.productos[i].cantidad;
            producto.subtotal = 0.00;
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
        let compraux = new Object();
        let total = 0.00; 
        let nCompras = await OCompra.find({});
        for(var i=0;i<ocompra.productos.length;i++){
            total += ocompra.productos[i].subtotal;
        }
        compraux.numeroOC = "OC" + `${nCompras.length + 1}`.padStart(5, "0");
        compraux.productos = ocompra.productos;
        compraux.total = total;
        compraux.fechaEntrega = new Date();
        compraux.proveedorID = ocompra.proveedorID;
        compraux.estado = "cotizado";
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
        await getTemplateHtml().then(async (resp)=>{
            let prod = "";
            let reshtml = resp;
            let date = compra.fechaRegistro;
            let day = date.getDate();
            let month = date.getMonth();
            let year = date.getFullYear();
            const link = '<strong>Buen día '+ proveedor.razonSocial + ', para aprobar esta cotización.</strong>' + '<br>' +'<a href='+`http://localhost:3000/proveedor/orden-de-compra?codigo=${compra.numeroOC}`+'>Click aqui</a>';
            reshtml = reshtml.replace('#CodigoCompra',compra.numeroOC);
            reshtml = reshtml.replace('#FechaRegistro', `${day + 1}/${month + 1}/${year}`);
            reshtml = reshtml.replace('#ProveedorNombre',proveedor.razonSocial);
            reshtml = reshtml.replace('#ProveedorCorreo',`${proveedor.correo}`);
            reshtml = reshtml.replace('#ProveedorRuc',`${proveedor.ruc}`);
            for(var i=0; i<compra.productos.length;i++){
                let producto = await Producto.findById(compra.productos[i].id);
                prod += '<tr class="item">';
                prod += `<td>${producto.nombre}</td>`;
                prod += `<td style="text-align: left !important;">${producto.SKU}</td>`;
                prod += `<td>${compra.productos[i].cantidad}</td>`;
                prod += '</tr>';
            }
            reshtml = reshtml.replace('#Productos', prod);
            reshtml = reshtml.replace('#Confirmacion', link);
            const msg = {
                to: proveedor.correo, // Change to your recipient
                from: 'gustavo.troncos@urp.edu.pe', // Change to your verified sender
                subject: `Generación de Orden de Compra ${compra.numeroOC}`,
                html: reshtml
            }
            sgMail.send(msg).then(() => {
                res.status(200).json({
                    status: 'success',
                });
            }).catch((error) => {
                res.status(401).json({
                    error: error,
                });
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
            console.error(err);
        });
    } catch(error){
        res.status(500).json({
            error: error,
        });
    }
}

const oCompraToInventario = async(req,res) =>{
    let codigoCompra = req.body.codigo;
    let productos = req.body.productos;
    let guiaProveedor = req.body.guiaProveedor;
    try{
        for(var i=0;i<productos.length;i++){
            let inventario = await Inventario.findOne({productoID: productos[i].productoID});
            let nseries = [];
            if(!inventario){
                let newInventario = new Object();
                newInventario.fechaRegistro = new Date();
                for(var j=0; j<productos[i].serialNumbers.length;j++){
                    var serieaux = new Object();
                    serieaux.numero = productos[i].serialNumbers[j];
                    serieaux.estado = 'habilitado';
                    nseries.push(serieaux);
                }
                newInventario.nSerie = nseries;
                newInventario.productoID = productos[i].productoID;
                newInventario.stock = nseries.length;
                await Inventario.create(newInventario)
            }else{
                let invstock = inventario.nSerie;
                for(var j=0; j<productos[i].serialNumbers.length;j++){
                    var serieaux = new Object();
                    serieaux.numero = productos[i].serialNumbers[j];
                    serieaux.estado = 'habilitado';
                    nseries.push(serieaux);
                }
                let newseries = invstock.concat(nseries);
                let newStock = newseries.length;
                await Inventario.findOneAndUpdate({productoID: productos[i].productoID},{stock:newStock, nSerie:newseries});
            }
        }
        await OCompra.findOneAndUpdate({numeroOC:codigoCompra},{estado:"finalizado", guiaProveedor: guiaProveedor});
        res.status(200).json({
            status: 'success'
        })
    }catch(err){
        res.status(500).json({
            error: err
        });
    }
}

const GuiaRemisiontoURL = async(req, res) => {
    const file = req.body.file;
    const ncompra = req.body.ncompra;
    let compra = await OCompra.findOne({numeroOC:ncompra})
    let proveedor = await Proveedor.findById(compra.proveedorID);
    const result = await cloudinary.v2.uploader.upload(file,{folder:`Coseinco/OCompras/${ncompra}/${proveedor.razonSocial}`});
    res.status(200).json({
        status: 'success',
        url: result.url
    }); 
}

const OCompraGenerarDoc = async(req, res)=>{
    let ncompra = req.body.ncompra;
    try{
        let compra = await OCompra.findOne({numeroOC:ncompra});
        let proveedor = await Proveedor.findById(compra.proveedorID);
        let data = {};
        await getTemplateHtmlOCompra().then(async (resp)=>{
            let prod = "";
            let reshtml = resp;
            let fechaReg = compra.fechaRegistro;
            let diaReg = fechaReg.getDate();
            let mesReg = fechaReg.getMonth();
            let anioReg = fechaReg.getFullYear();
            let fechaEnt = compra.fechaEntrega;
            let diaEnt = fechaEnt.getDate();
            let mesEnt = fechaEnt.getMonth();
            let anioEnt = fechaEnt.getFullYear();
            const total = '<strong style="float: right; margin-right: 45px;">' + 'Total: '+ compra.total + '</strong> '; 
            reshtml = reshtml.replace('#CodigoCompra',compra.numeroOC);
            reshtml = reshtml.replace('#FechaRegistro', `${diaReg + 1}/${mesReg + 1}/${anioReg}`);
            reshtml = reshtml.replace('#FechaLlegada', `${diaEnt + 1}/${mesEnt + 1}/${anioEnt}`);
            reshtml = reshtml.replace('#ProveedorNombre',proveedor.razonSocial);
            reshtml = reshtml.replace('#ProveedorCorreo',`${proveedor.correo}`);
            reshtml = reshtml.replace('#ProveedorRuc',`${proveedor.ruc}`);
            for(var i=0; i<compra.productos.length;i++){
                let producto = await Producto.findById(compra.productos[i].id);
                prod += '<tr class="item">';
                prod += `<td>${producto.nombre}</td>`;
                prod += `<td style="text-align: left !important;">${producto.SKU}</td>`;
                prod += `<td>${compra.productos[i].cantidad}</td>`;
                prod += `<td>${compra.productos[i].subtotal}</td>`;
                prod += '</tr>';
            }
            reshtml = reshtml.replace('#Productos', prod);
            reshtml = reshtml.replace('#Total', total);
            const template = hb.compile(reshtml, { strict: true });
            let result = template(data);
            let html = result;
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            let pathfile = `src/public/${compra.numeroOC}.pdf`;
            await page.pdf({ path: pathfile, format: 'A4' });
            const resultcloud = await cloudinary.v2.uploader.upload(pathfile,{folder:`Coseinco/OCompras/${compra.numeroOC}`});
            await browser.close();
            fs.unlink(pathfile,(err)=>{
                if(err){
                    res.status(500).json({
                        error: err
                    })
                };
            })
            await OCompra.findOneAndUpdate({numeroOC: compra.numeroOC},{"url": resultcloud.url});
            res.status(200).json({
                status: 'success'
            })
        })
    }catch(err){
        res.status(500).json({
            error: err
        });
    }
}

const oCompraAcceptByProveedor = async(req,res)=>{
    let codigo = req.body.codigo;
    let fecha = req.body.fechaEntrega;
    let compra = req.body.compra;
    let productsCompra =[];
    try{
        for(var i=0;i<compra.productos.length;i++){
            let productchange = new Object();
            productchange.id = compra.productos[i].productoId;
            productchange.cantidad = compra.productos[i].cantidad;
            productchange.subtotal = compra.productos[i].subtotal;
            productsCompra.push(productchange);
        }
        await OCompra.findOneAndUpdate({numeroOC:codigo},{fechaEntrega:fecha, total:compra.total, productos:productsCompra, cotizacionAccept:true})
        res.status(200).json({
            status: 'success'
        })
    }catch(err){
        res.status(500).json({
            error: err
        })
    }
}

async function getTemplateHtml() {
    
    console.log("Loading template file in memory")
    try {
    const invoicePath = path.resolve("src/public/templates/ocompraConfirm.html");
    return await readFile(invoicePath, 'utf8');
    } catch (err) {
    return Promise.reject("Could not load html template");
    }
    
}

async function getTemplateHtmlOCompra() {
    
    console.log("Loading template file in memory")
    try {
    const invoicePath = path.resolve("src/public/templates/ocompra.html");
    return await readFile(invoicePath, 'utf8');
    } catch (err) {
    return Promise.reject("Could not load html template");
    }
    
}


module.exports = {
    getAll,
    getOne,
    getOneConfirm,
    createOCompra,
    anularOCompra,
    enviarNotificacion,
    oCompraToInventario,
    oCompraAcceptByProveedor,
    OCompraGenerarDoc,
    GuiaRemisiontoURL
}
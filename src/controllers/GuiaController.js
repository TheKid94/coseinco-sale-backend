const fs = require('fs');
const path = require('path');
const utils = require('util');
const puppeteer = require('puppeteer');
const hb = require('handlebars');
const readFile = utils.promisify(fs.readFile);

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const Guia = require("../models/Guia");
const Inventario = require("../models/Inventario");
const Pedido = require("../models/Pedido");
const Producto = require("../models/Producto");

const getGuiaInfo = async (req, res) => {
    let codigo = req.body.codigo;
    let productores = [];
    try{
        let guia = await Guia.findOne({codigoPedido: codigo});
        for(let i=0;i<guia.nseries.length;i++){
            let product = new Object();
            let prod = await Producto.findById(guia.nseries[i].productoID);
            product.sku = prod.SKU;
            product.nombre = prod.nombre;
            product.cantidad = guia.nseries[i].serialNumbers.length;
            product.nseries = guia.nseries[i].serialNumbers;
            productores.push(product);
        }
        res.status(200).json({
            status: 'success',
            codigo,
            productores
        })
    }catch(error){
        res.status(500).json({
            error: error
        })
    }
}

const createGuia = async(req, res) => {
    let pedidoscod = req.body.codigo;
    let productos = req.body.productos;
    let nseries = [];
    let guia = new Object();
    try{
        for(var i=0;i<productos.length;i++){
            let instock = await Inventario.findOne({productoID: productos[i].productoID});
            let myArray = transformArray(instock.nSerie);
            let toRemove = transformArray(productos[i].serialNumbers);
            let difference = transformDifference(myArray,toRemove);
            await Inventario.findOneAndUpdate({productoID: productos[i].productoID},
                {"stock":instock.stock - productos[i].serialNumbers.length,"nSerie":difference}
            )
            nseries.push(productos[i]);
        };
        await Pedido.findOneAndUpdate({codigoPedido:pedidoscod},{"estado":"reservado"});
        let nGuias = await Guia.find({});
        guia.codigoPedido = pedidoscod;
        guia.codigoGuia = "G" + `${nGuias.length + 1}`.padStart(5, "0");
        guia.nseries = nseries;
        let guiares = await Guia.create(guia);
        res.status(200).json({
            guiares
        })
    }catch(error){
        res.status(500).json({
            error
        })
    }
}

const transformArray = (arr) => {
    let array = [];
    for(let i=0;i < arr.length;i++){
        array.push(arr[i]);
    }
    return array;
}

const transformDifference = (myArray, toRemove)=>{
    for(let i=0;i<myArray.length;i++){
        for(let j=0; j<toRemove.length;j++){
            if(myArray[i] === toRemove[j]){
                myArray.splice(i,1);
            }
        }
    }
    return myArray;
}


const createGuiaPDF = async(req, res) =>{
    let codigoped = req.body.codigo;
    try{
        let guia = await Guia.findOne({codigoPedido: codigoped});
        let pedido = await Pedido.findOne({codigoPedido: codigoped});
        let data = {};
        await getTemplateHtml().then(async (resp)=>{
            let prod = "";
            let reshtml = resp;
            let date = new Date();
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            reshtml = reshtml.replace('#CodGuia',guia.codigoGuia);
            reshtml = reshtml.replace('#FechaRegistro', `${day}/${month}/${year}`);
            reshtml = reshtml.replace('#Cliente',pedido.datos.name + " " + pedido.datos.lastName);
            reshtml = reshtml.replace('#CorreoCliente',`${pedido.datos.email}`);
            reshtml = reshtml.replace('#CodigoPedido',`${pedido.codigoPedido}`);
            for(var i=0; i<guia.nseries.length;i++){
                let producto = await Producto.findById(guia.nseries[i].productoID);
                prod += '<tr class="item">';
                prod += `<td>${producto.nombre}</td>`;
                prod += `<td style="text-align: left !important;">${producto.SKU}</td>`;
                prod += `<td>${guia.nseries[i].serialNumbers.length}</td>`;
                prod += '<td>';
                for(var j=0;j<guia.nseries[i].serialNumbers.length;j++){
                    prod += guia.nseries[i].serialNumbers[j];
                    prod += (j == guia.nseries[i].serialNumbers.length - 1)?"":"; ";
                };
                prod += '</td>';
                prod += '</tr>';
            }
            reshtml = reshtml.replace('#Productos', prod);
            const template = hb.compile(reshtml, { strict: true });
            let result = template(data);
            let html = result;
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            let pathfile = `src/public/${guia.codigoGuia}.pdf`;
            await page.pdf({ path: pathfile, format: 'A4' });
            const resultcloud = await cloudinary.v2.uploader.upload(pathfile,{folder:`Coseinco/Guia/${guia.codigoGuia}`});
            await browser.close();
            fs.unlink(pathfile,(err)=>{
                if(err){
                    res.status(500).json({
                        error: err
                    })
                };
            })
            await Guia.findOneAndUpdate({codigoPedido: codigoped},{"url": resultcloud.url})
            await Pedido.findOneAndUpdate({codigoPedido: codigoped},{"estado": "empaquetado"})
            res.status(200).json({
                status: 'success'
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
            console.error(err);
        });
    }catch(error){
        res.status(500).json({
            error: error
        })
    }
}

async function getTemplateHtml() {
    
    console.log("Loading template file in memory")
    try {
    const invoicePath = path.resolve("src/public/templates/guia.html");
    return await readFile(invoicePath, 'utf8');
    } catch (err) {
    return Promise.reject("Could not load html template");
    }
    
}

module.exports = {
    getGuiaInfo,
    createGuia,
    createGuiaPDF
}

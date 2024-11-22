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

const postmark = require("postmark");
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

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
            let stockReserve = [];
            let myArray = transformArray(instock.nSerie);
            for(var j=0;j<productos[i].serialNumbers.length;j++){
                let prod = myArray.find(x=>x.nroSerie == productos[i].serialNumbers[j]);
                prod.estado = 'reservado';
                stockReserve.push(prod);
            }
            let difference = myArray.map(a => {
                const exist = stockReserve.find(b=>a.estado == b.estado);
                if(exist){
                    a.estado = exist.estado;
                }
                return a;
            });
            await Inventario.findOneAndUpdate({productoID: productos[i].productoID},
                {"stock":difference.filter(x=>x.estado == 'habilitado').length ,"nSerie":difference}
            )
            nseries.push(productos[i]);
        };
        await Pedido.findOneAndUpdate({codigoPedido:pedidoscod},{"estado":"reservado", "fechaReserva": new Date()});
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


const createGuiaPDF = async(req, res) =>{
    let codigoped = req.body.codigo;

    try {
        const guiaPromise = Guia.findOne({ codigoPedido: codigoped });
        const pedidoPromise = Pedido.findOne({ codigoPedido: codigoped });
        const [guia, pedido] = await Promise.all([guiaPromise, pedidoPromise]);

        const templateHtml = await getTemplateHtml();
        
        // Generar los productos en el HTML de manera eficiente
        const productos = await Promise.all(
        guia.nseries.map(async (serie) => {
            const producto = await Producto.findById(serie.productoID);
            const serialNumbers = serie.serialNumbers.join('; ');
            return `
            <tr class="item">
                <td>${producto.nombre}</td>
                <td style="text-align: left !important;">${producto.SKU}</td>
                <td>${serie.serialNumbers.length}</td>
                <td>${serialNumbers}</td>
            </tr>
            `;
        })
        );
        
        // Reemplazar los valores en la plantilla
        const date = new Date();
        const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        const templateData = {
        '#CodGuia': guia.codigoGuia,
        '#FechaRegistro': fecha,
        '#Cliente': `${pedido.datos.name} ${pedido.datos.lastName}`,
        '#CorreoCliente': pedido.datos.email,
        '#CodigoPedido': pedido.codigoPedido,
        '#Productos': productos.join(''),
        };
        
        const reshtml = replaceTemplateVars(templateHtml, templateData);
        const template = hb.compile(reshtml, { strict: true });
        const html = template({});

        // Generar el PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);

        const pathfile = `src/public/${guia.codigoGuia}.pdf`;
        await page.pdf({ path: pathfile, format: 'A4' });

        const resultcloud = await cloudinary.v2.uploader.upload(pathfile, {
        folder: `Coseinco/Guia/${guia.codigoGuia}`
        });

        const pdfContent = fs.readFileSync(pathfile).toString('base64');
        
        // Limpieza del archivo PDF
        await browser.close();
        fs.unlink(pathfile, (err) => {
        if (err) {
            res.status(500).json({ error: err });
        }
        });

        // Actualizar la base de datos
        await Guia.findOneAndUpdate(
        { codigoPedido: codigoped },
        { "url": resultcloud.url }
        );
        await Pedido.findOneAndUpdate(
        { codigoPedido: codigoped },
        { "estado": "empaquetado", "fechaEmpaquetado": new Date() }
        );

        // Notificar al cliente
        await NotificarCliente(pedido, pdfContent);

        res.status(200).json({ status: 'success' });

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.error(error);
    }
};

const replaceTemplateVars = (template, data) => {
    return Object.keys(data).reduce((updatedTemplate, key) => {
      return updatedTemplate.replace(key, data[key]);
    }, template);
};

async function getTemplateHtml() {
    console.log("Loading template file in memory");
    try {
      const invoicePath = path.resolve("src/public/templates/guia.html");
      return await readFile(invoicePath, 'utf8');
    } catch (err) {
      throw new Error("Could not load html template");
    }
}

async function getTemplateMessageGuiaHtml(){
    console.log("Loading template file in memory");
    try {
      const invoicePath = path.resolve("src/public/templates/messageGuia.html");
      return await readFile(invoicePath, 'utf8');
    } catch (err) {
      throw new Error("Could not load html template");
    }
}

const NotificarCliente = async (pedido, archivo) => {
    const mensajeGuia = await getTemplateMessageGuiaHtml();
    await client.sendEmail({
        From: "gustavo.troncos@urp.edu.pe",
        To: pedido.datos.email,
        Subject: `Generación de Guia de Remisión ${pedido.codigoPedido}`,
        HtmlBody: mensajeGuia,
        MessageStream: "broadcast",
        Attachments: [
        {
            Name: `${pedido.codigoPedido}.pdf`,
            Content: archivo,
            ContentType: 'application/pdf'
        }
        ]
    });
};


module.exports = {
    getGuiaInfo,
    createGuia,
    createGuiaPDF
}

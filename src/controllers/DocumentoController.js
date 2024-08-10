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

var postmark = require("postmark");
var client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const Pedido = require("../models/Pedido");
const DetallePedido = require("../models/DetallePedido");

async function getTemplatePagoHtml() {
    
    console.log("Loading template file in memory")
    try {
    const invoicePath = path.resolve("src/public/templates/pago.html");
    return await readFile(invoicePath, 'utf8');
    } catch (err) {
    return Promise.reject("Could not load html template");
    }
    
}

const generarPagoDoc = async(req, res)=>{
    let npedido = req.body.npedido;
    try{
        let pedido = await Pedido.findOne({ codigoPedido: npedido });
        let detallePedido = await DetallePedido.findOne({ pedidoID: pedido._id });
        let dataMail = {};

        let resp = await getTemplatePagoHtml();
        let prod = "";
        let reshtml = resp;

        let fechaReg = pedido.fechaRegistro;
        let diaReg = fechaReg.getDate();
        let mesReg = fechaReg.getMonth();
        let anioReg = fechaReg.getFullYear();

        let fechaEnt = pedido.fechaEntrega;
        let diaEnt = fechaEnt.getDate();
        let mesEnt = fechaEnt.getMonth();
        let anioEnt = fechaEnt.getFullYear();

        const total = '<strong style="float: right; margin-right: 45px;">' + 'Total: ' + detallePedido.totalPrecio + '</strong> ';

        reshtml = reshtml.replace('#CodigoVenta', pedido.codigoPedido);
        reshtml = reshtml.replace('#FechaRegistro', `${diaReg + 1}/${mesReg + 1}/${anioReg}`);
        reshtml = reshtml.replace('#FechaLlegada', `${diaEnt + 1}/${mesEnt + 1}/${anioEnt}`);
        reshtml = reshtml.replace('#Cliente', `${pedido.datos.name} ${pedido.datos.lastName}`);
        reshtml = reshtml.replace('#Correo', `${pedido.datos.email}`);
        reshtml = reshtml.replace('#TipoDocumento', `${pedido.datos.documentType}`);
        reshtml = reshtml.replace('#NumDocumento', `${pedido.datos.numberDoc}`);

        for (var i = 0; i < detallePedido.productos.length; i++) {
            prod += '<tr class="item">';
            prod += `<td>${detallePedido.productos[i].nombre}</td>`;
            prod += `<td style="text-align: left !important;">${detallePedido.productos[i].SKU}</td>`;
            prod += `<td>${detallePedido.productos[i].cantidad}</td>`;
            prod += `<td>${detallePedido.productos[i].subtotal}</td>`;
            prod += '</tr>';
        }

        reshtml = reshtml.replace('#Productos', prod);
        reshtml = reshtml.replace('#Total', total);

        const template = hb.compile(reshtml, { strict: true });
        let result = template(dataMail);
        let html = result;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);

        let pathfile = `src/public/${pedido.codigoPedido}.pdf`;
        await page.pdf({ path: pathfile, format: 'A4' });

        const resultcloud = await cloudinary.uploader.upload(pathfile, { folder: `Coseinco/Ventas/Boleta/${pedido.codigoPedido}` });
        await browser.close();

        fs.unlink(pathfile, (err) => {
            if (err) {
                res.status(500).json({ error: err });
            }
        });

        const pdfContent = fs.readFileSync(pathfile).toString('base64');
        await Pedido.findOneAndUpdate({ codigoPedido: pedido.codigoPedido }, { $push: { files: resultcloud.url } });

        client.sendEmail({
            "From": "gustavo.troncos@urp.edu.pe",
            "To": pedido.datos.email,
            "Subject": `Generación de Boleta de Venta ${pedido.codigoPedido}`,
            "HtmlBody": reshtml,
            "MessageStream": "broadcast",
            "Attachments": [
                {
                    "Name": `${pedido.codigoPedido}.pdf`,
                    "Content": pdfContent,
                    "ContentType": 'application/pdf'
                }
            ]
          }, (error, result) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else {
                res.status(200).json({ status: 'success', message: 'Email sent successfully!' });
            }
        });

    }catch(err){
        res.status(500).json({
            error: err.message
        });
    }
}


module.exports = {
    generarPagoDoc
  };
const Guia = require("../models/Guia");

const getGuiabyId = async (req, res) => {

    let id = req.params.id; 
    let guia = await Guia.findById(id);
    let url = guia.url; 

    return url; 
}

const createGuia = async(req, res) => {
    let pedidoscod = req.body.codigo;
    let productos = req.body.productos;
    let nseries = [];
    let guia = new Object();
    for(var i=0;i<productos.length;i++){
        nseries.push(productos[i]);
    }
    guia.pedidoID = pedidoscod;
    guia.nseries = nseries;
    let guiares = await Guia.create(guia);
    res.status(200).json({
        guiares
    })
}

module.exports = {
    getGuiabyId,
    createGuia
}

const Guia = require("../models/Guia");
const Inventario = require("../models/Inventario");
const Pedido = require("../models/Pedido");

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
        guia.codigoPedido = pedidoscod;
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
module.exports = {
    getGuiabyId,
    createGuia
}

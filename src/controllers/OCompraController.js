const OCompra = require('../models/OCompra');

const getAll = (req, res) => {
    OCompra.find({},(err, compras) =>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion: ${err}`
            })
        }

        if(!compras){
            return res.status(404).json({
                message: 'No existen las ordenes de compra'
            })
        }
        res.status(200).json({
            status: 'success',
            compras
        });
    });
}

const getOne = (req, res) => {

    const id = req.params.id;
    OCompra.findById(id,(err,compra)=>{
        if(err){
            return res.status(500).json({
                message: `Error al realizar la peticion ${err}`
            })
        }
        if(!compra){
            return res.status(404).json({
                message: 'No existe la orden de compra'
            })
        }
        res.status(200).json({
            status: 'success',
            compra
        });
    });

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


module.exports = {
    getAll,
    getOne,
    createOCompra
}
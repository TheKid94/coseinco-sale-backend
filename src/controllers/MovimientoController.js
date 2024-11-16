const MovimientoEntrada = require('../models/MovimientoEntrada');

const createMovimientoBasico = async (req, res) => {
    try {
      
        let newMovimiento = new Object();
        newMovimiento.archivosAdjuntos = [];
        newMovimiento.nSerie = "";
        newMovimiento.precioCompra = 0.00;
        newMovimiento.fechaCreacion = Date.now();
        newMovimiento.productID = "";

        let movRes = await MovimientoEntrada.create(newMovimiento);
        let movID = movRes._id;
        
        res.status(200).json({
            status: "success",
            movID
        });
    } catch (error) {
        res.status(500).json({
            error
        });
    }
}

module.exports = {
    createMovimientoBasico
}
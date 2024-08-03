const Movimiento = require('../models/Movimiento');

const createMovimientoBasico = async (req, res) => {
    try {
      
        let newMovimiento = new Object();
        newMovimiento.fechaCreacion = Date.now();
        newMovimiento.datosItems = [];
        newMovimiento.cantidadItems = 0;
        newMovimiento.filesOC = [];
        newMovimiento.tipoMovimiento = "entrada";
        newMovimiento.productID = "";

        let movRes = await Movimiento.create(newMovimiento);
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
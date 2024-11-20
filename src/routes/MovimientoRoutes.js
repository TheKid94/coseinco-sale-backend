const { Router } = require('express');
const router = Router();
const movimientoController = require('../controllers/MovimientoController');

router.route('/createMovimientoBasico').post(movimientoController.createMovimientoBasico);
router.route('/getMovimientoEntrada').get(movimientoController.getMovimientoEntrada);
router.route('/getMovimientoSalida').get(movimientoController.getMovimientoSalida);

module.exports = router
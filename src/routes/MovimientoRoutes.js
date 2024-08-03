const { Router } = require('express');
const router = Router();
const movimientoController = require('../controllers/MovimientoController');

router.route('/createMovimientoBasico').post(movimientoController.createMovimientoBasico);

module.exports = router
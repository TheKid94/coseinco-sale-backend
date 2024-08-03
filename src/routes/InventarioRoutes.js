const { Router } = require('express');
const router = Router();
const inventarioController = require('../controllers/InventarioController');

router.route('/getSeriesByProductId/:id').get(inventarioController.getSeriesByProductId);
router.route('/getInventarios').get(inventarioController.getInventarios);
router.route('/OCompraArchivo').post(inventarioController.OCompraURL);
router.route('/agregarInventario').post(inventarioController.agregarInventario);

module.exports = router
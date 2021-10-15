const { Router } = require('express');
const router = Router();
const inventarioController = require('../controllers/InventarioController');

router.route('/getSeriesByProductId/:id').get(inventarioController.getSeriesByProductId);

module.exports = router
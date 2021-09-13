const { Router } = require('express');
const router = Router();
const productoController = require('../controllers/ProductoController');

router.route('/').get(productoController.getAll);

module.exports = router;
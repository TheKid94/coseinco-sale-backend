const { Router } = require('express');
const router = Router();
const productoController = require('../controllers/ProductoController');

router.route('/').get(productoController.getAll);
router.route('/getById/:id').get(productoController.getOne);
router.route('/ProductosCompra').get(productoController.getAllProductoCompra);
router.route('/productoCarrito').post(productoController.productoCarrito);

module.exports = router;
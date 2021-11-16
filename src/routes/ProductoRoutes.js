const { Router } = require('express');
const router = Router();
const productoController = require('../controllers/ProductoController');

router.route('/').get(productoController.getAll);
router.route('/getById/:id').get(productoController.getOne);
router.route('/ProductosCompra').get(productoController.getAllProductoCompra);
router.route('/productoCarrito').post(productoController.productoCarrito);
router.route('/productoCreate').post(productoController.createProducto);
router.route('/productoImagen').post(productoController.ImagenProductoURL);
router.route('/anular').post(productoController.inhabilitarProducto);
router.route('/habilitar').post(productoController.habilitarProducto);

module.exports = router;
const { Router } = require( 'express' );
const { registerCustomQueryHandler } = require('puppeteer');
const router = Router();
const pedidoController = require('../controllers/PedidoController')

router.route('/').get(pedidoController.getAll);
router.route('/getPedido/:id').get(pedidoController.getOne);
router.route('/create').post(pedidoController.createPedido);

router.route('/getPedidoReservabyID').post(pedidoController.getPedidoReservabyId);
router.route('/admin/reservas').get(pedidoController.getPedidoParaReservar);

module.exports = router;
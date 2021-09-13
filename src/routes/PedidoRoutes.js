const { Router } = require( 'express' );
const router = Router();
const pedidoController = require('../controllers/PedidoController')

router.route('/').get(pedidoController.getAll);
router.route('/:id').get(pedidoController.getOne);

module.exports = router;
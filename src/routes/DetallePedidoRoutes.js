const { Router } = require('express');
const router = Router();
const detallePedidoController = require('../controllers/DetallePedidoController');

router.route('/').get(detallePedidoController.getAll);
router.route('/:id').get(detallePedidoController.getOne);

module.exports = router;
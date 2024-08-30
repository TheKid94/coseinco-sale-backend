const { Router } = require( 'express' );
const router = Router();
const chatBotController = require('../controllers/ChatBotController')

router.route('/pedidoByCliente').post(chatBotController.getPedidoByNumberDoc);
router.route('/productoBySKU').post(chatBotController.getProductoBySKU);
router.route('/productosByCategoriaId').post(chatBotController.getProductosByCategoriaId);

module.exports = router;
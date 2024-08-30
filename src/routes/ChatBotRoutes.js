const { Router } = require( 'express' );
const router = Router();
const chatBotController = require('../controllers/ChatBotController')

router.route('/pedidoByCliente').post(chatBotController.getPedidoByNumberDoc);
router.route('/productoById').get(chatBotController.getProductoBySKU);

module.exports = router;
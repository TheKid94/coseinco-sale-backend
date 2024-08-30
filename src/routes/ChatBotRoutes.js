const { Router } = require( 'express' );
const router = Router();
const chatBotController = require('../controllers/ChatBotController')

router.route('/pedidoByCliente').get(chatBotController.getPedidoByNumberDoc);

module.exports = router;
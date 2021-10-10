const { Router } = require( 'express' );
const router = Router();
const oCompraController= require('../controllers/OCompraController');

router.route('/').get(oCompraController.getAll);
router.route('/getOCompra/:id').get(oCompraController.getOne);

router.route('/create').post(oCompraController.createOCompra);

module.exports = router;
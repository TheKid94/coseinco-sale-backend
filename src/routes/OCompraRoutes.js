const { Router } = require( 'express' );
const router = Router();
const oCompraController= require('../controllers/OCompraController');

router.route('/').get(oCompraController.getAll);
router.route('/getById/:id').get(oCompraController.getOne);

router.route('/create').post(oCompraController.createOCompra);

module.exports = router;
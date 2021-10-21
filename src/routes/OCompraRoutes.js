const { Router } = require( 'express' );
const router = Router();
const oCompraController= require('../controllers/OCompraController');

router.route('/').get(oCompraController.getAll);
router.route('/getById/:id').get(oCompraController.getOne);

router.route('/anular').post(oCompraController.anularOCompra);
router.route('/create').post(oCompraController.createOCompra);
router.route('/enviarNotificacion').post(oCompraController.enviarNotificacion);
router.route('/oCompraToInventario').post(oCompraController.oCompraToInventario);
router.route('/oCompraAcceptByProv').post(oCompraController.oCompraAcceptByProveedor);

module.exports = router;
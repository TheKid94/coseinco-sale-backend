const { Router } = require( 'express' );
const router = Router();
const proveedorController = require('../controllers/ProveedorController');

router.route('/').get(proveedorController.getAll);
router.route('/getProveedor/:id').get(proveedorController.getOne);

router.route('/create').post(proveedorController.createProveedor);
router.route('/modify').post(proveedorController.modifyProveedor);
router.route('/deshabilitar').post(proveedorController.deshabilitarProveedor);
router.route('/habilitar').post(proveedorController.habilitarProveedor);
    

module.exports = router;
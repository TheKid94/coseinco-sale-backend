const {Router} = require( 'express' );
const router = Router();
const rolController = require( '../controllers/RolController' );

router.route('/').get(rolController.getAll);
router.route('/admin').get(rolController.getAdminroles);

module.exports = router;
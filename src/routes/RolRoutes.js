const {Router} = require( 'express' );
const router = Router();
const rolController = require( '../controllers/RolController' );

router.route('/').get(rolController.getAll);

module.exports = router;
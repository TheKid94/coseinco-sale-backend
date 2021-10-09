const { Router } = require('express');
const router = Router();
const inventarioController = require('../controllers/InventarioController');

router.route('/getInvbyProductId/:id').get(inventarioController.getInventariobyProductId);

module.exports = router
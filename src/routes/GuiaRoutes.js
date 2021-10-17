const { Router } = require('express');
const router = Router();
const GuiaController = require('../controllers/GuiaController');

router.route('/getGuiaInfo').post(GuiaController.getGuiaInfo);
router.route('/createGuia').post(GuiaController.createGuia);
router.route('/createGuiaPDF').post(GuiaController.createGuiaPDF);

module.exports = router; 
const { Router } = require('express');
const router = Router();
const GuiaController = require('../controllers/GuiaController');

router.route('/getFile/:id').get(GuiaController.getGuiabyId);
router.route('/createGuia').post(GuiaController.createGuia);

module.exports = router; 
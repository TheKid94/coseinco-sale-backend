const { Router } = require('express');
const router = Router();
const GuiaController = require('../controllers/GuiaController');

router.route('/getFile/:id').get(GuiaController.getGuiabyId); 

module.exports = router; 
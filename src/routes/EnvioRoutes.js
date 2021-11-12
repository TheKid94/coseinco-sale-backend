const { Router } = require('express');
const router = Router();
const EnvioController = require('../controllers/EnvioController');

router.route('/createEnvio').post(EnvioController.createEnvio);

module.exports = router; 
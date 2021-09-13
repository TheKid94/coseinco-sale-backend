const { Router } = require('express');
const router = Router();
const marcaController = require('../controllers/MarcaController');

router.route('/').get(marcaController.getAll);

module.exports = router;
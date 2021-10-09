const { Router } = require('express');
const router = Router();
const marcaController = require('../controllers/MarcaController');

router.route('/').get(marcaController.getAll);
router.route('/getMarca/:id').get(marcaController.getOne);

module.exports = router;
const { Router } = require('express');
const router = Router();
const marcaController = require('../controllers/MarcaController');

router.route('/').get(marcaController.getAll);
router.route('/create').post(marcaController.createMarca);
router.route('/getMarca/:id').get(marcaController.getOne);

module.exports = router;
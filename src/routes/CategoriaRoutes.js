const { Router } = require('express');
const router = Router();
const categoriaController = require('../controllers/CategoriaController');

router.route('/').get(categoriaController.getAll);
router.route('/:id').get(categoriaController.getOne);
router.route('/create').post(categoriaController.createCategoria);


module.exports = router;
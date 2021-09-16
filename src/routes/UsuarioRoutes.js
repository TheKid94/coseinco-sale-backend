const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/UsuarioController')

router.route('/').get(usuarioController.getAll);
router.route('/:id').get(usuarioController.getUser);

module.exports = router;
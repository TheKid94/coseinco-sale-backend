const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/UsuarioController')

router.route('/').get(usuarioController.getAll);
router.route('/getUsuario/:id').get(usuarioController.getUser);
router.route('/getConductores').get(usuarioController.getUserConductores);

module.exports = router;
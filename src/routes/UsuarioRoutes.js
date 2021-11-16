const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/UsuarioController')

router.route('/').get(usuarioController.getAll);
router.route('/getUsuario/:id').get(usuarioController.getUser);
router.route('/getConductores').get(usuarioController.getUserConductores);
router.route('/getUsariosAdmin').get(usuarioController.getUsersAdmin);

router.route('/imagenDestroy').post(usuarioController.eliminateImage);


module.exports = router;
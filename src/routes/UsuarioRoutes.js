const { Router } = require('express');
const router = Router();
const usuarioController = require('../controllers/UsuarioController')

router.route('/').get(usuarioController.getAll);
router.route('/getUsuario/:id').get(usuarioController.getUser);
router.route('/login').post(usuarioController.getLogin);
router.route('/getConductores').get(usuarioController.getUserConductores);
router.route('/getUsuariosAdmin').get(usuarioController.getUsersAdmin);

router.route('/imagenDestroy').post(usuarioController.eliminateImage);
router.route('/create').post(usuarioController.createUser);
router.route('/update').post(usuarioController.updateUser);
router.route('/stateChange').post(usuarioController.stateChangeUser);


module.exports = router;
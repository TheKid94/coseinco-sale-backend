const { Router } = require('express');
const router = Router();
const DocumentoController = require('../controllers/DocumentoController');

router.route('/createPagoDoc').post(DocumentoController.generarPagoDoc);

module.exports = router; 
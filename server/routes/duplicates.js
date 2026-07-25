const express = require('express');
const router = express.Router();
const {
  checkSareeEndpoint,
  checkBeamEndpoint,
  checkCombinationEndpoint,
  checkWhatsAppBatchEndpoint,
} = require('../controllers/duplicateController');
const { authenticate } = require('../middleware/auth');

router.post('/check-saree',           authenticate, checkSareeEndpoint);
router.post('/check-beam',            authenticate, checkBeamEndpoint);
router.post('/check-combination',     authenticate, checkCombinationEndpoint);
router.post('/check-whatsapp-batch',  authenticate, checkWhatsAppBatchEndpoint);

module.exports = router;

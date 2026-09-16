const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  parseWhatsAppMessage,
  handleWhatsAppWebhook,
  ocrWhatsAppImage,
  ocrStatus,
} = require('../controllers/parserController');
const { authenticate } = require('../middleware/auth');

// In-memory upload for OCR screenshots (max 10MB, images only).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

router.post('/whatsapp', authenticate, parseWhatsAppMessage);
router.get('/ocr-status', authenticate, ocrStatus);
router.post('/ocr', authenticate, upload.single('image'), ocrWhatsAppImage);
router.post('/whatsapp-webhook', handleWhatsAppWebhook);

module.exports = router;

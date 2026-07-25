const express = require('express');
const router = express.Router();
const { updateStock, undoStockChange, rollbackStockChange, getHistory, getLedgerStats, deleteHistoryRecord } = require('../controllers/stockController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateStockUpdate } = require('../middleware/validation');

router.patch('/update', authenticate, validateStockUpdate, updateStock);
router.patch('/undo/:historyId', authenticate, authorize('admin', 'staff'), undoStockChange);
router.post('/rollback/:historyId', authenticate, authorize('admin'), rollbackStockChange);
router.get('/history', authenticate, getHistory);
router.get('/stats', authenticate, getLedgerStats);
router.delete('/history/:historyId', authenticate, authorize('admin'), deleteHistoryRecord);

module.exports = router;

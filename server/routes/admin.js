const express = require('express');
const router = express.Router();
const {
  getAccounts,
  updateAccountPlan,
  extendDeadline,
  toggleStatus,
  createAccount,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/accounts', getAccounts);
router.put('/accounts/:id/plan', updateAccountPlan);
router.post('/accounts/:id/extend', extendDeadline);
router.put('/accounts/:id/status', toggleStatus);
router.post('/accounts', createAccount);

module.exports = router;

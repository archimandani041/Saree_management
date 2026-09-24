/**
 * Admin Controller
 * Manages accounts, plans, deadlines, and multi-tenant quotas for Super Admin
 */
const adminService = require('../services/adminService');

/**
 * GET /api/admin/accounts
 * Retrieve all registered boutique accounts with their plan details & deadlines
 */
const getAccounts = async (req, res) => {
  try {
    const result = await adminService.getAllAccounts();
    res.json(result);
  } catch (error) {
    console.error('getAccounts error:', error);
    res.status(500).json({ error: 'Failed to retrieve accounts: ' + error.message });
  }
};

/**
 * PUT /api/admin/accounts/:id/plan
 * Update an account's plan tier, deadline, status, and limits
 */
const updateAccountPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, renewDate, status, customLimits, phone, notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updated = await adminService.updateAccountPlan(id, {
      planId,
      renewDate,
      status,
      customLimits,
      phone,
      notes,
    });

    res.json({ message: 'Account plan updated successfully', plan: updated });
  } catch (error) {
    console.error('updateAccountPlan error:', error);
    res.status(500).json({ error: 'Failed to update account plan: ' + error.message });
  }
};

/**
 * POST /api/admin/accounts/:id/extend
 * Extend an account's plan deadline by N days or to a specific date
 */
const extendDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { days, date } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updated = await adminService.extendDeadline(id, { days, date });
    res.json({ message: 'Plan deadline extended successfully', plan: updated });
  } catch (error) {
    console.error('extendDeadline error:', error);
    res.status(500).json({ error: 'Failed to extend deadline: ' + error.message });
  }
};

/**
 * PUT /api/admin/accounts/:id/status
 * Activate or suspend an account
 */
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!id || is_active === undefined) {
      return res.status(400).json({ error: 'User ID and is_active flag are required' });
    }

    const updated = await adminService.toggleAccountStatus(id, Boolean(is_active));
    res.json({ message: `Account ${is_active ? 'activated' : 'suspended'} successfully`, user: updated });
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.status(500).json({ error: 'Failed to update account status: ' + error.message });
  }
};

/**
 * POST /api/admin/accounts
 * Register a new boutique account with pre-assigned plan and deadline
 */
const createAccount = async (req, res) => {
  try {
    const { email, password, full_name, username, role, planId, deadlineDays, company_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await adminService.createAccount({
      email,
      password,
      full_name,
      username,
      role,
      planId,
      deadlineDays,
      company_name,
      phone,
    });

    res.status(201).json({ message: 'Account created successfully', ...result });
  } catch (error) {
    console.error('createAccount error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
};

/**
 * POST /api/admin/accounts/:id/cancel
 * Cancel an account's plan
 */
const cancelAccountPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { immediate, reason } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updated = await adminService.cancelAccountPlan(id, { immediate, reason });
    res.json({ message: 'Account plan cancelled successfully', plan: updated });
  } catch (error) {
    console.error('cancelAccountPlan error:', error);
    res.status(500).json({ error: 'Failed to cancel plan: ' + error.message });
  }
};

/**
 * POST /api/admin/accounts/:id/resume
 * Reactivate an account's plan
 */
const resumeAccountPlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updated = await adminService.resumeAccountPlan(id);
    res.json({ message: 'Account plan reactivated successfully', plan: updated });
  } catch (error) {
    console.error('resumeAccountPlan error:', error);
    res.status(500).json({ error: 'Failed to reactivate plan: ' + error.message });
  }
};

module.exports = {
  getAccounts,
  updateAccountPlan,
  extendDeadline,
  toggleStatus,
  createAccount,
  cancelAccountPlan,
  resumeAccountPlan,
};

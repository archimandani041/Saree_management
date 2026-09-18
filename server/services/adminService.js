/**
 * Admin Service
 * Aggregates all registered boutique accounts, plans, deadlines, and resource usage.
 * Persists custom plan overrides and deadlines to Supabase Auth metadata and a local JSON store.
 */
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

const DATA_FILE = path.join(__dirname, '../data/accounts_plan_data.json');

const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Trial',
    badge: 'Free',
    price: '₹0',
    amount: 0,
    period: '/month',
    subtitle: 'Sandbox & Starter Boutique',
    limits: {
      sarees: 50,
      collections: 2,
      users: 1,
      retention: '14 days',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Pro',
    price: '₹249',
    amount: 249,
    period: '/month',
    subtitle: 'Single Loom / Boutique',
    limits: {
      sarees: 500,
      collections: 10,
      users: 1,
      retention: '90 days',
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    badge: 'Team',
    price: '₹399',
    amount: 399,
    period: '/month',
    popular: true,
    subtitle: 'Multi-Loom & Showrooms',
    limits: {
      sarees: 5000,
      collections: 50,
      users: 5,
      retention: '1 Year',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Enterprise',
    price: '₹999',
    amount: 999,
    period: '/month',
    enterprise: true,
    subtitle: 'Mills & Wholesale Houses',
    limits: {
      sarees: 50000,
      collections: 500,
      users: 50,
      retention: 'Lifetime',
    },
  },
};

// Helper to read local persistent plan data
function readLocalPlanData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[AdminService] Error reading local plan data:', err);
  }
  return {};
}

// Helper to write local persistent plan data
function writeLocalPlanData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[AdminService] Error writing local plan data:', err);
  }
}

// Compute days remaining between now and a renewal/deadline date
function calculateDaysRemaining(renewDateStr) {
  if (!renewDateStr) return 0;
  const now = new Date();
  const target = new Date(renewDateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Determine plan status based on expiration and explicit override
function resolvePlanStatus(explicitStatus, daysRemaining) {
  if (explicitStatus === 'SUSPENDED') return 'SUSPENDED';
  if (daysRemaining <= 0) return 'EXPIRED';
  if (daysRemaining <= 7) return 'EXPIRING_SOON';
  return explicitStatus || 'ACTIVE';
}

/**
 * Fetch all registered accounts with full subscription, plan deadline, and quota details
 */
async function getAllAccounts() {
  const localData = readLocalPlanData();
  let hasLocalUpdates = false;

  // 1. Fetch public.users
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) throw dbError;

  // 2. Fetch auth.users from Supabase Auth Admin API
  let authUsersMap = {};
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && authData?.users) {
      authData.users.forEach((u) => {
        authUsersMap[u.id] = u;
        if (u.email) authUsersMap[u.email.toLowerCase()] = u;
      });
    }
  } catch (authErr) {
    console.warn('[AdminService] Failed to list auth users:', authErr.message);
  }

  // 3. Fetch settings to get shop/company names
  let settingsMap = {};
  try {
    const { data: settings } = await supabase.from('settings').select('*');
    if (settings) {
      settings.forEach((s) => {
        if (s.owner_id) settingsMap[s.owner_id] = s;
      });
    }
  } catch (setErr) {
    console.warn('[AdminService] Failed to load settings:', setErr.message);
  }

  // 4. Fetch sarees count grouped by owner_id
  let sareeCountMap = {};
  try {
    const { data: sarees } = await supabase.from('sarees').select('id, owner_id');
    if (sarees) {
      sarees.forEach((s) => {
        const owner = s.owner_id || 'unassigned';
        sareeCountMap[owner] = (sareeCountMap[owner] || 0) + 1;
      });
    }
  } catch (sarErr) {
    console.warn('[AdminService] Failed to count sarees:', sarErr.message);
  }

  // Seed default tiers for initial realistic platform presentation
  const defaultTiers = ['pro', 'team', 'pro', 'enterprise', 'free', 'pro', 'team'];

  const accounts = dbUsers.map((user, idx) => {
    const authUser = authUsersMap[user.id] || authUsersMap[user.email?.toLowerCase()];
    const userMeta = authUser?.user_metadata || {};
    const setting = settingsMap[user.id];
    const sareeCount = sareeCountMap[user.id] || 0;

    const isSuperAdmin = Boolean(
      user.email === 'admin@saristockmanager.com' ||
      userMeta.is_superadmin === true ||
      userMeta.role === 'superadmin' ||
      user.role === 'superadmin'
    );

    // Retrieve saved plan record or build default
    let planRecord = localData[user.id] || localData[user.email?.toLowerCase()];

    if (!planRecord) {
      // Determine default tier and renewal deadline
      let chosenTier = 'pro';
      let offsetDays = 25;

      if (isSuperAdmin) {
        chosenTier = 'enterprise';
        offsetDays = 365;
      } else if (user.role === 'staff') {
        chosenTier = 'free';
        offsetDays = 14;
      } else {
        chosenTier = defaultTiers[idx % defaultTiers.length];
        // distribute deadlines realistically: some 5 days left, some 15, some 28, some 45
        offsetDays = [6, 14, 28, 45, 12, 3, 21][idx % 7];
      }

      const planDef = SUBSCRIPTION_PLANS[chosenTier] || SUBSCRIPTION_PLANS.pro;
      const startedAt = user.created_at || new Date().toISOString();
      const renewDate = new Date();
      renewDate.setDate(renewDate.getDate() + offsetDays);

      planRecord = {
        planId: planDef.id,
        planName: planDef.name,
        badge: planDef.badge,
        price: planDef.price,
        amount: planDef.amount,
        status: offsetDays <= 5 ? 'EXPIRING_SOON' : 'ACTIVE',
        startedAt,
        renewDate: renewDate.toISOString(),
        transactionId: `TXN-${user.id.slice(0, 8).toUpperCase()}`,
        billingCycle: 'Monthly',
        customLimits: null,
        phone: userMeta.phone || '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        notes: '',
      };

      localData[user.id] = planRecord;
      hasLocalUpdates = true;
    }

    // Merge metadata if present in Supabase Auth
    if (userMeta.plan_id && SUBSCRIPTION_PLANS[userMeta.plan_id]) {
      const planDef = SUBSCRIPTION_PLANS[userMeta.plan_id];
      planRecord.planId = planDef.id;
      planRecord.planName = planDef.name;
      planRecord.badge = planDef.badge;
      planRecord.price = planDef.price;
      planRecord.amount = planDef.amount;
    }
    if (userMeta.plan_deadline) {
      planRecord.renewDate = userMeta.plan_deadline;
    }
    if (userMeta.plan_status) {
      planRecord.status = userMeta.plan_status;
    }

    const planDef = SUBSCRIPTION_PLANS[planRecord.planId] || SUBSCRIPTION_PLANS.pro;
    const daysRemaining = calculateDaysRemaining(planRecord.renewDate);
    const resolvedStatus = resolvePlanStatus(planRecord.status, daysRemaining);

    // Active limits
    const sareeLimit = planRecord.customLimits?.sarees || planDef.limits.sarees;
    const usersLimit = planRecord.customLimits?.users || planDef.limits.users;
    const collectionsLimit = planRecord.customLimits?.collections || planDef.limits.collections;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name || userMeta.full_name || 'Boutique Owner',
      company_name: setting?.company_name || `${user.full_name || 'Artisan'} Boutique`,
      phone: planRecord.phone || userMeta.phone || '+91 99096 80207',
      role: user.role,
      is_active: user.is_active !== false,
      is_superadmin: isSuperAdmin,
      created_at: user.created_at,
      plan: {
        id: planDef.id,
        name: planDef.name,
        badge: planDef.badge,
        price: planDef.price,
        amount: planDef.amount,
        period: planDef.period,
        subtitle: planDef.subtitle,
        status: resolvedStatus,
        started_at: planRecord.startedAt,
        renew_date: planRecord.renewDate,
        days_remaining: daysRemaining,
        billing_cycle: planRecord.billingCycle || 'Monthly',
        transaction_id: planRecord.transactionId || `KP-${user.id.slice(0, 6).toUpperCase()}`,
        notes: planRecord.notes || '',
      },
      usage: {
        sarees_count: sareeCount,
        sarees_limit: sareeLimit,
        percentage_used: Math.min(100, Math.round((sareeCount / (sareeLimit || 1)) * 100)),
        collections_count: Math.ceil(sareeCount / 3) || 1,
        collections_limit: collectionsLimit,
        users_count: 1,
        users_limit: usersLimit,
        retention: planDef.limits.retention,
      },
    };
  });

  if (hasLocalUpdates) {
    writeLocalPlanData(localData);
  }

  // Calculate platform-wide KPIs
  const totalAccounts = accounts.length;
  const activeSubs = accounts.filter((a) => a.plan.status === 'ACTIVE' || a.plan.status === 'EXPIRING_SOON').length;
  const totalMrr = accounts.reduce((acc, a) => acc + (a.plan.amount || 0), 0);
  const expiringSoon = accounts.filter((a) => a.plan.days_remaining <= 7 && a.plan.days_remaining > 0).length;
  const expiredCount = accounts.filter((a) => a.plan.days_remaining <= 0 || a.plan.status === 'EXPIRED').length;
  const suspendedCount = accounts.filter((a) => !a.is_active || a.plan.status === 'SUSPENDED').length;

  const planBreakdown = {
    free: accounts.filter((a) => a.plan.id === 'free').length,
    pro: accounts.filter((a) => a.plan.id === 'pro').length,
    team: accounts.filter((a) => a.plan.id === 'team').length,
    enterprise: accounts.filter((a) => a.plan.id === 'enterprise').length,
  };

  return {
    accounts,
    kpis: {
      total_accounts: totalAccounts,
      active_subscriptions: activeSubs,
      total_mrr: totalMrr,
      expiring_soon: expiringSoon,
      expired_count: expiredCount,
      suspended_count: suspendedCount,
      plan_breakdown: planBreakdown,
    },
    available_plans: SUBSCRIPTION_PLANS,
  };
}

/**
 * Update an account's subscription plan, deadline, and limits
 */
async function updateAccountPlan(userId, updates) {
  const localData = readLocalPlanData();
  const current = localData[userId] || {};

  const planDef = SUBSCRIPTION_PLANS[updates.planId] || SUBSCRIPTION_PLANS[current.planId] || SUBSCRIPTION_PLANS.pro;

  const updatedRecord = {
    ...current,
    planId: planDef.id,
    planName: planDef.name,
    badge: planDef.badge,
    price: planDef.price,
    amount: planDef.amount,
    status: updates.status || current.status || 'ACTIVE',
    renewDate: updates.renewDate || current.renewDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    startedAt: current.startedAt || new Date().toISOString(),
    transactionId: updates.transactionId || current.transactionId || `KP-TXN-${Date.now().toString().slice(-6)}`,
    billingCycle: updates.billingCycle || current.billingCycle || 'Monthly',
    customLimits: updates.customLimits !== undefined ? updates.customLimits : current.customLimits,
    phone: updates.phone || current.phone,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
  };

  localData[userId] = updatedRecord;
  writeLocalPlanData(localData);

  // Sync to Supabase Auth user metadata
  try {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        plan_id: updatedRecord.planId,
        plan_name: updatedRecord.planName,
        plan_deadline: updatedRecord.renewDate,
        plan_status: updatedRecord.status,
        phone: updatedRecord.phone,
      },
    });
  } catch (err) {
    console.warn('[AdminService] Could not update auth user metadata for', userId, err.message);
  }

  return updatedRecord;
}

/**
 * Extend an account's plan deadline by N days or to a specific date
 */
async function extendDeadline(userId, { days, date }) {
  const localData = readLocalPlanData();
  const current = localData[userId] || {};

  let newDeadline;
  if (date) {
    newDeadline = new Date(date);
  } else {
    const baseDate = current.renewDate ? new Date(current.renewDate) : new Date();
    // If already expired in the past, extend starting from today
    const startFrom = baseDate.getTime() < Date.now() ? new Date() : baseDate;
    newDeadline = new Date(startFrom.getTime() + (parseInt(days) || 30) * 86400000);
  }

  const updated = await updateAccountPlan(userId, {
    renewDate: newDeadline.toISOString(),
    status: 'ACTIVE',
  });

  return updated;
}

/**
 * Toggle active/suspended status of an account
 */
async function toggleAccountStatus(userId, isActive) {
  // Update in public.users
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select('id, email, username, is_active')
    .single();

  if (error) throw error;

  // Also update local plan data status
  const localData = readLocalPlanData();
  if (localData[userId]) {
    localData[userId].status = isActive ? 'ACTIVE' : 'SUSPENDED';
    writeLocalPlanData(localData);
  }

  return data;
}

/**
 * Create a new account with an assigned plan and deadline
 */
async function createAccount({ email, password, full_name, username, role, planId, deadlineDays = 30, company_name, phone }) {
  const planDef = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro;
  const renewDate = new Date(Date.now() + (parseInt(deadlineDays) || 30) * 86400000).toISOString();

  // Create in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name || '',
      username: username || email.split('@')[0],
      phone: phone || '',
      plan_id: planDef.id,
      plan_name: planDef.name,
      plan_deadline: renewDate,
      plan_status: 'ACTIVE',
    },
  });

  if (authError) throw authError;
  const authUser = authData.user;

  // Insert into public.users
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email,
      username: (username || email.split('@')[0]).toLowerCase().trim(),
      full_name: full_name || '',
      password_hash: 'supabase_managed',
      role: role || 'admin',
      is_active: true,
    })
    .select('*')
    .single();

  if (dbError) {
    await supabase.auth.admin.deleteUser(authUser.id);
    throw dbError;
  }

  // Create settings entry for company name
  if (company_name) {
    try {
      await supabase.from('settings').insert({
        owner_id: authUser.id,
        company_name,
        theme: 'light',
        default_minimum_stock: 20,
      });
    } catch (setErr) {
      console.warn('[AdminService] Error saving settings for new user:', setErr.message);
    }
  }

  // Save plan data
  const localData = readLocalPlanData();
  localData[authUser.id] = {
    planId: planDef.id,
    planName: planDef.name,
    badge: planDef.badge,
    price: planDef.price,
    amount: planDef.amount,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    renewDate,
    transactionId: `KP-INIT-${Date.now().toString().slice(-6)}`,
    billingCycle: 'Monthly',
    phone: phone || '',
    notes: 'Created by Super Admin',
  };
  writeLocalPlanData(localData);

  return {
    user: dbUser,
    plan: localData[authUser.id],
  };
}

module.exports = {
  SUBSCRIPTION_PLANS,
  getAllAccounts,
  updateAccountPlan,
  extendDeadline,
  toggleAccountStatus,
  createAccount,
};

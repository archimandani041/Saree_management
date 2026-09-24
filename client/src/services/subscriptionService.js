/**
 * Subscription & Account Plan Limits Service
 * Manages subscription tiers, resource quotas, usage analytics, and invoice history.
 */

export const SUBSCRIPTION_PLANS = {
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
    features: [
      'Up to 50 Saree SKUs & combinations',
      'Live stock & shortage monitoring',
      'Standard barcode & QR generation',
      '1 Admin user seat',
      '14 days stock history retention',
    ],
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
    features: [
      'Up to 500 Saree SKUs & combinations',
      'Live stock & shortage monitoring',
      'WhatsApp low-stock alerts',
      'Inventory movement history ledger',
      '1 Admin user seat',
      'Basic sales & stock analytics',
      'Standard community & email support',
    ],
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
    features: [
      'Unlimited Saree designs & color series (A→Z)',
      'AI demand forecasting (7d / 15d / 30d / 60d / 90d)',
      'WhatsApp supplier replenishment trigger',
      'Beam architecture & master weaver ledger',
      'Stock requests & approval workflow',
      'Multi-role access (Admin & Staff seats)',
      'Excel & PDF full ERP ledger exports',
      'Priority WhatsApp & phone support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Enterprise',
    price: 'Custom (₹999)',
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
    features: [
      'Unlimited loom clusters & weaving contracts',
      'Multi-warehouse & retail store transfer routing',
      'Custom ERP API & webhook integration',
      'Dedicated account manager & SLA (99.9%)',
      'Custom invoice branding & GST compliance engine',
      'On-premise / isolated cloud deployment support',
    ],
  },
};

const STORAGE_KEY_SUBSCRIPTION = 'sari_subscription';
const STORAGE_KEY_INVOICES = 'sari_invoices';

// Helper to seed initial subscription if not present
export const getActiveSubscription = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (SUBSCRIPTION_PLANS[parsed.planId]) {
        let daysRemaining = parsed.daysRemaining;
        if (parsed.renewDate) {
          const diffMs = new Date(parsed.renewDate).getTime() - new Date().getTime();
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          ...SUBSCRIPTION_PLANS[parsed.planId],
          ...parsed,
          daysRemaining: daysRemaining !== undefined ? daysRemaining : 12,
        };
      }
    }
  } catch (e) {
    console.error('Error reading subscription:', e);
  }

  // Default to Pro Plan
  const defaultSub = {
    planId: 'pro',
    name: 'Pro',
    status: 'ACTIVE',
    startedAt: '2026-09-01T00:00:00.000Z',
    renewDate: '2026-09-30T23:59:59.000Z',
    transactionId: 'KP-INIT-PRO-2026',
    billingCycle: 'Sep 01, 2026 – Sep 30, 2026',
    daysRemaining: 12,
  };

  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(defaultSub));
  } catch (_) {}

  return {
    ...SUBSCRIPTION_PLANS.pro,
    ...defaultSub,
  };
};

export const updateSubscription = (planId, paymentDetails = {}) => {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro;
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setDate(nextMonth.getDate() + 30);

  const startFormatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const endFormatted = nextMonth.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  const updated = {
    planId: plan.id,
    name: plan.name,
    status: 'ACTIVE',
    startedAt: now.toISOString(),
    renewDate: nextMonth.toISOString(),
    transactionId: paymentDetails.transactionId || `KP-TXN-${Date.now().toString().slice(-6)}`,
    billingCycle: `${startFormatted} – ${endFormatted}`,
    daysRemaining: 30,
    amount: plan.amount,
    cancellationPending: false,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    cancellationReason: null,
    autoRenew: true,
  };

  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(updated));
    sessionStorage.setItem('sari_active_subscription', JSON.stringify(updated));

    // Record invoice
    if (plan.amount > 0) {
      addInvoice({
        id: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        date: startFormatted,
        planName: `${plan.name} Plan - Monthly`,
        amount: plan.amount,
        status: 'PAID',
        paymentMethod: paymentDetails.method || 'UPI / Card',
        transactionId: updated.transactionId,
      });
    }

    window.dispatchEvent(new CustomEvent('sari_subscription_changed', { detail: updated }));
  } catch (e) {
    console.error('Failed to update subscription:', e);
  }

  return {
    ...plan,
    ...updated,
  };
};

/**
 * Cancel the current subscription
 * @param {Object} options
 * @param {boolean} options.immediate - If true, immediately reverts to free sandbox tier; if false, keeps access until renewDate.
 * @param {string} options.reason - Reason for cancellation.
 * @param {string} options.feedback - Optional feedback.
 */
export const cancelSubscription = ({ immediate = false, reason = '', feedback = '' } = {}) => {
  const current = getActiveSubscription();
  const now = new Date();

  let updated;
  if (immediate) {
    const freePlan = SUBSCRIPTION_PLANS.free;
    updated = {
      ...current,
      planId: freePlan.id,
      name: freePlan.name,
      badge: freePlan.badge,
      price: freePlan.price,
      amount: freePlan.amount,
      period: freePlan.period,
      limits: freePlan.limits,
      features: freePlan.features,
      status: 'CANCELLED',
      cancellationPending: false,
      immediate: true,
      cancelledAt: now.toISOString(),
      cancellationReason: reason || 'Immediate cancellation',
      feedback: feedback || '',
      autoRenew: false,
    };
  } else {
    updated = {
      ...current,
      status: 'CANCELLED',
      cancellationPending: true,
      immediate: false,
      cancelledAt: now.toISOString(),
      cancellationReason: reason || 'End of billing period cancellation',
      feedback: feedback || '',
      autoRenew: false,
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(updated));
    sessionStorage.setItem('sari_active_subscription', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sari_subscription_changed', { detail: updated }));
  } catch (e) {
    console.error('Failed to cancel subscription:', e);
  }

  return updated;
};

/**
 * Reactivate / Resume a cancelled subscription
 */
export const resumeSubscription = () => {
  const current = getActiveSubscription();
  const restoredPlanId = current.planId === 'free' ? 'pro' : current.planId;
  const planDef = SUBSCRIPTION_PLANS[restoredPlanId] || SUBSCRIPTION_PLANS.pro;

  const updated = {
    ...current,
    ...planDef,
    status: 'ACTIVE',
    cancellationPending: false,
    immediate: false,
    cancelledAt: null,
    cancellationReason: null,
    feedback: null,
    autoRenew: true,
  };

  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(updated));
    sessionStorage.setItem('sari_active_subscription', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sari_subscription_changed', { detail: updated }));
  } catch (e) {
    console.error('Failed to resume subscription:', e);
  }

  return updated;
};

// Invoices Management
export const getInvoices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading invoices:', e);
  }

  // Seed default initial invoice for demonstration matching Screenshot 3
  const seedInvoices = [
    {
      id: 'INV-2026-89421',
      date: 'Sep 01, 2026',
      planName: 'Pro Plan - Monthly',
      amount: 249,
      status: 'PAID',
      paymentMethod: 'UPI (9909680207@upi)',
      transactionId: 'KP-PAY-98234190',
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(seedInvoices));
  } catch (_) {}

  return seedInvoices;
};

export const addInvoice = (invoice) => {
  try {
    const existing = getInvoices();
    const updated = [invoice, ...existing];
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sari_invoices_changed', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error adding invoice:', e);
    return [];
  }
};

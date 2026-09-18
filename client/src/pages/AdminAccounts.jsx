/**
 * Super Admin Account & Subscription Management Console
 * Unified Master Ledger for all registered accounts, plans, deadlines, and quotas.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { SUBSCRIPTION_PLANS } from '../services/subscriptionService';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  PlusCircle,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Sparkles,
  Zap,
  Store,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  PhoneCall,
  Lock,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useSnackbar } from 'notistack';

export default function AdminAccounts() {
  const { user, isSuperAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Data state
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [kpis, setKpis] = useState({
    total_accounts: 0,
    active_subscriptions: 0,
    total_mrr: 0,
    expiring_soon: 0,
    expired_count: 0,
    suspended_count: 0,
    plan_breakdown: { free: 0, pro: 0, team: 0, enterprise: 0 }
  });

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline_asc');

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Plan Form State
  const [editForm, setEditForm] = useState({
    planId: 'pro',
    renewDate: '',
    status: 'ACTIVE',
    customSareesLimit: '',
    phone: '',
    notes: ''
  });

  // Create Account Form State
  const [createForm, setCreateForm] = useState({
    full_name: '',
    company_name: '',
    email: '',
    username: '',
    password: '',
    phone: '+91 ',
    planId: 'pro',
    deadlineDays: 30,
    role: 'admin'
  });

  // Fetch all accounts from backend
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAccounts();
      if (res.data) {
        setAccounts(res.data.accounts || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
      enqueueSnackbar('Failed to fetch accounts: ' + (err.response?.data?.error || err.message), {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle opening edit modal
  const handleOpenEdit = (account) => {
    setSelectedAccount(account);
    const renewDateFormatted = account.plan?.renew_date
      ? new Date(account.plan.renew_date).toISOString().split('T')[0]
      : '';

    setEditForm({
      planId: account.plan?.id || 'pro',
      renewDate: renewDateFormatted,
      status: account.plan?.status || 'ACTIVE',
      customSareesLimit: account.usage?.sarees_limit || '',
      phone: account.phone || '',
      notes: account.plan?.notes || ''
    });
    setEditModalOpen(true);
  };

  // Handle saving plan edits
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setActionLoading(true);
    try {
      const renewIso = editForm.renewDate
        ? new Date(`${editForm.renewDate}T23:59:59.000Z`).toISOString()
        : undefined;

      const payload = {
        planId: editForm.planId,
        renewDate: renewIso,
        status: editForm.status,
        customLimits: editForm.customSareesLimit
          ? { sarees: parseInt(editForm.customSareesLimit, 10) }
          : undefined,
        phone: editForm.phone,
        notes: editForm.notes
      };

      await adminAPI.updatePlan(selectedAccount.id, payload);
      enqueueSnackbar(`Successfully updated ${selectedAccount.full_name}'s plan & deadline!`, {
        variant: 'success'
      });
      setEditModalOpen(false);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to update plan:', err);
      enqueueSnackbar(err.response?.data?.error || 'Failed to update plan', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick deadline extension (+N days)
  const handleQuickExtend = async (account, days = 30) => {
    setActionLoading(true);
    try {
      await adminAPI.extendDeadline(account.id, { days });
      enqueueSnackbar(`Extended ${account.full_name}'s deadline by +${days} days!`, {
        variant: 'success'
      });
      fetchAccounts();
    } catch (err) {
      enqueueSnackbar('Failed to extend deadline: ' + (err.response?.data?.error || err.message), {
        variant: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle active/suspended
  const handleToggleStatus = async (account) => {
    const newStatus = !account.is_active;
    setActionLoading(true);
    try {
      await adminAPI.toggleStatus(account.id, { is_active: newStatus });
      enqueueSnackbar(`Account ${newStatus ? 'activated' : 'suspended'}!`, {
        variant: newStatus ? 'success' : 'warning'
      });
      fetchAccounts();
    } catch (err) {
      enqueueSnackbar('Failed to update status: ' + (err.response?.data?.error || err.message), {
        variant: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Create new account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      enqueueSnackbar('Please fill in Name, Email, and Password.', { variant: 'warning' });
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.createAccount(createForm);
      enqueueSnackbar(`Boutique account for ${createForm.full_name} created successfully!`, {
        variant: 'success'
      });
      setCreateModalOpen(false);
      setCreateForm({
        full_name: '',
        company_name: '',
        email: '',
        username: '',
        password: '',
        phone: '+91 ',
        planId: 'pro',
        deadlineDays: 30,
        role: 'admin'
      });
      fetchAccounts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Failed to create account', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick WhatsApp reminder link
  const openWhatsAppReminder = (account) => {
    const phoneClean = (account.phone || '').replace(/[^0-9]/g, '');
    const renewFormatted = account.plan?.renew_date
      ? new Date(account.plan.renew_date).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        })
      : 'upcoming';

    const msg = encodeURIComponent(
      `Hello ${account.full_name || 'Boutique Owner'},\n\nThis is a friendly reminder from KP Creation ERP regarding your *${account.plan?.name || 'Pro'} Plan* subscription.\n\nYour plan deadline is *${renewFormatted}* (${account.plan?.days_remaining || 0} days remaining).\n\nPlease renew or reach out if you need assistance!\n\nThank you!`
    );

    const waUrl = phoneClean
      ? `https://wa.me/${phoneClean}?text=${msg}`
      : `https://wa.me/?text=${msg}`;

    window.open(waUrl, '_blank');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!accounts.length) return;

    const headers = [
      'Account ID',
      'Full Name',
      'Boutique Name',
      'Email',
      'Username',
      'Phone',
      'Role',
      'Plan Tier',
      'Plan Price',
      'Deadline Date',
      'Days Remaining',
      'Plan Status',
      'Sarees Count',
      'Sarees Limit',
      'Account Active',
      'Created At'
    ];

    const rows = accounts.map((acc) => [
      acc.id,
      `"${acc.full_name || ''}"`,
      `"${acc.company_name || ''}"`,
      acc.email,
      acc.username,
      `"${acc.phone || ''}"`,
      acc.role,
      acc.plan?.name || '',
      acc.plan?.price || '',
      acc.plan?.renew_date ? new Date(acc.plan.renew_date).toISOString().split('T')[0] : '',
      acc.plan?.days_remaining ?? '',
      acc.plan?.status || '',
      acc.usage?.sarees_count || 0,
      acc.usage?.sarees_limit || 0,
      acc.is_active ? 'Yes' : 'No',
      acc.created_at ? new Date(acc.created_at).toISOString().split('T')[0] : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kp_creation_accounts_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueSnackbar('CSV Account Ledger exported successfully!', { variant: 'success' });
  };

  // Filtered & Sorted Accounts
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = acc.full_name?.toLowerCase().includes(q);
          const matchesEmail = acc.email?.toLowerCase().includes(q);
          const matchesShop = acc.company_name?.toLowerCase().includes(q);
          const matchesUser = acc.username?.toLowerCase().includes(q);
          const matchesPhone = acc.phone?.toLowerCase().includes(q);
          if (!matchesName && !matchesEmail && !matchesShop && !matchesUser && !matchesPhone) {
            return false;
          }
        }

        // Plan filter
        if (planFilter !== 'all' && acc.plan?.id !== planFilter) {
          return false;
        }

        // Status filter
        if (statusFilter === 'active' && (!acc.is_active || acc.plan?.status === 'SUSPENDED')) return false;
        if (statusFilter === 'expiring' && (acc.plan?.days_remaining > 7 || acc.plan?.days_remaining <= 0)) return false;
        if (statusFilter === 'expired' && acc.plan?.days_remaining > 0 && acc.plan?.status !== 'EXPIRED') return false;
        if (statusFilter === 'suspended' && acc.is_active && acc.plan?.status !== 'SUSPENDED') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline_asc') {
          return (a.plan?.days_remaining ?? 9999) - (b.plan?.days_remaining ?? 9999);
        }
        if (sortBy === 'deadline_desc') {
          return (b.plan?.days_remaining ?? 0) - (a.plan?.days_remaining ?? 0);
        }
        if (sortBy === 'created_desc') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (sortBy === 'sarees_desc') {
          return (b.usage?.sarees_count || 0) - (a.usage?.sarees_count || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.full_name || '').localeCompare(b.full_name || '');
        }
        return 0;
      });
  }, [accounts, searchQuery, planFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Super Admin Console
            </Badge>
            <span className="text-xs text-muted-foreground">• Unified Multi-Tenant Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-foreground tracking-tight">
            Account & Subscription Control
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Live master directory of all registered boutique accounts, subscription tiers, renewal deadlines, and SKU capacity quotas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccounts}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-semibold border-border hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="luxury"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-9 gap-1.5 text-xs uppercase tracking-wider font-bold shadow-luxury"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Account
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <Card className="border border-border/80 shadow-xs hover:border-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-2xl font-bold font-serif text-foreground mt-1">{kpis.total_accounts}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{kpis.active_subscriptions}</span> Active Boutiques
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Plans */}
        <Card className="border border-border/80 shadow-xs hover:border-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
              <h3 className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1">
                {kpis.active_subscriptions}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Across {Object.keys(SUBSCRIPTION_PLANS).length} subscription tiers
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Platform MRR */}
        <Card className="border border-border/80 shadow-xs hover:border-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform MRR</p>
              <h3 className="text-2xl font-bold font-serif text-burgundy-900 dark:text-amber-300 mt-1">
                ₹{kpis.total_mrr.toLocaleString()}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Monthly recurring revenue</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className={cn(
          "border shadow-xs hover:border-border transition-all",
          kpis.expiring_soon > 0 ? "border-amber-500/40 bg-amber-500/[0.03]" : "border-border/80"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Expiring Soon (&le; 7 Days)
              </p>
              <h3 className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-1">
                {kpis.expiring_soon}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {kpis.expired_count > 0 ? `${kpis.expired_count} already overdue` : 'Requires prompt renewal'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution Strip */}
      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/70 overflow-x-auto text-xs">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] shrink-0 mr-2">
          Tier Distribution:
        </span>
        <button
          onClick={() => setPlanFilter('all')}
          className={cn(
            'px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0',
            planFilter === 'all' ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          All ({kpis.total_accounts})
        </button>
        <button
          onClick={() => setPlanFilter('free')}
          className={cn(
            'px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1.5',
            planFilter === 'free' ? 'bg-slate-700 text-white' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Free Trial ({kpis.plan_breakdown?.free || 0})
        </button>
        <button
          onClick={() => setPlanFilter('pro')}
          className={cn(
            'px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1.5',
            planFilter === 'pro' ? 'bg-burgundy-900 text-white' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-burgundy-600" />
          Pro ({kpis.plan_breakdown?.pro || 0})
        </button>
        <button
          onClick={() => setPlanFilter('team')}
          className={cn(
            'px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1.5',
            planFilter === 'team' ? 'bg-blue-600 text-white' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Team ({kpis.plan_breakdown?.team || 0})
        </button>
        <button
          onClick={() => setPlanFilter('enterprise')}
          className={cn(
            'px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1.5',
            planFilter === 'enterprise' ? 'bg-amber-600 text-white' : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Enterprise ({kpis.plan_breakdown?.enterprise || 0})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts, emails, shops..."
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:ring-1 focus:ring-burgundy-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="expiring">Expiring Soon (&le; 7d)</option>
            <option value="expired">Expired / Overdue</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:ring-1 focus:ring-burgundy-900 focus:outline-none"
          >
            <option value="deadline_asc">Deadline (Soonest First)</option>
            <option value="deadline_desc">Deadline (Furthest First)</option>
            <option value="created_desc">Registration (Newest)</option>
            <option value="sarees_desc">Most Sarees</option>
            <option value="name_asc">Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Main Accounts Ledger Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Boutique & Account</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Deadline & Countdown</th>
                <th className="py-3 px-4">SKU / Limit Usage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-burgundy-900 dark:text-amber-400" />
                    Loading registered boutique accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const daysLeft = acc.plan?.days_remaining ?? 0;
                  const isExpiring = daysLeft <= 7 && daysLeft > 0;
                  const isExpired = daysLeft <= 0 || acc.plan?.status === 'EXPIRED';
                  const renewDateFormatted = acc.plan?.renew_date
                    ? new Date(acc.plan.renew_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                      {/* Boutique & Account */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-burgundy-900 to-burgundy-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {acc.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm truncate">{acc.full_name}</span>
                              {acc.is_superadmin && (
                                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 font-bold">
                                  Super Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-burgundy-900 dark:text-amber-400 flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {acc.company_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                                acc.plan?.id === 'enterprise'
                                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : acc.plan?.id === 'team'
                                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : acc.plan?.id === 'pro'
                                  ? 'border-burgundy-900/40 bg-burgundy-900/10 text-burgundy-900 dark:text-amber-300'
                                  : 'border-border bg-muted/50 text-muted-foreground'
                              )}
                            >
                              {acc.plan?.name}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-semibold text-foreground">
                            {acc.plan?.price}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">{acc.plan?.period}</span>
                          </p>
                        </div>
                      </td>

                      {/* Deadline & Countdown */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{renewDateFormatted}</span>
                          </div>

                          <div>
                            {isExpired ? (
                              <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0 h-4">
                                Expired ({Math.abs(daysLeft)}d overdue)
                              </Badge>
                            ) : isExpiring ? (
                              <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left ⚠️
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-[10px] px-1.5 py-0 h-4"
                              >
                                {daysLeft} days remaining
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / Limit Usage */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Saree SKUs</span>
                            <span className="font-mono font-semibold text-foreground">
                              {acc.usage?.sarees_count} / {acc.usage?.sarees_limit?.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                acc.usage?.percentage_used >= 90
                                  ? 'bg-rose-500'
                                  : 'bg-burgundy-900 dark:bg-amber-400'
                              )}
                              style={{ width: `${Math.min(100, acc.usage?.percentage_used || 0)}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground">
                            {acc.usage?.percentage_used}% quota consumed
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              acc.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          <span className="font-semibold capitalize text-foreground">
                            {acc.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manage Plan Modal Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEdit(acc)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 hover:bg-muted"
                            title="Edit Plan, Deadline & Limits"
                          >
                            <Edit className="w-3 h-3" />
                            Manage
                          </Button>

                          {/* Quick +30 Days Extend */}
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={actionLoading}
                            onClick={() => handleQuickExtend(acc, 30)}
                            className="h-7 px-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            title="Extend plan by +30 days"
                          >
                            +30d
                          </Button>

                          {/* WhatsApp Reminder */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openWhatsAppReminder(acc)}
                            className="h-7 px-2 text-[11px] text-emerald-600 hover:bg-emerald-500/10"
                            title="Send WhatsApp renewal reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>

                          {/* Suspend / Activate Toggle */}
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleStatus(acc)}
                            className={cn(
                              'h-7 px-2 text-[11px]',
                              acc.is_active
                                ? 'text-rose-600 hover:bg-rose-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            )}
                            title={acc.is_active ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            {acc.is_active ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Plan & Deadline Modal */}
      {editModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-luxury overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">
                  Manage Plan & Renewal Deadline
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Updating: <span className="font-semibold text-foreground">{selectedAccount.full_name}</span> ({selectedAccount.email})
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePlan} className="p-5 space-y-4 text-xs">
              {/* Plan Tier Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Subscription Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(SUBSCRIPTION_PLANS).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setEditForm({ ...editForm, planId: p.id })}
                      className={cn(
                        'p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between',
                        editForm.planId === p.id
                          ? 'border-burgundy-900 bg-burgundy-900/10 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs">{p.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold">
                          {p.price}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Up to {p.limits.sarees.toLocaleString()} Sarees
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline Date Picker & Quick Extension Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>Plan Deadline / Expiry Date</span>
                  <span className="text-muted-foreground font-normal">
                    Current: {selectedAccount.plan?.renew_date ? new Date(selectedAccount.plan.renew_date).toISOString().split('T')[0] : 'None'}
                  </span>
                </label>

                <Input
                  type="date"
                  value={editForm.renewDate}
                  onChange={(e) => setEditForm({ ...editForm, renewDate: e.target.value })}
                  className="h-9 text-xs"
                  required
                />

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">Quick Add:</span>
                  {[
                    { label: '+15 Days', days: 15 },
                    { label: '+30 Days', days: 30 },
                    { label: '+60 Days', days: 60 },
                    { label: '+1 Year', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const target = new Date();
                        target.setDate(target.getDate() + preset.days);
                        setEditForm({ ...editForm, renewDate: target.toISOString().split('T')[0] });
                      }}
                      className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold hover:bg-muted/80 text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Status & Custom Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Subscription Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRING_SOON">EXPIRING_SOON</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Custom Saree Limit Override
                  </label>
                  <Input
                    type="number"
                    value={editForm.customSareesLimit}
                    onChange={(e) => setEditForm({ ...editForm, customSareesLimit: e.target.value })}
                    placeholder="e.g. 1000"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Phone & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    WhatsApp Contact Number
                  </label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 99096 80207"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Internal Admin Notes
                  </label>
                  <Input
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="e.g. Paid via UPI"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="luxury"
                  size="sm"
                  disabled={actionLoading}
                  className="h-9 text-xs uppercase tracking-wider font-bold shadow-luxury"
                >
                  {actionLoading ? 'Saving...' : 'Save Plan & Deadline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Account Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-luxury overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Create New Boutique Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a tenant account with pre-configured plan tier & deadline.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Owner Full Name *
                  </label>
                  <Input
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Boutique / Shop Name
                  </label>
                  <Input
                    value={createForm.company_name}
                    onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                    placeholder="e.g. Patel Silk Mills"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="owner@boutique.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Username
                  </label>
                  <Input
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. rameshpatel"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Password *
                  </label>
                  <Input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    WhatsApp Number
                  </label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+91 99096 80207"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Initial Subscription Plan
                  </label>
                  <select
                    value={createForm.planId}
                    onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium"
                  >
                    <option value="free">Free Trial (₹0/mo - 50 Sarees)</option>
                    <option value="pro">Pro Plan (₹249/mo - 500 Sarees)</option>
                    <option value="team">Team Plan (₹399/mo - 5,000 Sarees)</option>
                    <option value="enterprise">Enterprise (₹999/mo - 50,000 Sarees)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Initial Deadline Duration
                  </label>
                  <select
                    value={createForm.deadlineDays}
                    onChange={(e) => setCreateForm({ ...createForm, deadlineDays: parseInt(e.target.value, 10) })}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground font-medium"
                  >
                    <option value={14}>14 Days (Trial)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (Quarterly)</option>
                    <option value={365}>365 Days (1 Year)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="luxury"
                  size="sm"
                  disabled={actionLoading}
                  className="h-9 text-xs uppercase tracking-wider font-bold shadow-luxury"
                >
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Billing & Account Limits Page
 * Matches reference designs from TestDino: Overview, Usage, and Invoices.
 * Allows managing organizational subscription, tracking quota limits, and viewing payment invoices.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sareeAPI, dashboardAPI } from '../services/api';
import {
  SUBSCRIPTION_PLANS,
  getActiveSubscription,
  getInvoices,
  updateSubscription,
  cancelSubscription,
  resumeSubscription
} from '../services/subscriptionService';
import PaymentGatewayModal from '../components/common/PaymentGatewayModal';
import CancelPlanModal from '../components/common/CancelPlanModal';

import {
  CreditCard,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  Users,
  Shirt,
  Clock,
  Search,
  RefreshCw,
  Download,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Lock,
  Printer,
  X,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';

export default function BillingUsage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab State: 'overview' | 'usage' | 'invoices'
  const [activeTab, setActiveTab] = useState('overview');

  // Subscription & Invoices State
  const [subscription, setSubscription] = useState(getActiveSubscription());
  const [invoices, setInvoices] = useState(getInvoices());

  // Live Database Quota Metrics
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [sareesList, setSareesList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Filters for Invoices
  const [searchInvoice, setSearchInvoice] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [refreshingInvoices, setRefreshingInvoices] = useState(false);

  // Upgrade Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState(null);

  // Features Expansion State
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Listen for external subscription & invoice updates
  useEffect(() => {
    const handleSubChange = () => {
      setSubscription(getActiveSubscription());
    };
    const handleInvChange = () => {
      setInvoices(getInvoices());
    };

    window.addEventListener('sari_subscription_changed', handleSubChange);
    window.addEventListener('sari_invoices_changed', handleInvChange);

    return () => {
      window.removeEventListener('sari_subscription_changed', handleSubChange);
      window.removeEventListener('sari_invoices_changed', handleInvChange);
    };
  }, []);

  // Fetch real count of Sarees and Dashboard statistics
  const fetchLiveUsage = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [sareeRes, dashRes] = await Promise.allSettled([
        sareeAPI.getAll(),
        dashboardAPI.get({ range: '30days' })
      ]);

      if (sareeRes.status === 'fulfilled' && sareeRes.value.data?.sarees) {
        setSareesList(sareeRes.value.data.sarees);
      }
      if (dashRes.status === 'fulfilled' && dashRes.value.data?.stats) {
        setDashboardStats(dashRes.value.data.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch live usage metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveUsage();
  }, [fetchLiveUsage]);

  // Derived metrics
  const sareesCount = sareesList.length || dashboardStats?.totalSarees || 12;
  const categoriesSet = new Set(sareesList.map(s => s.category || s.type || 'Standard').filter(Boolean));
  const collectionsCount = categoriesSet.size || 3;
  const usersCount = user?.role === 'admin' ? 1 : 2;

  const currentPlanLimits = subscription.limits || {
    sarees: 500,
    collections: 10,
    users: 1,
    retention: '90 days'
  };

  const sareeUsagePct = Math.min(100, Math.round((sareesCount / currentPlanLimits.sarees) * 100));
  const collectionUsagePct = Math.min(100, Math.round((collectionsCount / currentPlanLimits.collections) * 100));
  const userUsagePct = Math.min(100, Math.round((usersCount / currentPlanLimits.users) * 100));

  const sareesRemaining = Math.max(0, currentPlanLimits.sarees - sareesCount);
  const collectionsRemaining = Math.max(0, currentPlanLimits.collections - collectionsCount);
  const isUserAtLimit = usersCount >= currentPlanLimits.users;
  const isSareeNearLimit = sareeUsagePct >= 80;

  // Breakdown by collection/category
  const collectionBreakdown = useMemo(() => {
    const map = {};
    sareesList.forEach(s => {
      const cat = s.category || s.type || 'Silk Classic';
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          count: 0,
          totalPieces: 0,
          lowStock: 0,
          beams: 0
        };
      }
      map[cat].count += 1;
      const pieces = (s.beams || []).reduce((acc, b) => {
        return acc + (b.combinations || []).reduce((cAcc, c) => cAcc + (c.current_stock || 0), 0);
      }, 0);
      map[cat].totalPieces += pieces;
    });

    const list = Object.values(map);
    if (list.length === 0) {
      return [
        { name: 'Pure Silk Sarees', count: 6, totalPieces: 240, lowStock: 1, tier: 'Active' },
        { name: 'Banarasi Brocade', count: 4, totalPieces: 110, lowStock: 0, tier: 'Active' },
        { name: 'Kanjivaram Festive', count: 2, totalPieces: 85, lowStock: 0, tier: 'Active' },
      ];
    }
    return list;
  }, [sareesList]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        !searchInvoice ||
        inv.id.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        inv.planName.toLowerCase().includes(searchInvoice.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        inv.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchInvoice, statusFilter]);

  const handleOpenUpgrade = (planKey = 'team') => {
    const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.team;
    setTargetPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleRefreshInvoices = () => {
    setRefreshingInvoices(true);
    setTimeout(() => {
      setInvoices(getInvoices());
      setRefreshingInvoices(false);
    }, 400);
  };

  const isCancelled = subscription.status === 'CANCELLED';

  const handleResumeSubscription = () => {
    // Route through Payment Gateway to reactivate (not instant active)
    const targetPlanKey = (subscription.id && subscription.id !== 'free')
      ? subscription.id
      : (subscription.planId && subscription.planId !== 'free' ? subscription.planId : 'pro');
    const plan = SUBSCRIPTION_PLANS[targetPlanKey] || SUBSCRIPTION_PLANS.pro;
    setTargetPlan(plan);
    setPaymentModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 px-2 sm:px-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground/80 hover:text-foreground cursor-pointer" onClick={() => navigate('/dashboard')}>
            KP Creation
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Billing & Usage</span>
        </div>
      </div>

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
          Billing & Usage
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization's subscription, resource limits, and invoices
        </p>
      </div>

      {/* Navigation Tabs (Overview, Usage, Invoices) */}
      <div className="flex items-center gap-8 border-b border-border/70 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex items-center gap-2 pb-3 relative transition-colors",
            activeTab === 'overview'
              ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={cn(
            "flex items-center gap-2 pb-3 relative transition-colors",
            activeTab === 'usage'
              ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Activity className="w-4 h-4" />
          Usage
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "flex items-center gap-2 pb-3 relative transition-colors",
            activeTab === 'invoices'
              ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Invoices
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW (Screenshot 1 Reference)                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Main Plan Card */}
          <div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-7 shadow-xs">
            {/* Header: Plan Icon & Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted border border-border/80 text-foreground">
                  <CreditCard className="w-5 h-5 text-burgundy-900 dark:text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      {subscription.name}
                    </h2>
                    {isCancelled ? (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold px-2 py-0.5">
                        Cancelled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold px-2 py-0.5">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subscription.subtitle} • {subscription.price}{subscription.period}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isCancelled ? (
                  <Button
                    variant="luxury"
                    size="sm"
                    className="text-xs h-9 font-semibold gap-1.5 shadow-luxury"
                    onClick={handleResumeSubscription}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Reactivate Plan (Pay & Activate)
                  </Button>
                ) : (
                  <>
                    {subscription.id !== 'free' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/60"
                        onClick={() => setCancelModalOpen(true)}
                      >
                        Cancel Plan
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 font-semibold hover:border-foreground"
                      onClick={() => handleOpenUpgrade(subscription.id === 'pro' ? 'team' : 'pro')}
                    >
                      Change Plan
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Cancellation Notice Banner if subscription is cancelled */}
            {isCancelled && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs my-5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-sm">
                      {subscription.immediate
                        ? 'Subscription Cancelled'
                        : 'Plan Cancellation Scheduled'}
                    </span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {subscription.immediate
                        ? 'Your subscription was cancelled immediately. Your account operates on the Free Trial tier limits (50 Sarees, 2 Collections).'
                        : `Your ${subscription.name} features will remain active until ${subscription.renewDate ? new Date(subscription.renewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'renewal deadline'} (${subscription.daysRemaining || 0} days remaining). On this date, auto-renewal will be skipped and your account will downgrade to the Free Trial.`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="luxury"
                  size="sm"
                  className="h-8 px-3.5 text-xs font-semibold shrink-0 self-start sm:self-auto gap-1.5 shadow-luxury"
                  onClick={handleResumeSubscription}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Reactivate Plan ({subscription.price || '₹249'}/mo)
                </Button>
              </div>
            )}

            {/* 4 Quota Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-border/60">
              {/* Metric 1: Sarees Included */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Shirt className="w-4 h-4 opacity-75" />
                  <span>Sarees Included</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {currentPlanLimits.sarees.toLocaleString()}
                </div>
              </div>

              {/* Metric 2: Collections Included */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Layers className="w-4 h-4 opacity-75" />
                  <span>Collections Included</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {currentPlanLimits.collections}
                </div>
              </div>

              {/* Metric 3: Users Included */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="w-4 h-4 opacity-75" />
                  <span>Users Included</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {currentPlanLimits.users}
                </div>
              </div>

              {/* Metric 4: Data Retention */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="w-4 h-4 opacity-75" />
                  <span>Data Retention</span>
                  <Info className="w-3.5 h-3.5 opacity-60 ml-0.5" title="Historical stock transactions and ledger logs retained in your account." />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {currentPlanLimits.retention}
                </div>
              </div>
            </div>

            {/* Included Features Section */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Included features</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(subscription.features || []).slice(0, showAllFeatures ? 99 : 5).map((feat, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/60 text-xs font-medium text-foreground/90 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}

                {(subscription.features || []).length > 5 && !showAllFeatures && (
                  <button
                    onClick={() => setShowAllFeatures(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +{subscription.features.length - 5} more
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade Banner / Free Trial Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-card/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-start sm:items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-burgundy-900/15 dark:bg-burgundy-900/40 text-burgundy-900 dark:text-amber-200 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground">
                  {subscription.id === 'free' ? 'Start your free trial' : 'Upgrade your plan to Team or Enterprise'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Unlock unlimited saree designs, multi-staff seats, WhatsApp supplier triggers, and AI forecasting.
                </p>
              </div>
            </div>

            <Button
              variant="luxury"
              className="h-10 px-6 text-xs font-bold shrink-0 self-start sm:self-auto shadow-luxury"
              onClick={() => handleOpenUpgrade('team')}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {subscription.id === 'free' ? 'Start Free Trial' : 'Upgrade to Team (₹399)'}
            </Button>
          </div>

          {/* Quick Plans Comparison Row */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Available Subscription Tiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(SUBSCRIPTION_PLANS).filter(p => p.id !== 'free').map(p => {
                const isCurrent = subscription.id === p.id || subscription.planId === p.id;
                const isCurrentAndActive = isCurrent && !isCancelled;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-xl border p-5 flex flex-col justify-between transition-all bg-card/50",
                      isCurrent ? "border-burgundy-900/80 dark:border-amber-400/60 ring-1 ring-burgundy-900/30" : "border-border hover:border-border/80"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base text-foreground">{p.name}</span>
                        {isCurrentAndActive && (
                          <Badge className="bg-burgundy-900 text-white text-[10px] font-bold">
                            Current
                          </Badge>
                        )}
                        {isCurrent && isCancelled && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">
                            Cancelled
                          </Badge>
                        )}
                        {p.popular && !isCurrent && (
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-2xl font-bold font-mono text-foreground">{p.price}</span>
                        <span className="text-xs text-muted-foreground">{p.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">{p.subtitle}</p>

                      <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.limits.sarees.toLocaleString()} Sarees quota</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.limits.users} Team user seat(s)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.limits.retention} History logs</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      variant={isCurrentAndActive ? "outline" : "luxury"}
                      size="sm"
                      disabled={isCurrentAndActive}
                      className="w-full text-xs font-bold"
                      onClick={() => handleOpenUpgrade(p.id)}
                    >
                      {isCurrentAndActive
                        ? 'Current Plan'
                        : isCurrent && isCancelled
                        ? `Reactivate ${p.name} (${p.price})`
                        : `Upgrade to ${p.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: USAGE (Screenshot 2 Reference)                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'usage' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Amber Alert Banner (Exact Match to Screenshot 2) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {isUserAtLimit
                  ? `All ${currentPlanLimits.users} user seats on your plan are in use.`
                  : isSareeNearLimit
                  ? `${sareesCount} of ${currentPlanLimits.sarees} Sarees on your plan are in use.`
                  : `Your organization is currently operating within quota limits.`}
              </span>
            </div>

            <Button
              variant="default"
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs h-8 px-4 rounded-lg self-start sm:self-auto shrink-0"
              onClick={() => handleOpenUpgrade('team')}
            >
              Upgrade plan
            </Button>
          </div>

          {/* Current Usage Section */}
          <div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-foreground">
              Current usage
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Saree SKUs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Shirt className="w-4 h-4 opacity-70" />
                  <span>Saree SKUs</span>
                </div>
                <div className="flex items-baseline gap-1 text-xl font-bold font-mono text-foreground">
                  <span>{sareesCount}</span>
                  <span className="text-muted-foreground text-sm font-normal">/ {currentPlanLimits.sarees.toLocaleString()}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      sareeUsagePct >= 90 ? "bg-red-500" : "bg-burgundy-900 dark:bg-amber-400"
                    )}
                    style={{ width: `${sareeUsagePct}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground pt-0.5">
                  {sareesRemaining > 0 ? `${sareesRemaining.toLocaleString()} remaining` : (
                    <span className="text-red-500 font-semibold">At limit</span>
                  )}
                </div>
              </div>

              {/* 2. Collections / Projects */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Layers className="w-4 h-4 opacity-70" />
                  <span>Collections</span>
                </div>
                <div className="flex items-baseline gap-1 text-xl font-bold font-mono text-foreground">
                  <span>{collectionsCount}</span>
                  <span className="text-muted-foreground text-sm font-normal">/ {currentPlanLimits.collections}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      collectionUsagePct >= 100 ? "bg-red-500" : "bg-burgundy-900 dark:bg-amber-400"
                    )}
                    style={{ width: `${collectionUsagePct}%` }}
                  />
                </div>
                <div className="text-xs pt-0.5">
                  {collectionsRemaining > 0 ? (
                    <span className="text-muted-foreground">{collectionsRemaining} remaining</span>
                  ) : (
                    <span className="text-red-500 font-semibold">At limit</span>
                  )}
                </div>
              </div>

              {/* 3. Users Included (Highlighted in Red if at limit like screenshot) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Users className="w-4 h-4 opacity-70" />
                  <span>Users</span>
                </div>
                <div className="flex items-baseline gap-1 text-xl font-bold font-mono text-foreground">
                  <span className={isUserAtLimit ? "text-foreground font-extrabold" : ""}>{usersCount}</span>
                  <span className="text-muted-foreground text-sm font-normal">/ {currentPlanLimits.users}</span>
                </div>
                {/* Red progress line matching Screenshot 2 */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isUserAtLimit ? "bg-red-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${userUsagePct}%` }}
                  />
                </div>
                <div className="text-xs pt-0.5">
                  {isUserAtLimit ? (
                    <span className="text-red-500 font-semibold">At limit</span>
                  ) : (
                    <span className="text-muted-foreground">{currentPlanLimits.users - usersCount} remaining</span>
                  )}
                </div>
              </div>

              {/* 4. Usage cycle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="w-4 h-4 opacity-70" />
                  <span>Usage cycle</span>
                </div>
                <div className="text-sm font-semibold text-foreground pt-0.5">
                  {subscription.billingCycle || 'Sep 01, 2026 – Sep 30, 2026'}
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/40 rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
                <div className="text-xs text-muted-foreground pt-0.5">
                  Executions reset in {subscription.daysRemaining || 12} days
                </div>
              </div>
            </div>
          </div>

          {/* Usage by Project / Collection Table (Screenshot 2 Reference) */}
          <div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-7 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Usage by collection
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {collectionBreakdown.length} active saree collections registered
              </p>
            </div>

            <div className="overflow-x-auto border border-border/70 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/70">
                  <tr>
                    <th className="py-3 px-4">Collection</th>
                    <th className="py-3 px-4">Sarees Count</th>
                    <th className="py-3 px-4">Stock Pieces</th>
                    <th className="py-3 px-4">Low Stock</th>
                    <th className="py-3 px-4">AI Demand</th>
                    <th className="py-3 px-4">ERP Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {collectionBreakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{item.count}</td>
                      <td className="py-3 px-4 font-mono">{item.totalPieces} pcs</td>
                      <td className="py-3 px-4">
                        {item.lowStock > 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            {item.lowStock} Short
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Optimal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {subscription.id === 'free' ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground/80 font-medium">
                            <Lock className="w-3 h-3" /> Pro
                          </span>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {subscription.id === 'free' || subscription.id === 'pro' ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground/80 font-medium">
                            <Lock className="w-3 h-3" /> Team
                          </span>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0">
                            Full
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INVOICES (Screenshot 3 Reference)                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Invoices
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              View and download your payment invoices
            </p>
          </div>

          {/* Filter Toolbar (Search, Status dropdown, Time dropdown, Refresh button) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>

              {/* Date Dropdown */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 days</option>
                <option value="2026">Year 2026</option>
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshInvoices}
              disabled={refreshingInvoices}
              className="h-9 px-3 text-xs font-medium gap-1.5 shrink-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshingInvoices && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Invoices List or Empty State */}
          {filteredInvoices.length > 0 ? (
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/60 shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/70">
                  <tr>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Billing Date</th>
                    <th className="py-3 px-4">Plan / Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/25 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{inv.date}</td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {inv.planName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        ₹{inv.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-semibold hover:bg-muted gap-1 text-foreground"
                          onClick={() => setReceiptInvoice(inv)}
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>View Receipt</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State Container (Screenshot 3 Exact Match) */
            <div className="rounded-2xl border border-border bg-card/40 py-16 px-4 text-center space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/60 text-muted-foreground mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  No invoices yet
                </h3>
                <p className="text-xs text-muted-foreground">
                  Invoices will appear here after your first payment.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => handleOpenUpgrade('pro')}
                >
                  Make Test Payment
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* RECEIPT / INVOICE MODAL                                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {receiptInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setReceiptInvoice(null)}
        >
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-luxury p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  Tax Invoice & Receipt
                </h3>
              </div>
              <button
                onClick={() => setReceiptInvoice(null)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice No:</span>
                <span className="font-mono font-bold text-foreground">{receiptInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground">{receiptInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-muted-foreground">{receiptInvoice.transactionId || 'KP-PAY-ONLINE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed To:</span>
                <span className="font-semibold text-foreground">{user?.full_name || 'Admin User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium text-foreground">{receiptInvoice.paymentMethod || 'UPI / Card'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                <div className="flex justify-between font-bold text-foreground">
                  <span>{receiptInvoice.planName}</span>
                  <span>₹{receiptInvoice.amount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>GST (Included - 18%)</span>
                  <span>₹{Math.round((receiptInvoice.amount * 0.18 / 1.18) * 10) / 10}</span>
                </div>
                <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold text-foreground text-sm">
                  <span>Total Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{receiptInvoice.amount}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
              <Button
                variant="luxury"
                className="flex-1 text-xs font-semibold"
                onClick={() => setReceiptInvoice(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PAYMENT GATEWAY MODAL                                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {targetPlan && (
        <PaymentGatewayModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          plan={targetPlan}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* CANCEL PLAN MODAL                                                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <CancelPlanModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        subscription={subscription}
        onCancelled={(updated) => setSubscription(updated)}
      />
    </div>
  );
}

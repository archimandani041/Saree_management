import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  X,
  ShieldAlert,
  ArrowRight,
  Shirt,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cancelSubscription, SUBSCRIPTION_PLANS } from '../../services/subscriptionService';

const CANCELLATION_REASONS = [
  { id: 'cost', label: 'Pricing is too high / cutting business expenses' },
  { id: 'missing_features', label: 'Missing features needed for my saree business / looms' },
  { id: 'seasonal', label: 'Seasonal slowdown / temporary off-season pause' },
  { id: 'competitor', label: 'Switching to another ERP or manual ledger' },
  { id: 'technical', label: 'Encountered bugs or difficulty using the system' },
  { id: 'other', label: 'Other reason' }
];

export default function CancelPlanModal({
  isOpen,
  onClose,
  subscription,
  onCancelled
}) {
  const [timing, setTiming] = useState('period_end'); // 'period_end' | 'immediate'
  const [selectedReason, setSelectedReason] = useState('cost');
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !subscription) return null;

  const currentPlan = SUBSCRIPTION_PLANS[subscription.planId] || subscription;
  const formattedRenewDate = subscription.renewDate
    ? new Date(subscription.renewDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'End of current cycle';

  const daysLeft = subscription.daysRemaining || 12;

  const handleConfirmCancel = async () => {
    setIsProcessing(true);
    try {
      const isImmediate = timing === 'immediate';
      const reasonObj = CANCELLATION_REASONS.find((r) => r.id === selectedReason);
      const reasonLabel = reasonObj ? reasonObj.label : 'Other';

      // Update in local subscription service
      const updated = cancelSubscription({
        immediate: isImmediate,
        reason: reasonLabel,
        feedback
      });

      // Notify parent component
      if (onCancelled) {
        onCancelled(updated);
      }

      // Try background dispatch to server payment cancellation notification if endpoint exists
      try {
        await fetch('http://localhost:5000/api/payment/send-cancellation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: currentPlan.name,
            immediate: isImmediate,
            reason: reasonLabel,
            feedback,
            renewDate: subscription.renewDate,
            daysRemaining: daysLeft
          })
        });
      } catch (_) {
        // Non-blocking offline fallback
      }

      onClose();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
    >
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-luxury overflow-hidden my-6 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-rose-500/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">
                Cancel Subscription
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                We're sorry to see you go. Review your options below.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Current Active Plan Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Current Plan
                </span>
                <h4 className="text-base font-bold text-foreground">
                  {currentPlan.name} Plan
                </h4>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                {currentPlan.price}{currentPlan.period}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground pt-1 border-t border-border/60 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next renewal: <strong className="text-foreground">{formattedRenewDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span><strong className="text-foreground">{daysLeft}</strong> days remaining</span>
              </div>
            </div>
          </div>

          {/* Cancellation Timing Options */}
          <div className="space-y-2">
            <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
              When should cancellation take effect?
            </label>

            <div className="space-y-2">
              {/* Option 1: End of Billing Period (Recommended) */}
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  timing === 'period_end'
                    ? 'border-burgundy-900 bg-burgundy-900/5 dark:border-amber-400/80 dark:bg-amber-400/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="timing"
                  value="period_end"
                  checked={timing === 'period_end'}
                  onChange={() => setTiming('period_end')}
                  className="mt-0.5 accent-burgundy-900"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">
                      At end of current billing period ({formattedRenewDate})
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] px-1.5 py-0 font-bold">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    You keep full access to all {currentPlan.name} features and quotas for the remaining {daysLeft} days. No upcoming charges will be made.
                  </p>
                </div>
              </label>

              {/* Option 2: Immediate */}
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  timing === 'immediate'
                    ? 'border-rose-600 bg-rose-500/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="timing"
                  value="immediate"
                  checked={timing === 'immediate'}
                  onChange={() => setTiming('immediate')}
                  className="mt-0.5 accent-rose-600"
                />
                <div className="space-y-0.5 flex-1">
                  <span className="font-bold text-foreground text-xs">
                    Cancel immediately
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Immediately reverts your account to the Free Trial tier (50 sarees quota). Unused days will not be refunded.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Benefits you will lose */}
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] space-y-2">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              What will change after downgrade:
            </span>
            <ul className="space-y-1 text-[11px] text-muted-foreground pl-5 list-disc">
              <li>Saree SKU quota drops to <strong className="text-foreground">50 sarees</strong> (Sandbox tier)</li>
              <li>Collections limited to <strong className="text-foreground">2 collections</strong></li>
              <li>Automated WhatsApp weaver replenishment alerts will be deactivated</li>
              <li>Multi-staff collaborator seats will be locked</li>
              <li>Advanced AI demand forecasting algorithms disabled</li>
            </ul>
          </div>

          {/* Reason for Cancellation */}
          <div className="space-y-2">
            <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
              Why are you cancelling? (Helps us improve)
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-burgundy-900"
                  />
                  <span className="text-xs text-foreground font-medium">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground uppercase tracking-wider text-[10px]">
              Additional Feedback (Optional)
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What could we have done better to keep your business?"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-burgundy-900 focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 gap-3">
          <Button
            type="button"
            variant="luxury"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 text-xs font-bold shadow-luxury"
          >
            Keep My Plan
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleConfirmCancel}
            disabled={isProcessing}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10 hover:border-rose-500/70"
          >
            {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

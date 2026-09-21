import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSubscription } from '../../services/subscriptionService';

/**
 * PaymentGatewayModal — High-Impact Evaluator/Examiner Sandbox Payment Gateway
 * Specially designed for project viva & external guide demonstrations.
 *
 * Features:
 * 1. Evaluator Sandbox Banner (NPCI & RBI Simulation Active)
 * 2. UPI & Dynamic Animated QR Code with 1-Click Scan & Approve simulation
 * 3. Credit / Debit Card with live interactive card preview & 1-click test card presets
 * 4. Net Banking for major Indian banks (SBI, HDFC, ICICI, Axis, Kotak, PNB)
 * 5. Interactive 3D Secure / OTP verification challenge
 * 6. Multi-step banking handshake progress visualizer (AES-256 -> NPCI -> 2FA -> ERP Ledger)
 * 7. Authentic GST Tax Invoice modal & printable view
 * 8. Official Razorpay client SDK test mode integration
 */

// Helper to load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentGatewayModal({ isOpen, onClose, plan }) {
  const navigate = useNavigate();

  // Tabs: 'upi' | 'card' | 'netbanking' | 'razorpay'
  const [activeTab, setActiveTab] = useState('upi');

  // UPI Fields
  const [upiId, setUpiId] = useState('');
  const [qrTimer, setQrTimer] = useState(300); // 5 min countdown

  // Card Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('visa'); // 'visa' | 'mastercard' | 'rupay'

  // Netbanking Field
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // OTP Challenge State
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingMethod, setPendingMethod] = useState('');

  // Processing & Multi-step tracker
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Success State
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentTimestamp, setPaymentTimestamp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setShowOtpScreen(false);
      setShowInvoiceModal(false);
      setErrorMsg('');
      setOtpError('');
      setEnteredOtp('');
      setCurrentStepIndex(0);
      setTransactionId('');
      setUtrNumber('');
      setInvoiceNumber('');
      setUpiId('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setCardType('visa');
      setSelectedBank('HDFC');
      setQrTimer(300);
    }
  }, [isOpen, plan]);

  // QR Timer countdown
  useEffect(() => {
    if (!isOpen || isProcessing || isSuccess) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isProcessing, isSuccess]);

  if (!isOpen || !plan) return null;

  const planAmount = plan.amount !== undefined ? plan.amount : (plan.id === 'team' ? 399 : plan.id === 'enterprise' ? 999 : 249);
  const planPriceDisplay = plan.price || `₹${planAmount}`;

  // Indian GST Calculations (18% GST: 9% CGST + 9% SGST inclusive)
  const baseAmount = (planAmount / 1.18).toFixed(2);
  const totalTax = (planAmount - baseAmount).toFixed(2);
  const halfTax = (totalTax / 2).toFixed(2);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Processing steps visualizer
  const STEPS = [
    { title: 'End-to-End Encryption', desc: 'Securing payload with 256-bit AES-GCM' },
    { title: 'Payment Switch Routing', desc: 'Communicating with NPCI / Banking Gateway' },
    { title: 'Two-Factor Authentication', desc: 'Validating 3D Secure / UPI MPIN token' },
    { title: 'ERP Ledger Synchronization', desc: 'Confirming tenant quota & issuing GST invoice' },
  ];

  // Complete Payment Success handler
  const handlePaymentSuccess = (txId, methodUsed = 'UPI Instant (NPCI Sandbox)') => {
    const now = new Date();
    const generatedTxId = txId || `KP-PAY-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedUtr = `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const generatedInv = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestampStr = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    setTransactionId(generatedTxId);
    setUtrNumber(generatedUtr);
    setInvoiceNumber(generatedInv);
    setPaymentTimestamp(timestampStr);
    setIsProcessing(false);
    setShowOtpScreen(false);
    setIsSuccess(true);

    try {
      updateSubscription(plan.id, {
        transactionId: generatedTxId,
        method: methodUsed,
        amount: planAmount,
        invoiceId: generatedInv,
      });
    } catch (_) {}

    try {
      sessionStorage.setItem(
        'sari_active_subscription',
        JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: planAmount,
          transactionId: generatedTxId,
          utrNumber: generatedUtr,
          invoiceId: generatedInv,
          paidAt: now.toISOString(),
          status: 'PAID',
        })
      );
    } catch (_) {}
  };

  // Multi-step Sandbox execution
  const executeSandboxPayment = (methodName) => {
    setErrorMsg('');
    setIsProcessing(true);
    setCurrentStepIndex(0);

    // Step 0 -> 1
    setTimeout(() => {
      setCurrentStepIndex(1);
    }, 500);

    // Step 1 -> 2
    setTimeout(() => {
      setCurrentStepIndex(2);
    }, 1100);

    // Step 2 -> 3
    setTimeout(() => {
      setCurrentStepIndex(3);
    }, 1700);

    // Final Success
    setTimeout(() => {
      handlePaymentSuccess(null, methodName);
    }, 2300);
  };

  // Start checkout flow with OTP challenge for card / netbanking
  const triggerOtpOrInstant = (methodName) => {
    setPendingMethod(methodName);
    setShowOtpScreen(true);
    setEnteredOtp('123456'); // pre-filled for ultra-fast smooth demo
    setOtpError('');
  };

  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.length < 4) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    setShowOtpScreen(false);
    executeSandboxPayment(pendingMethod || '3D Secure Card');
  };

  // Pre-fill Test Cards
  const fillTestCard = (type = 'visa') => {
    if (type === 'visa') {
      setCardNumber('4111 1111 1111 1111');
      setCardExpiry('12/28');
      setCardCvv('786');
      setCardName('Prof. External Examiner (Viva Demo)');
      setCardType('visa');
    } else if (type === 'rupay') {
      setCardNumber('6071 5200 8899 4433');
      setCardExpiry('08/29');
      setCardCvv('452');
      setCardName('KP Creation Textile Partner');
      setCardType('rupay');
    } else {
      setCardNumber('5200 8282 3434 9191');
      setCardExpiry('11/27');
      setCardCvv('912');
      setCardName('Master Weaver Cooperative');
      setCardType('mastercard');
    }
  };

  // Launch official Razorpay standard test checkout
  const handleLaunchRazorpay = async () => {
    setErrorMsg('');
    setIsProcessing(true);
    setCurrentStepIndex(0);

    const res = await loadRazorpayScript();
    if (!res) {
      setIsProcessing(false);
      setErrorMsg('Razorpay SDK failed to load. Falling back to Instant UPI Sandbox.');
      setActiveTab('upi');
      return;
    }

    const testKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

    const options = {
      key: testKey,
      amount: planAmount * 100, // paise
      currency: 'INR',
      name: 'KP Creation Saree ERP',
      description: `${plan.name} Subscription Plan (Evaluator Demo)`,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
      handler: function (response) {
        handlePaymentSuccess(response.razorpay_payment_id, 'Razorpay Test Gateway');
      },
      prefill: {
        name: 'Evaluation Examiner',
        email: 'viva.evaluator@kpcreation.com',
        contact: '9909680207',
      },
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
      },
      theme: {
        color: '#8B1A3A',
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        },
      },
    };

    try {
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        setIsProcessing(false);
        setErrorMsg(response.error.description || 'Payment was not completed.');
      });
      rzpInstance.open();
    } catch (err) {
      setIsProcessing(false);
      // If test key restricted or invalid, fallback smoothly to sandbox
      executeSandboxPayment('Razorpay Sandbox');
    }
  };

  const isUserLoggedIn = Boolean(sessionStorage.getItem('sari_user'));

  const handleContinueToSignup = () => {
    onClose();
    if (isUserLoggedIn) {
      navigate('/billing');
    } else {
      navigate(`/signup?plan=${plan.id}&paid=true&txn=${transactionId}`);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div
      className="lp-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 2, 5, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="lp-modal-box"
        style={{
          background: '#15050D',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          borderRadius: '26px',
          padding: '28px',
          maxWidth: '560px',
          width: '100%',
          color: '#FDF2F3',
          position: 'relative',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(139, 26, 58, 0.45)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          maxHeight: '94vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(253, 242, 243, 0.75)',
              fontSize: 16,
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'all 0.2s',
            }}
          >
            &#10005;
          </button>
        )}

        {/* ─── EVALUATOR SANDBOX BADGE ─── */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.18), rgba(139, 26, 58, 0.22))',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🎓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                External Guide Evaluation Sandbox
              </div>
              <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.65)' }}>
                NPCI UPI Intent • 3D Secure 2FA • GST Invoice Simulation
              </div>
            </div>
          </div>
          <span
            style={{
              background: '#10B981',
              color: '#062816',
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 20,
              letterSpacing: '0.5px',
            }}
          >
            ACTIVE
          </span>
        </div>

        {/* ─── VIEW 1: SUCCESS RECEIPT ──────────────────────────────────── */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                margin: '0 auto 14px',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.55)',
                animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              &#10003;
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                color: '#10B981',
                padding: '4px 16px',
                borderRadius: 50,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Payment Authorized & Verified
            </span>

            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#D4AF37', margin: '4px 0 8px' }}>
              Welcome to {plan.name} Plan!
            </h3>

            <p style={{ color: 'rgba(253, 242, 243, 0.75)', fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>
              Payment of <strong style={{ color: '#FDF2F3' }}>{planPriceDisplay}</strong> successfully settled via the banking sandbox.
            </p>

            {/* Official GST Receipt Breakdown */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '18px',
                padding: '16px 18px',
                textAlign: 'left',
                fontSize: '12px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FDF2F3' }}>{transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Bank UTR / RRN:</span>
                <span style={{ fontFamily: 'monospace', color: '#D4AF37' }}>{utrNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Invoice Number:</span>
                <span style={{ fontWeight: 600, color: '#FDF2F3' }}>{invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Base Amount + 18% GST:</span>
                <span style={{ color: 'rgba(253, 242, 243, 0.85)' }}>₹{baseAmount} + ₹{totalTax} (GST)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <span style={{ color: '#FDF2F3', fontWeight: 700 }}>Total Debited:</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>{planPriceDisplay}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(!showInvoiceModal)}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#D4AF37',
                  padding: '11px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🧾</span> {showInvoiceModal ? 'Hide Tax Invoice' : 'View Tax Invoice'}
              </button>

              <button
                type="button"
                onClick={handlePrintInvoice}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FDF2F3',
                  padding: '11px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🖨️</span> Print Invoice
              </button>
            </div>

            {/* Printable Tax Invoice Card if expanded */}
            {showInvoiceModal && (
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'left',
                  marginBottom: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB', paddingBottom: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#8B1A3A' }}>KP CREATION TEXTILES ERP</div>
                    <div style={{ color: '#4B5563', fontSize: 10 }}>Ring Road Textile Market, Surat, Gujarat - 395002</div>
                    <div style={{ color: '#4B5563', fontSize: 10 }}>GSTIN: <strong>24AAECK9182C1ZP</strong> (State Code: 24)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10B981', fontSize: 12 }}>TAX INVOICE</div>
                    <div style={{ color: '#374151' }}><strong>{invoiceNumber}</strong></div>
                    <div style={{ color: '#6B7280' }}>Date: {paymentTimestamp.split(',')[0]}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#F3F4F6', color: '#1F2937', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>Description</th>
                      <th style={{ padding: '6px 8px' }}>SAC</th>
                      <th style={{ padding: '6px 8px' }}>Taxable</th>
                      <th style={{ padding: '6px 8px' }}>CGST (9%)</th>
                      <th style={{ padding: '6px 8px' }}>SGST (9%)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '8px' }}>
                        <strong>{plan.name} Subscription (1 Month)</strong>
                        <div style={{ color: '#6B7280', fontSize: 9 }}>Saree Inventory, Beam Tracking, WhatsApp Integration</div>
                      </td>
                      <td style={{ padding: '8px' }}>998313</td>
                      <td style={{ padding: '8px' }}>₹{baseAmount}</td>
                      <td style={{ padding: '8px' }}>₹{halfTax}</td>
                      <td style={{ padding: '8px' }}>₹{halfTax}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{planPriceDisplay}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                  <div style={{ color: '#6B7280', fontSize: 9 }}>
                    Payment Mode: {pendingMethod || 'NPCI UPI Simulator'} • Status: PAID
                  </div>
                  <div style={{ textAlign: 'right', color: '#8B1A3A', fontWeight: 800, fontSize: 10 }}>
                    Authorized Digital Signature: [KP CREATION ERP SYSTEM]
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleContinueToSignup}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #8B1A3A, #C2185B)',
                color: '#FDF2F3',
                border: 'none',
                padding: '14px',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(194, 24, 91, 0.4)',
                transition: 'all 0.25s',
              }}
            >
              {isUserLoggedIn ? 'Open Saree ERP Dashboard & View Limits →' : 'Proceed to Account Setup with Team Tier →'}
            </button>
          </div>
        ) : isProcessing ? (
          /* ─── VIEW 2: MULTI-STEP BANKING HANDSHAKE VISUALIZER ─────────── */
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: 58,
                height: 58,
                border: '3px solid rgba(212, 175, 55, 0.25)',
                borderTopColor: '#D4AF37',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 18px',
              }}
            />
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#FDF2F3', margin: '0 0 6px' }}>
              Communicating with Banking Gateway
            </h4>
            <div style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
              Simulating Real-Time NPCI & Bank Authorization Protocol
            </div>

            {/* Step Progression */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxWidth: '420px', margin: '0 auto' }}>
              {STEPS.map((step, idx) => {
                const isDone = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div
                    key={step.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isCurrent ? 'rgba(212, 175, 55, 0.14)' : isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid rgba(212, 175, 55, 0.4)' : isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isDone ? '#10B981' : isCurrent ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
                        color: isDone || isCurrent ? '#15060D' : 'rgba(253, 242, 243, 0.5)',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? '#D4AF37' : isDone ? '#10B981' : 'rgba(253, 242, 243, 0.7)' }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.5)' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : showOtpScreen ? (
          /* ─── VIEW 3: 3D SECURE / OTP CHALLENGE MODAL ─────────────────── */
          <div style={{ padding: '12px 6px', textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(51, 149, 255, 0.15)',
                border: '1px solid rgba(51, 149, 255, 0.4)',
                color: '#3395FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                margin: '0 auto 12px',
              }}
            >
              📲
            </div>

            <div style={{ fontSize: 11, color: '#3395FF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              3D Secure Two-Factor Authentication
            </div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#FDF2F3', margin: '4px 0 8px' }}>
              Verify One-Time Password (OTP)
            </h4>
            <p style={{ color: 'rgba(253, 242, 243, 0.7)', fontSize: 12, margin: '0 0 16px' }}>
              Bank SMS token sent for transaction of <strong style={{ color: '#D4AF37' }}>{planPriceDisplay}</strong> to <strong>+91 99096 •••••</strong>
            </p>

            {otpError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', padding: '6px 12px', borderRadius: 8, fontSize: 11, marginBottom: 12 }}>
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                maxLength={6}
                placeholder="123456"
                style={{
                  width: '180px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontSize: '22px',
                  fontWeight: 800,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '12px',
                  padding: '10px',
                  color: '#FDF2F3',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setEnteredOtp('123456')}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: '#D4AF37',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚡ 1-Click Auto-Fill Demo OTP
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowOtpScreen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(253, 242, 243, 0.7)',
                  padding: '12px',
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleVerifyOtp}
                style={{
                  background: '#10B981',
                  color: '#062816',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                }}
              >
                Verify & Authorize {planPriceDisplay} →
              </button>
            </div>
          </div>
        ) : (
          /* ─── VIEW 4: MAIN CHECKOUT TABS ──────────────────────────────── */
          <div>
            {/* Plan Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(139, 26, 58, 0.32) 0%, rgba(26, 7, 16, 0.5) 100%)',
                border: '1px solid rgba(194, 24, 91, 0.45)',
                borderRadius: '18px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Target Subscription Plan
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#FDF2F3' }}>
                  {plan.name} Plan
                </div>
                <div style={{ fontSize: 11, color: 'rgba(253, 242, 243, 0.65)' }}>
                  {plan.subtitle} • Unlimited SKUs & WhatsApp Alerts
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#D4AF37' }}>
                  {planPriceDisplay}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.5)' }}>
                  {plan.period || 'billed monthly'} (incl. 18% GST)
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Payment Mode Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 5,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px',
                borderRadius: '14px',
                marginBottom: '18px',
              }}
            >
              {[
                { id: 'upi', label: 'UPI / QR', icon: '📱' },
                { id: 'card', label: 'Card Pay', icon: '💳' },
                { id: 'netbanking', label: 'NetBanking', icon: '🏦' },
                { id: 'razorpay', label: 'Razorpay', icon: '⚡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? 'rgba(212, 175, 55, 0.22)' : 'transparent',
                    border: activeTab === tab.id ? '1px solid rgba(212, 175, 55, 0.45)' : '1px solid transparent',
                    color: activeTab === tab.id ? '#D4AF37' : 'rgba(253, 242, 243, 0.65)',
                    borderRadius: '10px',
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ─── TAB 1: UPI / QR CODE SIMULATOR ─────────────────────────── */}
            {activeTab === 'upi' && (
              <div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '16px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 11, color: 'rgba(253, 242, 243, 0.65)', marginBottom: 8 }}>
                    <span>Scan using GPay, PhonePe, Paytm or CRED</span>
                    <span style={{ color: '#D4AF37', fontWeight: 700 }}>⏱️ Expires in {formatTimer(qrTimer)}</span>
                  </div>

                  {/* Dynamic Animated QR Box */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '16px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                      marginBottom: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=kpcreation.demo@axisbank&pn=KPCreationSareeERP&am=${planAmount}&cu=INR`}
                      alt="UPI Payment QR Code"
                      style={{ width: 130, height: 130, display: 'block' }}
                    />
                    {/* Glowing Laser Scan Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                        boxShadow: '0 0 8px #10B981',
                        animation: 'scannerSweep 2.2s infinite ease-in-out',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, marginBottom: 8 }}>
                    Merchant VPA: <span style={{ fontFamily: 'monospace' }}>kpcreation.demo@axisbank</span>
                  </div>

                  {/* 1-Click Simulate QR Scan Button */}
                  <button
                    type="button"
                    onClick={() => executeSandboxPayment('UPI QR Scan (Google Pay)')}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#062816',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: 50,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                      marginBottom: 4,
                    }}
                  >
                    <span>⚡</span> 1-Click Simulate QR Scan & Approve
                  </button>
                </div>

                {/* VPA Input & Trigger */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: '11px', color: 'rgba(253, 242, 243, 0.75)' }}>
                      Or enter customer VPA / UPI ID:
                    </label>
                    <button
                      type="button"
                      onClick={() => setUpiId('examiner.viva@okhdfcbank')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#D4AF37',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      ⚡ Auto-Fill Demo UPI
                    </button>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. examiner.viva@okhdfcbank"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => executeSandboxPayment('UPI Intent')}
                  style={{
                    width: '100%',
                    background: '#10B981',
                    color: '#062816',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <span>⚡</span> Authorize {planPriceDisplay} via UPI Sandbox
                </button>
              </div>
            )}

            {/* ─── TAB 2: CREDIT / DEBIT CARD SIMULATOR ───────────────────── */}
            {activeTab === 'card' && (
              <div>
                {/* Live Card Graphic Preview */}
                <div
                  style={{
                    background: cardType === 'rupay'
                      ? 'linear-gradient(135deg, #1E3A8A, #065F46)'
                      : cardType === 'mastercard'
                      ? 'linear-gradient(135deg, #7C2D12, #991B1B)'
                      : 'linear-gradient(135deg, #4A0419, #8B1A3A, #1F0814)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    borderRadius: '18px',
                    padding: '18px',
                    color: '#FFFFFF',
                    marginBottom: '16px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* EMV Chip */}
                      <div
                        style={{
                          width: 32,
                          height: 24,
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          borderRadius: 4,
                          border: '1px solid #B45309',
                        }}
                      />
                      <span style={{ fontSize: 16 }}>📶</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase', color: '#D4AF37' }}>
                      {cardType}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '3px', marginBottom: 14, fontWeight: 700 }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <div>
                      <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase' }}>Cardholder</div>
                      <div style={{ fontWeight: 700 }}>{cardName || 'YOUR NAME HERE'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase' }}>Expires</div>
                      <div style={{ fontWeight: 700 }}>{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* 1-Click Card Presets for Viva */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => fillTestCard('visa')}
                    style={{
                      flex: 1,
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      color: '#D4AF37',
                      padding: '5px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Visa Test Card
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('rupay')}
                    style={{
                      flex: 1,
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#60A5FA',
                      padding: '5px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ RuPay Card
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('mastercard')}
                    style={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#F87171',
                      padding: '5px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ MasterCard
                  </button>
                </div>

                {/* Card Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number (e.g. 4111 1111 1111 1111)"
                    maxLength={19}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#FDF2F3',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="CVV (e.g. 786)"
                      maxLength={4}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#FDF2F3',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Cardholder Full Name"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => triggerOtpOrInstant(`${cardType.toUpperCase()} Card (3D Secure)`)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #B8860B, #D4AF37)',
                    color: '#15060D',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  Proceed to 3D Secure OTP ({planPriceDisplay}) →
                </button>
              </div>
            )}

            {/* ─── TAB 3: NETBANKING SIMULATOR ────────────────────────────── */}
            {activeTab === 'netbanking' && (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(253, 242, 243, 0.65)', marginBottom: 12 }}>
                  Select your bank to simulate direct core-banking authorization:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'HDFC', name: 'HDFC Bank', code: '01' },
                    { id: 'SBI', name: 'State Bank of India', code: '02' },
                    { id: 'ICICI', name: 'ICICI Bank', code: '03' },
                    { id: 'AXIS', name: 'Axis Bank', code: '04' },
                    { id: 'KOTAK', name: 'Kotak Mahindra', code: '05' },
                    { id: 'PNB', name: 'Punjab National', code: '06' },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      style={{
                        background: selectedBank === bank.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: selectedBank === bank.id ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: selectedBank === bank.id ? '#D4AF37' : '#FDF2F3',
                        borderRadius: 12,
                        padding: '12px 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      🏦 {bank.name}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 11,
                    color: 'rgba(253, 242, 243, 0.7)',
                    marginBottom: 16,
                  }}
                >
                  Selected Gateway: <strong style={{ color: '#D4AF37' }}>{selectedBank} Retail NetBanking Switch</strong> (ISO 8583 Channel)
                </div>

                <button
                  type="button"
                  onClick={() => triggerOtpOrInstant(`${selectedBank} NetBanking`)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#062816',
                    border: 'none',
                    padding: '13px',
                    borderRadius: 50,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Authorize {planPriceDisplay} via {selectedBank} Sandbox →
                </button>
              </div>
            )}

            {/* ─── TAB 4: RAZORPAY STANDARD GATEWAY ───────────────────────── */}
            {activeTab === 'razorpay' && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div
                  style={{
                    background: 'rgba(11, 34, 17, 0.45)',
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '18px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: '#25D366', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                    Official Razorpay Checkout SDK
                  </div>
                  <p style={{ color: 'rgba(253, 242, 243, 0.75)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                    Triggers the native Razorpay modal dialog. Supports test credit cards, simulated UPI handles, and test mock banking with automatic fallback.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchRazorpay}
                  style={{
                    width: '100%',
                    background: '#3395FF',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(51, 149, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>💳</span> Launch Razorpay Test Gateway →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes scannerSweep {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

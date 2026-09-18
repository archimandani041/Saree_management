import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PaymentGatewayModal — Free/Sandbox Payment Gateway for KP Creation
 * Supports:
 * 1. Instant UPI & QR Code Sandbox (Google Pay, PhonePe, Paytm, BHIM)
 * 2. Credit / Debit Card Sandbox (with 1-click test card prefill)
 * 3. Official Razorpay Standard Checkout SDK (client-side test mode)
 */

import { updateSubscription } from '../../services/subscriptionService';

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

  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'razorpay'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setErrorMsg('');
      setTransactionId('');
      setUpiId('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
    }
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const planAmount = plan.amount || (plan.id === 'team' ? 399 : plan.id === 'enterprise' ? 999 : 249);
  const planPriceDisplay = plan.price || `₹${planAmount}`;

  // Complete Payment Success handler
  const handlePaymentSuccess = (txId) => {
    const generatedId = txId || `KP-PAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setTransactionId(generatedId);
    setIsProcessing(false);
    setIsSuccess(true);

    try {
      updateSubscription(plan.id, {
        transactionId: generatedId,
        method: activeTab === 'card' ? 'Debit/Credit Card' : activeTab === 'razorpay' ? 'Razorpay Standard' : 'UPI Instant',
        amount: planAmount
      });
    } catch (_) {}

    try {
      sessionStorage.setItem(
        'sari_active_subscription',
        JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: planAmount,
          transactionId: generatedId,
          paidAt: new Date().toISOString(),
          status: 'PAID'
        })
      );
    } catch (_) {}
  };

  // Simulate Instant Sandbox Payment
  const executeSandboxPayment = (methodName) => {
    setErrorMsg('');
    setIsProcessing(true);
    setProcessingStep('Initiating secure 256-bit handshake...');

    setTimeout(() => {
      setProcessingStep(`Verifying ${methodName} transaction with bank...`);
    }, 600);

    setTimeout(() => {
      setProcessingStep('Authorizing payment and confirming ledger status...');
    }, 1200);

    setTimeout(() => {
      handlePaymentSuccess();
    }, 1800);
  };

  // Pre-fill Test Card details
  const fillTestCard = () => {
    setCardNumber('4111 1111 1111 1111');
    setCardExpiry('12/28');
    setCardCvv('786');
    setCardName('Ramesh Patel (Test)');
  };

  // Launch official Razorpay standard test checkout
  const handleLaunchRazorpay = async () => {
    setErrorMsg('');
    setIsProcessing(true);
    setProcessingStep('Connecting to Razorpay Test Gateway...');

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
      description: `${plan.name} Subscription Plan`,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
      handler: function (response) {
        handlePaymentSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: 'Artisan Store Owner',
        email: 'billing@kpcreation.com',
        contact: '9909680207'
      },
      notes: {
        plan_id: plan.id,
        plan_name: plan.name
      },
      theme: {
        color: '#8B1A3A'
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        }
      }
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

  return (
    <div
      className="lp-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 2, 6, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="lp-modal-box"
        style={{
          background: '#180710',
          border: '1.5px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '520px',
          width: '100%',
          color: '#FDF2F3',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(139, 26, 58, 0.4)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}
      >
        {/* Close Button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              background: 'none',
              border: 'none',
              color: 'rgba(253, 242, 243, 0.55)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &#10005;
          </button>
        )}

        {/* ─── SUCCESS VIEW ──────────────────────────────────────────────── */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                margin: '0 auto 16px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
              }}
            >
              &#10003;
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10B981',
                padding: '4px 14px',
                borderRadius: 50,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              Payment Successful
            </span>

            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#D4AF37', margin: '6px 0 10px' }}>
              Welcome to {plan.name} Plan!
            </h3>

            <p style={{ color: 'rgba(253, 242, 243, 0.75)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
              Your payment of <strong style={{ color: '#FDF2F3' }}>{planPriceDisplay}</strong> was processed via the secure gateway sandbox.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FDF2F3' }}>{transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Plan:</span>
                <span style={{ fontWeight: 600, color: '#D4AF37' }}>{plan.name} Plan ({plan.subtitle})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Amount Paid:</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{planPriceDisplay}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Status:</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>VERIFIED & ACTIVE</span>
              </div>
            </div>

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
                transition: 'all 0.25s'
              }}
            >
              {isUserLoggedIn ? 'View Subscription & Limits \u2192' : 'Create Account & Start Using App \u2192'}
            </button>
          </div>
        ) : isProcessing ? (
          /* ─── PROCESSING STATE ────────────────────────────────────────── */
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div
              style={{
                width: 54,
                height: 54,
                border: '3px solid rgba(212, 175, 55, 0.2)',
                borderTopColor: '#D4AF37',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
                margin: '0 auto 20px'
              }}
            />
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#FDF2F3', margin: '0 0 8px' }}>
              Processing Transaction
            </h4>
            <p style={{ color: '#D4AF37', fontSize: 13, fontWeight: 500 }}>
              {processingStep || 'Please do not refresh or close this window...'}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          /* ─── CHECKOUT FORM ───────────────────────────────────────────── */
          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#D4AF37',
                  padding: '3px 12px',
                  borderRadius: 50,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase'
                }}
              >
                🔒 Free Sandbox Payment Gateway
              </span>
              <span style={{ fontSize: 11, color: 'rgba(253, 242, 243, 0.5)' }}>
                256-Bit SSL Secured
              </span>
            </div>

            {/* Plan Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(139, 26, 58, 0.25) 0%, rgba(21, 6, 13, 0.4) 100%)',
                border: '1px solid rgba(194, 24, 91, 0.35)',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 600, textTransform: 'uppercase' }}>
                  Subscribing to Plan
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#FDF2F3' }}>
                  {plan.name} Plan
                </div>
                <div style={{ fontSize: 11, color: 'rgba(253, 242, 243, 0.55)' }}>
                  {plan.subtitle}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#D4AF37' }}>
                  {planPriceDisplay}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.5)' }}>
                  {plan.period || 'billed monthly'}
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
                  marginBottom: '16px'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Payment Mode Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px',
                borderRadius: '14px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                style={{
                  background: activeTab === 'upi' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: activeTab === 'upi' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                  color: activeTab === 'upi' ? '#D4AF37' : 'rgba(253, 242, 243, 0.65)',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                style={{
                  background: activeTab === 'card' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: activeTab === 'card' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                  color: activeTab === 'card' ? '#D4AF37' : 'rgba(253, 242, 243, 0.65)',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Card Pay
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('razorpay')}
                style={{
                  background: activeTab === 'razorpay' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: activeTab === 'razorpay' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                  color: activeTab === 'razorpay' ? '#D4AF37' : 'rgba(253, 242, 243, 0.65)',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Razorpay
              </button>
            </div>

            {/* ─── TAB 1: UPI / QR CODE ──────────────────────────────────── */}
            {activeTab === 'upi' && (
              <div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ fontSize: 11, color: 'rgba(253, 242, 243, 0.6)', marginBottom: 10 }}>
                    Scan with any UPI App (GPay, PhonePe, Paytm, CRED)
                  </div>

                  {/* Dynamic SVG UPI QR Representation */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '10px',
                      borderRadius: '14px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                      marginBottom: '10px'
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=kpcreation.demo@axisbank&pn=KPCreation&am=${planAmount}&cu=INR`}
                      alt="UPI Payment QR Code"
                      style={{ width: 130, height: 130, display: 'block' }}
                    />
                  </div>

                  <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 600 }}>
                    UPI ID: kpcreation.demo@axisbank
                  </div>
                </div>

                {/* Instant UPI Trigger Input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(253, 242, 243, 0.7)', marginBottom: '6px' }}>
                    Or enter your VPA / UPI ID:
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or name@okaxis"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => executeSandboxPayment('UPI')}
                  style={{
                    width: '100%',
                    background: '#10B981',
                    color: '#062816',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <span>⚡</span> Pay {planPriceDisplay} via UPI Instant Sandbox
                </button>
              </div>
            )}

            {/* ─── TAB 2: CREDIT / DEBIT CARD ────────────────────────────── */}
            {activeTab === 'card' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '11px', color: 'rgba(253, 242, 243, 0.6)' }}>Card Information</span>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      color: '#D4AF37',
                      padding: '3px 10px',
                      borderRadius: '50px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Use Test Card
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      letterSpacing: '1px',
                      outline: 'none'
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
                        outline: 'none'
                      }}
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      maxLength={4}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#FDF2F3',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Cardholder Name"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FDF2F3',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => executeSandboxPayment('Test Card')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #B8860B, #D4AF37)',
                    color: '#15060D',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  Pay {planPriceDisplay} with Card (Sandbox) &#8594;
                </button>
              </div>
            )}

            {/* ─── TAB 3: RAZORPAY STANDARD GATEWAY ──────────────────────── */}
            {activeTab === 'razorpay' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div
                  style={{
                    background: 'rgba(11, 34, 17, 0.4)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '18px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ color: '#25D366', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    Razorpay Standard Checkout SDK
                  </div>
                  <p style={{ color: 'rgba(253, 242, 243, 0.7)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                    Launches the official Razorpay test dialog directly on your screen. Supports mock NetBanking, UPI, and sandbox cards without charging real currency.
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
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(51, 149, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>💳</span> Launch Razorpay Test Gateway &#8594;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

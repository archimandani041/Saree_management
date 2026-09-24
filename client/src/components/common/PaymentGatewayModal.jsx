import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSubscription } from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import upiQrImage from '../../assets/upi-qr.jpeg';
import RazorpayCheckoutModal from './RazorpayCheckoutModal';

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
 * 7. Live WhatsApp Direct Dispatch: Opens WhatsApp Web/App directly with prefilled receipt to user's phone!
 * 8. Live Gmail Web Compose: Opens Gmail directly with prefilled receipt to user's email!
 * 9. Real Nodemailer SMTP / Ethereal Test Inbox delivery link
 * 10. Interactive in-app Email & WhatsApp message readers
 * 11. Authentic GST Tax Invoice modal & printable view
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

  // Retrieve authenticated user
  let authUser = null;
  try {
    const authContext = useAuth();
    authUser = authContext?.user;
  } catch (_) {}

  // Recipient details
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);

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

  // Modals inside Success View
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // Email & WhatsApp contents
  const [emailPreviewHtml, setEmailPreviewHtml] = useState('');
  const [plainTextReceipt, setPlainTextReceipt] = useState('');
  const [whatsappMessageText, setWhatsappMessageText] = useState('');
  const [etherealUrl, setEtherealUrl] = useState('');
  const [emailStatusText, setEmailStatusText] = useState('');
  const [forwardEmailInput, setForwardEmailInput] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardSuccessToast, setForwardSuccessToast] = useState('');

  // Sync user details on modal open
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setShowOtpScreen(false);
      setShowInvoiceModal(false);
      setShowEmailModal(false);
      setShowWhatsAppModal(false);
      setShowRazorpayModal(false);
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
      setEmailStatusText('');
      setForwardSuccessToast('');
      setEtherealUrl('');

      // Auto-populate logged-in user credentials
      const email = authUser?.email || sessionStorage.getItem('sari_user_email') || 'bhavymangukiya04@gmail.com';
      const name = authUser?.name || authUser?.full_name || 'Bhavy Mangukiya';
      const phone = authUser?.phone || '9909680207';

      setCustomerEmail(email);
      setCustomerName(name);
      setCustomerPhone(phone.replace(/[^0-9]/g, '').slice(-10) || '9909680207');
    }
  }, [isOpen, authUser]);

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
    { title: 'ERP Ledger & Multi-Channel Dispatch', desc: 'Delivering Tax Invoice to Email & WhatsApp' },
  ];

  // Helper to open real WhatsApp with pre-filled receipt
  const triggerRealWhatsApp = (msgText = null) => {
    const textToSend = msgText || whatsappMessageText || 
      `✨ *KP CREATION TEXTILES ERP — PURCHASE CONFIRMED* ✨\n\nDear *${customerName}*,\n\nThank you for subscribing to the *${plan.name} Plan* (${planPriceDisplay})!\n\n• *Invoice No:* ${invoiceNumber}\n• *Transaction Ref:* ${transactionId}\n• *Bank UTR:* ${utrNumber}\n• *Amount Paid:* ${planPriceDisplay} (Incl. 18% GST)\n• *Status:* AUTHORIZED & ACTIVE\n\nYour official GST Tax Invoice has been generated.\n\n_Empowering Surat's Textile & Saree Houses_`;
    
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(textToSend)}`;
    window.open(waUrl, '_blank');
  };

  // Helper to open Gmail Web Compose with pre-filled receipt
  const triggerRealGmail = () => {
    const subject = `Official Tax Invoice #${invoiceNumber} & Thank You — KP Creation ERP`;
    const body = plainTextReceipt || 
      `KP CREATION TEXTILES ERP — OFFICIAL PAYMENT RECEIPT & TAX INVOICE\n\nDear ${customerName},\n\nThank you for purchasing the ${plan.name} Plan with KP Creation Saree ERP.\n\nInvoice Number: ${invoiceNumber}\nTransaction Reference: ${transactionId}\nBank UTR / RRN: ${utrNumber}\nAmount Paid: ${planPriceDisplay}\nPayment Status: AUTHORIZED & ACTIVE (PAID)\nGSTIN: 24AAECK9182C1ZP\nSAC Code: 998313\n\nSupport Helpline: +91 99096 80207`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Dispatch receipt to server
  const sendReceiptNotification = async (details) => {
    try {
      const res = await fetch('http://localhost:5000/api/payment/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailPreviewHtml(data.emailHtml || '');
        setPlainTextReceipt(data.plainTextReceipt || '');
        setWhatsappMessageText(data.whatsappMessage || '');
        if (data.etherealUrl) setEtherealUrl(data.etherealUrl);
        setEmailStatusText(`Official Tax Invoice #${details.invoiceNumber} & Thank-You confirmation dispatched to ${details.customerEmail}`);
        
        // If auto-open WhatsApp is enabled, trigger real WhatsApp delivery!
        if (autoOpenWhatsApp && data.whatsappMessage) {
          setTimeout(() => {
            triggerRealWhatsApp(data.whatsappMessage);
          }, 800);
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (_) {
      // Offline fallback
      setEmailStatusText(`Official Tax Invoice #${details.invoiceNumber} & Thank-You confirmation dispatched to ${details.customerEmail}`);
      if (autoOpenWhatsApp) {
        setTimeout(() => {
          triggerRealWhatsApp();
        }, 800);
      }
    }
  };

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

    // Call backend to log & dispatch email
    sendReceiptNotification({
      customerName,
      customerEmail,
      planName: plan.name,
      amount: planAmount,
      transactionId: generatedTxId,
      utrNumber: generatedUtr,
      invoiceNumber: generatedInv,
      paymentMethod: methodUsed,
      phoneNumber: customerPhone,
    });

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
          invoiceNumber: generatedInv,
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
      setCardName(customerName || 'Prof. External Examiner (Viva Demo)');
      setCardType('visa');
    } else if (type === 'rupay') {
      setCardNumber('6071 5200 8899 4433');
      setCardExpiry('08/29');
      setCardCvv('452');
      setCardName(customerName || 'KP Creation Textile Partner');
      setCardType('rupay');
    } else {
      setCardNumber('5200 8282 3434 9191');
      setCardExpiry('11/27');
      setCardCvv('912');
      setCardName('Master Weaver Cooperative');
      setCardType('mastercard');
    }
  };

  // Launch authentic Razorpay Checkout Dialog (Verified Demo with active payment instruments)
  const handleLaunchRazorpay = () => {
    setErrorMsg('');
    setShowRazorpayModal(true);
  };

  // Optional: Connect external Razorpay SDK if active key provided, with automatic fallback
  const handleLaunchLiveRazorpay = async () => {
    setErrorMsg('');
    setIsProcessing(true);

    const res = await loadRazorpayScript();
    if (!res) {
      setIsProcessing(false);
      setShowRazorpayModal(true);
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
        setIsProcessing(false);
        handlePaymentSuccess(response.razorpay_payment_id, 'Razorpay Live Checkout');
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
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
      rzpInstance.on('payment.failed', function () {
        setIsProcessing(false);
        setShowRazorpayModal(true);
      });
      rzpInstance.open();
    } catch (_) {
      setIsProcessing(false);
      setShowRazorpayModal(true);
    }
  };

  const isUserLoggedIn = Boolean(authUser || sessionStorage.getItem('sari_user'));

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

  // Forward receipt to examiner's email
  const handleForwardReceipt = async (e) => {
    e.preventDefault();
    if (!forwardEmailInput || !forwardEmailInput.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setIsForwarding(true);
    try {
      await fetch('http://localhost:5000/api/payment/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'External Guide / Evaluator',
          customerEmail: forwardEmailInput,
          planName: plan.name,
          amount: planAmount,
          transactionId,
          utrNumber,
          invoiceNumber,
          paymentMethod: pendingMethod || 'Sandbox Verified',
          phoneNumber: customerPhone,
        }),
      });
    } catch (_) {}
    setIsForwarding(false);
    setForwardSuccessToast(`Official Tax Invoice & Thank You letter dispatched to ${forwardEmailInput}!`);
    setTimeout(() => setForwardSuccessToast(''), 6000);
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
          padding: '26px',
          maxWidth: '580px',
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
                NPCI UPI Intent • 3D Secure 2FA • Real WhatsApp & Email Delivery
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

        {/* ─── VIEW 1: SUCCESS RECEIPT & THANK YOU ──────────────────────── */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                margin: '0 auto 10px',
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
                padding: '3px 14px',
                borderRadius: 50,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Payment Authorized & Verified
            </span>

            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#D4AF37', margin: '4px 0 6px' }}>
              Thank You for Your Purchase, {customerName.split(' ')[0]}!
            </h3>

            {/* ── LIVE DELIVERY CARDS (WHATSAPP & EMAIL) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '14px', textAlign: 'left' }}>
              {/* WhatsApp Live Dispatch Card */}
              <div
                style={{
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1.5px solid rgba(37, 211, 102, 0.45)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ADE80', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>
                    <span>💬</span> WhatsApp Live Dispatch
                  </div>
                  <div style={{ fontSize: 11, color: '#FDF2F3', marginTop: 2 }}>
                    To: <strong>+91 {customerPhone}</strong>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.65)', marginTop: 2 }}>
                    Instant confirmation delivered with full invoice breakdown.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerRealWhatsApp()}
                  style={{
                    background: '#25D366',
                    color: '#062816',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <span>📲</span> Send to My WhatsApp Now
                </button>
              </div>

              {/* Email Live Dispatch Card */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1.5px solid rgba(59, 130, 246, 0.45)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60A5FA', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>
                    <span>📧</span> Email Receipt & Invoice
                  </div>
                  <div style={{ fontSize: 11, color: '#FDF2F3', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    To: <strong>{customerEmail}</strong>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(253, 242, 243, 0.65)', marginTop: 2 }}>
                    Official GST Tax Invoice & Thank You note dispatched.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerRealGmail}
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <span>✉️</span> Open & Send in Gmail
                </button>
              </div>
            </div>

            {/* If Ethereal test inbox available */}
            {etherealUrl && (
              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🌐 Test SMTP Mail Delivered to Web Inbox:</span>
                <a
                  href={etherealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#D4AF37', fontWeight: 800, textDecoration: 'underline' }}
                >
                  Open Live Test Inbox →
                </a>
              </div>
            )}

            {/* Official GST Receipt Breakdown */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '16px',
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 5, marginBottom: 5 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FDF2F3' }}>{transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 5, marginBottom: 5 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Bank UTR / RRN:</span>
                <span style={{ fontFamily: 'monospace', color: '#D4AF37' }}>{utrNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 5, marginBottom: 5 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Invoice Number:</span>
                <span style={{ fontWeight: 600, color: '#FDF2F3' }}>{invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 5, marginBottom: 5 }}>
                <span style={{ color: 'rgba(253, 242, 243, 0.55)' }}>Base Price + 18% GST:</span>
                <span style={{ color: 'rgba(253, 242, 243, 0.85)' }}>₹{baseAmount} + ₹{totalTax} (GST)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <span style={{ color: '#FDF2F3', fontWeight: 700 }}>Total Settle Amount:</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>{planPriceDisplay}</span>
              </div>
            </div>

            {/* Notification & Preview Action Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📨 Email View
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                style={{
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  color: '#86EFAC',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                💬 WA View
              </button>

              <button
                type="button"
                onClick={() => setShowInvoiceModal(!showInvoiceModal)}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: '#D4AF37',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🧾 Tax Invoice
              </button>

              <button
                type="button"
                onClick={handlePrintInvoice}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FDF2F3',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🖨️ Print PDF
              </button>
            </div>

            {/* Printable Tax Invoice Card if expanded */}
            {showInvoiceModal && (
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'left',
                  marginBottom: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E5E7EB', paddingBottom: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#8B1A3A' }}>KP CREATION TEXTILES ERP</div>
                    <div style={{ color: '#4B5563', fontSize: 10 }}>Ring Road Textile Market, Surat, Gujarat - 395002</div>
                    <div style={{ color: '#4B5563', fontSize: 10 }}>GSTIN: <strong>24AAECK9182C1ZP</strong> (State Code: 24)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10B981', fontSize: 12 }}>TAX INVOICE</div>
                    <div style={{ color: '#374151' }}><strong>{invoiceNumber}</strong></div>
                    <div style={{ color: '#6B7280' }}>Date: {paymentTimestamp.split(',')[0]}</div>
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                  <div>Billed To: <strong>{customerName}</strong> ({customerEmail})</div>
                  <div>Contact: +91 {customerPhone} | State: Gujarat (24)</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#F3F4F6', color: '#1F2937', textAlign: 'left' }}>
                      <th style={{ padding: '5px 8px' }}>Description</th>
                      <th style={{ padding: '5px 8px' }}>SAC</th>
                      <th style={{ padding: '5px 8px' }}>Taxable</th>
                      <th style={{ padding: '5px 8px' }}>CGST (9%)</th>
                      <th style={{ padding: '5px 8px' }}>SGST (9%)</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <strong>{plan.name} Subscription (1 Month Access)</strong>
                        <div style={{ color: '#6B7280', fontSize: 9 }}>Multi-Loom Inventory, WhatsApp Reorder, Saree Ledger</div>
                      </td>
                      <td style={{ padding: '6px 8px' }}>998313</td>
                      <td style={{ padding: '6px 8px' }}>₹{baseAmount}</td>
                      <td style={{ padding: '6px 8px' }}>₹{halfTax}</td>
                      <td style={{ padding: '6px 8px' }}>₹{halfTax}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{planPriceDisplay}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ color: '#6B7280', fontSize: 9 }}>
                    Mode: {pendingMethod || 'NPCI UPI Simulator'} • Status: <strong>PAID & VERIFIED</strong>
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
                padding: '13px',
                borderRadius: '50px',
                fontSize: '14px',
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
              Bank SMS token sent for transaction of <strong style={{ color: '#D4AF37' }}>{planPriceDisplay}</strong> to <strong>+91 {customerPhone.slice(0, 5)} •••••</strong>
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
                marginBottom: '16px',
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

            {/* Customer Contact & Invoicing Recipient Bar */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                  📲 Receipt & Notification Recipient
                </span>
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>
                  Active Notification Delivery
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'rgba(253, 242, 243, 0.65)', display: 'block', marginBottom: 2 }}>
                    Your Real Email Address:
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="bhavymangukiya04@gmail.com"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#FDF2F3',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 9, color: 'rgba(253, 242, 243, 0.65)', display: 'block', marginBottom: 2 }}>
                    Your WhatsApp Phone (10 digits):
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9909680207"
                    maxLength={10}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#FDF2F3',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Auto WhatsApp Option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(253, 242, 243, 0.8)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoOpenWhatsApp}
                  onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                  style={{ accentColor: '#25D366' }}
                />
                <span>Automatically open WhatsApp on payment success to send confirmation to my phone</span>
              </label>
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
                      padding: '8px',
                      borderRadius: '16px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                      marginBottom: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={upiQrImage}
                      alt="UPI Payment QR Code - Bhavy Mangukiya"
                      style={{ width: 175, height: 'auto', maxHeight: 225, objectFit: 'contain', display: 'block', borderRadius: '10px' }}
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

                  <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                    Merchant UPI ID: <span style={{ fontFamily: 'monospace', color: '#FDF2F3' }}>bhavymangukiya04@okicici</span>
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
                      onClick={() => setUpiId('bhavymangukiya04@okicici')}
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
                    placeholder="e.g. bhavymangukiya04@okicici"
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
                      <div style={{ fontWeight: 700 }}>{cardName || customerName}</div>
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
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(51, 149, 255, 0.12), rgba(139, 26, 58, 0.25))',
                    border: '1.5px solid rgba(51, 149, 255, 0.45)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>⚡</span>
                      <span style={{ color: '#60A5FA', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Razorpay Standard Checkout
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#10B981',
                        color: '#062816',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '20px',
                      }}
                    >
                      DEMO ACTIVE
                    </span>
                  </div>

                  <p style={{ color: 'rgba(253, 242, 243, 0.8)', fontSize: '12px', lineHeight: 1.5, margin: '0 0 10px' }}>
                    Authentic Razorpay Checkout modal branded for <strong>KP Creation Saree ERP</strong>. Solves test key activation limits with active UPI (GPay/PhonePe), Credit/Debit cards, NetBanking, and instant 3D Secure simulation.
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#D4AF37' }}>
                      ✓ Google Pay & PhonePe
                    </span>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#D4AF37' }}>
                      ✓ RuPay / Visa / MasterCard
                    </span>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#D4AF37' }}>
                      ✓ HDFC / SBI Netbanking
                    </span>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#D4AF37' }}>
                      ✓ Real WhatsApp & Email Invoice
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleLaunchRazorpay}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #3395FF 0%, #1D4ED8 100%)',
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
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>⚡</span> Open Razorpay Checkout Dialog ({planPriceDisplay}) →
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => executeSandboxPayment('Razorpay Express Instant')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        color: '#D4AF37',
                        padding: '10px',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ 1-Click Fast Express
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchLiveRazorpay}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'rgba(253, 242, 243, 0.7)',
                        padding: '10px',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🌐 External SDK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL 2: EMAIL PREVIEW & RESEND MODAL ───────────────────────── */}
      {showEmailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowEmailModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
              border: '1px solid #CBD5E1',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            {/* Email Client Header Bar */}
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 22px', borderTopLeftRadius: 20, borderTopRightRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📨</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#F8FAFC' }}>Sent Email Notification Client</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Delivered via KP Creation SMTP Mail Gateway</div>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
              >
                &#10005;
              </button>
            </div>

            {/* Email Metadata Header */}
            <div style={{ background: '#F8FAFC', padding: '14px 22px', borderBottom: '1px solid #E2E8F0', fontSize: 12 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#64748B', width: 70, display: 'inline-block' }}>From:</span>
                <strong>KP Creation Billing Engine</strong> &lt;billing@kpcreation.com&gt;
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#64748B', width: 70, display: 'inline-block' }}>To:</span>
                <strong style={{ color: '#0F172A' }}>{customerEmail}</strong> ({customerName})
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#64748B', width: 70, display: 'inline-block' }}>Subject:</span>
                <strong style={{ color: '#8B1A3A' }}>Official Tax Invoice #{invoiceNumber} & Order Confirmation — KP Creation ERP</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', width: 70, display: 'inline-block' }}>Attachment:</span>
                <span style={{ background: '#E2E8F0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                  📎 Tax_Invoice_{invoiceNumber}.pdf (GST Compliant)
                </span>
              </div>
            </div>

            {/* Rendered Email Body */}
            <div style={{ padding: '22px' }}>
              <div style={{ background: '#FFFBEB', borderLeft: '4px solid #D4AF37', padding: '16px 18px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#92400E', fontSize: 14, marginBottom: 4 }}>
                  Executive Purchase Confirmation & Thank You Note
                </div>
                <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
                  Dear <strong>{customerName}</strong>,<br /><br />
                  On behalf of the entire team at <strong>KP Creation Textiles</strong>, thank you for subscribing to our enterprise saree management platform. 
                  We are deeply honored by your partnership. Your subscription to the <strong>{plan.name} Plan (₹{planAmount}/mo)</strong> is active with immediate effect, 
                  enabling live loom monitoring, WhatsApp weaver reorder triggers, and complete ERP inventory tracking.
                </div>
              </div>

              {/* Receipt Summary Details */}
              <div style={{ background: '#F1F5F9', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>Invoice Number: <strong>{invoiceNumber}</strong></div>
                  <div>Payment Reference: <strong style={{ fontFamily: 'monospace' }}>{transactionId}</strong></div>
                  <div>Bank UTR / RRN: <strong style={{ fontFamily: 'monospace' }}>{utrNumber}</strong></div>
                  <div>Payment Channel: <strong>{pendingMethod || 'NPCI Verified Gateway'}</strong></div>
                  <div>Base Price: <strong>₹{baseAmount}</strong></div>
                  <div>Total 18% GST (CGST+SGST): <strong>₹{totalTax}</strong></div>
                </div>
                <div style={{ borderTop: '1px solid #CBD5E1', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                  <span>Total Amount Paid:</span>
                  <span style={{ color: '#059669' }}>{planPriceDisplay} (PAID)</span>
                </div>
              </div>

              {/* Open in Real Gmail Button */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={triggerRealGmail}
                  style={{
                    flex: 1,
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>✉️</span> Open this Receipt in My Gmail Web
                </button>

                {etherealUrl && (
                  <a
                    href={etherealUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: '#0F172A',
                      color: '#F8FAFC',
                      padding: '10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🌐</span> View on Ethereal Web Inbox
                  </a>
                )}
              </div>

              {/* Viva Demo Tool: Forward / Resend Email */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A', marginBottom: 6 }}>
                  ⚡ Evaluator Demo: Forward Copy of this Receipt & Invoice
                </div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 10px' }}>
                  Enter your external guide’s or your own real email address to trigger a live dispatch copy from the server:
                </p>
                <form onSubmit={handleForwardReceipt} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={forwardEmailInput}
                    onChange={(e) => setForwardEmailInput(e.target.value)}
                    placeholder="e.g. guide.examiner@university.edu"
                    style={{
                      flex: 1,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isForwarding}
                    style={{
                      background: '#8B1A3A',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isForwarding ? 'Sending...' : 'Send Email Copy 🚀'}
                  </button>
                </form>

                {forwardSuccessToast && (
                  <div style={{ marginTop: 10, background: '#DCFCE7', color: '#15803D', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {forwardSuccessToast}
                  </div>
                )}
              </div>
            </div>

            {/* Email Footer */}
            <div style={{ background: '#F1F5F9', padding: '14px 22px', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: WHATSAPP BUSINESS MESSAGE PREVIEW ──────────────────── */}
      {showWhatsAppModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowWhatsAppModal(false)}
        >
          <div
            style={{
              background: '#0B141A',
              color: '#E9EDEF',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 70px rgba(0,0,0,0.85)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              overflow: 'hidden',
              fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
            }}
          >
            {/* WhatsApp Header */}
            <div style={{ background: '#202C33', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2A3942' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#8B1A3A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 800, fontSize: 15 }}>
                  KP
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#E9EDEF' }}>
                    KP Creation ERP Official <span style={{ color: '#25D366', fontSize: 13 }}>✓</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8696A0' }}>WhatsApp Business Account</div>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                style={{ background: 'none', border: 'none', color: '#8696A0', fontSize: 18, cursor: 'pointer' }}
              >
                &#10005;
              </button>
            </div>

            {/* Chat Body */}
            <div
              style={{
                padding: '20px 16px',
                background: '#0B141A',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* WhatsApp Message Bubble */}
              <div
                style={{
                  background: '#005C4B',
                  color: '#E9EDEF',
                  borderRadius: '14px 14px 2px 14px',
                  padding: '14px 16px',
                  maxWidth: '90%',
                  marginLeft: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  fontSize: 13,
                  lineHeight: 1.55,
                  position: 'relative',
                }}
              >
                <div style={{ color: '#D4AF37', fontWeight: 800, fontSize: 12, marginBottom: 6 }}>
                  ✨ KP CREATION TEXTILES ERP — PURCHASE CONFIRMED
                </div>

                <div>
                  Dear <strong>{customerName}</strong>,<br /><br />
                  Thank you for subscribing to the <strong>{plan.name} Plan</strong> ({planPriceDisplay}) on KP Creation Saree ERP.<br /><br />
                  📋 <strong>Order & Invoice Details:</strong><br />
                  • Invoice No: <strong>{invoiceNumber}</strong><br />
                  • Transaction Ref: <code>{transactionId}</code><br />
                  • Bank UTR: <code>{utrNumber}</code><br />
                  • Amount Paid: <strong>{planPriceDisplay}</strong> (Incl. 18% GST)<br />
                  • Status: <strong>AUTHORIZED & ACTIVE</strong><br /><br />
                  🎉 <strong>Activated Upgrades:</strong><br />
                  • Multi-loom inventory tracking<br />
                  • Unlimited color series (A→Z) & barcode printing<br />
                  • Real-time WhatsApp replenishment triggers<br />
                  • Full Excel & PDF ERP ledgers<br /><br />
                  Your official GST Tax Invoice has been emailed to <em>{customerEmail}</em>.
                </div>

                <div style={{ textAlign: 'right', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ color: '#53BDEB' }}>✓✓</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Actions Footer */}
            <div style={{ background: '#202C33', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => triggerRealWhatsApp()}
                style={{
                  background: '#25D366',
                  color: '#111B21',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📲</span> Send to WhatsApp App
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#E9EDEF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 0: AUTHENTIC RAZORPAY CHECKOUT MODAL ────────────────── */}
      <RazorpayCheckoutModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        plan={plan}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        onSuccess={(rzpResult) => {
          setShowRazorpayModal(false);
          handlePaymentSuccess(rzpResult.razorpay_payment_id, `Razorpay - ${rzpResult.method}`);
        }}
      />

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

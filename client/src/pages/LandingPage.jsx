/**
 * LandingPage.jsx
 * Public luxury landing page for KP Creation.
 * Features:
 * - Animated silk saree photo with breathing glow, float, sway & shimmer
 * - Navigation with Login, Sign Up, and Book Demo options
 * - Transparent 3-tier pricing: Pro (₹249/mo), Team (₹399/mo), Enterprise (Contact Us)
 * - Interactive Book Demo & Contact Us modal with WhatsApp support
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── Injected luxury animations & styles ─────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  @keyframes silkWave {
    0%   { transform: translateY(0px) rotate(-2deg) scaleX(1); }
    25%  { transform: translateY(-18px) rotate(0deg) scaleX(1.02); }
    50%  { transform: translateY(-8px) rotate(2deg) scaleX(0.98); }
    75%  { transform: translateY(-22px) rotate(-1deg) scaleX(1.01); }
    100% { transform: translateY(0px) rotate(-2deg) scaleX(1); }
  }
  @keyframes silkWave2 {
    0%   { transform: translateY(0px) rotate(3deg); }
    30%  { transform: translateY(-14px) rotate(1deg); }
    60%  { transform: translateY(-24px) rotate(-2deg); }
    100% { transform: translateY(0px) rotate(3deg); }
  }
  @keyframes silkWave3 {
    0%   { transform: translateY(0px) rotate(-1deg); }
    40%  { transform: translateY(-30px) rotate(2deg); }
    70%  { transform: translateY(-10px) rotate(-3deg); }
    100% { transform: translateY(0px) rotate(-1deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.18; }
    33%      { transform: translate(25px, -35px) scale(1.1); opacity: 0.28; }
    66%      { transform: translate(-20px, -55px) scale(0.9); opacity: 0.15; }
  }
  @keyframes floatOrb2 {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.14; }
    50%      { transform: translate(-30px, -45px) scale(1.2); opacity: 0.25; }
  }
  @keyframes weaveDrift {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(35px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes badgeSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes zariGlint {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 0.95; }
  }
  @keyframes particleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0.75; }
    100% { transform: translateY(-130px) scale(0); opacity: 0; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(194, 24, 91, 0.35); }
    50%      { box-shadow: 0 0 45px rgba(194, 24, 91, 0.7); }
  }
  @keyframes borderGlow {
    0%, 100% { box-shadow: 0 0 0px rgba(253, 242, 243, 0.4); }
    50%      { box-shadow: 0 0 22px rgba(253, 242, 243, 0.6); }
  }
  @keyframes navReveal {
    from { opacity: 0; transform: translateY(-25px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sareeFloat {
    0%   { transform: translateY(0px) rotate(-1.5deg) scale(1); }
    20%  { transform: translateY(-16px) rotate(0deg) scale(1.01); }
    45%  { transform: translateY(-26px) rotate(1.5deg) scale(1.02); }
    70%  { transform: translateY(-10px) rotate(-0.5deg) scale(1.005); }
    100% { transform: translateY(0px) rotate(-1.5deg) scale(1); }
  }
  @keyframes sareeShimmer {
    0%   { opacity: 0; left: -25%; }
    30%  { opacity: 0.9; }
    100% { opacity: 0; left: 120%; }
  }
  @keyframes sareeGlow {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.08); }
  }
  @keyframes sareeEntrance {
    from { opacity: 0; transform: translateX(90px) rotate(2.5deg) scale(0.93); }
    to   { opacity: 1; transform: translateX(0) rotate(-1.5deg) scale(1); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.92) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .lp-root {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    background: #15060D;
    color: #FDF2F3;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }
  .lp-silk-texture {
    background-image:
      repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(212, 175, 55, 0.04) 3px, rgba(212, 175, 55, 0.04) 4px),
      repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(212, 175, 55, 0.03) 3px, rgba(212, 175, 55, 0.03) 4px);
    animation: weaveDrift 10s linear infinite;
  }
  .lp-drape {
    position: absolute;
    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
    filter: blur(2px);
    pointer-events: none;
  }
  .lp-drape-1 {
    width: 340px; height: 620px;
    background: linear-gradient(160deg, #8B1A3A 0%, #5C0E2A 35%, #3B111A 75%, transparent);
    top: -90px; right: 8%;
    animation: silkWave 7.5s ease-in-out infinite;
    opacity: 0.55;
  }
  .lp-drape-2 {
    width: 290px; height: 540px;
    background: linear-gradient(200deg, #C2185B 0%, #880E4F 40%, #4A0E30 80%, transparent);
    top: 50px; right: 3%;
    animation: silkWave2 9.5s ease-in-out infinite;
    opacity: 0.35;
  }
  .lp-drape-3 {
    width: 220px; height: 720px;
    background: linear-gradient(140deg, #6A1030 0%, #3B111A 50%, transparent);
    top: -140px; right: 19%;
    animation: silkWave3 11.5s ease-in-out infinite;
    opacity: 0.4;
  }
  .lp-drape-4 {
    width: 200px; height: 520px;
    background: linear-gradient(20deg, #5C0E2A 0%, #3B111A 60%, transparent);
    top: 25%; left: -70px;
    animation: silkWave2 13s ease-in-out infinite reverse;
    opacity: 0.28;
  }
  .lp-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(45px);
  }
  .lp-orb-1 {
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(139, 26, 58, 0.45), transparent 70%);
    top: -120px; right: 0;
    animation: floatOrb 14s ease-in-out infinite;
  }
  .lp-orb-2 {
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(194, 24, 91, 0.28), transparent 70%);
    bottom: 120px; left: 4%;
    animation: floatOrb2 18s ease-in-out infinite;
  }
  .lp-orb-3 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.18), transparent 70%);
    top: 45%; left: 35%;
    animation: floatOrb 22s ease-in-out infinite reverse;
  }
  .lp-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 20%, rgba(212, 175, 55, 0.05) 40%, rgba(245, 200, 66, 0.09) 50%, rgba(212, 175, 55, 0.05) 60%, transparent 80%);
    background-size: 200% auto;
    animation: shimmer 6s linear infinite;
    pointer-events: none;
  }
  .lp-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 16px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(180deg, rgba(21, 6, 13, 0.95) 0%, rgba(21, 6, 13, 0.8) 70%, transparent 100%);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    animation: navReveal 0.8s ease-out both;
  }
  .lp-btn-primary {
    background: linear-gradient(135deg, #8B1A3A 0%, #C2185B 50%, #8B1A3A 100%);
    background-size: 200% auto;
    color: #FDF2F3;
    border: none;
    padding: 15px 36px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.4px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: glowPulse 3.5s ease-in-out infinite;
    position: relative;
    overflow: hidden;
  }
  .lp-btn-primary:hover {
    background-position: right center;
    transform: translateY(-2px);
  }
  .lp-btn-secondary {
    background: rgba(253, 242, 243, 0.04);
    color: #FDF2F3;
    border: 1.5px solid rgba(253, 242, 243, 0.35);
    padding: 14px 34px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
  }
  .lp-btn-secondary:hover {
    background: rgba(253, 242, 243, 0.12);
    border-color: rgba(253, 242, 243, 0.7);
    transform: translateY(-2px);
  }
  .lp-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.28);
    color: #D4AF37;
    padding: 7px 18px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.3px;
    backdrop-filter: blur(8px);
  }
  .lp-saree-wrap {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 48%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    overflow: hidden;
  }
  .lp-saree-glow {
    position: absolute;
    width: 540px; height: 720px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(139, 26, 58, 0.58) 0%, rgba(212, 175, 55, 0.12) 45%, transparent 70%);
    animation: sareeGlow 5s ease-in-out infinite;
    filter: blur(35px);
  }
  .lp-saree-img-wrap {
    position: relative;
    animation: sareeEntrance 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both,
               sareeFloat 8s ease-in-out 1.5s infinite;
  }
  .lp-saree-img {
    width: clamp(310px, 35vw, 520px);
    height: auto;
    object-fit: contain;
    border-radius: 16px;
    filter: drop-shadow(0 32px 64px rgba(139, 26, 58, 0.75)) drop-shadow(0 0 45px rgba(212, 175, 55, 0.3));
    mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%);
  }
  .lp-saree-shimmer {
    position: absolute;
    top: 0; bottom: 0; width: 85px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
    animation: sareeShimmer 4.2s ease-in-out 2s infinite;
    pointer-events: none;
    border-radius: 16px;
  }
  .lp-saree-frame {
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.35), transparent 40%, rgba(212, 175, 55, 0.18) 80%, transparent);
    pointer-events: none;
  }
  .lp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #D4AF37, #F5C842, #D4AF37, transparent);
    opacity: 0.45;
  }
  .lp-zari {
    position: absolute;
    width: 3px;
    border-radius: 2px;
    background: linear-gradient(180deg, transparent, #D4AF37, #F5C842, #D4AF37, transparent);
    pointer-events: none;
    animation: zariGlint 3s ease-in-out infinite;
  }
  .lp-motif-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(212, 175, 55, 0.2);
    pointer-events: none;
  }
  .lp-badge-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px dashed rgba(212, 175, 55, 0.5);
    animation: badgeSpin 14s linear infinite;
  }
  .lp-badge-inner {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.06));
    border: 1px solid rgba(212, 175, 55, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
  .lp-pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 28px;
    max-width: 1080px;
    margin: 0 auto;
  }
  .lp-plan-card {
    position: relative;
    padding: 40px 32px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.03);
    border: 1.5px solid rgba(212, 175, 55, 0.18);
    backdrop-filter: blur(12px);
    transition: all 0.35s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .lp-plan-card:hover {
    border-color: rgba(212, 175, 55, 0.5);
    background: rgba(212, 175, 55, 0.05);
    transform: translateY(-8px);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  }
  .lp-plan-team {
    border-color: rgba(194, 24, 91, 0.6) !important;
    background: linear-gradient(180deg, rgba(139, 26, 58, 0.2) 0%, rgba(21, 6, 13, 0.6) 100%) !important;
    box-shadow: 0 15px 40px rgba(139, 26, 58, 0.25);
  }
  .lp-plan-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #8B1A3A, #C2185B);
    color: #FDF2F3;
    padding: 5px 20px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(194, 24, 91, 0.4);
  }
  .lp-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 2, 6, 0.8);
    backdrop-filter: blur(8px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .lp-modal-box {
    background: #1C0913;
    border: 1.5px solid rgba(212, 175, 55, 0.35);
    border-radius: 24px;
    padding: 36px;
    max-width: 520px;
    width: 100%;
    position: relative;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 26, 58, 0.35);
    animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .lp-form-input {
    width: 100%;
    padding: 13px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 12px;
    color: #FDF2F3;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
    margin-bottom: 16px;
  }
  .lp-form-input:focus {
    border-color: #D4AF37;
    background: rgba(255, 255, 255, 0.09);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
  }
  .lp-form-input::placeholder {
    color: rgba(253, 242, 243, 0.35);
  }
  .lp-form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #D4AF37;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
`;

/* ─── Zari SVG Motif ──────────────────────────────────────────────────────── */
const SareeBorderSVG = () => (
  <svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', opacity: 0.45 }}>
    <defs>
      <pattern id="zari-p" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
        <circle cx="20" cy="20" r="3" fill="#D4AF37" opacity="0.6" />
        <line x1="20" y1="2" x2="20" y2="38" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4" />
        <line x1="2" y1="20" x2="38" y2="20" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4" />
      </pattern>
      <pattern id="paisleys-p" x="0" y="0" width="60" height="50" patternUnits="userSpaceOnUse">
        <path d="M30,5 Q45,15 40,25 Q35,35 25,30 Q15,25 20,15 Q22,8 30,5 Z" fill="none" stroke="#D4AF37" strokeWidth="0.7" opacity="0.55" />
        <circle cx="30" cy="7" r="2" fill="#D4AF37" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="400" height="33" fill="url(#zari-p)" />
    <rect y="33" width="400" height="34" fill="url(#paisleys-p)" />
    <rect y="67" width="400" height="33" fill="url(#zari-p)" />
    <line x1="0" y1="1" x2="400" y2="1" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" />
    <line x1="0" y1="99" x2="400" y2="99" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" />
  </svg>
);

/* ─── Saree Hero Image with Float & Glow ──────────────────────────────────── */
const SareeImage = () => (
  <div className="lp-saree-wrap" style={{ zIndex: 6 }}>
    <div className="lp-saree-glow" />
    <div className="lp-saree-img-wrap">
      <div className="lp-saree-frame" />
      <img
        src="/saree-hero.jpg"
        alt="KP Creation Luxury Handloom Saree"
        className="lp-saree-img"
      />
      <div className="lp-saree-shimmer" />
    </div>
  </div>
);

/* ─── Check Mark ─────────────────────────────────────────────────────────── */
const CheckIcon = ({ gold }) => (
  <div style={{
    width: 20, height: 20, borderRadius: '50%',
    background: gold ? 'rgba(212, 175, 55, 0.15)' : 'rgba(194, 24, 91, 0.15)',
    color: gold ? '#D4AF37' : '#E03D72',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
    border: `1px solid ${gold ? 'rgba(212, 175, 55, 0.4)' : 'rgba(194, 24, 91, 0.4)'}`
  }}>
    ✓
  </div>
);

/* ─── Pricing Plans Definition ──────────────────────────────────────────── */
const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Single Loom / Boutique',
    price: '₹249',
    period: '/month',
    desc: 'For independent saree boutiques & artisans managing exclusive collections.',
    features: [
      'Up to 500 Saree SKUs & combinations',
      'Live stock & shortage monitoring',
      'WhatsApp low-stock alerts',
      'Inventory movement history ledger',
      '1 Admin user seat',
      'Basic sales & stock analytics',
      'Standard community & email support',
    ],
    buttonText: 'Start Free Trial',
    buttonClass: 'pro',
  },
  {
    id: 'team',
    name: 'Team',
    subtitle: 'Multi-Loom & Showrooms',
    price: '₹399',
    period: '/month',
    desc: 'For active saree brands, weaving cooperatives & fast-growing teams.',
    popular: true,
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
    buttonText: 'Get Started with Team',
    buttonClass: 'team',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Mills & Wholesale Houses',
    price: 'Custom',
    period: '',
    desc: 'For large textile manufacturers, wholesale distributors & multiple branches.',
    enterprise: true,
    features: [
      'All Team features included without limits',
      'Unlimited staff & master weaver accounts',
      'Multi-warehouse & loom location support',
      'Custom WhatsApp Business API integration',
      'Dedicated textile account manager',
      'Custom ERP, Tally & POS database sync',
      'Personalised onsite weaver onboarding',
      '99.9% uptime SLA with 24/7 dedicated support',
    ],
    buttonText: 'Contact Us',
    buttonClass: 'enterprise',
  },
];

/* ─── Book Demo & Contact Modal ──────────────────────────────────────────── */
function BookDemoModal({ isOpen, onClose, initialPlan = 'team' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    plan: initialPlan,
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, plan: initialPlan }));
  }, [initialPlan]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello KP Creation Team! I am ${formData.fullName || 'a business owner'} from ${formData.businessName || 'my saree firm'}. I would like to book a demo / enquire about the ${formData.plan.toUpperCase()} plan.`
    );
    window.open(`https://wa.me/919999999999?text=${text}`, '_blank');
  };

  return (
    <div className="lp-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lp-modal-box">
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 20,
            background: 'none', border: 'none',
            color: 'rgba(253, 242, 243, 0.5)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1
          }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✨</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#D4AF37', margin: '0 0 10px' }}>
              Request Received!
            </h3>
            <p style={{ color: 'rgba(253, 242, 243, 0.7)', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
              Thank you, <strong style={{ color: '#FDF2F3' }}>{formData.fullName}</strong>! Our handloom solutions specialist will reach out on <strong style={{ color: '#FDF2F3' }}>{formData.phone || 'your phone'}</strong> within 24 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={openWhatsAppDirect}
                style={{
                  background: '#25D366', color: '#0B2211',
                  border: 'none', padding: '13px', borderRadius: 50,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span>💬</span> Connect Instantly on WhatsApp
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(253, 242, 243, 0.08)', color: '#FDF2F3',
                  border: '1px solid rgba(253, 242, 243, 0.2)', padding: '12px',
                  borderRadius: 50, fontSize: 14, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 22 }}>
              <span className="lp-pill" style={{ fontSize: 11, padding: '4px 14px', marginBottom: 10 }}>
                🗓️ Personalized Platform Tour
              </span>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#FDF2F3', margin: '6px 0 4px' }}>
                Book Your Live Demo
              </h3>
              <p style={{ color: 'rgba(253, 242, 243, 0.55)', fontSize: 13, margin: 0 }}>
                Experience how KP Creation streamlines artisanal saree beams, stock & weaver coordination.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="lp-form-label">Your Name *</label>
                  <input
                    required
                    className="lp-form-input"
                    placeholder="e.g. Ramesh Patel"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="lp-form-label">Firm / Business *</label>
                  <input
                    required
                    className="lp-form-input"
                    placeholder="e.g. Surat Silk House"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="lp-form-label">WhatsApp / Mobile *</label>
                  <input
                    required
                    className="lp-form-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="lp-form-label">Email</label>
                  <input
                    type="email"
                    className="lp-form-input"
                    placeholder="owner@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <label className="lp-form-label">Interested Plan</label>
              <select
                className="lp-form-input"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                style={{ background: '#240C19' }}
              >
                <option value="pro">Pro — ₹249 / month (Single Loom / Boutique)</option>
                <option value="team">Team — ₹399 / month (Recommended for Growth)</option>
                <option value="enterprise">Enterprise — Custom Architecture (Mills & Wholesale)</option>
              </select>

              <label className="lp-form-label">Specific Requirements / Message</label>
              <textarea
                rows={2}
                className="lp-form-input"
                placeholder="Tell us about your saree volume, looms, or specific tracking needs..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ resize: 'none', marginBottom: 20 }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  className="lp-btn-primary"
                  style={{ flex: 1, padding: '13px', borderRadius: 50, fontSize: 14 }}
                >
                  Schedule Demo →
                </button>
                <button
                  type="button"
                  onClick={openWhatsAppDirect}
                  style={{
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.4)',
                    color: '#25D366',
                    padding: '13px 18px',
                    borderRadius: 50,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Chat directly on WhatsApp"
                >
                  💬 WhatsApp
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Landing Page Component ────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedPlanForDemo, setSelectedPlanForDemo] = useState('team');

  useEffect(() => {
    if (!document.getElementById('kp-landing-styles')) {
      const tag = document.createElement('style');
      tag.id = 'kp-landing-styles';
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      const tag = document.getElementById('kp-landing-styles');
      if (tag) tag.remove();
    };
  }, []);

  const handleOpenDemo = (planId = 'team') => {
    setSelectedPlanForDemo(planId);
    setDemoModalOpen(true);
  };

  const goLogin = () => navigate('/login');
  const goSignUp = (plan = '') => {
    if (plan) {
      navigate(`/login?mode=signup&plan=${plan}`);
    } else {
      navigate('/login?mode=signup');
    }
  };
  const goDashboard = () => navigate('/dashboard');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const particles = Array.from({ length: 18 }, (_, i) => ({
    bottom: `${6 + ((i * 13) % 48)}%`,
    left: `${4 + ((i * 19) % 92)}%`,
    animationDelay: `${(i * 0.35) % 5}s`,
    animationDuration: `${3.2 + ((i * 0.6) % 4)}s`,
  }));

  return (
    <div className="lp-root">
      {/* Demo Modal */}
      <BookDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        initialPlan={selectedPlanForDemo}
      />

      {/* ── Background Elements & Animations ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-silk-texture" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div className="lp-shimmer" style={{ zIndex: 1 }} />

      {/* Silk drapes */}
      <div className="lp-drape lp-drape-1" style={{ zIndex: 2 }} />
      <div className="lp-drape lp-drape-2" style={{ zIndex: 2 }} />
      <div className="lp-drape lp-drape-3" style={{ zIndex: 2 }} />
      <div className="lp-drape lp-drape-4" style={{ zIndex: 2 }} />

      {/* Real Animated Saree Hero Photo */}
      <SareeImage />

      {/* Zari accent lines */}
      {[
        { top: '12%', right: '39%', height: '260px', animationDelay: '0s' },
        { top: '32%', right: '43%', height: '190px', animationDelay: '1.2s' },
        { top: '58%', right: '35%', height: '300px', animationDelay: '0.6s' },
      ].map((s, i) => (
        <div key={i} className="lp-zari" style={{ ...s, zIndex: 4 }} />
      ))}

      {/* Motif rings */}
      <div className="lp-motif-ring" style={{ width: 320, height: 320, top: '8%', right: '5%', animation: 'badgeSpin 32s linear infinite', zIndex: 3 }} />
      <div className="lp-motif-ring" style={{ width: 220, height: 220, top: '13%', right: '11%', animation: 'badgeSpin 22s linear infinite reverse', zIndex: 3, borderColor: 'rgba(212, 175, 55, 0.35)' }} />

      {/* Rising particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4, height: 4,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #D4AF37, #F5C842)',
              animation: `particleRise ${p.animationDuration} ease-out infinite`,
              animationDelay: p.animationDelay,
              bottom: p.bottom,
              left: p.left,
            }}
          />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR (Login, Sign Up, Book Demo, Pricing)
      ════════════════════════════════════════════════════════════════════ */}
      <nav className="lp-nav">
        {/* Brand */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B1A3A, #D4AF37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#FDF2F3',
            fontFamily: 'Playfair Display, serif',
            boxShadow: '0 4px 18px rgba(139, 26, 58, 0.6)',
          }}>
            K
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#FDF2F3', letterSpacing: '0.5px', lineHeight: 1.1 }}>
              KP Creation
            </div>
            <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              Artisan Handloom
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
          <button
            onClick={() => scrollToSection('features')}
            style={{ background: 'none', border: 'none', color: 'rgba(253, 242, 243, 0.7)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#D4AF37'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(253, 242, 243, 0.7)'}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            style={{ background: 'none', border: 'none', color: 'rgba(253, 242, 243, 0.7)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#D4AF37'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(253, 242, 243, 0.7)'}
          >
            Pricing
          </button>
          <button
            onClick={() => handleOpenDemo('enterprise')}
            style={{ background: 'none', border: 'none', color: 'rgba(253, 242, 243, 0.7)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#D4AF37'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(253, 242, 243, 0.7)'}
          >
            Contact
          </button>
        </div>

        {/* Right CTA Actions: Login, Sign Up, Book Demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <button
              className="lp-btn-primary"
              onClick={goDashboard}
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              Open Dashboard →
            </button>
          ) : (
            <>
              {/* Login button */}
              <button
                onClick={goLogin}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(253, 242, 243, 0.3)',
                  color: '#FDF2F3',
                  padding: '9px 20px',
                  borderRadius: 50,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.color = '#D4AF37'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(253, 242, 243, 0.3)'; e.target.style.color = '#FDF2F3'; }}
              >
                Login
              </button>

              {/* Sign Up button */}
              <button
                onClick={() => goSignUp()}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1.5px solid rgba(212, 175, 55, 0.6)',
                  color: '#F5C842',
                  padding: '9px 22px',
                  borderRadius: 50,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#D4AF37'; e.target.style.color = '#15060D'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(212, 175, 55, 0.15)'; e.target.style.color = '#F5C842'; }}
              >
                Sign Up
              </button>

              {/* Book Demo button */}
              <button
                onClick={() => handleOpenDemo('team')}
                style={{
                  background: 'linear-gradient(135deg, #8B1A3A, #C2185B)',
                  color: '#FDF2F3',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 50,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 16px rgba(194, 24, 91, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>📅</span> Book Demo
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <main style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: 110,
        paddingLeft: 'clamp(24px, 7vw, 100px)',
        paddingRight: 'clamp(24px, 46vw, 700px)',
        paddingBottom: 60,
      }}>
        {/* Pill */}
        <div style={{ animation: 'heroFadeUp 0.7s ease-out 0.1s both', marginBottom: 26 }}>
          <span className="lp-pill">
            <span style={{ fontSize: 16 }}>🧵</span> Artisanal Saree Management & Intelligence
          </span>
        </div>

        {/* Big Heading */}
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(44px, 5.8vw, 84px)',
          fontWeight: 700,
          lineHeight: 1.08,
          color: '#FDF2F3',
          margin: '0 0 14px',
          animation: 'heroFadeUp 0.8s ease-out 0.2s both',
        }}>
          Where Tradition<br />
          <span style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5C842 40%, #D4AF37 60%, #B8860B 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}>
            Meets Mastery
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(20px, 2.2vw, 28px)',
          color: 'rgba(253, 242, 243, 0.7)',
          margin: '0 0 22px',
          animation: 'heroFadeUp 0.8s ease-out 0.35s both',
        }}>
          Handloom Intelligence for KP Creation
        </p>

        {/* Description */}
        <p style={{
          fontSize: 'clamp(15px, 1.25vw, 17px)',
          color: 'rgba(253, 242, 243, 0.6)',
          lineHeight: 1.75,
          maxWidth: 500,
          margin: '0 0 42px',
          animation: 'heroFadeUp 0.8s ease-out 0.5s both',
        }}>
          Engineered specifically for Indian handloom saree masters. Track every warp beam, color combination, weaver replenishment, and stock shortage with real-time clarity.
        </p>

        {/* Action Buttons: Sign Up, Login, Book Demo */}
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap',
          animation: 'heroFadeUp 0.9s ease-out 0.65s both',
          marginBottom: 52,
        }}>
          <button className="lp-btn-primary" onClick={() => goSignUp()}>
            → &nbsp; Sign Up Free
          </button>
          <button className="lp-btn-secondary" onClick={goLogin}>
            Login to Account
          </button>
          <button
            onClick={() => handleOpenDemo('team')}
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              color: '#F5C842',
              padding: '14px 28px',
              borderRadius: 50,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.25s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.22)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.12)'}
          >
            <span>📅</span> Book Demo
          </button>
        </div>

        {/* Mini highlight chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', animation: 'heroFadeIn 1s ease-out 0.85s both' }}>
          {[
            { icon: '📦', text: 'Live Stock Tracking' },
            { icon: '🤖', text: 'AI Demand Forecast' },
            { icon: '💬', text: 'WhatsApp Alert Triggers' },
            { icon: '📊', text: 'Real-time ERP Ledger' },
          ].map(({ icon, text }) => (
            <span key={text} className="lp-pill" style={{ fontSize: 12 }}>
              <span>{icon}</span> {text}
            </span>
          ))}
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          ZARI BORDER PATTERN STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <div id="features" style={{ position: 'relative', zIndex: 10, padding: '0 clamp(24px, 6vw, 90px)' }}>
        <div className="lp-divider" style={{ marginBottom: 36 }} />
        <div style={{ maxWidth: 760 }}>
          <SareeBorderSVG />
        </div>
        <div className="lp-divider" style={{ marginTop: 36 }} />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: 'clamp(40px, 6vh, 80px) clamp(24px, 7vw, 100px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, maxWidth: 900 }}>
          {[
            { value: '500+', label: 'Saree Designs Tracked', icon: '🥻' },
            { value: 'Instant', label: 'WhatsApp Replenishment', icon: '⚡' },
            { value: 'Multi-Role', label: 'Admin & Staff Access', icon: '👥' },
            { value: '100%', label: 'Handloom Tailored', icon: '🧵' },
          ].map(({ value, label, icon }) => (
            <div
              key={label}
              style={{
                textAlign: 'center', padding: '26px 24px',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                borderRadius: 18, background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 700, color: '#D4AF37', marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(253, 242, 243, 0.55)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRICING SECTION (Pro ₹249, Team ₹399, Enterprise Contact Us)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{
        position: 'relative', zIndex: 10,
        padding: 'clamp(70px, 9vh, 120px) clamp(24px, 6vw, 90px)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(26, 7, 16, 0.6) 50%, transparent 100%)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="lp-pill" style={{ marginBottom: 18, display: 'inline-flex' }}>
            <span>💎</span> Transparent & Predictable Pricing
          </span>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(32px, 4.2vw, 56px)',
            fontWeight: 700,
            color: '#FDF2F3',
            margin: '16px 0 16px'
          }}>
            Choose the Perfect Plan for Your Saree Business
          </h2>
          <p style={{
            fontSize: 17,
            color: 'rgba(253, 242, 243, 0.6)',
            maxWidth: 580,
            margin: '0 auto',
            lineHeight: 1.7
          }}>
            Whether you run a bespoke boutique or an expansive weaving house, our plans scale seamlessly with your operations.
          </p>
        </div>

        {/* 3-Tier Grid */}
        <div className="lp-pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`lp-plan-card ${plan.popular ? 'lp-plan-team' : ''}`}
            >
              {plan.popular && (
                <div className="lp-plan-badge">
                  ⭐ Most Popular for Saree Houses
                </div>
              )}

              {/* Top info */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 26, fontWeight: 700,
                    color: plan.popular ? '#FDF2F3' : '#D4AF37',
                    margin: 0
                  }}>
                    {plan.name}
                  </h3>
                  <span style={{
                    fontSize: 12, color: 'rgba(253, 242, 243, 0.5)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px', borderRadius: 20
                  }}>
                    {plan.subtitle}
                  </span>
                </div>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '16px 0 14px' }}>
                  <span style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: plan.enterprise ? 38 : 50,
                    fontWeight: 700,
                    color: '#FDF2F3',
                    lineHeight: 1
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 16, color: 'rgba(253, 242, 243, 0.55)', fontWeight: 500 }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <p style={{ color: 'rgba(253, 242, 243, 0.55)', fontSize: 14, lineHeight: 1.6, minHeight: 44, margin: '0 0 24px' }}>
                  {plan.desc}
                </p>

                <div className="lp-divider" style={{ marginBottom: 24 }} />

                {/* Features list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                  {plan.features.map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <CheckIcon gold={plan.enterprise || plan.popular} />
                      <span style={{ color: 'rgba(253, 242, 243, 0.8)', fontSize: 14, lineHeight: 1.45 }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action Button */}
              <div>
                {plan.enterprise ? (
                  <button
                    onClick={() => handleOpenDemo('enterprise')}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 50%, #F5C842 100%)',
                      color: '#15060D',
                      border: 'none',
                      padding: '14px',
                      borderRadius: 50,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(212, 175, 55, 0.3)',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.92'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Contact Us / Talk to Sales →
                  </button>
                ) : plan.popular ? (
                  <button
                    onClick={() => goSignUp('team')}
                    className="lp-btn-primary"
                    style={{ width: '100%', padding: '14px', borderRadius: 50, fontSize: 15 }}
                  >
                    Start 14-Day Free Trial →
                  </button>
                ) : (
                  <button
                    onClick={() => goSignUp('pro')}
                    style={{
                      width: '100%',
                      background: 'rgba(253, 242, 243, 0.05)',
                      border: '1.5px solid rgba(253, 242, 243, 0.35)',
                      color: '#FDF2F3',
                      padding: '13px',
                      borderRadius: 50,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.25s'
                    }}
                    onMouseEnter={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.color = '#D4AF37'; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(253, 242, 243, 0.35)'; e.target.style.color = '#FDF2F3'; }}
                  >
                    {plan.buttonText} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Assurance footer */}
        <div style={{ textAlign: 'center', marginTop: 44, color: 'rgba(253, 242, 243, 0.45)', fontSize: 14 }}>
          🛡️ All plans include 14-day risk-free trial · Zero setup fee · Cancel or upgrade at any time
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FINAL CONVERSION SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        padding: 'clamp(50px, 8vh, 100px) 24px clamp(60px, 9vh, 110px)'
      }}>
        <div style={{ width: 120, height: 120, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <div className="lp-badge-ring" />
          <div className="lp-badge-inner">🥻</div>
        </div>

        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(30px, 4.2vw, 52px)',
          fontWeight: 600,
          color: '#FDF2F3',
          margin: '0 0 16px'
        }}>
          Ready to Elevate Your Handloom Operations?<br />
          <span style={{ color: '#D4AF37' }}>Experience KP Creation Today</span>
        </h2>

        <p style={{
          fontSize: 16, color: 'rgba(253, 242, 243, 0.55)',
          maxWidth: 520, margin: '0 auto 38px', lineHeight: 1.7
        }}>
          Join leading artisan houses managing their sarees with automated replenishment, series tracking, and master weaver ledgers.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="lp-btn-primary"
            onClick={() => goSignUp()}
            style={{ fontSize: 16, padding: '16px 44px' }}
          >
            Start Free Trial
          </button>
          <button
            onClick={() => handleOpenDemo('team')}
            style={{
              background: 'rgba(253, 242, 243, 0.06)',
              border: '1.5px solid rgba(253, 242, 243, 0.35)',
              color: '#FDF2F3',
              padding: '15px 40px',
              borderRadius: 50,
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            📅 Book a Live Demo
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '28px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        color: 'rgba(253, 242, 243, 0.35)',
        fontSize: 13, letterSpacing: '0.5px'
      }}>
        © {new Date().getFullYear()} KP Creation · Artisan Handloom Saree Inventory & Intelligence · All rights reserved
      </footer>
    </div>
  );
}

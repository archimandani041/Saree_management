/**
 * LandingPage.jsx
 * Public landing page for KP Creation — shown to all visitors before login.
 * Features animated saree fabric elements, luxury design tokens, and CTA buttons.
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap");

  @keyframes silkWave {
    0%   { transform: translateY(0px) rotate(-2deg) scaleX(1); }
    25%  { transform: translateY(-18px) rotate(0deg) scaleX(1.02); }
    50%  { transform: translateY(-8px) rotate(2deg) scaleX(0.98); }
    75%  { transform: translateY(-22px) rotate(-1deg) scaleX(1.01); }
    100% { transform: translateY(0px) rotate(-2deg) scaleX(1); }
  }
  @keyframes silkWave2 {
    0%   { transform: translateY(0px) rotate(3deg) scaleX(1); }
    30%  { transform: translateY(-14px) rotate(1deg) scaleX(1.03); }
    60%  { transform: translateY(-24px) rotate(-2deg) scaleX(0.97); }
    100% { transform: translateY(0px) rotate(3deg) scaleX(1); }
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
    0%   { transform: translate(0,0) scale(1); opacity:0.18; }
    33%  { transform: translate(20px,-30px) scale(1.1); opacity:0.28; }
    66%  { transform: translate(-15px,-50px) scale(0.9); opacity:0.15; }
    100% { transform: translate(0,0) scale(1); opacity:0.18; }
  }
  @keyframes floatOrb2 {
    0%   { transform: translate(0,0) scale(1); opacity:0.12; }
    50%  { transform: translate(-25px,-40px) scale(1.2); opacity:0.22; }
    100% { transform: translate(0,0) scale(1); opacity:0.12; }
  }
  @keyframes weaveDrift {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(40px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes heroFadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes badgeSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes zariGlint {
    0%, 100% { opacity:0.4; }
    50%       { opacity:0.9; }
  }
  @keyframes particleRise {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity:0.7; }
    100% { transform: translateY(-120px) translateX(var(--dx,10px)) scale(0); opacity:0; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 18px rgba(150,50,80,0.35); }
    50%       { box-shadow: 0 0 38px rgba(150,50,80,0.65); }
  }
  @keyframes borderGlow {
    0%, 100% { box-shadow: 0 0 0px rgba(253,242,243,0.4); }
    50%       { box-shadow: 0 0 22px rgba(253,242,243,0.5); }
  }
  @keyframes navReveal {
    from { opacity:0; transform:translateY(-20px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Saree image float + gentle sway */
  @keyframes sareeFloat {
    0%   { transform: translateY(0px) rotate(-1.5deg) scale(1); }
    20%  { transform: translateY(-18px) rotate(0deg) scale(1.01); }
    45%  { transform: translateY(-28px) rotate(1.5deg) scale(1.02); }
    70%  { transform: translateY(-12px) rotate(-0.5deg) scale(1.005); }
    100% { transform: translateY(0px) rotate(-1.5deg) scale(1); }
  }
  /* Shimmer sweep across saree */
  @keyframes sareeShimmer {
    0%   { opacity:0; left:-15%; }
    30%  { opacity:1; }
    100% { opacity:0; left:110%; }
  }
  /* Glow halo breathe */
  @keyframes sareeGlow {
    0%, 100% { opacity:0.4; transform:scale(1); }
    50%       { opacity:0.75; transform:scale(1.08); }
  }
  /* Entrance slide from right */
  @keyframes sareeEntrance {
    from { opacity:0; transform:translateX(80px) rotate(2deg) scale(0.95); }
    to   { opacity:1; transform:translateX(0) rotate(-1.5deg) scale(1); }
  }

  .lp-saree-wrap {
    position:absolute; right:0; top:0; bottom:0; width:46%;
    display:flex; align-items:center; justify-content:center;
    pointer-events:none; overflow:hidden;
  }
  .lp-saree-glow {
    position:absolute;
    width:520px; height:700px;
    border-radius:50%;
    background:radial-gradient(ellipse,rgba(139,26,58,0.55) 0%,rgba(212,175,55,0.1) 45%,transparent 70%);
    animation:sareeGlow 5s ease-in-out infinite;
    filter:blur(30px);
  }
  .lp-saree-img-wrap {
    position:relative;
    animation: sareeEntrance 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both,
               sareeFloat 8s ease-in-out 1.5s infinite;
  }
  .lp-saree-img {
    width:clamp(300px,34vw,500px);
    height:auto;
    object-fit:contain;
    border-radius:12px;
    filter:drop-shadow(0 30px 60px rgba(139,26,58,0.7)) drop-shadow(0 0 40px rgba(212,175,55,0.25));
    mask-image:linear-gradient(to bottom,transparent 0%,black 8%,black 88%,transparent 100%);
    -webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 8%,black 88%,transparent 100%);
  }
  .lp-saree-shimmer {
    position:absolute; top:0; bottom:0; width:80px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
    animation:sareeShimmer 4s ease-in-out 2s infinite;
    pointer-events:none; border-radius:12px;
  }
  .lp-saree-frame {
    position:absolute; inset:-2px; border-radius:14px;
    background:linear-gradient(135deg,rgba(212,175,55,0.3),transparent 40%,rgba(212,175,55,0.15) 80%,transparent);
    pointer-events:none;
  }

  .lp-root {
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    background: #1A0810;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }
  .lp-silk-texture {
    background-image:
      repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(212,175,55,0.04) 3px, rgba(212,175,55,0.04) 4px),
      repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(212,175,55,0.03) 3px, rgba(212,175,55,0.03) 4px);
    animation: weaveDrift 8s linear infinite;
  }
  .lp-drape { position:absolute; border-radius:60% 40% 70% 30% / 50% 60% 40% 50%; filter:blur(2px); pointer-events:none; }
  .lp-drape-1 { width:320px;height:600px;background:linear-gradient(160deg,#8B1A3A,#5C0E2A 30%,#3B111A 70%,transparent);top:-80px;right:8%;animation:silkWave 7s ease-in-out infinite;opacity:0.55; }
  .lp-drape-2 { width:280px;height:520px;background:linear-gradient(200deg,#C2185B,#880E4F 40%,#4A0E30 80%,transparent);top:60px;right:4%;animation:silkWave2 9s ease-in-out infinite;opacity:0.35; }
  .lp-drape-3 { width:200px;height:700px;background:linear-gradient(140deg,#6A1030,#3B111A 50%,transparent);top:-120px;right:18%;animation:silkWave3 11s ease-in-out infinite;opacity:0.4; }
  .lp-drape-4 { width:180px;height:500px;background:linear-gradient(20deg,#5C0E2A,#3B111A 60%,transparent);top:30%;left:-60px;animation:silkWave2 13s ease-in-out infinite reverse;opacity:0.3; }
  .lp-orb { position:absolute;border-radius:50%;pointer-events:none;filter:blur(40px); }
  .lp-orb-1 { width:500px;height:500px;background:radial-gradient(circle,rgba(139,26,58,0.4),transparent 70%);top:-100px;right:0;animation:floatOrb 14s ease-in-out infinite; }
  .lp-orb-2 { width:350px;height:350px;background:radial-gradient(circle,rgba(192,24,91,0.25),transparent 70%);bottom:100px;left:5%;animation:floatOrb2 18s ease-in-out infinite; }
  .lp-orb-3 { width:250px;height:250px;background:radial-gradient(circle,rgba(212,175,55,0.15),transparent 70%);top:40%;left:40%;animation:floatOrb 22s ease-in-out infinite reverse; }
  .lp-shimmer { position:absolute;inset:0;background:linear-gradient(105deg,transparent 20%,rgba(212,175,55,0.05) 40%,rgba(245,200,66,0.08) 50%,rgba(212,175,55,0.05) 60%,transparent 80%);background-size:200% auto;animation:shimmer 6s linear infinite;pointer-events:none; }
  .lp-nav { position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 48px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,rgba(26,8,16,0.92),transparent);backdrop-filter:blur(12px);animation:navReveal 0.8s ease-out both; }
  .lp-btn-primary { background:linear-gradient(135deg,#8B1A3A,#C2185B 50%,#8B1A3A);background-size:200% auto;color:#FDF2F3;border:none;padding:16px 40px;border-radius:50px;font-family:"Plus Jakarta Sans",sans-serif;font-size:16px;font-weight:600;letter-spacing:0.5px;cursor:pointer;transition:all 0.3s ease;animation:glowPulse 3s ease-in-out infinite;position:relative;overflow:hidden; }
  .lp-btn-primary:hover { background-position:right center;transform:translateY(-2px); }
  .lp-btn-secondary { background:transparent;color:#FDF2F3;border:1.5px solid rgba(253,242,243,0.45);padding:15px 40px;border-radius:50px;font-family:"Plus Jakarta Sans",sans-serif;font-size:16px;font-weight:500;cursor:pointer;transition:all 0.3s ease;animation:borderGlow 4s ease-in-out infinite;backdrop-filter:blur(8px); }
  .lp-btn-secondary:hover { background:rgba(253,242,243,0.1);border-color:rgba(253,242,243,0.75);transform:translateY(-2px); }
  .lp-nav-btn { background:transparent;border:1.5px solid rgba(212,175,55,0.5);color:#D4AF37;padding:9px 24px;border-radius:50px;font-family:"Plus Jakarta Sans",sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.25s ease; }
  .lp-nav-btn:hover { background:rgba(212,175,55,0.12);border-color:#D4AF37; }
  .lp-nav-btn-solid { background:#D4AF37;color:#1A0810;border:none;padding:9px 24px;border-radius:50px;font-family:"Plus Jakarta Sans",sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.25s ease; }
  .lp-nav-btn-solid:hover { background:#F5C842;transform:translateY(-1px); }
  .lp-pill { display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);color:#D4AF37;padding:8px 18px;border-radius:50px;font-size:13px;font-weight:500;letter-spacing:0.3px;backdrop-filter:blur(8px); }
  .lp-stat { text-align:center;padding:24px 32px;border:1px solid rgba(212,175,55,0.15);border-radius:16px;background:rgba(255,255,255,0.03);backdrop-filter:blur(8px);transition:all 0.3s ease; }
  .lp-stat:hover { border-color:rgba(212,175,55,0.4);background:rgba(212,175,55,0.05); }
  .lp-divider { height:1px;background:linear-gradient(90deg,transparent,#D4AF37,#F5C842,#D4AF37,transparent);opacity:0.4; }
  .lp-zari { position:absolute;width:3px;border-radius:2px;background:linear-gradient(180deg,transparent,#D4AF37,#F5C842,#D4AF37,transparent);pointer-events:none;animation:zariGlint 3s ease-in-out infinite; }
  .lp-motif-ring { position:absolute;border-radius:50%;border:1px solid rgba(212,175,55,0.2);pointer-events:none; }
  .lp-badge-ring { position:absolute;inset:0;border-radius:50%;border:1px dashed rgba(212,175,55,0.5);animation:badgeSpin 12s linear infinite; }
  .lp-badge-inner { width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.2),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;font-size:30px; }
`;

const SareeBorderSVG = () => (
  <svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", opacity: 0.45 }}>
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

const SareeImage = () => (
  <div className="lp-saree-wrap" style={{ zIndex: 6 }}>
    {/* Glowing halo behind image */}
    <div className="lp-saree-glow" />
    {/* Image wrapper that floats & sways */}
    <div className="lp-saree-img-wrap">
      {/* Gold frame overlay */}
      <div className="lp-saree-frame" />
      {/* The saree photo */}
      <img
        src="/saree-hero.jpg"
        alt="KP Creation Handloom Saree"
        className="lp-saree-img"
      />
      {/* Silk shimmer sweep */}
      <div className="lp-saree-shimmer" />
    </div>
  </div>
);


export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.getElementById("lp-styles")) {
      const tag = document.createElement("style");
      tag.id = "lp-styles";
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      const tag = document.getElementById("lp-styles");
      if (tag) tag.remove();
    };
  }, []);

  const goLogin  = () => navigate("/login");
  const goSignUp = () => navigate("/login?mode=signup");

  const particles = Array.from({ length: 16 }, (_, i) => ({
    bottom: `${8 + (i * 11) % 45}%`,
    left:   `${5 + (i * 17) % 88}%`,
    animationDelay: `${(i * 0.4) % 5}s`,
    animationDuration: `${3 + (i * 0.7) % 4}s`,
  }));

  return (
    <div className="lp-root">
      {/* Ambient */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-silk-texture" style={{ position:"absolute", inset:0, zIndex:0 }} />
      <div className="lp-shimmer" style={{ zIndex:1 }} />

      {/* Drapes */}
      <div className="lp-drape lp-drape-1" style={{ zIndex:2 }} />
      <div className="lp-drape lp-drape-2" style={{ zIndex:2 }} />
      <div className="lp-drape lp-drape-3" style={{ zIndex:2 }} />
      <div className="lp-drape lp-drape-4" style={{ zIndex:2 }} />

      {/* Real saree photo with float + shimmer + glow animations */}
      <SareeImage />

      {/* Zari accent lines */}
      {[
        { top:"12%", right:"39%", height:"260px", animationDelay:"0s" },
        { top:"32%", right:"43%", height:"190px", animationDelay:"1.2s" },
        { top:"58%", right:"35%", height:"300px", animationDelay:"0.6s" },
      ].map((s, i) => (
        <div key={i} className="lp-zari" style={{ ...s, zIndex:4 }} />
      ))}

      {/* Motif rings */}
      <div className="lp-motif-ring" style={{ width:300,height:300,top:"10%",right:"5%",animation:"badgeSpin 30s linear infinite",zIndex:3 }} />
      <div className="lp-motif-ring" style={{ width:200,height:200,top:"15%",right:"10%",animation:"badgeSpin 20s linear infinite reverse",zIndex:3,borderColor:"rgba(212,175,55,0.35)" }} />

      {/* Particles */}
      <div style={{ position:"absolute", inset:0, zIndex:5, pointerEvents:"none" }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position:"absolute",
            width:4, height:4,
            borderRadius:"50%",
            background:"radial-gradient(circle,#D4AF37,#F5C842)",
            animation:`particleRise ${p.animationDuration} ease-out infinite`,
            animationDelay: p.animationDelay,
            bottom: p.bottom,
            left: p.left,
          }} />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav className="lp-nav" style={{ zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#8B1A3A,#D4AF37)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#FDF2F3",fontFamily:"Playfair Display,serif",boxShadow:"0 4px 15px rgba(139,26,58,0.5)" }}>K</div>
          <div>
            <div style={{ fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"#FDF2F3",letterSpacing:"0.5px",lineHeight:1.1 }}>KP Creation</div>
            <div style={{ fontSize:10,color:"#D4AF37",letterSpacing:"2px",textTransform:"uppercase" }}>Artisan Handloom</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <button className="lp-nav-btn" onClick={goLogin}>Sign In</button>
          <button className="lp-nav-btn-solid" onClick={goSignUp}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main style={{ position:"relative",zIndex:10,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",paddingTop:100,paddingLeft:"clamp(24px,7vw,100px)",paddingRight:"clamp(24px,45vw,680px)",paddingBottom:60 }}>

        <div style={{ animation:"heroFadeUp 0.7s ease-out 0.1s both", marginBottom:28 }}>
          <span className="lp-pill"><span style={{ fontSize:16 }}>🧵</span> Premium Saree Inventory Platform</span>
        </div>

        <h1 style={{ fontFamily:"Playfair Display,serif",fontSize:"clamp(42px,6vw,82px)",fontWeight:700,lineHeight:1.08,color:"#FDF2F3",margin:"0 0 12px",animation:"heroFadeUp 0.8s ease-out 0.2s both" }}>
          Where Tradition<br />
          <span style={{ background:"linear-gradient(135deg,#D4AF37,#F5C842 40%,#D4AF37 60%,#B8860B)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmer 4s linear infinite" }}>
            Meets Mastery
          </span>
        </h1>

        <p style={{ fontFamily:"Playfair Display,serif",fontStyle:"italic",fontSize:"clamp(18px,2.2vw,26px)",color:"rgba(253,242,243,0.65)",margin:"0 0 24px",animation:"heroFadeUp 0.8s ease-out 0.35s both" }}>
          Handloom Intelligence for KP Creation
        </p>

        <p style={{ fontSize:"clamp(14px,1.3vw,17px)",color:"rgba(253,242,243,0.5)",lineHeight:1.75,maxWidth:480,margin:"0 0 44px",animation:"heroFadeUp 0.8s ease-out 0.5s both" }}>
          Manage your artisanal saree inventory with the precision of a master weaver.
          Track every beam, every colour, every series — from loom to showroom.
        </p>

        <div style={{ display:"flex",gap:16,flexWrap:"wrap",animation:"heroFadeUp 0.9s ease-out 0.65s both",marginBottom:56 }}>
          <button className="lp-btn-primary" onClick={goLogin}>
            &#8594;&nbsp; Sign In to Dashboard
          </button>
          <button className="lp-btn-secondary" onClick={goSignUp}>
            Create Account
          </button>
        </div>

        <div style={{ display:"flex",gap:12,flexWrap:"wrap",animation:"heroFadeIn 1s ease-out 0.9s both" }}>
          {[
            { icon:"📦", text:"Live Stock Tracking" },
            { icon:"🤖", text:"AI Demand Forecast" },
            { icon:"💬", text:"WhatsApp Alerts" },
            { icon:"📊", text:"Analytics Dashboard" },
          ].map(({ icon, text }) => (
            <span key={text} className="lp-pill" style={{ fontSize:12 }}><span>{icon}</span>{text}</span>
          ))}
        </div>
      </main>

      {/* ── ZARI BORDER PATTERN ── */}
      <div style={{ position:"relative",zIndex:10,padding:"0 clamp(24px,5vw,80px)",animation:"heroFadeIn 1s ease-out 1.1s both" }}>
        <div className="lp-divider" style={{ marginBottom:32 }} />
        <div style={{ maxWidth:700 }}><SareeBorderSVG /></div>
        <div className="lp-divider" style={{ marginTop:32 }} />
      </div>

      {/* ── STATS ── */}
      <section style={{ position:"relative",zIndex:10,padding:"clamp(40px,6vh,80px) clamp(24px,7vw,100px)",animation:"heroFadeIn 1s ease-out 1.2s both" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:20,maxWidth:760 }}>
          {[
            { value:"500+",      label:"Saree Designs",  icon:"🥻" },
            { value:"Real-time", label:"Stock Updates",  icon:"⚡" },
            { value:"Multi-role",label:"Admin & Staff",  icon:"👥" },
            { value:"100%",      label:"Handloom",       icon:"🧵" },
          ].map(({ value, label, icon }) => (
            <div key={label} className="lp-stat">
              <div style={{ fontSize:28,marginBottom:6 }}>{icon}</div>
              <div style={{ fontFamily:"Playfair Display,serif",fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#D4AF37",marginBottom:4 }}>{value}</div>
              <div style={{ fontSize:12,color:"rgba(253,242,243,0.5)",letterSpacing:"0.5px" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{ position:"relative",zIndex:10,textAlign:"center",padding:"clamp(40px,6vh,80px) 24px clamp(60px,8vh,100px)",animation:"heroFadeIn 1s ease-out 1.4s both" }}>
        <div style={{ width:120,height:120,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 32px" }}>
          <div className="lp-badge-ring" />
          <div className="lp-badge-inner">🥻</div>
        </div>

        <h2 style={{ fontFamily:"Playfair Display,serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:600,color:"#FDF2F3",marginBottom:16 }}>
          Ready to Transform Your<br />
          <span style={{ color:"#D4AF37" }}>Saree Business?</span>
        </h2>
        <p style={{ fontSize:16,color:"rgba(253,242,243,0.5)",maxWidth:480,margin:"0 auto 40px",lineHeight:1.7 }}>
          Join KP Creation&apos;s intelligent inventory system built specifically for artisanal handloom sarees.
        </p>
        <div style={{ display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap" }}>
          <button className="lp-btn-primary" onClick={goSignUp} style={{ fontSize:18,padding:"18px 52px" }}>Get Started Free</button>
          <button className="lp-btn-secondary" onClick={goLogin} style={{ fontSize:18,padding:"17px 52px" }}>Sign In</button>
        </div>
      </section>

      {/* ── FOOTER BAR ── */}
      <footer style={{ position:"relative",zIndex:10,textAlign:"center",padding:"24px",borderTop:"1px solid rgba(212,175,55,0.15)",color:"rgba(253,242,243,0.3)",fontSize:12,letterSpacing:"0.5px" }}>
        &copy; {new Date().getFullYear()} KP Creation &middot; Artisanal Handloom Sarees &middot; All rights reserved
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";

const C = {
  dark:   "#060d1a",
  darker: "#030812",
  navy:   "#0b1e3d",
  navyL:  "#0e2245",
  navyLL: "#112554",
  border: "#1a3a6e",
  borderL:"#243d6e",
  green:  "#1d9e75",
  greenL: "#5dcaa5",
  greenD: "#0f6e56",
  blue:   "#4a9edd",
  amber:  "#e8a742",
  red:    "#e24b4a",
  text:   "#e8f4f0",
  textM:  "#8aa8c8",
  textS:  "#5a7a99",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${C.dark};
    color: ${C.text};
    overflow-x: hidden;
    font-size: 15px;
    line-height: 1.6;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-10px); }
  }
  @keyframes ticker-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes pulse-dot {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; }
  }

  .fu  { animation: fadeUp 0.6s ease both; }
  .fu1 { animation: fadeUp 0.6s 0.08s ease both; }
  .fu2 { animation: fadeUp 0.6s 0.16s ease both; }
  .fu3 { animation: fadeUp 0.6s 0.24s ease both; }
  .fu4 { animation: fadeUp 0.6s 0.32s ease both; }
  .fu5 { animation: fadeUp 0.6s 0.40s ease both; }

  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    padding: 0 6%; height: 62px;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.3s, border 0.3s;
  }
  .nav.scrolled {
    background: rgba(6,13,26,0.96);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid ${C.border};
  }
  .nav-links { display: flex; gap: 28px; list-style: none; }
  .nav-links a { color: ${C.textM}; text-decoration: none; font-size: 13px; font-weight: 400; transition: color 0.15s; }
  .nav-links a:hover { color: ${C.greenL}; }

  .btn-p {
    background: ${C.green}; color: #fff; border: none;
    padding: 10px 22px; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.2s; text-decoration: none; display: inline-block;
  }
  .btn-p:hover { background: ${C.greenD}; transform: translateY(-1px); }

  .btn-o {
    background: transparent; color: ${C.text};
    border: 1px solid ${C.border};
    padding: 9px 22px; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 400; cursor: pointer;
    transition: all 0.2s; text-decoration: none; display: inline-block;
  }
  .btn-o:hover { border-color: ${C.green}; color: ${C.greenL}; }

  .section { padding: 90px 6%; }

  .label {
    display: inline-block; font-size: 11px; font-weight: 600;
    letter-spacing: 0.07em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 20px; margin-bottom: 14px;
    background: rgba(29,158,117,0.1); color: ${C.greenL};
    border: 1px solid rgba(29,158,117,0.2);
  }
  .label-dark { background: rgba(29,158,117,0.08); color: ${C.greenL}; border-color: rgba(29,158,117,0.15); }

  .h1 { font-size: clamp(32px, 5vw, 58px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.1; }
  .h2 { font-size: clamp(26px, 4vw, 42px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
  .h3 { font-size: 17px; font-weight: 600; line-height: 1.4; }

  .card {
    background: ${C.navyL}; border: 1px solid ${C.border};
    border-radius: 14px; padding: 24px;
    transition: transform 0.22s, border-color 0.22s;
  }
  .card:hover { transform: translateY(-3px); border-color: ${C.borderL}; }

  .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  .grid4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }

  .ticker-wrap { overflow: hidden; border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border}; padding: 10px 0; background: ${C.navyL}; }
  .ticker-inner { display: flex; width: max-content; animation: ticker-scroll 28s linear infinite; }
  .ticker-item { display: flex; align-items: center; gap: 8px; padding: 0 28px; font-size: 12px; white-space: nowrap; }

  .faq-q {
    width: 100%; background: none; border: none;
    padding: 18px 0; text-align: left; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 500; color: ${C.text};
    border-bottom: 1px solid ${C.border};
  }
  .faq-a { font-size: 14px; color: ${C.textM}; line-height: 1.7; padding: 14px 0 18px; border-bottom: 1px solid ${C.border}; }

  @media(max-width: 768px) {
    .nav-links { display: none; }
    .section { padding: 64px 5%; }
    .hide-mobile { display: none; }
  }
`;

const TICKERS = [
  { t:"SCOM", p:"14.85", c:"+1.23%", up:true  },
  { t:"KCB",  p:"45.20", c:"-0.44%", up:false },
  { t:"EQTY", p:"49.75", c:"+2.10%", up:true  },
  { t:"COOP", p:"13.10", c:"+0.77%", up:true  },
  { t:"ABSA", p:"12.50", c:"-1.20%", up:false },
  { t:"BAMB", p:"38.00", c:"+0.53%", up:true  },
  { t:"BAT",  p:"410.0", c:"-0.24%", up:false },
  { t:"EABL", p:"165.0", c:"+1.82%", up:true  },
];

const FEATURES = [
  { icon:"📊", title:"Live NSE market data",       desc:"Real-time prices and price changes for all major NSE equities, updated throughout the trading day.", color:C.green },
  { icon:"🤖", title:"ML trading signals",         desc:"Random Forest model delivers BUY/HOLD/SELL signals with confidence scores — real machine learning, not just rules.", color:C.blue },
  { icon:"💬", title:"FinanceGPT AI chat",         desc:"Ask anything in plain English. Understands stock names, fetches live data, and answers like a financial advisor.", color:C.amber },
  { icon:"📁", title:"Portfolio tracker",          desc:"Log your NSE holdings. Watch live P&L, cost basis, and portfolio value update in real time.", color:"#a78bfa" },
  { icon:"🔔", title:"Smart price alerts",         desc:"Set P/E and price threshold alerts. Get notified the moment a stock crosses your target.", color:C.red },
  { icon:"🔒", title:"Secure per-user accounts",   desc:"JWT auth, bcrypt passwords, and fully isolated user data. Your portfolio is yours alone.", color:C.greenL },
];

const STEPS = [
  { n:"1", title:"Create your free account",    desc:"Sign up with your email in seconds. No credit card required." },
  { n:"2", title:"Browse live NSE markets",     desc:"Real-time prices and AI signals load the moment you log in." },
  { n:"3", title:"Run ML signal analysis",      desc:"One click trains the Random Forest model and scores every stock." },
  { n:"4", title:"Chat with FinanceGPT",        desc:"Ask 'Should I buy Safaricom?' — get a data-driven AI response." },
  { n:"5", title:"Track your portfolio",        desc:"Add holdings and watch live P&L update as prices move." },
];

const SCREENSHOTS = [
  { title:"Market dashboard",  desc:"Live NSE prices, signal mix chart, and top buy opportunities at a glance.", icon:"📊", color:C.green  },
  { title:"ML signal engine",  desc:"Random Forest predictions with confidence bars for every tracked stock.",  icon:"🤖", color:C.blue   },
  { title:"Portfolio tracker", desc:"Real-time P&L, cost basis, and holdings breakdown with bar charts.",       icon:"📁", color:"#a78bfa"},
  { title:"FinanceGPT chat",   desc:"Conversational AI that understands NSE stocks and market questions.",      icon:"💬", color:C.amber  },
  { title:"Price alerts",      desc:"Threshold-based alerts that trigger and log automatically.",               icon:"🔔", color:C.red    },
];

const TESTIMONIALS = [
  { name:"James Mwangi",  role:"Retail investor, Nairobi",   text:"Finally an NSE app that explains WHY to buy or sell. FinanceGPT is like having a stockbroker in your pocket.",        avatar:"JM", color:C.green },
  { name:"Grace Otieno",  role:"Financial analyst",           text:"The ML confidence scores changed how I validate picks. I cross-check every trade with NSE Investor now.",             avatar:"GO", color:C.blue  },
  { name:"David Kamau",   role:"Portfolio manager",           text:"The portfolio tracker with live P&L is exactly what was missing in the Kenyan market. Simple, fast, accurate.",       avatar:"DK", color:C.amber },
];

const PLANS = [
  { name:"Free",  price:"KES 0",     period:"forever",      highlight:false, color:C.border, features:["Live NSE market data","Basic BUY/HOLD/SELL signals","Up to 5 portfolio holdings","FinanceGPT (10 messages/day)","1 price alert"],                                                                             cta:"Get started free" },
  { name:"Pro",   price:"KES 999",   period:"per month",    highlight:true,  color:C.green,  features:["Everything in Free","Full ML signal engine","Unlimited portfolio holdings","Unlimited FinanceGPT","Unlimited alerts","Priority signal updates","Export portfolio to CSV"],                                     cta:"Start Pro trial"  },
  { name:"Team",  price:"KES 2,999", period:"per month",    highlight:false, color:C.blue,   features:["Everything in Pro","Up to 5 team members","Shared watchlists","API access","Custom ML model training","Dedicated support"],                                                                                     cta:"Contact us"       },
];

const FAQS = [
  { q:"Is the market data real-time?",          a:"Yes — prices are fetched live from Yahoo Finance whenever you load the Markets or Dashboard tab. The scheduler also auto-updates every 24 hours." },
  { q:"How does the ML model work?",            a:"We use a Random Forest classifier trained on financial features: PE ratio, ROE, debt ratio, price momentum, and volatility. It outputs BUY/HOLD/SELL with a confidence percentage." },
  { q:"Does FinanceGPT remember context?",      a:"Yes — the last 10 messages are sent with every new request, so it builds naturally on previous answers within a session." },
  { q:"Is my portfolio data safe?",             a:"All data is stored per-user with JWT authentication. Passwords are bcrypt-hashed. No one can access your portfolio except you." },
  { q:"Which NSE stocks are supported?",        a:"We track 10 major equities including Safaricom, KCB, Equity Group, Co-op Bank, EABL, BAT Kenya, Absa, and Bamburi. More are being added." },
  { q:"Does it work on mobile?",                a:"Yes — the dashboard is fully responsive on mobile browsers. A dedicated mobile app is on our roadmap." },
];

// ===============================
// TICKER BAR
// ===============================
function TickerBar() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {items.map((t, i) => (
          <div key={i} className="ticker-item">
            <span style={{ fontWeight: 600, color: C.text, fontSize: 12 }}>{t.t}</span>
            <span style={{ color: C.textM }}>KES {t.p}</span>
            <span style={{ color: t.up ? C.green : C.red, fontWeight: 500 }}>{t.c}</span>
            <span style={{ color: C.border, margin: "0 6px" }}>·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===============================
// NAV
// ===============================
function NavBar({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16, color:"#fff" }}>N</div>
        <span style={{ fontWeight:700, fontSize:15, color:C.text }}>NSE Investor</span>
      </div>
      <ul className="nav-links">
        {["Features","How it works","Screenshots","Pricing","FAQ","Contact"].map(l => (
          <li key={l}><a href={`#${l.toLowerCase().replace(" ","-")}`}>{l}</a></li>
        ))}
      </ul>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn-o" onClick={onLaunch}>Sign in</button>
        <button className="btn-p" onClick={onLaunch}>Get started</button>
      </div>
    </nav>
  );
}

// ===============================
// HERO
// ===============================
function Hero({ onLaunch }) {
  return (
    <section style={{ minHeight:"100vh", background:C.dark, display:"flex", flexDirection:"column", justifyContent:"center", position:"relative", overflow:"hidden", paddingTop:80 }}>
      {/* subtle grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${C.border}16 1px,transparent 1px),linear-gradient(90deg,${C.border}16 1px,transparent 1px)`, backgroundSize:"56px 56px" }} />
      {/* glow */}
      <div style={{ position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)", width:560, height:560, background:`radial-gradient(circle,${C.green}10 0%,transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ position:"relative", maxWidth:1040, margin:"0 auto", padding:"0 6%", textAlign:"center" }}>

        {/* pill badge */}
        <div className="fu" style={{ display:"inline-flex", alignItems:"center", gap:7, background:C.navyL, border:`1px solid ${C.border}`, borderRadius:20, padding:"5px 14px", fontSize:12, color:C.greenL, marginBottom:24 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", animation:"pulse-dot 1.8s ease infinite" }} />
          NSE markets live · AI signals active
        </div>

        {/* headline — smaller, tighter */}
        <h1 className="fu1 h1" style={{ color:C.text, marginBottom:18 }}>
          Your AI-powered<br />
          <span style={{ background:`linear-gradient(130deg,${C.green},${C.blue})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            NSE stock analyst
          </span>
        </h1>

        <p className="fu2" style={{ fontSize:16, color:C.textM, lineHeight:1.7, maxWidth:560, margin:"0 auto 32px", fontWeight:300 }}>
          Real-time Nairobi Securities Exchange data, machine learning signals, and a conversational AI that explains every investment decision in plain English.
        </p>

        <div className="fu3" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:52 }}>
          <button className="btn-p" onClick={onLaunch} style={{ padding:"12px 30px", fontSize:14 }}>Start investing smarter →</button>
          <a href="#how-it-works" className="btn-o" style={{ padding:"12px 30px", fontSize:14 }}>See how it works</a>
        </div>

        {/* stats row */}
        <div className="fu4" style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"20px 0", gap:0 }}>
          {[["10+","NSE stocks"],["ML","Random Forest"],["LLaMA 3","AI chat"],["Live","Real-time"]].map(([v,l],i) => (
            <div key={i} style={{ padding:"0 32px", borderRight:i<3?`1px solid ${C.border}`:"none", textAlign:"center" }}>
              <p style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:"-0.02em" }}>{v}</p>
              <p style={{ fontSize:11, color:C.textS, marginTop:3 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* mock dashboard */}
        <div className="fu5" style={{ marginTop:52, animation:"float 4s ease-in-out infinite" }}>
          <div style={{ background:C.navyL, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px", boxShadow:`0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {[C.red,C.amber,C.green].map(c => <div key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
              <span style={{ fontSize:11, color:C.textS, marginLeft:6 }}>NSE Smart Investor — Dashboard</span>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {[["1,842","NSE 20 Index","+0.83%",C.green],["KES 2.4T","Market cap","+1.2%",C.blue],["4","BUY signals","of 8 stocks",C.green],["1","SELL signal","Today",C.red]].map(([v,l,s,c]) => (
                <div key={l} style={{ flex:1, minWidth:90, background:C.dark, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:9, color:C.textS, textTransform:"uppercase", letterSpacing:"0.05em" }}>{l}</p>
                  <p style={{ fontSize:18, fontWeight:700, color:c, margin:"3px 0 2px" }}>{v}</p>
                  <p style={{ fontSize:10, color:s.startsWith("+")?C.green:C.red }}>{s}</p>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TICKERS.slice(0,4).map(t => (
                <div key={t.t} style={{ flex:1, minWidth:90, background:C.dark, borderRadius:8, padding:"9px 11px", border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{t.t}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:8, background:t.up?"rgba(29,158,117,0.18)":"rgba(232,167,66,0.18)", color:t.up?C.green:C.amber }}>{t.up?"BUY":"HOLD"}</span>
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text }}>KES {t.p}</p>
                  <p style={{ fontSize:10, color:t.up?C.green:C.red }}>{t.c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===============================
// FEATURES
// ===============================
function Features() {
  return (
    <section id="features" className="section" style={{ background:C.darker }}>
      <TickerBar />
      <div style={{ maxWidth:1040, margin:"72px auto 0" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <span className="label">Everything you need</span>
          <h2 className="h2" style={{ color:C.text }}>Built for serious NSE investors</h2>
          <p style={{ color:C.textM, marginTop:12, fontSize:15, maxWidth:480, margin:"12px auto 0", fontWeight:300 }}>
            Research, analyze, and act on NSE opportunities — all in one platform.
          </p>
        </div>
        <div className="grid3">
          {FEATURES.map((f,i) => (
            <div key={i} className="card">
              <div style={{ width:42, height:42, borderRadius:12, background:`${f.color}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14, border:`1px solid ${f.color}28` }}>
                {f.icon}
              </div>
              <h3 className="h3" style={{ color:C.text, marginBottom:8 }}>{f.title}</h3>
              <p style={{ fontSize:13, color:C.textM, lineHeight:1.7, fontWeight:300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===============================
// HOW IT WORKS
// ===============================
function HowItWorks() {
  return (
    <section id="how-it-works" className="section" style={{ background:C.dark }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <span className="label">Simple process</span>
          <h2 className="h2" style={{ color:C.text }}>From signup to first signal in 2 minutes</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {STEPS.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:20, position:"relative", paddingBottom:i<STEPS.length-1?36:0 }}>
              {i < STEPS.length-1 && (
                <div style={{ position:"absolute", left:19, top:46, bottom:0, width:2, background:`linear-gradient(to bottom,${C.green},${C.border})` }} />
              )}
              <div style={{ width:40, height:40, borderRadius:12, background:C.green, color:"#fff", fontSize:15, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.n}</div>
              <div style={{ paddingTop:6 }}>
                <h3 className="h3" style={{ color:C.text, marginBottom:6 }}>{s.title}</h3>
                <p style={{ fontSize:13, color:C.textM, lineHeight:1.7, fontWeight:300 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===============================
// SCREENSHOTS
// ===============================
function Screenshots() {
  const [active, setActive] = useState(0);
  return (
    <section id="screenshots" className="section" style={{ background:C.darker }}>
      <div style={{ maxWidth:1040, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <span className="label">Product tour</span>
          <h2 className="h2" style={{ color:C.text }}>See it in action</h2>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:32 }}>
          {SCREENSHOTS.map((s,i) => (
            <button key={i} onClick={()=>setActive(i)} style={{ padding:"7px 16px", borderRadius:20, border:`1px solid ${active===i?s.color:C.border}`, background:active===i?`${s.color}12`:"transparent", color:active===i?s.color:C.textM, fontSize:12, fontWeight:active===i?600:400, cursor:"pointer", transition:"all 0.2s" }}>
              {s.title}
            </button>
          ))}
        </div>
        <div style={{ background:C.navyL, border:`1px solid ${SCREENSHOTS[active].color}38`, borderRadius:16, padding:"48px 32px", textAlign:"center", transition:"border-color 0.3s", minHeight:280, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:`${SCREENSHOTS[active].color}16`, border:`1px solid ${SCREENSHOTS[active].color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:18 }}>
            {SCREENSHOTS[active].icon}
          </div>
          <h3 style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:10 }}>{SCREENSHOTS[active].title}</h3>
          <p style={{ fontSize:14, color:C.textM, maxWidth:440, lineHeight:1.7, fontWeight:300 }}>{SCREENSHOTS[active].desc}</p>
          <div style={{ display:"flex", gap:8, marginTop:20, flexWrap:"wrap", justifyContent:"center" }}>
            {["Real-time data","ML powered","Mobile ready"].map(tag => (
              <span key={tag} style={{ fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:10, background:`${SCREENSHOTS[active].color}12`, color:SCREENSHOTS[active].color, border:`1px solid ${SCREENSHOTS[active].color}28` }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:7, marginTop:20 }}>
          {SCREENSHOTS.map((_,i) => (
            <button key={i} onClick={()=>setActive(i)} style={{ width:active===i?20:7, height:7, borderRadius:4, background:active===i?C.green:C.border, border:"none", cursor:"pointer", transition:"all 0.3s" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ===============================
// TESTIMONIALS
// ===============================
function Testimonials() {
  return (
    <section className="section" style={{ background:C.dark }}>
      <div style={{ maxWidth:1040, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <span className="label">Testimonials</span>
          <h2 className="h2" style={{ color:C.text }}>Trusted by NSE investors</h2>
        </div>
        <div className="grid3">
          {TESTIMONIALS.map((t,i) => (
            <div key={i} className="card">
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:t.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{t.avatar}</div>
                <div>
                  <p style={{ fontWeight:600, fontSize:14, color:C.text }}>{t.name}</p>
                  <p style={{ fontSize:11, color:C.textS }}>{t.role}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:2, marginBottom:10 }}>
                {[1,2,3,4,5].map(s=><span key={s} style={{ color:"#f6ad55", fontSize:13 }}>★</span>)}
              </div>
              <p style={{ fontSize:13, color:C.textM, lineHeight:1.7, fontStyle:"italic", fontWeight:300 }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===============================
// PRICING
// ===============================
function Pricing({ onLaunch }) {
  return (
    <section id="pricing" className="section" style={{ background:C.darker }}>
      <div style={{ maxWidth:1040, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <span className="label">Pricing</span>
          <h2 className="h2" style={{ color:C.text }}>Simple, transparent pricing</h2>
          <p style={{ color:C.textM, marginTop:10, fontSize:14, fontWeight:300 }}>Start free, upgrade when you're ready.</p>
        </div>
        <div className="grid3" style={{ alignItems:"start" }}>
          {PLANS.map((p,i) => (
            <div key={i} style={{ background:C.navyL, border:`2px solid ${p.highlight?C.green:C.border}`, borderRadius:16, padding:"28px 24px", transform:p.highlight?"scale(1.03)":"none", boxShadow:p.highlight?`0 16px 48px rgba(29,158,117,0.18)`:"none", position:"relative" }}>
              {p.highlight && (
                <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:C.green, color:"#fff", fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, whiteSpace:"nowrap", letterSpacing:"0.06em" }}>MOST POPULAR</div>
              )}
              <p style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>{p.name}</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:2 }}>
                <span style={{ fontSize:30, fontWeight:700, color:C.text }}>{p.price}</span>
              </div>
              <p style={{ fontSize:12, color:C.textS, marginBottom:20 }}>{p.period}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:24 }}>
                {p.features.map((f,j) => (
                  <div key={j} style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
                    <span style={{ color:C.green, fontSize:13, flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:13, color:C.textM, fontWeight:300 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onLaunch} style={{ width:"100%", padding:"11px", borderRadius:9, border:p.highlight?"none":`1px solid ${C.border}`, background:p.highlight?C.green:"transparent", color:p.highlight?"#fff":C.textM, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all 0.2s" }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===============================
// FAQ
// ===============================
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="section" style={{ background:C.dark }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <span className="label">FAQ</span>
          <h2 className="h2" style={{ color:C.text }}>Frequently asked questions</h2>
        </div>
        {FAQS.map((f,i) => (
          <div key={i}>
            <button className="faq-q" onClick={()=>setOpen(open===i?null:i)}>
              <span style={{ fontSize:14 }}>{f.q}</span>
              <span style={{ color:C.green, fontSize:18, transition:"transform 0.25s", transform:open===i?"rotate(45deg)":"none", flexShrink:0 }}>+</span>
            </button>
            {open===i && <p className="faq-a">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ===============================
// CONTACT
// ===============================
function Contact() {
  const [form, setForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [sent, setSent] = useState(false);
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const inp = { width:"100%", boxSizing:"border-box", background:C.navyL, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 14px", fontSize:13, color:C.text, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"border-color 0.2s" };
  return (
    <section id="contact" className="section" style={{ background:C.darker }}>
      <div style={{ maxWidth:1040, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:52, alignItems:"start" }}>
        <div>
          <span className="label">Get in touch</span>
          <h2 className="h2" style={{ color:C.text, marginBottom:14 }}>We'd love to hear from you</h2>
          <p style={{ fontSize:14, color:C.textM, lineHeight:1.7, marginBottom:28, fontWeight:300 }}>
            Questions, feature requests, or partnership opportunities — send us a message and we'll reply within 24 hours.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["📧","Email","support@nseinvestor.co.ke"],["📍","Location","Nairobi, Kenya"],["🕐","Response time","Within 24 hours"]].map(([icon,label,val])=>(
              <div key={label} style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`rgba(29,158,117,0.1)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize:11, color:C.textS }}>{label}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:C.text }}>{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:C.navyL, borderRadius:16, padding:"28px", border:`1px solid ${C.border}` }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:6 }}>Message sent!</h3>
              <p style={{ color:C.textM, fontSize:13 }}>We'll get back to you within 24 hours.</p>
              <button onClick={()=>setSent(false)} className="btn-p" style={{ marginTop:18 }}>Send another</button>
            </div>
          ) : (
            <form onSubmit={e=>{e.preventDefault();setSent(true);}} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:11, color:C.textS, display:"block", marginBottom:5 }}>Full name</label>
                  <input required value={form.name} onChange={h("name")} placeholder="John Kamau" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, color:C.textS, display:"block", marginBottom:5 }}>Email</label>
                  <input required type="email" value={form.email} onChange={h("email")} placeholder="john@example.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:C.textS, display:"block", marginBottom:5 }}>Subject</label>
                <input required value={form.subject} onChange={h("subject")} placeholder="Feature request, bug report..." style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11, color:C.textS, display:"block", marginBottom:5 }}>Message</label>
                <textarea required value={form.message} onChange={h("message")} rows={4} placeholder="Tell us more..." style={{ ...inp, resize:"vertical", minHeight:100 }} />
              </div>
              <button type="submit" className="btn-p" style={{ width:"100%", padding:"12px", fontSize:14 }}>Send message →</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ===============================
// CTA
// ===============================
function CTA({ onLaunch }) {
  return (
    <section style={{ padding:"90px 6%", background:C.dark, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center,${C.green}0e 0%,transparent 70%)` }} />
      <div style={{ position:"relative", maxWidth:620, margin:"0 auto", textAlign:"center" }}>
        <h2 className="h2" style={{ color:C.text, marginBottom:16 }}>Start making smarter NSE investments today</h2>
        <p style={{ fontSize:15, color:C.textM, marginBottom:28, fontWeight:300, lineHeight:1.7 }}>
          Join investors using AI-powered analysis to navigate the Nairobi Securities Exchange with confidence.
        </p>
        <button className="btn-p" onClick={onLaunch} style={{ padding:"13px 36px", fontSize:14 }}>Create free account →</button>
      </div>
    </section>
  );
}

// ===============================
// FOOTER
// ===============================
function Footer() {
  return (
    <footer style={{ background:C.darker, borderTop:`1px solid ${C.border}`, padding:"44px 6% 28px" }}>
      <div style={{ maxWidth:1040, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:36, marginBottom:40 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:15, color:"#fff" }}>N</div>
              <span style={{ fontWeight:700, fontSize:14, color:C.text }}>NSE Investor</span>
            </div>
            <p style={{ fontSize:12, color:C.textS, lineHeight:1.7, fontWeight:300 }}>AI-powered stock analysis for the Nairobi Securities Exchange.</p>
          </div>
          {[
            { title:"Product", links:["Dashboard","Markets","Portfolio","AI Chat","Alerts"] },
            { title:"Company", links:["About","Blog","Careers","Press"] },
            { title:"Legal",   links:["Privacy Policy","Terms of Service","Cookies"] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontSize:11, fontWeight:600, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>{col.title}</p>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {col.links.map(l=>(
                  <li key={l}><a href="#" style={{ fontSize:13, color:C.textS, textDecoration:"none", transition:"color 0.15s" }} onMouseEnter={e=>e.target.style.color=C.greenL} onMouseLeave={e=>e.target.style.color=C.textS}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <p style={{ fontSize:12, color:C.textS }}>© 2026 NSE Smart Investor. All rights reserved.</p>
          <p style={{ fontSize:12, color:C.textS }}>Built in Nairobi, Kenya 🇰🇪</p>
        </div>
      </div>
    </footer>
  );
}

// ===============================
// ROOT
// ===============================
export default function LandingPage({ onLaunch }) {
  return (
    <>
      <style>{styles}</style>
      <NavBar onLaunch={onLaunch} />
      <Hero onLaunch={onLaunch} />
      <Features />
      <HowItWorks />
      <Screenshots />
      <Testimonials />
      <Pricing onLaunch={onLaunch} />
      <FAQ />
      <Contact />
      <CTA onLaunch={onLaunch} />
      <Footer />
    </>
  );
}

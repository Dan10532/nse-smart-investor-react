import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler } from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import LandingPage from "./LandingPage";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler);

const API = "https://api.nsesmartinvestor.co.ke";

const MOCK_MARKET = [
  { company: "Safaricom",    ticker: "SCOM", price: 14.85, change: "+1.23%", volume: "N/A", signal: "BUY",  pe: null, roe: null },
  { company: "KCB Group",    ticker: "KCB",  price: 45.20, change: "-0.44%", volume: "N/A", signal: "HOLD", pe: null, roe: null },
  { company: "Equity Group", ticker: "EQTY", price: 49.75, change: "+2.10%", volume: "N/A", signal: "BUY",  pe: null, roe: null },
  { company: "Co-op Bank",   ticker: "COOP", price: 13.10, change: "+0.77%", volume: "N/A", signal: "BUY",  pe: null, roe: null },
  { company: "Absa Kenya",   ticker: "ABSA", price: 12.50, change: "-1.20%", volume: "N/A", signal: "HOLD", pe: null, roe: null },
  { company: "Bamburi",      ticker: "BAMB", price: 38.00, change: "+0.53%", volume: "N/A", signal: "SELL", pe: null, roe: null },
  { company: "BAT Kenya",    ticker: "BAT",  price: 410.0, change: "-0.24%", volume: "N/A", signal: "HOLD", pe: null, roe: null },
  { company: "EABL",         ticker: "EABL", price: 165.0, change: "+1.82%", volume: "N/A", signal: "BUY",  pe: null, roe: null },
];

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Mon", "Tue", "Wed"];

// ===============================
// AUTH CONTEXT
// ===============================
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("nse_token"));

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => u ? setUser(u) : logout())
        .catch(logout);
    }
  }, []);

  const login = (tokenStr, userData) => {
    localStorage.setItem("nse_token", tokenStr);
    setToken(tokenStr);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nse_token");
    setToken(null);
    setUser(null);
  };

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ===============================
// HELPERS
// ===============================
function isPositive(change) { return typeof change === "string" && change.startsWith("+"); }

function SignalBadge({ signal }) {
  const map = {
    BUY:  { bg: "#d4edda", color: "#155724", border: "#c3e6cb" },
    SELL: { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" },
    HOLD: { bg: "#fff3cd", color: "#856404", border: "#ffeeba" },
  };
  const s = map[signal] || map.HOLD;
  return <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{signal || "HOLD"}</span>;
}

function MiniSparkline({ data, positive }) {
  if (!data || data.length < 2) return null;
  const w = 80, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return <svg width={w} height={h} style={{ display: "block" }}><polyline points={pts} fill="none" stroke={positive ? "#1d9e75" : "#e24b4a"} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 140 }}>
      <p style={{ margin: 0, fontSize: 11, color: "#7a9bbf", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 700, color: accent || "#e8f4f0", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: sub.toString().startsWith("+") ? "#1d9e75" : sub.toString().startsWith("-") ? "#e24b4a" : "#7a9bbf" }}>{sub}</p>}
    </div>
  );
}

// ===============================
// AUTH PAGE
// ===============================
function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const url = mode === "login" ? `${API}/auth/login` : `${API}/auth/register`;
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { full_name: form.full_name, email: form.email, password: form.password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      login(data.access_token, data.user);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "#071529", border: "1px solid #1a3a6e", borderRadius: 8,
    color: "#e8f4f0", padding: "12px 14px", fontSize: 14, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#071529", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 auto 16px" }}>N</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#e8f4f0" }}>NSE Smart Investor</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#5a7a99" }}>Nairobi Securities Exchange · AI-powered analysis</p>
        </div>

        <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 14, padding: "28px 28px" }}>
          <div style={{ display: "flex", marginBottom: 24, background: "#071529", borderRadius: 8, padding: 4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
                flex: 1, padding: "8px", border: "none", borderRadius: 6,
                background: mode === m ? "#1d9e75" : "transparent",
                color: mode === m ? "#fff" : "#7a9bbf",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}>{m === "login" ? "Sign in" : "Create account"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 12, color: "#5a7a99", display: "block", marginBottom: 5 }}>Full name</label>
                <input value={form.full_name} onChange={handle("full_name")} placeholder="John Kamau" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: "#5a7a99", display: "block", marginBottom: 5 }}>Email address</label>
              <input type="email" value={form.email} onChange={handle("email")} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#5a7a99", display: "block", marginBottom: 5 }}>Password</label>
              <input type="password" value={form.password} onChange={handle("password")}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="••••••••" style={inputStyle} />
            </div>
          </div>

          {error && <p style={{ marginTop: 12, fontSize: 13, color: "#e24b4a", background: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 6, padding: "8px 12px" }}>{error}</p>}

          <button onClick={submit} disabled={loading} style={{
            marginTop: 20, width: "100%", background: "#1d9e75", border: "none", borderRadius: 8,
            color: "#fff", padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </div>
      </div>
    </div>
  );
}

// ===============================
// NAVBAR
// ===============================
function NavBar({ active, setActive, wsStatus, loading }) {
  const { user, logout } = useAuth();
  const tabs = ["Dashboard", "Markets", "Watchlist", "Compare", "News", "Portfolio", "Paper Trade", "Analyze", "Alerts", "AI Chat"];
  return (
    <nav style={{ background: "#0b1e3d", borderBottom: "1px solid #1a3a6e", padding: "0 24px", display: "flex", alignItems: "center", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>N</div>
        <span style={{ color: "#e8f4f0", fontWeight: 700, fontSize: 15 }}>NSE Investor</span>
      </div>

      <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActive(tab)} style={{
            background: active === tab ? "rgba(29,158,117,0.18)" : "transparent",
            border: "none", borderBottom: active === tab ? "2px solid #1d9e75" : "2px solid transparent",
            color: active === tab ? "#5dcaa5" : "#8aa8c8",
            padding: "0 14px", height: 56, cursor: "pointer",
            fontSize: 13, fontWeight: active === tab ? 600 : 400,
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {loading && <span style={{ fontSize: 11, color: "#e8a742" }}>Loading...</span>}
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: wsStatus === "connected" ? "#1d9e75" : "#e24b4a", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: "#8aa8c8" }}>{wsStatus === "connected" ? "Live" : "Offline"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid #1a3a6e" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1d9e75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: "#8aa8c8", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name}</span>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid #1a3a6e", borderRadius: 6, color: "#5a7a99", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

// ===============================
// DASHBOARD
// ===============================
function CandlestickChart({ ticker, company }) {
  const canvasRef = useRef(null);
  const [candles, setCandles] = useState([]);
  const [range, setRange]     = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${API}/stock/${ticker}/ohlc?days=${range}`)
      .then(r => r.json())
      .then(d => {
        const c = d.candles || [];
        console.log(`[Candle] ${ticker} got ${c.length} candles`);
        setCandles(c);
        setLoading(false);
      })
      .catch(e => { console.error("[Candle] fetch error:", e); setError(true); setLoading(false); });
  }, [ticker, range]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    // Use actual rendered width
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    // Dark background
    ctx.fillStyle = "#071529";
    ctx.fillRect(0, 0, W, H);

    const padL = 10, padR = 10, padT = 16, padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const prices = candles.flatMap(c => [c.h, c.l]);
    const minP   = Math.min(...prices);
    const maxP   = Math.max(...prices);
    const priceRange = maxP - minP || 1;

    const toX = (i) => padL + (i / (candles.length - 1 || 1)) * chartW;
    const toY = (p)  => padT + chartH - ((p - minP) / priceRange) * chartH;

    // Grid lines
    ctx.strokeStyle = "rgba(26,58,110,0.6)";
    ctx.lineWidth   = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const price = maxP - (priceRange / 4) * i;
      ctx.fillStyle = "#5a7a99";
      ctx.font      = "9px sans-serif";
      ctx.fillText(price.toFixed(1), W - padR - 28, y - 2);
    }

    const totalW   = chartW / candles.length;
    const bodyW    = Math.max(2, totalW * 0.55);

    candles.forEach((c, i) => {
      const x     = padL + i * totalW + totalW / 2;
      const isUp  = c.c >= c.o;
      const color = isUp ? "#1d9e75" : "#e24b4a";

      // Wick (high-low)
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.h));
      ctx.lineTo(x, toY(c.l));
      ctx.stroke();

      // Body (open-close)
      const y1 = toY(Math.max(c.o, c.c));
      const y2 = toY(Math.min(c.o, c.c));
      const bH = Math.max(1.5, y2 - y1);
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyW / 2, y1, bodyW, bH);
    });

    // X axis date labels
    ctx.fillStyle = "#5a7a99";
    ctx.font      = "9px sans-serif";
    ctx.textAlign = "center";
    const step = Math.ceil(candles.length / 6);
    candles.forEach((c, i) => {
      if (i % step === 0 || i === candles.length - 1) {
        const x     = padL + i * totalW + totalW / 2;
        const label = new Date(c.t).toLocaleDateString("en-KE", { month:"short", day:"numeric" });
        ctx.fillText(label, x, H - 6);
      }
    });

  }, [candles]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>{company}</p>
          <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>OHLC candlestick chart</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[[7,"7D"],[14,"14D"],[30,"1M"],[60,"2M"]].map(([d,l]) => (
            <button key={d} onClick={()=>setRange(d)} style={{
              padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
              background: range===d ? "#1d9e75" : "transparent",
              border: `1px solid ${range===d ? "#1d9e75" : "#1a3a6e"}`,
              color: range===d ? "#fff" : "#5a7a99",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:16, marginBottom:8 }}>
        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#5a7a99" }}>
          <span style={{ width:10, height:10, borderRadius:2, background:"#1d9e75", display:"inline-block" }} />Up day
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#5a7a99" }}>
          <span style={{ width:10, height:10, borderRadius:2, background:"#e24b4a", display:"inline-block" }} />Down day
        </span>
        {candles.length > 0 && (
          <span style={{ fontSize:11, color:"#5a7a99", marginLeft:"auto" }}>
            {candles.length} trading days · KES {candles[candles.length-1]?.c?.toFixed(2)}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ height:240, background:"#071529", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <p style={{ color:"#5a7a99", fontSize:12 }}>Loading {ticker} candlestick data...</p>
        </div>
      ) : error || candles.length === 0 ? (
        <div style={{ height:240, background:"#071529", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
          <p style={{ color:"#5a7a99", fontSize:12 }}>No OHLC data for {ticker}</p>
          <p style={{ color:"#5a7a99", fontSize:11 }}>Yahoo Finance may not have history for this symbol</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width:"100%", height:240, display:"block", borderRadius:8 }}
        />
      )}
    </div>
  );
}

function Dashboard({ market, histories }) {
  const buys  = market.filter(s => s.signal === "BUY").length;
  const sells = market.filter(s => s.signal === "SELL").length;
  const holds = market.filter(s => s.signal === "HOLD").length;
  const [candleTicker, setCandleTicker] = useState("SCOM");
  const colors = ["#1d9e75", "#4a9edd", "#e8a742"];

  const donutData = {
    labels: ["BUY", "HOLD", "SELL"],
    datasets: [{ data: [buys, holds, sells], backgroundColor: ["#1d9e75", "#e8a742", "#e24b4a"], borderWidth: 0, hoverOffset: 4 }]
  };

  const topBuys = market.filter(s => s.signal === "BUY").slice(0, 4);
  const topTickers = ["SCOM", "EQTY", "KCB", "COOP", "EABL", "BAT"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Stocks tracked" value={market.length} sub="NSE equities" />
        <StatCard label="Buy signals"  value={buys}  sub={`of ${market.length} stocks`} accent="#1d9e75" />
        <StatCard label="Sell signals" value={sells} sub="Today" accent="#e24b4a" />
        <StatCard label="Hold"         value={holds} sub="Neutral" accent="#e8a742" />
        <StatCard label="Market"       value={buys > sells ? "Bullish" : buys < sells ? "Bearish" : "Neutral"} sub="Overall bias" accent={buys > sells ? "#1d9e75" : buys < sells ? "#e24b4a" : "#8aa8c8"} />
      </div>

      {/* Candlestick + Signal mix row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 3, minWidth: 280, background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: "16px 20px" }}>
          {/* Ticker selector */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {topTickers.map(t => {
              const s = market.find(x => x.ticker === t);
              return (
                <button key={t} onClick={()=>setCandleTicker(t)} style={{
                  padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer",
                  background: candleTicker===t ? "#1d9e75" : "#071529",
                  border: `1px solid ${candleTicker===t ? "#1d9e75" : "#1a3a6e"}`,
                  color: candleTicker===t ? "#fff" : "#7a9bbf",
                }}>
                  {t} {s ? <span style={{ color: isPositive(s.change) ? "#5dcaa5" : "#e24b4a", marginLeft:3 }}>{s.change}</span> : ""}
                </button>
              );
            })}
          </div>
          <CandlestickChart
            ticker={candleTicker}
            company={market.find(s => s.ticker === candleTicker)?.company || candleTicker}
          />
        </div>

        <div style={{ flex: 1, minWidth: 180, background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#e8f4f0", alignSelf: "flex-start" }}>Signal mix</p>
          <div style={{ position: "relative", height: 140, width: "100%" }}>
            <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false } } }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, width: "100%" }}>
            {[["#1d9e75", "BUY", buys], ["#e8a742", "HOLD", holds], ["#e24b4a", "SELL", sells]].map(([c, l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8aa8c8" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>
                <span style={{ fontWeight: 600, color: "#e8f4f0" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top buys */}
      <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: "16px 20px" }}>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#e8f4f0" }}>Top buy opportunities</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(topBuys.length > 0 ? topBuys : market.slice(0, 4)).map(s => (
            <div key={s.ticker} style={{ flex: 1, minWidth: 140, background: "#071529", border: "1px solid #1a3a6e", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e8f4f0" }}>{s.ticker}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#5a7a99" }}>{s.company}</p>
                </div>
                <SignalBadge signal={s.signal} />
              </div>
              <p style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 700, color: "#e8f4f0" }}>KES {s.price?.toFixed(2) ?? "—"}</p>
              <p style={{ margin: 0, fontSize: 11, color: isPositive(s.change) ? "#1d9e75" : "#e24b4a" }}>{s.change}</p>
              <div style={{ marginTop: 8 }}><MiniSparkline data={histories[s.ticker]} positive={isPositive(s.change)} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===============================
// MARKETS
// ===============================
function ConfidenceBar({ value, signal }) {
  const color = signal === "BUY" ? "#1d9e75" : signal === "SELL" ? "#e24b4a" : "#e8a742";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "#071529", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, minWidth: 32 }}>{value?.toFixed(0)}%</span>
    </div>
  );
}

function Markets({ market }) {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [sector, setSector]     = useState("ALL");
  const [mlSignals, setMlSignals] = useState({});
  const [mlLoading, setMlLoading] = useState(false);
  const [mlTrained, setMlTrained] = useState(false);
  const [sentiments, setSentiments] = useState({});
  const [page, setPage]         = useState(1);
  const [sectors, setSectors]   = useState([]);
  const PER_PAGE = 20;

  useEffect(() => {
    fetch(`${API}/news/summary/all`)
      .then(r => r.json())
      .then(d => {
        if (d.summaries) {
          const map = {};
          d.summaries.forEach(s => { map[s.ticker] = s; });
          setSentiments(map);
        }
      }).catch(() => {});

    // Get unique sectors from market data
    const secs = [...new Set(market.map(s => s.sector).filter(Boolean))].sort();
    setSectors(secs);
  }, [market]);

  const trainAndFetch = async () => {
    setMlLoading(true);
    try {
      await fetch(`${API}/ml/train`, { method: "POST" });
      setMlTrained(true);
      const res = await fetch(`${API}/ml/signals/all`);
      const data = await res.json();
      if (data.signals) {
        const map = {};
        data.signals.forEach(s => { map[s.ticker] = s; });
        setMlSignals(map);
      }
    } catch (e) { console.error("ML error:", e); }
    setMlLoading(false);
  };

  useEffect(() => {
    fetch(`${API}/ml/status`)
      .then(r => r.json())
      .then(d => {
        if (d.model_ready) {
          setMlTrained(true);
          fetch(`${API}/ml/signals/all`)
            .then(r => r.json())
            .then(data => {
              if (data.signals) {
                const map = {};
                data.signals.forEach(s => { map[s.ticker] = s; });
                setMlSignals(map);
              }
            });
        }
      }).catch(() => {});
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filter, sector]);

  const filtered = market.filter(s => {
    const sig = mlSignals[s.ticker]?.signal || s.signal;
    const matchFilter = filter === "ALL" || sig === filter;
    const matchSector = sector === "ALL" || s.sector === sector;
    const matchSearch = s.company?.toLowerCase().includes(search.toLowerCase()) ||
                        s.ticker?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSector && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks..."
          style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 8, color: "#e8f4f0", padding: "8px 14px", fontSize: 13, outline: "none", flex: 1, minWidth: 180 }} />
        {["ALL", "BUY", "HOLD", "SELL"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#1d9e75" : "#0e2245", border: `1px solid ${filter === f ? "#1d9e75" : "#1a3a6e"}`, borderRadius: 7, color: filter === f ? "#fff" : "#7a9bbf", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{f}</button>
        ))}
        <button onClick={trainAndFetch} disabled={mlLoading} style={{ background: mlTrained ? "#0e2245" : "#1d9e75", border: `1px solid ${mlTrained ? "#1a3a6e" : "#1d9e75"}`, borderRadius: 7, color: mlTrained ? "#5dcaa5" : "#fff", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: mlLoading ? 0.7 : 1 }}>
          {mlLoading ? "Training..." : mlTrained ? "↻ ML signals" : "Run ML signals"}
        </button>
      </div>

      {/* Sector filter */}
      {sectors.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setSector("ALL")} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: sector === "ALL" ? "#1a3a6e" : "transparent", border: `1px solid ${sector === "ALL" ? "#4a9edd" : "#1a3a6e"}`, color: sector === "ALL" ? "#4a9edd" : "#5a7a99" }}>All sectors</button>
          {sectors.map(sec => (
            <button key={sec} onClick={() => setSector(sec)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: sector === sec ? "#1a3a6e" : "transparent", border: `1px solid ${sector === sec ? "#4a9edd" : "#1a3a6e"}`, color: sector === sec ? "#4a9edd" : "#5a7a99" }}>{sec}</button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#5a7a99" }}>
          Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} stocks
          {sector !== "ALL" ? ` · ${sector}` : ""}{filter !== "ALL" ? ` · ${filter}` : ""}
        </p>
        {mlTrained && <span style={{ fontSize: 11, color: "#5dcaa5" }}>ML active</span>}
      </div>

      {/* Table */}
      <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a3a6e" }}>
              {["Company", "Sector", "Price (KES)", "Change", "Signal", "Sentiment", "ML Confidence"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#5a7a99", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((s, i) => {
              const ml = mlSignals[s.ticker];
              const signal = ml?.signal || s.signal;
              const confidence = ml?.confidence;
              const sent = sentiments[s.ticker];
              return (
                <tr key={s.ticker} style={{ borderBottom: i < paginated.length - 1 ? "1px solid rgba(26,58,110,0.4)" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(29,158,117,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 14px" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e8f4f0" }}>{s.company}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#5a7a99" }}>{s.ticker}</p>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(74,158,221,0.1)", color: "#4a9edd", border: "1px solid rgba(74,158,221,0.2)", whiteSpace: "nowrap" }}>{s.sector || "—"}</span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#e8f4f0", whiteSpace: "nowrap" }}>
                    {s.price > 0 ? s.price.toFixed(2) : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 500, color: isPositive(s.change) ? "#1d9e75" : "#e24b4a", whiteSpace: "nowrap" }}>{s.change || "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <SignalBadge signal={signal} />
                      {ml && <span style={{ fontSize: 9, color: "#4a9edd", background: "rgba(74,158,221,0.1)", border: "1px solid rgba(74,158,221,0.2)", padding: "1px 4px", borderRadius: 4 }}>ML</span>}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {sent ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: sent.color+"18", color: sent.color, border: `1px solid ${sent.color}35`, whiteSpace: "nowrap" }}>
                        {sent.sentiment === "Positive" ? "↑" : sent.sentiment === "Negative" ? "↓" : "→"} {sent.sentiment}
                      </span>
                    ) : <span style={{ fontSize: 11, color: "#5a7a99" }}>—</span>}
                  </td>
                  <td style={{ padding: "11px 14px", minWidth: 110 }}>
                    {confidence != null ? <ConfidenceBar value={confidence} signal={signal} /> : <span style={{ fontSize: 11, color: "#5a7a99" }}>—</span>}
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#5a7a99", fontSize: 13 }}>No stocks match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            style={{ background: "transparent", border: "1px solid #1a3a6e", borderRadius: 7, color: page === 1 ? "#5a7a99" : "#e8f4f0", padding: "7px 14px", fontSize: 12, cursor: page === 1 ? "default" : "pointer" }}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: page === p ? "#1d9e75" : "transparent",
              border: `1px solid ${page === p ? "#1d9e75" : "#1a3a6e"}`,
              borderRadius: 7, color: page === p ? "#fff" : "#7a9bbf",
              padding: "7px 12px", fontSize: 12, fontWeight: page === p ? 600 : 400, cursor: "pointer",
            }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            style={{ background: "transparent", border: "1px solid #1a3a6e", borderRadius: 7, color: page === totalPages ? "#5a7a99" : "#e8f4f0", padding: "7px 14px", fontSize: 12, cursor: page === totalPages ? "default" : "pointer" }}>Next →</button>
        </div>
      )}
    </div>
  );
}


// ===============================
// WATCHLIST PANEL
// ===============================
function WatchlistPanel({ market }) {
  const { authFetch } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [search, setSearch]       = useState("");

  const NSE_STOCKS = [
    { ticker:"SCOM", company:"Safaricom" }, { ticker:"KCB",  company:"KCB Group" },
    { ticker:"EQTY", company:"Equity Group" }, { ticker:"COOP", company:"Co-op Bank" },
    { ticker:"ABSA", company:"Absa Kenya" },   { ticker:"BAMB", company:"Bamburi" },
    { ticker:"BAT",  company:"BAT Kenya" },    { ticker:"EABL", company:"EABL" },
    { ticker:"SASN", company:"Sasini" },       { ticker:"CARB", company:"Carbacid" },
  ];

  const load = () => {
    setLoading(true);
    authFetch(`${API}/watchlist`).then(r=>r.json())
      .then(d => setWatchlist(d.watchlist || []))
      .catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const add = async (stock) => {
    setAdding(true);
    try {
      const res = await authFetch(`${API}/watchlist`, {
        method:"POST",
        body: JSON.stringify({ ticker: stock.ticker, company_name: stock.company }),
      });
      const d = await res.json();
      if (d.detail) alert(d.detail);
      else load();
    } catch {}
    setAdding(false);
  };

  const remove = async (id) => {
    await authFetch(`${API}/watchlist/${id}`, { method:"DELETE" });
    setWatchlist(w => w.filter(x => x.id !== id));
  };

  const filtered = NSE_STOCKS.filter(s =>
    s.company.toLowerCase().includes(search.toLowerCase()) ||
    s.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const inWatchlist = (ticker) => watchlist.some(w => w.ticker === ticker);

  const signalColors = { BUY:"#1d9e75", SELL:"#e24b4a", HOLD:"#e8a742" };

  return (
    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
      {/* Add stocks panel */}
      <div style={{ flex:1, minWidth:240, background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"18px 20px" }}>
        <p style={{ margin:"0 0 14px", fontSize:14, fontWeight:600, color:"#e8f4f0" }}>Add to watchlist</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stocks..."
          style={{ width:"100%", boxSizing:"border-box", background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"9px 12px", fontSize:13, outline:"none", marginBottom:12 }} />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(s => (
            <div key={s.ticker} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"#071529", borderRadius:8, border:"1px solid #1a3a6e" }}>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>{s.ticker}</p>
                <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{s.company}</p>
              </div>
              <button onClick={()=>add(s)} disabled={adding || inWatchlist(s.ticker)} style={{
                background: inWatchlist(s.ticker) ? "transparent" : "#1d9e75",
                border: `1px solid ${inWatchlist(s.ticker) ? "#1a3a6e" : "#1d9e75"}`,
                borderRadius:6, color: inWatchlist(s.ticker) ? "#5a7a99" : "#fff",
                padding:"5px 12px", fontSize:11, fontWeight:600, cursor: inWatchlist(s.ticker) ? "default" : "pointer",
              }}>{inWatchlist(s.ticker) ? "Added" : "+ Add"}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Watchlist cards */}
      <div style={{ flex:2, minWidth:300 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#e8f4f0" }}>Watching {watchlist.length} stocks</p>
          <button onClick={load} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:6, color:"#7a9bbf", padding:"5px 12px", fontSize:11, cursor:"pointer" }}>↻ Refresh</button>
        </div>
        {loading ? (
          <p style={{ color:"#5a7a99", textAlign:"center", padding:32, fontSize:13 }}>Loading watchlist...</p>
        ) : watchlist.length === 0 ? (
          <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:32, textAlign:"center" }}>
            <p style={{ color:"#5a7a99", fontSize:13 }}>No stocks in your watchlist yet.</p>
            <p style={{ color:"#5a7a99", fontSize:12, marginTop:6 }}>Add stocks from the panel on the left.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
            {watchlist.map(w => (
              <div key={w.id} style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#e8f4f0" }}>{w.ticker}</p>
                    <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{w.company_name}</p>
                  </div>
                  <button onClick={()=>remove(w.id)} style={{ background:"transparent", border:"none", color:"#5a7a99", cursor:"pointer", fontSize:16, padding:"0 4px", lineHeight:1 }}>×</button>
                </div>
                <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:700, color:"#e8f4f0" }}>
                  {w.price > 0 ? `KES ${w.price.toFixed(2)}` : "—"}
                </p>
                <p style={{ margin:"0 0 10px", fontSize:12, color: isPositive(w.change) ? "#1d9e75" : "#e24b4a" }}>{w.change}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <SignalBadge signal={w.signal} />
                  <span style={{ fontSize:11, color: signalColors[w.signal] || "#8aa8c8" }}>{w.confidence?.toFixed(0)}% conf</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===============================
// COMPARE PANEL
// ===============================
function ComparePanel({ market }) {
  const [selected, setSelected] = useState(["SCOM","KCB"]);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);

  const NSE_TICKERS = ["SCOM","KCB","EQTY","COOP","ABSA","BAMB","BAT","EABL"];
  const COLORS      = ["#1d9e75","#4a9edd","#e8a742"];

  const compare = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/compare?tickers=${selected.join(",")}`);
      const d = await res.json();
      setData(d.comparison || []);
    } catch { setData([]); }
    setLoading(false);
  };

  useEffect(()=>{ compare(); },[]);

  const toggleTicker = (t) => {
    if (selected.includes(t)) {
      if (selected.length > 2) setSelected(s => s.filter(x => x !== t));
    } else {
      if (selected.length < 3) setSelected(s => [...s, t]);
    }
  };

  const metrics = [
    { key:"pe",             label:"P/E Ratio",      fmt: v => v?.toFixed(1) ?? "—", good:"low"  },
    { key:"roe",            label:"ROE %",           fmt: v => v ? v.toFixed(1)+"%" : "—", good:"high" },
    { key:"debt_ratio",     label:"Debt Ratio",      fmt: v => v?.toFixed(2) ?? "—", good:"low"  },
    { key:"dividend_yield", label:"Dividend Yield",  fmt: v => v ? v.toFixed(2)+"%" : "—", good:"high" },
    { key:"confidence",     label:"ML Confidence",   fmt: v => v ? v.toFixed(0)+"%" : "—", good:"high" },
    { key:"sentiment",      label:"News Sentiment",  fmt: v => v ?? "Neutral", good:"pos" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Stock selector */}
      <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
        <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Select 2–3 stocks to compare</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          {NSE_TICKERS.map(t => (
            <button key={t} onClick={()=>toggleTicker(t)} style={{
              padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              background: selected.includes(t) ? COLORS[selected.indexOf(t)] : "#071529",
              border: `1px solid ${selected.includes(t) ? COLORS[selected.indexOf(t)] : "#1a3a6e"}`,
              color: selected.includes(t) ? "#fff" : "#7a9bbf", transition:"all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        <button onClick={compare} disabled={loading || selected.length < 2} style={{
          background:"#1d9e75", border:"none", borderRadius:8, color:"#fff",
          padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity: loading ? 0.7 : 1,
        }}>{loading ? "Comparing..." : "Compare stocks"}</button>
      </div>

      {/* Comparison table */}
      {data && data.length > 0 && (
        <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:500 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1a3a6e" }}>
                <th style={{ padding:"14px 18px", textAlign:"left", fontSize:11, color:"#5a7a99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Metric</th>
                {data.map((s,i) => (
                  <th key={s.ticker} style={{ padding:"14px 18px", textAlign:"center", fontSize:13, color:COLORS[i], fontWeight:700 }}>
                    {s.ticker}<br/>
                    <span style={{ fontSize:11, color:"#5a7a99", fontWeight:400 }}>KES {s.price?.toFixed(2)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Signal row */}
              <tr style={{ borderBottom:"1px solid rgba(26,58,110,0.4)", background:"rgba(29,158,117,0.04)" }}>
                <td style={{ padding:"12px 18px", fontSize:12, color:"#7a9bbf", fontWeight:500 }}>ML Signal</td>
                {data.map((s,i) => (
                  <td key={s.ticker} style={{ padding:"12px 18px", textAlign:"center" }}>
                    <SignalBadge signal={s.signal} />
                  </td>
                ))}
              </tr>
              {/* Change row */}
              <tr style={{ borderBottom:"1px solid rgba(26,58,110,0.4)" }}>
                <td style={{ padding:"12px 18px", fontSize:12, color:"#7a9bbf", fontWeight:500 }}>Today</td>
                {data.map((s,i) => (
                  <td key={s.ticker} style={{ padding:"12px 18px", textAlign:"center", fontSize:13, fontWeight:600, color: isPositive(s.change) ? "#1d9e75" : "#e24b4a" }}>{s.change}</td>
                ))}
              </tr>
              {/* Metrics rows */}
              {metrics.map((m,mi) => (
                <tr key={m.key} style={{ borderBottom: mi < metrics.length-1 ? "1px solid rgba(26,58,110,0.4)" : "none" }}>
                  <td style={{ padding:"12px 18px", fontSize:12, color:"#7a9bbf", fontWeight:500 }}>{m.label}</td>
                  {data.map((s,i) => {
                    const val = s[m.key];
                    const fmtVal = m.fmt(val);
                    // Highlight best value
                    let color = "#e8f4f0";
                    if (m.key === "sentiment") {
                      color = val === "Positive" ? "#1d9e75" : val === "Negative" ? "#e24b4a" : "#8aa8c8";
                    }
                    return (
                      <td key={s.ticker} style={{ padding:"12px 18px", textAlign:"center", fontSize:13, fontWeight:600, color }}>{fmtVal}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sparklines comparison */}
      {data && data.length > 0 && (
        <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
          <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>7-day price trend</p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {data.map((s,i) => (
              <div key={s.ticker} style={{ flex:1, minWidth:160 }}>
                <p style={{ margin:"0 0 8px", fontSize:12, color:COLORS[i], fontWeight:600 }}>{s.ticker}</p>
                {s.history && s.history.length > 1 ? (
                  <MiniSparkline data={s.history} positive={isPositive(s.change)} />
                ) : (
                  <p style={{ fontSize:11, color:"#5a7a99" }}>No history available</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===============================
// PAPER TRADING PANEL
// ===============================
function PaperTradingPanel({ market }) {
  const { authFetch } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [trading, setTrading]   = useState(false);
  const [form, setForm]         = useState({ ticker:"SCOM", company_name:"Safaricom", action:"BUY", shares:"" });
  const [msg, setMsg]           = useState(null);

  const NSE_STOCKS = [
    { ticker:"SCOM", company:"Safaricom" }, { ticker:"KCB",  company:"KCB Group" },
    { ticker:"EQTY", company:"Equity Group" }, { ticker:"COOP", company:"Co-op Bank" },
    { ticker:"ABSA", company:"Absa Kenya" },   { ticker:"BAMB", company:"Bamburi" },
    { ticker:"BAT",  company:"BAT Kenya" },    { ticker:"EABL", company:"EABL" },
  ];

  const load = () => {
    setLoading(true);
    authFetch(`${API}/paper-trading`).then(r=>r.json())
      .then(setData).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const NSE_REF = {
    "SCOM":14.85,"KCB":45.20,"EQTY":49.75,"COOP":13.10,"ABSA":12.50,
    "BAMB":38.00,"BAT":410.0,"EABL":165.0,"NCBA":45.0,"SCBK":120.0,
    "DTK":65.0,"IMH":25.0,"JUB":220.0,"BRIT":3.50,"KEGN":6.80,
    "KPLC":2.90,"NMG":18.0,"SASN":30.0,"KUKZ":380.0,"UNGA":40.0,
    "HFCK":4.50,"CIC":2.80,"TOTL":22.0,"CTUM":28.0,"CARB":14.0,
  };

  const _mktPrice = market.find(s => s.ticker === form.ticker)?.price;
  const livePrice = (_mktPrice && _mktPrice > 0) ? _mktPrice : (NSE_REF[form.ticker] || 0);
  const estimatedCost = livePrice && form.shares ? (livePrice * parseFloat(form.shares)).toFixed(2) : null;

  const trade = async () => {
    if (!form.shares || parseFloat(form.shares) <= 0) return;
    const _livePx = market.find(s => s.ticker === form.ticker)?.price;
const priceToSend = (_livePx && _livePx > 0)
  ? _livePx
  : (NSE_REF[form.ticker] || 0);
if (!priceToSend || priceToSend <= 0) {
  setMsg({ type:"error", text:`No price available for ${form.ticker}. Try refreshing market data.` });
  return;
}
    setTrading(true); setMsg(null);
    try {
      const res = await authFetch(`${API}/paper-trading`, {
        method:"POST",
        body: JSON.stringify({
          ticker:       form.ticker,
          company_name: form.company_name,
          action:       form.action,
          shares:       parseFloat(form.shares),
          price:        priceToSend,
        }),
      });
      const d = await res.json();
      if (d.detail) setMsg({ type:"error", text: d.detail });
      else { setMsg({ type:"success", text: d.message }); load(); }
    } catch (e) { setMsg({ type:"error", text: e.message }); }
    setTrading(false);
    setForm(f => ({ ...f, shares:"" }));
  };

  const reset = async () => {
    if (!confirm("Reset paper trading account to KES 100,000?")) return;
    await authFetch(`${API}/paper-trading/reset`, { method:"DELETE" });
    load();
  };

  const inp = { background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"10px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
      {/* Trade form */}
      <div style={{ flex:1, minWidth:260, background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"20px" }}>
        <p style={{ margin:"0 0 16px", fontSize:14, fontWeight:600, color:"#e8f4f0" }}>Place virtual trade</p>

        {data && (
          <div style={{ background:"#071529", borderRadius:10, padding:"12px 14px", marginBottom:16, border:"1px solid #1a3a6e" }}>
            <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>Available balance</p>
            <p style={{ margin:"4px 0 0", fontSize:22, fontWeight:700, color:"#e8f4f0" }}>KES {data.balance?.toLocaleString()}</p>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:11, color:"#5a7a99", display:"block", marginBottom:4 }}>Stock</label>
            <select value={form.ticker} onChange={e => {
              const s = NSE_STOCKS.find(x => x.ticker === e.target.value);
              setForm(f => ({ ...f, ticker: e.target.value, company_name: s?.company || "" }));
            }} style={inp}>
              {NSE_STOCKS.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.company}</option>)}
            </select>
          </div>

          <div style={{ display:"flex", background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, overflow:"hidden" }}>
            {["BUY","SELL"].map(a => (
              <button key={a} onClick={()=>setForm(f=>({...f,action:a}))} style={{
                flex:1, padding:"9px", border:"none", fontSize:13, fontWeight:600, cursor:"pointer",
                background: form.action===a ? (a==="BUY"?"#1d9e75":"#e24b4a") : "transparent",
                color: form.action===a ? "#fff" : "#7a9bbf", transition:"all 0.15s",
              }}>{a}</button>
            ))}
          </div>

          <div>
            <label style={{ fontSize:11, color:"#5a7a99", display:"block", marginBottom:4 }}>Number of shares</label>
            <input type="number" value={form.shares} onChange={e=>setForm(f=>({...f,shares:e.target.value}))} placeholder="e.g. 100" style={inp} />
          </div>

          {livePrice && (
            <div style={{ background:"#071529", borderRadius:8, padding:"10px 12px", border:"1px solid #1a3a6e", fontSize:12, color:"#7a9bbf" }}>
              Live price: <strong style={{ color:"#e8f4f0" }}>KES {livePrice?.toFixed(2)}</strong>
              {estimatedCost && <> · Total: <strong style={{ color: form.action==="BUY"?"#e24b4a":"#1d9e75" }}>KES {parseFloat(estimatedCost).toLocaleString()}</strong></>}
            </div>
          )}

          {msg && (
            <div style={{ padding:"10px 12px", borderRadius:8, fontSize:12, background: msg.type==="success"?"rgba(29,158,117,0.1)":"rgba(226,75,74,0.1)", color: msg.type==="success"?"#1d9e75":"#e24b4a", border:`1px solid ${msg.type==="success"?"rgba(29,158,117,0.3)":"rgba(226,75,74,0.3)"}` }}>
              {msg.text}
            </div>
          )}

          <button onClick={trade} disabled={trading || !form.shares} style={{
            background: form.action==="BUY" ? "#1d9e75" : "#e24b4a",
            border:"none", borderRadius:8, color:"#fff",
            padding:"11px", fontSize:13, fontWeight:600, cursor:"pointer", opacity: trading?0.7:1,
          }}>{trading ? "Processing..." : `${form.action} ${form.shares || ""} shares`}</button>

          <button onClick={reset} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:8, color:"#5a7a99", padding:"8px", fontSize:12, cursor:"pointer" }}>
            Reset account
          </button>
        </div>
      </div>

      {/* Portfolio + stats */}
      <div style={{ flex:2, minWidth:280, display:"flex", flexDirection:"column", gap:14 }}>
        {loading ? (
          <p style={{ color:"#5a7a99", textAlign:"center", padding:32, fontSize:13 }}>Loading paper trading...</p>
        ) : data && (
          <>
            {/* Summary */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <StatCard label="Virtual balance" value={`KES ${data.balance?.toLocaleString()}`} sub="Available cash" />
              <StatCard label="Portfolio value" value={`KES ${data.total_value?.toLocaleString()}`} sub="Cash + holdings" accent="#4a9edd" />
              <StatCard label="Total P&L"
                value={`${data.total_pnl>=0?"+":""}KES ${data.total_pnl?.toLocaleString()}`}
                sub={`vs KES 100,000 start`}
                accent={data.total_pnl>=0?"#1d9e75":"#e24b4a"} />
            </div>

            {/* Holdings */}
            {data.holdings?.length > 0 && (
              <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
                <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Virtual holdings</p>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #1a3a6e" }}>
                      {["Stock","Shares","Avg buy","Current","P&L"].map(h => (
                        <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, color:"#5a7a99", fontWeight:600, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.holdings.map((h,i) => (
                      <tr key={h.ticker} style={{ borderBottom: i<data.holdings.length-1?"1px solid rgba(26,58,110,0.4)":"none" }}>
                        <td style={{ padding:"10px" }}>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#e8f4f0" }}>{h.ticker}</p>
                          <p style={{ margin:0, fontSize:10, color:"#5a7a99" }}>{h.company}</p>
                        </td>
                        <td style={{ padding:"10px", fontSize:12, color:"#e8f4f0" }}>{h.shares}</td>
                        <td style={{ padding:"10px", fontSize:12, color:"#7a9bbf" }}>{h.avg_price?.toFixed(2)}</td>
                        <td style={{ padding:"10px", fontSize:12, color:"#e8f4f0" }}>{h.current_price?.toFixed(2)}</td>
                        <td style={{ padding:"10px" }}>
                          <p style={{ margin:0, fontSize:12, fontWeight:600, color:h.pnl>=0?"#1d9e75":"#e24b4a" }}>
                            {h.pnl>=0?"+":""}{h.pnl?.toFixed(0)}
                          </p>
                          <p style={{ margin:0, fontSize:10, color:h.pnl_pct>=0?"#1d9e75":"#e24b4a" }}>
                            {h.pnl_pct>=0?"+":""}{h.pnl_pct?.toFixed(1)}%
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent trades */}
            {data.trades?.length > 0 && (
              <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
                <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Recent trades</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {data.trades.slice(0,8).map(t => (
                    <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"#071529", borderRadius:8, border:"1px solid #1a3a6e" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, background: t.action==="BUY"?"rgba(29,158,117,0.15)":"rgba(226,75,74,0.15)", color: t.action==="BUY"?"#1d9e75":"#e24b4a" }}>{t.action}</span>
                        <div>
                          <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#e8f4f0" }}>{t.ticker} · {t.shares} shares</p>
                          <p style={{ margin:0, fontSize:10, color:"#5a7a99" }}>@ KES {t.price?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ margin:0, fontSize:12, fontWeight:600, color: t.action==="BUY"?"#e24b4a":"#1d9e75" }}>
                          {t.action==="BUY"?"-":"+"}KES {t.total?.toLocaleString()}
                        </p>
                        <p style={{ margin:0, fontSize:10, color:"#5a7a99" }}>Bal: {t.balance_after?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.holdings?.length === 0 && data.trades?.length === 0 && (
              <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:32, textAlign:"center" }}>
                <p style={{ color:"#5a7a99", fontSize:13 }}>No trades yet. You have KES 100,000 virtual balance to start!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===============================
// NEWS PANEL
// ===============================
function SentimentBadge({ sentiment, small }) {
  const map = {
    Positive: { bg: "rgba(29,158,117,0.15)", color: "#1d9e75", border: "rgba(29,158,117,0.3)", emoji: "↑" },
    Negative: { bg: "rgba(226,75,74,0.15)",  color: "#e24b4a", border: "rgba(226,75,74,0.3)",  emoji: "↓" },
    Neutral:  { bg: "rgba(138,168,200,0.15)",color: "#8aa8c8", border: "rgba(138,168,200,0.3)",emoji: "→" },
  };
  const s = map[sentiment] || map.Neutral;
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 600,
      padding: small ? "2px 7px" : "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>{s.emoji} {sentiment}</span>
  );
}

function NewsCard({ article }) {
  const s = article.sentiment;
  return (
    <div style={{
      background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 10,
      padding: "14px 16px", transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#243d6e"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3a6e"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#e8f4f0", textDecoration: "none", lineHeight: 1.4, flex: 1 }}
          onMouseEnter={e => e.target.style.color = "#5dcaa5"}
          onMouseLeave={e => e.target.style.color = "#e8f4f0"}
        >{article.title}</a>
        {s && <SentimentBadge sentiment={s.label} small />}
      </div>
      {article.summary && (
        <p style={{ fontSize: 12, color: "#7a9bbf", lineHeight: 1.6, marginBottom: 10 }}>{article.summary}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#5a7a99" }}>{article.source}</span>
        {article.tickers_mentioned?.length > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            {article.tickers_mentioned.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: "rgba(74,158,221,0.12)", color: "#4a9edd", border: "1px solid rgba(74,158,221,0.2)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsPanel() {
  const [view, setView]           = useState("market");
  const [ticker, setTicker]       = useState("SCOM");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [summaries, setSummaries] = useState([]);

  const NSE_TICKERS = ["SCOM","KCB","EQTY","COOP","ABSA","BAMB","BAT","EABL"];

  const loadMarketNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/news`);
      if (!res.ok) throw new Error("Request failed");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error("News fetch error:", e);
      setData({ articles: [], sentiment: null });
    }
    setLoading(false);
  };

  const loadStockNews = async (t) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/news/${t}`);
      if (!res.ok) throw new Error("Request failed");
      const d = await res.json();
      // Normalize response — backend returns {ticker, sentiment, articles}
      setData({ articles: d.articles || [], sentiment: d.sentiment || null });
    } catch (e) {
      console.error("Stock news fetch error:", e);
      setData({ articles: [], sentiment: null });
    }
    setLoading(false);
  };

  const loadSummaries = async () => {
    try {
      const res = await fetch(`${API}/news/summary/all`);
      const d = await res.json();
      if (d.summaries) setSummaries(d.summaries);
    } catch {}
  };

  useEffect(() => {
    loadMarketNews();
    loadSummaries();
  }, []);

  const switchView = (v) => {
    setView(v);
    if (v === "market") loadMarketNews();
    else loadStockNews(ticker);
  };

  const switchTicker = (t) => {
    setTicker(t);
    loadStockNews(t);
  };

  const sentiment = data?.sentiment;
  const articles  = data?.articles || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Sentiment summary cards */}
      {summaries.length > 0 && (
        <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: "16px 20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#e8f4f0" }}>Sentiment overview</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {summaries.map(s => (
              <div key={s.ticker} onClick={() => { setView("stock"); switchTicker(s.ticker); }}
                style={{ background: "#071529", border: `1px solid ${s.color}40`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", minWidth: 100, transition: "transform 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#e8f4f0" }}>{s.ticker}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sentiment}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#5a7a99" }}>{s.total_articles} articles</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 8, overflow: "hidden" }}>
          {[["market","Market news"],["stock","Stock news"]].map(([v,l]) => (
            <button key={v} onClick={() => switchView(v)} style={{
              padding: "8px 16px", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: view === v ? "#1d9e75" : "transparent",
              color: view === v ? "#fff" : "#7a9bbf",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        {view === "stock" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {NSE_TICKERS.map(t => (
              <button key={t} onClick={() => switchTicker(t)} style={{
                padding: "7px 13px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: ticker === t ? "#1d9e75" : "#0e2245",
                border: `1px solid ${ticker === t ? "#1d9e75" : "#1a3a6e"}`,
                color: ticker === t ? "#fff" : "#7a9bbf",
                transition: "all 0.15s",
              }}>{t}</button>
            ))}
          </div>
        )}
        <button onClick={() => view === "market" ? loadMarketNews() : loadStockNews(ticker)}
          style={{ marginLeft: "auto", background: "transparent", border: "1px solid #1a3a6e", borderRadius: 7, color: "#7a9bbf", padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Overall sentiment banner */}
      {sentiment && (
        <div style={{ background: `${sentiment.color}12`, border: `1px solid ${sentiment.color}30`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SentimentBadge sentiment={sentiment.overall} />
            <p style={{ margin: 0, fontSize: 13, color: "#e8f4f0" }}>{sentiment.summary}</p>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            {[["Positive", sentiment.positive, "#1d9e75"], ["Neutral", sentiment.neutral, "#8aa8c8"], ["Negative", sentiment.negative, "#e24b4a"]].map(([l,v,c]) => (
              <span key={l} style={{ color: c }}>{l}: <strong>{v}</strong></span>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <p style={{ color: "#5a7a99", fontSize: 13 }}>Fetching latest news...</p>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ background: "#0e2245", border: "1px solid #1a3a6e", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#5a7a99", fontSize: 13 }}>No articles returned from news API.</p>
          <p style={{ color: "#5a7a99", fontSize: 12, marginTop: 6 }}>Check that your FastAPI backend is running and try refreshing.</p>
          <button onClick={() => view === "market" ? loadMarketNews() : loadStockNews(ticker)}
            style={{ marginTop: 14, background: "#1d9e75", border: "none", borderRadius: 7, color: "#fff", padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {articles.map((a, i) => <NewsCard key={i} article={a} />)}
        </div>
      )}
    </div>
  );
}



// ===============================
// PORTFOLIO
// ===============================
function Portfolio() {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ticker: "", company_name: "", shares: "", buy_price: "" });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch(`${API}/portfolio`).then(r => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addHolding = async () => {
    setAdding(true);
    try {
      await authFetch(`${API}/portfolio`, {
        method: "POST",
        body: JSON.stringify({ ticker: form.ticker.toUpperCase(), company_name: form.company_name, shares: parseFloat(form.shares), buy_price: parseFloat(form.buy_price) }),
      });
      setForm({ ticker: "", company_name: "", shares: "", buy_price: "" });
      setShowForm(false);
      load();
    } catch (e) {}
    setAdding(false);
  };

  const remove = async (id) => {
    await authFetch(`${API}/portfolio/${id}`, { method: "DELETE" });
    load();
  };

  const exportCSV = () => {
    if (!data?.holdings?.length) return;
    const rows = [
      ["Ticker","Company","Shares","Buy Price","Current Price","Invested","Value","P&L","P&L %"],
      ...data.holdings.map(h => [h.ticker, h.company_name, h.shares, h.buy_price, h.current_price, h.invested, h.current_value, h.pnl, h.pnl_pct+"%"])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "nse_portfolio.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    if (!data?.holdings?.length) return;
    const summary = data.summary;
    const rows = data.holdings.map(h => `${h.ticker.padEnd(6)} | ${h.company_name.padEnd(20)} | Shares: ${h.shares} | Buy: ${h.buy_price} | Now: ${h.current_price} | P&L: ${h.pnl>=0?"+":""}${h.pnl.toFixed(0)} (${h.pnl_pct.toFixed(1)}%)`).join("\n)");

    const txt = ["NSE SMART INVESTOR — PORTFOLIO REPORT", "Generated: " + new Date().toLocaleDateString("en-KE"), "", "SUMMARY", `Total Invested: KES ${summary.total_invested.toLocaleString()}`, `Current Value:  KES ${summary.total_value.toLocaleString()}`, `Total P&L:      ${summary.total_pnl>=0?"+":""}KES ${summary.total_pnl.toLocaleString()}`, `Return:         ${summary.total_pnl_pct>=0?"+":""}${summary.total_pnl_pct.toFixed(2)}%`, "", "HOLDINGS", rows].join("\n)");

    const blob = new Blob([txt], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "nse_portfolio_report.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const inp = { background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"10px 14px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const summary = data?.summary;
  const holdings = data?.holdings || [];

  const barData = {
    labels: holdings.map(h => h.ticker),
    datasets: [
      { label:"Invested",      data: holdings.map(h => h.invested),      backgroundColor:"rgba(74,158,221,0.7)",  borderRadius:4 },
      { label:"Current value", data: holdings.map(h => h.current_value), backgroundColor:"rgba(29,158,117,0.7)", borderRadius:4 },
    ]
  };

  if (loading) return <p style={{ color:"#5a7a99", textAlign:"center", padding:40, fontSize:13 }}>Loading portfolio...</p>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {summary && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <StatCard label="Total invested" value={`KES ${summary.total_invested.toLocaleString()}`} sub="Cost basis" />
          <StatCard label="Current value"  value={`KES ${summary.total_value.toLocaleString()}`}    sub="Live prices" accent="#4a9edd" />
          <StatCard label="Total P&L"
            value={`${summary.total_pnl>=0?"+":""}KES ${summary.total_pnl.toLocaleString()}`}
            sub={`${summary.total_pnl_pct>=0?"+":""}${summary.total_pnl_pct.toFixed(2)}%`}
            accent={summary.total_pnl>=0?"#1d9e75":"#e24b4a"} />
        </div>
      )}

      {holdings.length > 0 && (
        <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
          <p style={{ margin:"0 0 16px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Holdings breakdown</p>
          <div style={{ position:"relative", height:200 }}>
            <Bar data={barData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#5a7a99", font:{ size:11 } } }, y:{ grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#5a7a99", font:{ size:11 } } } } }} />
          </div>
        </div>
      )}

      <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"16px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Holdings</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={exportCSV}    style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:7, color:"#7a9bbf", padding:"7px 14px", fontSize:12, cursor:"pointer" }}>↓ CSV</button>
            <button onClick={exportReport} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:7, color:"#7a9bbf", padding:"7px 14px", fontSize:12, cursor:"pointer" }}>↓ Report</button>
            <button onClick={() => setShowForm(!showForm)} style={{ background:"#1d9e75", border:"none", borderRadius:7, color:"#fff", padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {showForm ? "Cancel" : "+ Add holding"}
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ background:"#071529", border:"1px solid #1a3a6e", borderRadius:10, padding:"16px", marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["ticker","Ticker (e.g. SCOM)"],["company_name","Company name"],["shares","Number of shares"],["buy_price","Buy price (KES)"]].map(([k,label]) => (
              <div key={k}>
                <label style={{ fontSize:11, color:"#5a7a99", display:"block", marginBottom:4 }}>{label}</label>
                <input type={["shares","buy_price"].includes(k)?"number":"text"} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]:e.target.value }))} style={inp} />
              </div>
            ))}
            <div style={{ gridColumn:"span 2" }}>
              <button onClick={addHolding} disabled={adding} style={{ width:"100%", background:"#1d9e75", border:"none", borderRadius:7, color:"#fff", padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {adding ? "Adding..." : "Add to portfolio"}
              </button>
            </div>
          </div>
        )}

        {holdings.length === 0 ? (
          <p style={{ color:"#5a7a99", fontSize:13, textAlign:"center", padding:24 }}>No holdings yet. Add your first stock above.</p>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1a3a6e" }}>
                  {["Stock","Shares","Buy price","Current","Invested","Value","P&L",""].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#5a7a99", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h,i) => (
                  <tr key={h.id} style={{ borderBottom:i<holdings.length-1?"1px solid rgba(26,58,110,0.4)":"none" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(29,158,117,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px" }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#e8f4f0" }}>{h.ticker}</p>
                      <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{h.company_name}</p>
                    </td>
                    <td style={{ padding:"12px", fontSize:13, color:"#e8f4f0" }}>{h.shares}</td>
                    <td style={{ padding:"12px", fontSize:13, color:"#7a9bbf" }}>{h.buy_price?.toFixed(2)}</td>
                    <td style={{ padding:"12px", fontSize:13, color:"#e8f4f0" }}>{h.current_price?.toFixed(2)}</td>
                    <td style={{ padding:"12px", fontSize:13, color:"#7a9bbf" }}>{h.invested?.toLocaleString()}</td>
                    <td style={{ padding:"12px", fontSize:13, color:"#e8f4f0" }}>{h.current_value?.toLocaleString()}</td>
                    <td style={{ padding:"12px" }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:h.pnl>=0?"#1d9e75":"#e24b4a" }}>{h.pnl>=0?"+":""}{h.pnl?.toFixed(0)}</p>
                      <p style={{ margin:0, fontSize:11, color:h.pnl_pct>=0?"#1d9e75":"#e24b4a" }}>{h.pnl_pct>=0?"+":""}{h.pnl_pct?.toFixed(2)}%</p>
                    </td>
                    <td style={{ padding:"12px" }}>
                      <button onClick={() => remove(h.id)} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:6, color:"#5a7a99", padding:"4px 10px", fontSize:11, cursor:"pointer" }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ===============================
// ANALYZE
// ===============================
const NSE_STOCK_LIST = [
  { ticker:"SCOM", company:"Safaricom",          sector:"Telecom" },
  { ticker:"KCB",  company:"KCB Group",          sector:"Banking" },
  { ticker:"EQTY", company:"Equity Group",       sector:"Banking" },
  { ticker:"COOP", company:"Co-op Bank",         sector:"Banking" },
  { ticker:"ABSA", company:"Absa Kenya",         sector:"Banking" },
  { ticker:"SCBK", company:"Standard Chartered", sector:"Banking" },
  { ticker:"NCBA", company:"NCBA Group",         sector:"Banking" },
  { ticker:"DTK",  company:"Diamond Trust Bank", sector:"Banking" },
  { ticker:"IMH",  company:"I&M Holdings",       sector:"Banking" },
  { ticker:"HFCK", company:"HF Group",           sector:"Banking" },
  { ticker:"BAMB", company:"Bamburi Cement",     sector:"Manufacturing" },
  { ticker:"BAT",  company:"BAT Kenya",          sector:"Manufacturing" },
  { ticker:"EABL", company:"EABL",               sector:"Manufacturing" },
  { ticker:"UNGA", company:"Unga Group",         sector:"Manufacturing" },
  { ticker:"CARB", company:"Carbacid",           sector:"Manufacturing" },
  { ticker:"JUB",  company:"Jubilee Holdings",   sector:"Insurance" },
  { ticker:"BRIT", company:"Britam Holdings",    sector:"Insurance" },
  { ticker:"CIC",  company:"CIC Insurance",      sector:"Insurance" },
  { ticker:"KEGN", company:"KenGen",             sector:"Energy" },
  { ticker:"KPLC", company:"Kenya Power",        sector:"Energy" },
  { ticker:"TOTL", company:"Total Energies",     sector:"Energy" },
  { ticker:"SASN", company:"Sasini",             sector:"Agriculture" },
  { ticker:"KUKZ", company:"Kakuzi",             sector:"Agriculture" },
  { ticker:"NMG",  company:"Nation Media Group", sector:"Commercial" },
  { ticker:"CTUM", company:"Centum Investment",  sector:"Commercial" },
];

function StockSearchModal({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [loadingTicker, setLoadingTicker] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const sectors = ["All", ...new Set(NSE_STOCK_LIST.map(s => s.sector))];
  const filtered = NSE_STOCK_LIST.filter(s =>
    (sector === "All" || s.sector === sector) &&
    (s.company.toLowerCase().includes(search.toLowerCase()) || s.ticker.toLowerCase().includes(search.toLowerCase()))
  );
  const selectStock = async (stock) => {
    setLoadingTicker(stock.ticker);
    try {
      const res = await fetch(`${API}/stock/${stock.ticker}`);
      const data = await res.json();
      onSelect({ ...stock, price: data.price || data.current_price || data.last_price || 0 })
    } catch { onSelect({ ...stock, price: 0 }); }
    setLoadingTicker(null);
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:16, width:"100%", maxWidth:540, maxHeight:"80vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #1a3a6e", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#e8f4f0" }}>Select NSE stock to analyze</p>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#5a7a99", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #1a3a6e" }}>
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ticker..."
            style={{ width:"100%", boxSizing:"border-box", background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"10px 14px", fontSize:13, outline:"none" }} />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
            {sectors.map(s => (
              <button key={s} onClick={() => setSector(s)} style={{ padding:"4px 10px", borderRadius:14, fontSize:11, fontWeight:600, cursor:"pointer", background:sector===s?"#1d9e75":"transparent", border:`1px solid ${sector===s?"#1d9e75":"#1a3a6e"}`, color:sector===s?"#fff":"#5a7a99" }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(s => (
            <button key={s.ticker} onClick={() => selectStock(s)} disabled={!!loadingTicker}
              style={{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid rgba(26,58,110,0.4)", padding:"12px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(29,158,117,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ textAlign:"left" }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>{s.company}</p>
                <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{s.ticker} · {s.sector}</p>
              </div>
              <span style={{ fontSize:11, color: loadingTicker===s.ticker?"#1d9e75":"#5a7a99" }}>
                {loadingTicker===s.ticker ? "Loading..." : "Select →"}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p style={{ color:"#5a7a99", fontSize:13, textAlign:"center", padding:24 }}>No stocks found.</p>}
        </div>
      </div>
    </div>
  );
}

function Analyze() {
  const [form, setForm]             = useState({ share_price:"", eps:"", dividend:"", profit:"", equity:"", debt:"" });
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [selectedStock, setSelected] = useState(null);

  const handleSelect = async (stock) => {
    setSelected(stock);
    setShowModal(false);
    setResult(null);
    // Pre-fill share price from live data
    const newForm = { share_price:"", eps:"", dividend:"", profit:"", equity:"", debt:"" };
    if (stock.price > 0) newForm.share_price = stock.price.toFixed(2);

    // Try to fetch stored financials from DB
        try {
      const res = await fetch(`${API}/companies`);
      const companies = await res.json();
      const company = companies.find(c =>
        c.ticker === stock.ticker ||
        c.ticker === stock.ticker + ".NR" ||
        c.ticker === stock.ticker + ".ke"
      );
      if (company) {
        const fRes = await fetch(`${API}/companies/${company.id}/financials`);
        const financials = await fRes.json();
        if (financials && financials.length > 0) {
          const f = financials[0];
          newForm.share_price = (stock.price > 0 ? stock.price : (f.share_price || 0)).toFixed(2);
          newForm.eps      = f.eps?.toString()      || "";
          newForm.dividend = f.dividend?.toString() || "";
          newForm.profit   = f.profit?.toString()   || "";
          newForm.equity   = f.equity?.toString()   || "";
          newForm.debt     = f.debt?.toString()     || "";
        } else {
          // Company in DB but no financials yet
          newForm.share_price = stock.price > 0 ? stock.price.toFixed(2) : "";
        }
      } else {
        // Company not in DB — still fill live price so field isn't blank
        newForm.share_price = stock.price > 0 ? stock.price.toFixed(2) : "";
      }
    } catch {
      // Network error — best-effort fill price
      newForm.share_price = stock.price > 0 ? stock.price.toFixed(2) : "";
    }

    setForm(newForm);
  };

  const analyze = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/chat`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ share_price:parseFloat(form.share_price), eps:parseFloat(form.eps), dividend:parseFloat(form.dividend), profit:parseFloat(form.profit), equity:parseFloat(form.equity), debt:parseFloat(form.debt) }),
      });
      setResult(await res.json());
    } catch { setError("Could not connect to backend."); }
    setLoading(false);
  };

  const inp = { background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"10px 14px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const valColors = { Undervalued:"#1d9e75", Fair:"#e8a742", Overvalued:"#e24b4a", Invalid:"#5a7a99" };

  return (
    <>
      {showModal && <StockSearchModal onSelect={handleSelect} onClose={() => setShowModal(false)} />}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:280, background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"20px 24px" }}>
          {/* Stock picker */}
          <button onClick={() => setShowModal(true)} style={{ width:"100%", background:"#071529", border:"1px solid #1a3a6e", borderRadius:10, color:"#e8f4f0", padding:"12px 16px", fontSize:13, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, transition:"border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor="#1d9e75"}
            onMouseLeave={e => e.currentTarget.style.borderColor="#1a3a6e"}>
            <div style={{ textAlign:"left" }}>
              {selectedStock ? (
                <>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>{selectedStock.company} ({selectedStock.ticker})</p>
                  <p style={{ margin:0, fontSize:11, color:"#1d9e75" }}>Live price auto-filled · click to change</p>
                </>
              ) : (
                <>
                  <p style={{ margin:0, fontSize:13, color:"#7a9bbf" }}>Select a stock to analyze</p>
                  <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>Auto-fills live NSE price</p>
                </>
              )}
            </div>
            <span style={{ color:"#1d9e75", fontSize:18 }}>⊕</span>
          </button>

          <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Financial inputs</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {[["share_price","Share Price (KES)"],["eps","EPS"],["dividend","Dividend/Share"],["profit","Net Profit (M)"],["equity","Total Equity (M)"],["debt","Total Debt (M)"]].map(([k,label]) => (
              <div key={k}>
                <label style={{ fontSize:12, color:"#5a7a99", display:"block", marginBottom:4 }}>{label}</label>
                <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]:e.target.value }))} placeholder="0.00" style={inp} />
              </div>
            ))}
          </div>
          {error && <p style={{ color:"#e24b4a", fontSize:12, marginTop:10 }}>{error}</p>}
          <button onClick={analyze} disabled={loading} style={{ marginTop:20, width:"100%", background:"#1d9e75", border:"none", borderRadius:8, color:"#fff", padding:"12px", fontSize:14, fontWeight:600, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading ? "Analyzing..." : "Run analysis"}
          </button>
          <p style={{ margin:"10px 0 0", fontSize:11, color:"#5a7a99", textAlign:"center" }}>Enter data from NSE company filings and annual reports</p>
        </div>

        {result && (
          <div style={{ flex:1, minWidth:280, background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"20px 24px" }}>
            {selectedStock && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 14px", background:"#071529", borderRadius:8, border:"1px solid #1a3a6e" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(29,158,117,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#1d9e75" }}>{selectedStock.ticker.slice(0,2)}</div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>{selectedStock.company}</p>
                  <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{selectedStock.ticker} · NSE · KES {parseFloat(form.share_price).toFixed(2)}</p>
                </div>
              </div>
            )}
            <div style={{ textAlign:"center", padding:"20px 0", borderBottom:"1px solid #1a3a6e", marginBottom:16 }}>
              <p style={{ margin:"0 0 4px", fontSize:12, color:"#5a7a99" }}>Valuation</p>
              <p style={{ margin:0, fontSize:36, fontWeight:800, color:valColors[result.Valuation]||"#e8f4f0" }}>{result.Valuation}</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              {[
                ["P/E Ratio", result.PE?.toFixed(2), result.PE<10?"#1d9e75":result.PE>20?"#e24b4a":"#e8a742"],
                ["ROE", result.ROE?(result.ROE*100).toFixed(1)+"%":"—", "#4a9edd"],
                ["Div Yield", result["Dividend Yield"]?(result["Dividend Yield"]*100).toFixed(2)+"%":"—", "#1d9e75"],
                ["Debt Ratio", result["Debt Ratio"]?.toFixed(2), result["Debt Ratio"]>0.7?"#e24b4a":"#1d9e75"],
              ].map(([label,val,color]) => (
                <div key={label} style={{ background:"#071529", borderRadius:8, padding:"12px 14px" }}>
                  <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>{label}</p>
                  <p style={{ margin:"4px 0 0", fontSize:22, fontWeight:700, color }}>{val??"—"}</p>
                </div>
              ))}
            </div>
            {result.AI && (
              <div style={{ background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, padding:"12px 14px" }}>
                <p style={{ margin:"0 0 6px", fontSize:11, color:"#5a7a99" }}>AI analysis</p>
                <p style={{ margin:0, fontSize:13, color:"#e8f4f0", lineHeight:1.6 }}>{result.AI}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ===============================
// ALERTS PANEL
// ===============================
function AlertsPanel() {
  const { authFetch } = useAuth();
  const [alerts, setAlerts]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm]           = useState({ company_id:"", alert_type:"pe", threshold:"" });

  useEffect(() => {
    fetch(`${API}/companies`).then(r => r.json()).then(setCompanies).catch(() => {});
    authFetch(`${API}/alerts`).then(r => r.json()).then(setAlerts).catch(() => {});
  }, []);

  const add = async () => {
    if (!form.threshold || !form.company_id) return;
    const res = await authFetch(`${API}/alerts`, {
      method:"POST",
      body: JSON.stringify({ company_id:parseInt(form.company_id), alert_type:form.alert_type, threshold:parseFloat(form.threshold) }),
    });
    const a = await res.json();
    if (!a.error) setAlerts(prev => [...prev, a]);
    setForm(f => ({ ...f, threshold:"" }));
  };

  const remove = async (id) => {
    await authFetch(`${API}/alerts/${id}`, { method:"DELETE" });
    setAlerts(a => a.filter(x => x.id !== id));
  };

  const sel = { width:"100%", background:"#071529", border:"1px solid #1a3a6e", borderRadius:8, color:"#e8f4f0", padding:"10px 14px", fontSize:13, outline:"none" };

  return (
    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
      <div style={{ flex:1, minWidth:240, background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:12, padding:"20px 24px" }}>
        <p style={{ margin:"0 0 16px", fontSize:14, fontWeight:600, color:"#e8f4f0" }}>New alert</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:"#5a7a99", display:"block", marginBottom:4 }}>Company</label>
            <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id:e.target.value }))} style={sel}>
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.ticker})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:"#5a7a99", display:"block", marginBottom:4 }}>Alert type</label>
            <select value={form.alert_type} onChange={e => setForm(f => ({ ...f, alert_type:e.target.value }))} style={sel}>
              <option value="pe">P/E drops below</option>
              <option value="price">Price drops below</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:"#5a7a99", display:"block", marginBottom:4 }}>Threshold</label>
            <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold:e.target.value }))} placeholder="e.g. 10" style={{ ...sel, boxSizing:"border-box" }} />
          </div>
          <button onClick={add} style={{ background:"#1d9e75", border:"none", borderRadius:8, color:"#fff", padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Add alert</button>
        </div>
        {companies.length === 0 && <p style={{ fontSize:11, color:"#5a7a99", marginTop:12 }}>No companies in DB yet. Add via POST /companies.</p>}
      </div>

      <div style={{ flex:2, minWidth:280, display:"flex", flexDirection:"column", gap:10 }}>
        <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:600, color:"#e8f4f0" }}>Your alerts</p>
        {alerts.map(a => (
          <div key={a.id} style={{ background:"#0e2245", border:`1px solid ${a.triggered?"rgba(226,75,74,0.4)":"#1a3a6e"}`, borderRadius:10, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#e8f4f0" }}>Company #{a.company_id}</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#5a7a99" }}>{a.alert_type?.toUpperCase()} drops below {a.threshold}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {a.triggered && <span style={{ fontSize:11, fontWeight:600, background:"rgba(226,75,74,0.15)", color:"#e24b4a", border:"1px solid rgba(226,75,74,0.3)", padding:"3px 9px", borderRadius:20 }}>Triggered</span>}
              <button onClick={() => remove(a.id)} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:6, color:"#5a7a99", padding:"4px 10px", fontSize:11, cursor:"pointer" }}>Remove</button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p style={{ color:"#5a7a99", fontSize:13, textAlign:"center", padding:24 }}>No alerts yet.</p>}
      </div>
    </div>
  );
}

// ===============================
// AI CHAT
// ===============================
const QUICK_PROMPTS = [
  "How is Safaricom performing?",
  "Should I buy KCB Group?",
  "What is a P/E ratio?",
  "Give me a market summary",
  "Best dividend stocks on NSE?",
  "How to diversify my NSE portfolio?",
];

function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const welcome = `Hello ${user?.full_name?.split(" ")[0] || ""}! I'm **FinanceGPT** — your NSE AI analyst.

Just ask me anything — like you would a financial advisor!`;
    setMessages([{ role:"assistant", content:welcome, id:0 }]);

    fetch(`${API}/nse`).then(r => r.json()).then(data => {
      if (data.data) {
        const stocks = data.data;
        const buys  = stocks.filter(s => s.signal==="BUY").length;
        const sells = stocks.filter(s => s.signal==="SELL").length;
        const holds = stocks.filter(s => s.signal==="HOLD").length;
        const topBuy = stocks.filter(s => s.signal==="BUY")[0];
        const summary = `📊 **Today's NSE snapshot:**
${buys} BUY · ${holds} HOLD · ${sells} SELL signals
${topBuy?`Top pick: ${topBuy.company} at KES ${topBuy.price?.toFixed(2)} (${topBuy.change})`:""}`;
        setMessages(m => [...m, { role:"assistant", content:summary, id:1 }]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg) return;
    setInput(""); setShowQuick(false);
    const userEntry = { role:"user", content:userMsg, id:Date.now() };
    setMessages(m => [...m, userEntry]);
    setLoading(true);

    const history = messages.filter(m => m.id > 1).map(m => ({ role:m.role, content:m.content }));

    try {
      const res = await fetch(`${API}/chat/conversation`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message:userMsg, history, include_market_summary: userMsg.toLowerCase().includes("market") || userMsg.toLowerCase().includes("today") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");
      let extra = "";
      if (data.tickers_detected?.length > 0) extra = `

_Fetched live data for: ${data.tickers_detected.join(", ")}_`;
      setMessages(m => [...m, { role:"assistant", content:data.response + extra, id:Date.now()+1 }]);
    } catch (e) {
      setMessages(m => [...m, { role:"assistant", content:`Sorry, I couldn't connect to the backend. Error: ${e.message}`, id:Date.now()+1 }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{ role:"assistant", content:"Chat cleared! What would you like to know about NSE?", id:Date.now() }]);
    setShowQuick(true);
  };

  const renderContent = (text) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 160px)", minHeight:500, background:"#071529", borderRadius:12, border:"1px solid #1a3a6e", overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #1a3a6e", background:"#0e2245", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#1d9e75", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff" }}>F</div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#e8f4f0" }}>FinanceGPT</p>
            <p style={{ margin:0, fontSize:11, color:"#5a7a99" }}>NSE AI Analyst · Powered by LLaMA 3</p>
          </div>
        </div>
        <button onClick={clearChat} style={{ background:"transparent", border:"1px solid #1a3a6e", borderRadius:6, color:"#5a7a99", padding:"5px 12px", fontSize:11, cursor:"pointer" }}>Clear chat</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-start" }}>
            {m.role==="assistant" && <div style={{ width:28, height:28, borderRadius:8, background:"#1d9e75", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0, marginTop:2 }}>F</div>}
            <div style={{ maxWidth:"75%", padding:"12px 16px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px", background:m.role==="user"?"#1d9e75":"#0e2245", border:m.role==="assistant"?"1px solid #1a3a6e":"none", color:"#e8f4f0", fontSize:13, lineHeight:1.7 }}
              dangerouslySetInnerHTML={{ __html:renderContent(m.content) }} />
            {m.role==="user" && <div style={{ width:28, height:28, borderRadius:8, background:"#4a9edd", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0, marginTop:2 }}>{user?.full_name?.charAt(0).toUpperCase()}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#1d9e75", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>F</div>
            <div style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:"4px 18px 18px 18px", padding:"14px 18px", display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i => <span key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#1d9e75", display:"inline-block", animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showQuick && (
        <div style={{ padding:"0 20px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
          {QUICK_PROMPTS.map(q => (
            <button key={q} onClick={() => send(q)} style={{ background:"#0e2245", border:"1px solid #1a3a6e", borderRadius:20, color:"#8aa8c8", padding:"5px 12px", fontSize:11, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { e.target.style.borderColor="#1d9e75"; e.target.style.color="#5dcaa5"; }}
              onMouseLeave={e => { e.target.style.borderColor="#1a3a6e"; e.target.style.color="#8aa8c8"; }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding:"12px 16px", borderTop:"1px solid #1a3a6e", background:"#0e2245", display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask me anything about NSE stocks, investing, or finance..."
          rows={1} style={{ flex:1, background:"#071529", border:"1px solid #1a3a6e", borderRadius:10, color:"#e8f4f0", padding:"10px 14px", fontSize:13, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.5, maxHeight:100, overflowY:"auto" }}
          onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ background:input.trim()?"#1d9e75":"#0e2245", border:`1px solid ${input.trim()?"#1d9e75":"#1a3a6e"}`, borderRadius:10, color:input.trim()?"#fff":"#5a7a99", padding:"10px 18px", fontSize:13, fontWeight:600, cursor:input.trim()?"pointer":"default", transition:"all 0.15s", whiteSpace:"nowrap" }}>Send</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
// ===============================
// APP INNER
// ===============================
function AppInner() {
  const { user } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth]       = useState(false);
  const [active, setActive]           = useState("Dashboard");
  const [market, setMarket]           = useState(MOCK_MARKET);
  const [histories, setHistories]     = useState({});
  const [wsStatus, setWsStatus]       = useState("offline");
  const [loading, setLoading]         = useState(true);

  // Restore cached market data immediately
  useEffect(() => {
    const cached = sessionStorage.getItem("nse_market");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) setMarket(parsed);
      } catch {}
    }
  }, []);

  // Fetch live market data once user confirmed
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${API}/nse`)
      .then(r => r.json())
      .then(d => {
        if (d.data && Array.isArray(d.data) && d.data.length > 0) {
          const valid = d.data.filter(s => s.price && s.price > 0);
          if (valid.length > 0) {
            setMarket(valid);
            sessionStorage.setItem("nse_market", JSON.stringify(valid));
          }
        }
      })
      .catch(() => {
        const cached = sessionStorage.getItem("nse_market");
        if (cached) { try { setMarket(JSON.parse(cached)); } catch {} }
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch price history for top stocks
  useEffect(() => {
    if (!user) return;
    ["SCOM", "EQTY", "KCB"].forEach(ticker => {
      fetch(`${API}/stock/${ticker}/history?days=8`)
        .then(r => r.json())
        .then(d => { if (d.history?.length > 0) setHistories(h => ({ ...h, [ticker]: d.history })); })
        .catch(() => {});
    });
  }, [user]);

  // WebSocket for live signals
  useEffect(() => {
    if (!user) return;
    let ws;
    try {
      ws = new WebSocket("ws://localhost:8000/ws");
      ws.onopen  = () => setWsStatus("connected");
      ws.onclose = () => setWsStatus("offline");
      ws.onerror = () => setWsStatus("offline");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "ai_signals" && msg.data) {
            setMarket(prev => {
              const updated = prev.map(stock => {
                const u = msg.data.find(s => s.ticker === stock.ticker);
                return u ? { ...stock, signal: u.decision, price: u.price || stock.price } : stock;
              });
              sessionStorage.setItem("nse_market", JSON.stringify(updated));
              return updated;
            });
          }
        } catch {}
      };
    } catch { setWsStatus("offline"); }
    return () => ws?.close();
  }, [user]);

  if (!user && showAuth) return <AuthPage />;
  if (!user) return <LandingPage onLaunch={() => { setShowLanding(false); setShowAuth(true); }} />;

  return (
    <div style={{ minHeight: "100vh", background: "#071529", fontFamily: "'Segoe UI', sans-serif", color: "#e8f4f0" }}>
      <NavBar active={active} setActive={setActive} wsStatus={wsStatus} loading={loading} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e8f4f0" }}>
            {active === "Dashboard"   && "Market overview"}
            {active === "Markets"     && "NSE equities"}
            {active === "Watchlist"   && "My watchlist"}
            {active === "Compare"     && "Stock comparison"}
            {active === "News"        && "Market news & sentiment"}
            {active === "Portfolio"   && "My portfolio"}
            {active === "Paper Trade" && "Paper trading"}
            {active === "Analyze"     && "Stock analyzer"}
            {active === "Alerts"      && "Price alerts"}
            {active === "AI Chat"     && "AI analyst"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5a7a99" }}>
            Nairobi Securities Exchange · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {active === "Dashboard"   && <Dashboard market={market} histories={histories} />}
        {active === "Markets"     && <Markets market={market} />}
        {active === "Watchlist"   && <WatchlistPanel market={market} />}
        {active === "Compare"     && <ComparePanel market={market} />}
        {active === "News"        && <NewsPanel />}
        {active === "Portfolio"   && <Portfolio />}
        {active === "Paper Trade" && <PaperTradingPanel market={market} />}
        {active === "Analyze"     && <Analyze />}
        {active === "Alerts"      && <AlertsPanel />}
        {active === "AI Chat"     && <AIChat />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

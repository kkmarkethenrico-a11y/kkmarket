// ============================================================
// Sketch primitives — reusable wireframe atoms
// Loaded as a global script, components exported to window.
// ============================================================

const Frame = ({ url = "kkmarket.app", children, tall, mobile, className = "", chromeRight }) => (
  <div className={`frame ${tall ? "tall" : ""} ${mobile ? "mobile" : ""} ${className}`}>
    {mobile ? (
      <div className="notch"></div>
    ) : (
      <div className="chrome">
        <span className="dots"><span></span><span></span><span></span></span>
        <span className="url">{url}</span>
        {chromeRight}
      </div>
    )}
    <div className="body">{children}</div>
  </div>
);

const TopNav = ({ logged = true, cart = 1, compact = false }) => (
  <div className="row between" style={{ marginBottom: 18 }}>
    <div className="row gap-12">
      <div className="row gap-6">
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#1a1126", fontSize: 16, fontWeight: 700
        }}>▶</div>
        <span style={{ fontWeight: 700, fontSize: 18 }}>GameMarket</span>
      </div>
      {!compact && (
        <>
          <span className="mono" style={{ marginLeft: 12 }}>Categorias ▾</span>
          <span className="mono">Blog</span>
        </>
      )}
    </div>
    <div className="sk-input" style={{ flex: 1, maxWidth: 280, margin: "0 16px" }}>
      <span>🔍</span>
      <span>Buscar anúncios, jogos…</span>
    </div>
    <div className="row gap-8">
      {logged && <span className="rank-chip">🎮 0 pts</span>}
      {logged && <button className="sk-btn small">Painel</button>}
      {logged && <button className="sk-btn small primary">+ Vender</button>}
      <div className="row gap-4" style={{ position: "relative" }}>
        <span style={{ fontSize: 18 }}>🛒</span>
        {cart > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -8,
            background: "var(--hot)", color: "#1a0a10",
            borderRadius: 99, fontSize: 10, padding: "1px 5px",
            fontFamily: "var(--ui)", fontWeight: 700
          }}>{cart}</span>
        )}
      </div>
      {logged && <SkAvatar initials="HG" size="sm" online />}
    </div>
  </div>
);

const SkAvatar = ({ initials = "•", size = "", online = false, ring = false }) => (
  <span className={`sk-avatar ${size === "lg" ? "lg" : size === "sm" ? "sm" : ""}`}>
    {ring && <span className="ring"></span>}
    {initials}
    {online && <span className="online"></span>}
  </span>
);

const SkImg = ({ h = 160, label = "image", style = {} }) => (
  <div className="sk-img" style={{ height: h, ...style }}>
    <span className="x"></span>
    <span style={{ position: "relative", zIndex: 1, opacity: 0.5 }}>{label}</span>
  </div>
);

const Bars = ({ widths = [100, 80, 60], gap = 8, height = 10 }) => (
  <div className="col" style={{ gap }}>
    {widths.map((w, i) => (
      <div key={i} className="bar" style={{ width: `${w}%`, height }}></div>
    ))}
  </div>
);

// Squiggly arrow that points to an element. Direction controls curve.
const Arrow = ({ d = "M2,2 Q 30,5 56,28", w = 60, h = 30, color = "var(--accent)" }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
    <path d={d} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d={`M${w-8},${h-6} L${w-2},${h-2} L${w-6},${h-12}`} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Game product card (sketchy)
const GameCard = ({ title = "Conta Gold Valorant", price = "R$ 50", seller = "Marcos", badge = "⚡ Entrega Auto", rank, hover3d, story }) => (
  <div className="sk-box" style={{ padding: 12, position: "relative" }}>
    {hover3d && (
      <span className="anim-tag" style={{ position: "absolute", top: -10, right: 12, background: "var(--paper-2)" }}>
        ✦ tilt 3D
      </span>
    )}
    <div style={{ position: "relative" }}>
      <SkImg h={120} label="cover" />
      {badge && (
        <span className="sk-tag good" style={{
          position: "absolute", top: 8, left: 8,
          background: "rgba(52,211,153,0.15)"
        }}>{badge}</span>
      )}
      {rank && (
        <span className="rank-chip gold" style={{
          position: "absolute", top: 8, right: 8
        }}>{rank}</span>
      )}
      {story && (
        <span className="sk-tag" style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(0,0,0,0.5)", borderColor: "var(--ink)"
        }}>▶ preview</span>
      )}
    </div>
    <div className="mt-8">
      <div className="bold" style={{ fontSize: 15 }}>{title}</div>
      <div className="row between mt-8">
        <span className="good bold" style={{ fontSize: 18 }}>{price}</span>
        <span className="stars">★★★★<span className="empty">★</span></span>
      </div>
      <div className="row gap-8 mt-8" style={{ paddingTop: 10, borderTop: "1px dashed var(--ink-faint)" }}>
        <SkAvatar initials={seller[0]} size="sm" online />
        <span className="mono" style={{ fontSize: 12 }}>{seller}</span>
        <span className="mono faint" style={{ marginLeft: "auto", fontSize: 11 }}>Lv 12</span>
      </div>
    </div>
  </div>
);

// Section header inside a frame
const FrameHead = ({ title, right }) => (
  <div className="row between mb-12">
    <div className="h-title" style={{ fontSize: 22 }}>{title}</div>
    {right}
  </div>
);

// Compact icon button
const IconBtn = ({ children }) => (
  <span style={{
    width: 32, height: 32, borderRadius: 8,
    border: "var(--stroke) solid var(--ink-faint)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "var(--ink-dim)", fontSize: 14
  }}>{children}</span>
);

// Inline note pointing to a feature
const Callout = ({ children, color = "var(--accent)", style = {} }) => (
  <div style={{
    fontFamily: "var(--hand)",
    fontSize: 12,
    color,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    ...style
  }}>{children}</div>
);

Object.assign(window, {
  Frame, TopNav, SkAvatar, SkImg, Bars, Arrow, GameCard, FrameHead, IconBtn, Callout
});

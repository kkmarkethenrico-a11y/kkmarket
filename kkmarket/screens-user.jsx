// ============================================================
// User screens: Dashboard, Detalhe, Painel Vendedor, Perfil Vendedor
// ============================================================

// --- DASHBOARD A — Sidebar + grid (classic marketplace dashboard) ---
const DashboardA = () => (
  <Frame url="kkmarket.app/painel" tall>
    <TopNav cart={1} />
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18 }}>
      {/* Sidebar */}
      <div className="col gap-6">
        <div className="sk-box" style={{ padding: 12 }}>
          <div className="row gap-8">
            <SkAvatar initials="H" size="lg" online ring />
            <div>
              <div className="bold" style={{ fontSize: 13 }}>Henrico</div>
              <div className="mono accent" style={{ fontSize: 11 }}>Lv 8 · 240 pts</div>
            </div>
          </div>
          <div className="xp-bar mt-12"><div className="fill" style={{ width: "48%" }}></div></div>
          <div className="mono faint mt-8" style={{ fontSize: 10 }}>160 pts → Lv 9</div>
        </div>
        {[
          ["📊", "visão geral", true],
          ["📦", "meus pedidos", false, 2],
          ["💰", "carteira", false],
          ["⭐", "pontos & recompensas", false],
          ["♡", "favoritos", false, 12],
          ["📢", "meus anúncios", false],
          ["💬", "mensagens", false, 3],
          ["⚙", "config", false]
        ].map(([icon, label, active, count]) => (
          <div key={label} className={`row gap-8 ${active ? "sk-box accent" : ""}`} style={{
            padding: active ? "8px 12px" : 8,
            fontSize: 13,
            cursor: "pointer"
          }}>
            <span style={{ width: 18 }}>{icon}</span>
            <span className="grow">{label}</span>
            {count && <span className="sk-tag hot" style={{ fontSize: 10, padding: "1px 6px" }}>{count}</span>}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="col gap-12">
        <div className="row between">
          <div className="h-title">oi, Henrico 👋</div>
          <div className="row gap-8">
            <button className="sk-btn small">▼ exportar</button>
            <button className="sk-btn small primary">+ Vender</button>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { l: "saldo", v: "R$ 124,00", s: "saque disponível", c: "good" },
            { l: "pedidos", v: "12", s: "2 em entrega", c: "" },
            { l: "pontos", v: "240", s: "🏆 Lv 8", c: "accent" },
            { l: "avaliação", v: "4.9", s: "8 reviews", c: "warn" }
          ].map((s, i) => (
            <div key={i} className="sk-box" style={{ padding: 12 }}>
              <div className="mono" style={{ fontSize: 11 }}>{s.l.toUpperCase()}</div>
              <div className={`bold ${s.c}`} style={{ fontSize: 24, marginTop: 4 }}>{s.v}</div>
              <div className="mono faint" style={{ fontSize: 11 }}>{s.s}</div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <FrameHead title="pedidos recentes" right={<span className="mono accent">ver todos →</span>} />
        <div className="sk-box" style={{ padding: 0 }}>
          {[
            { id: "#1234", t: "Conta Gold Valorant", p: "R$ 50", s: "✓ entregue", c: "good" },
            { id: "#1233", t: "1000 likes BR", p: "R$ 50", s: "⏳ processando", c: "warn" },
            { id: "#1232", t: "Skin Knife CS2", p: "R$ 240", s: "✓ entregue", c: "good" }
          ].map((o, i) => (
            <div key={o.id} className="row gap-12" style={{
              padding: 12,
              borderBottom: i < 2 ? "1px dashed var(--ink-faint)" : "none"
            }}>
              <SkImg h={40} style={{ width: 40, flexShrink: 0 }} label="" />
              <div className="grow">
                <div className="row gap-8">
                  <span className="bold" style={{ fontSize: 13 }}>{o.t}</span>
                  <span className="mono faint" style={{ fontSize: 11 }}>{o.id}</span>
                </div>
                <span className={`mono ${o.c}`} style={{ fontSize: 11 }}>{o.s}</span>
              </div>
              <span className="good bold">{o.p}</span>
              <button className="sk-btn small ghost">detalhes</button>
            </div>
          ))}
        </div>

        {/* Side row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="sk-box">
            <FrameHead title="favoritos" right={<span className="mono faint">12</span>} />
            <div className="row gap-8">
              {[1,2,3].map(i => <SkImg key={i} h={56} style={{ width: "33%" }} label="" />)}
            </div>
          </div>
          <div className="sk-box">
            <FrameHead title="conquistas" right={<span className="mono accent">2 novas</span>} />
            <div className="row gap-6">
              {["🏆", "⚡", "🔒", "★", "?", "?"].map((a, i) => (
                <div key={i} style={{
                  width: 36, height: 36,
                  border: `1.5px ${i < 4 ? "solid" : "dashed"} var(--ink-faint)`,
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i < 2 ? "rgba(167,139,250,0.1)" : "transparent",
                  opacity: i < 4 ? 1 : 0.4
                }}>{a}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

// --- DASHBOARD B — Gamer HUD style ---
const DashboardB = () => (
  <Frame url="kkmarket.app/painel" tall>
    <TopNav cart={1} />

    {/* Player card — hero */}
    <div className="sk-box accent mb-16" style={{
      padding: 20,
      background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.04))",
      position: "relative", overflow: "hidden"
    }}>
      <div className="row gap-16" style={{ alignItems: "center" }}>
        <SkAvatar initials="H" size="lg" online ring />
        <div className="grow">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <div className="h-title">Henrico Gerais</div>
            <span className="rank-chip diamond">◆ DIAMANTE</span>
            <span className="rank-chip gold">VIP</span>
          </div>
          <div className="mono faint mt-8" style={{ fontSize: 12 }}>@henrico · membro desde 2024 · 4.9 ★</div>
          <div className="row gap-12 mt-12" style={{ alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 12 }}>LV 8</span>
            <div className="xp-bar thick" style={{ flex: 1, maxWidth: 320 }}>
              <div className="fill" style={{ width: "48%" }}></div>
            </div>
            <span className="mono accent" style={{ fontSize: 12 }}>240 / 500 XP</span>
          </div>
        </div>
        <div className="col gap-6" style={{ alignItems: "flex-end" }}>
          <button className="sk-btn small">⚙ config</button>
          <button className="sk-btn small primary">+ vender</button>
        </div>
      </div>
      {/* Decorative */}
      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 80, opacity: 0.04 }}>🎮</div>
    </div>

    {/* Quick stats — HUD bars */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {[
        { icon: "💰", l: "CARTEIRA", v: "R$ 124", sub: "saque ↗", c: "good" },
        { icon: "📦", l: "PEDIDOS", v: "12", sub: "2 ativos", c: "" },
        { icon: "🏆", l: "PONTOS", v: "240", sub: "Lv 8", c: "accent" },
        { icon: "⭐", l: "REVIEWS", v: "4.9", sub: "8 avaliações", c: "warn" }
      ].map((s, i) => (
        <div key={i} className="sk-box" style={{ padding: 14, position: "relative" }}>
          <div className="row between">
            <span className="mono" style={{ fontSize: 11 }}>{s.l}</span>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
          </div>
          <div className={`bold ${s.c}`} style={{ fontSize: 28, marginTop: 6 }}>{s.v}</div>
          <div className="mono faint" style={{ fontSize: 11 }}>{s.sub}</div>
          <div className="sparkline mt-12">
            {[2,4,3,5,8,6,9,7,10].map((h, j) => (
              <div key={j} style={{ height: `${h*3}px`, background: `var(--accent)`, opacity: 0.3 + j * 0.07 }}></div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div className="col gap-12">
        {/* Daily quests */}
        <div className="sk-box">
          <FrameHead title="quests diárias" right={<span className="mono accent">+125 pts hoje</span>} />
          <div className="col gap-8">
            {[
              { t: "comprar 1 item", p: 1, max: 1, pts: 25, done: true },
              { t: "responder 3 mensagens", p: 2, max: 3, pts: 15, done: false },
              { t: "criar 1 novo anúncio", p: 0, max: 1, pts: 50, done: false },
              { t: "convidar 1 amigo", p: 0, max: 1, pts: 100, done: false }
            ].map((q, i) => (
              <div key={i} className="row gap-12" style={{ padding: "8px 0", borderBottom: i < 3 ? "1px dashed var(--ink-faint)" : "none" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 5,
                  border: `1.5px solid ${q.done ? "var(--good)" : "var(--ink-faint)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--good)", fontSize: 12,
                  background: q.done ? "rgba(52,211,153,0.1)" : "transparent"
                }}>{q.done && "✓"}</div>
                <span className="bold grow" style={{ fontSize: 13, opacity: q.done ? 0.6 : 1, textDecoration: q.done ? "line-through" : "none" }}>{q.t}</span>
                <div className="xp-bar" style={{ width: 80 }}>
                  <div className="fill" style={{ width: `${q.p/q.max*100}%` }}></div>
                </div>
                <span className="mono accent" style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>+{q.pts} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders compact */}
        <div className="sk-box">
          <FrameHead title="atividade" right={<span className="mono faint">últimos 7 dias</span>} />
          {[
            { t: "Conta Gold Valorant comprada", s: "✓ entregue · há 2h", c: "good", icon: "📦" },
            { t: "Lia te avaliou ★★★★★", s: "+5 pts · ontem", c: "warn", icon: "⭐" },
            { t: "Você desbloqueou 'Comprador Veloz'", s: "achievement · 2 dias", c: "accent", icon: "🏆" }
          ].map((a, i) => (
            <div key={i} className="row gap-12" style={{ padding: "8px 0", borderBottom: i < 2 ? "1px dashed var(--ink-faint)" : "none" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1.5px solid var(--ink-faint)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{a.icon}</div>
              <div className="grow">
                <div className="bold" style={{ fontSize: 13 }}>{a.t}</div>
                <div className={`mono ${a.c}`} style={{ fontSize: 11 }}>{a.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col gap-12">
        {/* Achievements */}
        <div className="sk-box">
          <FrameHead title="conquistas" right={<span className="mono accent">12/30</span>} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {["🏆","⚡","🔒","★","💰","🎯","?","?","?","?","?","?"].map((a, i) => (
              <div key={i} style={{
                aspectRatio: "1",
                border: `1.5px ${i < 6 ? "solid" : "dashed"} ${i < 2 ? "var(--accent)" : "var(--ink-faint)"}`,
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < 2 ? "rgba(167,139,250,0.1)" : "transparent",
                fontSize: 18,
                opacity: i < 6 ? 1 : 0.4
              }}>{a}</div>
            ))}
          </div>
        </div>

        {/* Wishlist preview */}
        <div className="sk-box">
          <FrameHead title="wishlist" right={<span className="mono accent">12</span>} />
          <div className="col gap-8">
            {["Skin Karambit", "Conta Imortal", "Gift Card R$200"].map((w, i) => (
              <div key={i} className="row gap-8" style={{ alignItems: "center" }}>
                <SkImg h={32} style={{ width: 32, flexShrink: 0 }} label="" />
                <span className="mono grow" style={{ fontSize: 12 }}>{w}</span>
                <span className="good bold" style={{ fontSize: 12 }}>R$ {[420, 380, 180][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

// --- DETALHE A — Image left, buy panel right ---
const DetalheA = () => (
  <Frame url="kkmarket.app/anuncio/12345" tall>
    <TopNav cart={1} compact />
    <div className="mono faint mb-12" style={{ fontSize: 12 }}>Home › Jogos › Valorant › <span>Conta Gold Imortal 2</span></div>

    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
      {/* Gallery */}
      <div className="col gap-8">
        <div style={{ position: "relative" }}>
          <SkImg h={280} label="cover image" />
          <span className="sk-tag good lightning" style={{ position: "absolute", top: 10, left: 10 }}>entrega auto</span>
          <span className="rank-chip diamond" style={{ position: "absolute", top: 10, right: 10 }}>◆ IMORTAL 2</span>
        </div>
        <div className="row gap-8">
          {[1,2,3,4,5].map(i => <SkImg key={i} h={56} style={{ width: 56 }} label="" />)}
        </div>

        <div className="sk-box mt-12">
          <FrameHead title="descrição" />
          <Bars widths={[100, 95, 80, 90, 60]} />
        </div>

        <div className="sk-box">
          <FrameHead title="o que está incluso" />
          <div className="col gap-6">
            {["100+ skins de armas", "Rank Imortal 2", "Battlepass ativo", "E-mail original incluso"].map(t => (
              <div key={t} className="row gap-8 mono" style={{ fontSize: 13 }}>
                <span className="good">✓</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buy panel */}
      <div className="col gap-12">
        <div className="sk-box accent" style={{ padding: 18, position: "sticky", top: 16 }}>
          <div className="h-title" style={{ fontSize: 22 }}>Conta Gold Valorant — Imortal 2</div>
          <div className="row gap-8 mt-8">
            <span className="stars">★★★★★</span>
            <span className="mono faint" style={{ fontSize: 12 }}>4.9 · 23 reviews</span>
          </div>
          <div className="row gap-8 mt-16" style={{ alignItems: "baseline" }}>
            <span className="good bold" style={{ fontSize: 36 }}>R$ 240</span>
            <span className="mono faint" style={{ textDecoration: "line-through" }}>R$ 320</span>
            <span className="sk-tag hot fire">-25%</span>
          </div>
          <div className="mono faint mt-8" style={{ fontSize: 12 }}>12x R$ 22,30 no cartão</div>

          <div className="sk-box dashed mt-12" style={{ padding: 10 }}>
            <div className="row between">
              <span className="mono" style={{ fontSize: 11 }}>⚡ entrega automática</span>
              <span className="mono good" style={{ fontSize: 11 }}>~ 30 seg</span>
            </div>
          </div>

          <div className="row gap-8 mt-16">
            <button className="sk-btn primary full glow" style={{ flex: 2 }}>comprar agora</button>
            <button className="sk-btn" style={{ flex: 1 }}>🛒 +</button>
            <button className="sk-btn" style={{ width: 44 }}>♡</button>
          </div>

          <div className="mono faint mt-12 center" style={{ fontSize: 11 }}>🔒 compra protegida · entrega garantida</div>
        </div>

        {/* Seller */}
        <div className="sk-box">
          <div className="row gap-12">
            <SkAvatar initials="M" size="lg" online ring />
            <div className="grow">
              <div className="row gap-8">
                <span className="bold">Marcos</span>
                <span className="rank-chip gold" style={{ fontSize: 9, padding: "1px 6px" }}>VIP</span>
              </div>
              <div className="mono faint" style={{ fontSize: 11 }}>Lv 24 · membro desde 2023</div>
              <div className="row gap-12 mt-8 mono" style={{ fontSize: 11 }}>
                <span>⭐ 4.9</span><span>📦 842 vendas</span><span>⚡ resp. 5min</span>
              </div>
            </div>
          </div>
          <div className="row gap-6 mt-12">
            <button className="sk-btn small full ghost">ver perfil</button>
            <button className="sk-btn small full">💬 conversar</button>
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

// --- DETALHE B — Full bleed hero with floating buy card ---
const DetalheB = () => (
  <Frame url="kkmarket.app/anuncio/12345" tall>
    <TopNav cart={1} compact />

    {/* Full-bleed hero */}
    <div style={{ position: "relative", margin: "0 -18px" }}>
      <SkImg h={300} label="full-bleed hero · auto-rotate gallery" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }} />
      <div style={{ position: "absolute", top: 16, left: 16 }}>
        <div className="rank-chip diamond mb-8">◆ RARO · IMORTAL 2</div>
        <div className="h-title xl" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          Conta <span className="accent">Valorant</span><br/>Imortal 2
        </div>
        <div className="row gap-8 mt-12">
          <span className="sk-tag good lightning" style={{ background: "rgba(0,0,0,0.5)" }}>auto</span>
          <span className="sk-tag warn star" style={{ background: "rgba(0,0,0,0.5)" }}> 4.9</span>
          <span className="sk-tag hot fire" style={{ background: "rgba(0,0,0,0.5)" }}>top 5%</span>
        </div>
      </div>

      {/* Floating buy card */}
      <div className="sk-box accent" style={{
        position: "absolute", right: 16, bottom: -40, width: 280,
        padding: 16,
        background: "rgba(13,13,18,0.96)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.6)"
      }}>
        <div className="mono" style={{ fontSize: 11 }}>POR APENAS</div>
        <div className="row gap-8" style={{ alignItems: "baseline" }}>
          <span className="good bold" style={{ fontSize: 32 }}>R$ 240</span>
          <span className="mono faint" style={{ textDecoration: "line-through" }}>R$ 320</span>
        </div>
        <div className="xp-bar mt-12">
          <div className="fill" style={{ width: "20%", background: "var(--hot)" }}></div>
        </div>
        <div className="mono hot mt-8" style={{ fontSize: 11 }}>🔥 só restam 2 unidades</div>
        <button className="sk-btn primary full glow mt-12">comprar agora →</button>
      </div>
    </div>

    <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
      <div className="col gap-12">
        {/* Tabs */}
        <div className="row gap-12" style={{ borderBottom: "1px dashed var(--ink-faint)", paddingBottom: 8 }}>
          <span className="bold accent squiggle">descrição</span>
          <span className="mono faint">o que inclui</span>
          <span className="mono faint">reviews (23)</span>
          <span className="mono faint">vendedor</span>
        </div>
        <Bars widths={[100, 95, 80, 90, 60, 85, 70]} />

        {/* Reviews preview */}
        <FrameHead title="reviews recentes" right={<span className="stars">★★★★★</span>} />
        {[1,2].map(i => (
          <div key={i} className="sk-box" style={{ padding: 12 }}>
            <div className="row between mb-8">
              <div className="row gap-8">
                <SkAvatar initials="L" size="sm" />
                <span className="bold" style={{ fontSize: 13 }}>Lia M.</span>
                <span className="stars" style={{ fontSize: 11 }}>★★★★★</span>
              </div>
              <span className="mono faint" style={{ fontSize: 11 }}>há 2 dias</span>
            </div>
            <Bars widths={[90, 70]} />
          </div>
        ))}
      </div>

      <div className="col gap-12">
        <div className="sk-box">
          <FrameHead title="vendedor" />
          <div className="col gap-6" style={{ alignItems: "center" }}>
            <SkAvatar initials="M" size="lg" online ring />
            <span className="bold">Marcos</span>
            <span className="rank-chip gold" style={{ fontSize: 10 }}>VIP · LV 24</span>
            <button className="sk-btn small">ver perfil →</button>
          </div>
        </div>
        <div className="sk-box">
          <FrameHead title="similares" />
          <div className="col gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="row gap-8">
                <SkImg h={40} style={{ width: 40 }} label="" />
                <div className="grow">
                  <div className="bold" style={{ fontSize: 12 }}>Conta Valorant Diamante</div>
                  <span className="good bold" style={{ fontSize: 12 }}>R$ 180</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

// --- PAINEL VENDEDOR A — Table view ---
const PainelVendedorA = () => (
  <Frame url="kkmarket.app/painel/anuncios" tall>
    <TopNav cart={0} />
    <div className="row between mb-16">
      <div>
        <div className="h-title">meus anúncios</div>
        <div className="mono faint" style={{ fontSize: 12 }}>24 ativos · 3 pausados · 187 vendidos</div>
      </div>
      <button className="sk-btn primary glow">+ criar anúncio</button>
    </div>

    {/* Stats row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
      {[
        { l: "vendas mês", v: "R$ 3.420", c: "good" },
        { l: "pedidos", v: "47", c: "" },
        { l: "conversão", v: "8.2%", c: "accent" },
        { l: "rating", v: "4.9 ★", c: "warn" }
      ].map(s => (
        <div key={s.l} className="sk-box" style={{ padding: 12 }}>
          <div className="mono" style={{ fontSize: 11 }}>{s.l.toUpperCase()}</div>
          <div className={`bold ${s.c}`} style={{ fontSize: 22 }}>{s.v}</div>
        </div>
      ))}
    </div>

    {/* Filters */}
    <div className="row gap-8 mb-12">
      <div className="sk-input grow" style={{ maxWidth: 280 }}>🔍 buscar nos seus anúncios</div>
      <span className="sk-tag solid">todos · 24</span>
      <span className="sk-tag">ativos · 21</span>
      <span className="sk-tag">pausados · 3</span>
      <span className="sk-tag">vendidos</span>
      <span style={{ marginLeft: "auto" }} className="mono faint">▼ ordenar: mais recentes</span>
    </div>

    {/* Table */}
    <div className="sk-box" style={{ padding: 0 }}>
      <div className="row" style={{
        padding: "10px 14px",
        borderBottom: "1px dashed var(--ink-faint)",
        fontFamily: "var(--ui)", fontSize: 11, color: "var(--ink-dim)"
      }}>
        <div style={{ flex: 3 }}>ANÚNCIO</div>
        <div style={{ flex: 1 }}>PREÇO</div>
        <div style={{ flex: 1 }}>STATUS</div>
        <div style={{ flex: 1 }}>VENDAS</div>
        <div style={{ flex: 1 }}>VIEWS</div>
        <div style={{ width: 100 }}></div>
      </div>
      {[
        { t: "Conta Gold Valorant", p: "R$ 50", s: "ativo", c: "good", v: 12, vw: 340 },
        { t: "1000 likes BR Instagram", p: "R$ 50", s: "ativo", c: "good", v: 8, vw: 220 },
        { t: "Skin Knife CS2", p: "R$ 240", s: "ativo", c: "good", v: 3, vw: 180 },
        { t: "Gift Card R$ 100", p: "R$ 92", s: "pausado", c: "warn", v: 0, vw: 24 },
        { t: "Bot Discord moderador", p: "R$ 30", s: "rascunho", c: "faint", v: 0, vw: 0 }
      ].map((it, i) => (
        <div key={i} className="row" style={{
          padding: "10px 14px",
          borderBottom: i < 4 ? "1px dashed var(--ink-faint)" : "none",
          alignItems: "center", gap: 8
        }}>
          <div style={{ flex: 3, display: "flex", gap: 10, alignItems: "center" }}>
            <SkImg h={36} style={{ width: 50, flexShrink: 0 }} label="" />
            <span className="bold" style={{ fontSize: 13 }}>{it.t}</span>
          </div>
          <div style={{ flex: 1 }} className="good bold">{it.p}</div>
          <div style={{ flex: 1 }}>
            <span className={`sk-tag ${it.c === "good" ? "good" : it.c === "warn" ? "warn" : ""}`} style={{ fontSize: 10 }}>● {it.s}</span>
          </div>
          <div style={{ flex: 1 }} className="mono">{it.v}</div>
          <div style={{ flex: 1 }} className="mono faint">{it.vw}</div>
          <div style={{ width: 100, display: "flex", gap: 4 }}>
            <button className="sk-btn small ghost">edit</button>
            <span className="mono faint">⋯</span>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

// --- PAINEL VENDEDOR B — Kanban ---
const PainelVendedorB = () => (
  <Frame url="kkmarket.app/painel/anuncios" tall>
    <TopNav cart={0} />
    <div className="row between mb-16">
      <div className="h-title">gerenciar anúncios</div>
      <div className="row gap-8">
        <span className="mono faint">vista:</span>
        <span className="sk-tag">tabela</span>
        <span className="sk-tag solid">kanban</span>
        <button className="sk-btn primary small glow">+ criar</button>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {[
        { title: "rascunhos", count: 2, c: "var(--ink-faint)", items: ["Bot Discord", "Curso Roblox"] },
        { title: "ativos", count: 21, c: "var(--good)", items: ["Conta Gold Valorant", "1000 likes BR", "Skin Knife CS2", "Gift Card R$50"] },
        { title: "pausados", count: 3, c: "var(--warn)", items: ["Gift Card R$100", "Conta LoL"] },
        { title: "vendidos", count: 187, c: "var(--accent)", items: ["Skin AK-47", "Bot Instagram"] }
      ].map((col, i) => (
        <div key={col.title} className="col gap-8">
          <div className="row between" style={{ paddingBottom: 8, borderBottom: `2px solid ${col.c}` }}>
            <div className="row gap-6">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.c }}></span>
              <span className="bold upper" style={{ fontSize: 12 }}>{col.title}</span>
            </div>
            <span className="mono faint" style={{ fontSize: 11 }}>{col.count}</span>
          </div>

          {col.items.map((t, j) => (
            <div key={j} className="sk-box" style={{ padding: 10, cursor: "grab" }}>
              <SkImg h={56} label="" />
              <div className="bold mt-8" style={{ fontSize: 12 }}>{t}</div>
              <div className="row between mt-8">
                <span className="good bold" style={{ fontSize: 13 }}>R$ {[50, 240, 92, 30, 50][j % 5]}</span>
                <span className="mono faint" style={{ fontSize: 10 }}>{Math.floor(Math.random() * 200)} ↗</span>
              </div>
              {i === 1 && (
                <div className="row gap-4 mt-8">
                  <span className="sk-tag good lightning" style={{ fontSize: 9, padding: "1px 4px" }}>auto</span>
                  {j === 0 && <span className="sk-tag hot fire" style={{ fontSize: 9, padding: "1px 4px" }}>hot</span>}
                </div>
              )}
            </div>
          ))}

          {i < 2 && (
            <div className="sk-box dashed faint center" style={{ padding: 14, cursor: "pointer" }}>
              <span className="mono faint" style={{ fontSize: 12 }}>+ adicionar</span>
            </div>
          )}
        </div>
      ))}
    </div>

    <Callout style={{ marginTop: 16 }}>
      ↑ arrastar entre colunas → muda status (drag transition + status badge swap)
    </Callout>
  </Frame>
);

// --- PERFIL VENDEDOR A — Classic profile ---
const PerfilVendedorA = () => (
  <Frame url="kkmarket.app/@marcos" tall>
    <TopNav cart={1} compact />

    {/* Cover */}
    <div style={{ position: "relative", margin: "0 -18px 0", height: 140 }}>
      <SkImg h={140} label="cover" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }} />
      <div style={{
        position: "absolute", bottom: -28, left: 24, display: "flex", alignItems: "center", gap: 16
      }}>
        <SkAvatar initials="M" size="lg" online ring />
      </div>
    </div>

    <div style={{ marginTop: 36, padding: "0 6px" }}>
      <div className="row between mb-16" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span className="h-title">Marcos</span>
            <span className="rank-chip gold" style={{ fontSize: 10 }}>VIP</span>
            <span className="rank-chip diamond" style={{ fontSize: 10 }}>◆ DIAMANTE</span>
          </div>
          <div className="mono faint" style={{ fontSize: 12 }}>@marcos · membro desde 2023 · 🌎 SP, Brasil</div>
          <Bars widths={[70, 50]} gap={6} height={8} />
        </div>
        <div className="row gap-8">
          <button className="sk-btn ghost">♡ seguir</button>
          <button className="sk-btn primary glow">💬 conversar</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          ["⭐ 4.9", "8 reviews"],
          ["📦 842", "vendas"],
          ["⚡ 5min", "resposta"],
          ["✓ 99%", "concluídas"],
          ["🏆 Lv 24", "vendedor"]
        ].map(([v, l]) => (
          <div key={l} className="sk-box center" style={{ padding: 10 }}>
            <div className="bold" style={{ fontSize: 16 }}>{v}</div>
            <div className="mono faint" style={{ fontSize: 10 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="row gap-16 mb-16" style={{ borderBottom: "1px dashed var(--ink-faint)", paddingBottom: 6 }}>
        <span className="bold accent squiggle">anúncios · 24</span>
        <span className="mono faint">reviews · 23</span>
        <span className="mono faint">sobre</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <GameCard title="Conta Gold Valorant" price="R$ 50" badge="⚡ Auto" />
        <GameCard title="1000 likes BR" price="R$ 50" />
        <GameCard title="Skin Knife" price="R$ 240" rank="◆ RARO" />
        <GameCard title="Gift Card" price="R$ 92" badge="⚡ Auto" />
      </div>
    </div>
  </Frame>
);

// --- PERFIL VENDEDOR B — Gamer card style ---
const PerfilVendedorB = () => (
  <Frame url="kkmarket.app/@marcos" tall>
    <TopNav cart={1} compact />

    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
      {/* Gamer card */}
      <div className="sk-box accent" style={{
        padding: 18,
        background: "linear-gradient(160deg, rgba(167,139,250,0.1), rgba(34,211,238,0.04))",
        position: "sticky", top: 16, height: "fit-content"
      }}>
        <div className="row between mb-16">
          <span className="rank-chip diamond">◆ DIAMANTE</span>
          <span className="rank-chip gold">VIP</span>
        </div>
        <div className="center">
          <SkAvatar initials="M" size="lg" online ring />
          <div className="h-title mt-12" style={{ fontSize: 22 }}>Marcos</div>
          <div className="mono faint" style={{ fontSize: 11 }}>@marcos · top vendedor 2024</div>
        </div>

        <div className="row gap-12 mt-16" style={{ alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 11 }}>LV 24</span>
          <div className="xp-bar thick grow"><div className="fill" style={{ width: "78%" }}></div></div>
          <span className="mono accent" style={{ fontSize: 11 }}>78%</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            ["⭐", "4.9", "rating"],
            ["📦", "842", "vendas"],
            ["⚡", "5m", "resp."],
            ["✓", "99%", "ok"]
          ].map(([i, v, l]) => (
            <div key={l} className="sk-box dashed center" style={{ padding: 8 }}>
              <div style={{ fontSize: 18 }}>{i}</div>
              <div className="bold" style={{ fontSize: 14 }}>{v}</div>
              <div className="mono faint" style={{ fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="row gap-6 mt-16">
          <button className="sk-btn full small">♡ seguir</button>
          <button className="sk-btn primary full small glow">💬 chat</button>
        </div>

        <div className="mono faint mt-16" style={{ fontSize: 11 }}>BADGES · 18</div>
        <div className="row gap-6 mt-8" style={{ flexWrap: "wrap" }}>
          {["🏆","⚡","🔒","★","💰","🎯","🔥","◆","⭐"].map((b, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 6,
              border: "1.5px solid var(--ink-faint)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < 3 ? "rgba(167,139,250,0.1)" : "transparent",
              fontSize: 14
            }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="col gap-12">
        {/* Tabs */}
        <div className="row gap-12">
          <span className="sk-tag solid">anúncios · 24</span>
          <span className="sk-tag">reviews · 23</span>
          <span className="sk-tag">sobre</span>
        </div>

        {/* Featured anúncio */}
        <div className="sk-box accent" style={{ padding: 14 }}>
          <div className="row gap-12">
            <SkImg h={120} style={{ width: 180, flexShrink: 0 }} label="featured" />
            <div className="grow">
              <span className="sk-tag warn star" style={{ fontSize: 10 }}>destaque do vendedor</span>
              <div className="h-title mt-8" style={{ fontSize: 18 }}>Conta Gold Valorant</div>
              <div className="row gap-8 mt-8">
                <span className="good bold" style={{ fontSize: 22 }}>R$ 240</span>
                <span className="sk-tag hot fire">-25%</span>
              </div>
              <div className="row gap-6 mt-12">
                <button className="sk-btn primary small">comprar</button>
                <button className="sk-btn small">ver detalhes</button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <GameCard title="1000 likes BR" price="R$ 50" badge="⚡ Auto" />
          <GameCard title="Skin Knife" price="R$ 240" rank="◆ RARO" />
          <GameCard title="Gift Card" price="R$ 92" badge="⚡ Auto" />
        </div>

        {/* Reviews preview */}
        <div className="sk-box">
          <FrameHead title="o que dizem do Marcos" right={<span className="stars">★★★★★ 4.9</span>} />
          <div className="row gap-12">
            {[1,2,3].map(i => (
              <div key={i} className="sk-box dashed grow" style={{ padding: 10 }}>
                <div className="row gap-6 mb-8">
                  <SkAvatar initials={["L","J","B"][i-1]} size="sm" />
                  <span className="mono bold" style={{ fontSize: 11 }}>{["Lia","João","Beta"][i-1]}</span>
                  <span className="stars" style={{ fontSize: 10, marginLeft: "auto" }}>★★★★★</span>
                </div>
                <Bars widths={[100, 70]} height={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Frame>
);

Object.assign(window, {
  DashboardA, DashboardB, DetalheA, DetalheB,
  PainelVendedorA, PainelVendedorB, PerfilVendedorA, PerfilVendedorB
});

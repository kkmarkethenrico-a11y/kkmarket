// ============================================================
// Shop screens: Home, Detalhe, Carrinho, Checkout (2 variants each)
// ============================================================

// --- HOME A — Marketplace classic with hero + grid ---
const HomeA = () => (
  <Frame url="kkmarket.app" tall>
    <TopNav cart={2} />

    {/* Hero */}
    <div className="sk-box" style={{
      padding: 32, marginBottom: 20,
      background: "linear-gradient(135deg, rgba(167,139,250,0.06), transparent)",
      position: "relative"
    }}>
      <div className="rank-chip mb-8">O MARKETPLACE DE JOGOS DIGITAIS</div>
      <div className="h-title xl mb-8">comprar e <span className="accent squiggle">vender</span></div>
      <div className="muted" style={{ fontSize: 13, maxWidth: 360 }}>
        contas · jogos · gift cards · gold · itens digitais e mais
      </div>
      <div className="row gap-8 mt-16">
        <button className="sk-btn primary glow">COMO FUNCIONA?</button>
        <button className="sk-btn">explorar →</button>
      </div>
      <Callout style={{ position: "absolute", top: 20, right: 20 }}>
        ← contraste alto<br/>nas headings
      </Callout>
    </div>

    {/* Categorias */}
    <FrameHead title="categorias populares" right={<span className="mono accent">ver todas →</span>} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
      {["Jogos", "Redes Sociais", "Bots", "Scripts", "Gift Cards", "+ ver"].map((c, i) => (
        <div key={c} className="sk-box" style={{
          padding: 8,
          borderStyle: i === 5 ? "dashed" : "solid",
          borderColor: i === 5 ? "var(--ink-faint)" : "var(--ink-dim)"
        }}>
          <SkImg h={70} label="" />
          <div className="center mono mt-8" style={{ fontSize: 12 }}>{c}</div>
        </div>
      ))}
    </div>

    {/* Mais populares — sketchy cards */}
    <FrameHead
      title="mais populares"
      right={<div className="row gap-8"><span className="sk-tag">recentes</span><span className="sk-tag solid">populares</span><span className="sk-tag">mais barato</span></div>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <GameCard title="Conta Gold Valorant" price="R$ 50" badge="⚡ Auto" hover3d />
      <GameCard title="1000 likes BR" price="R$ 50" seller="Marcos" badge="⚡ Auto" />
      <GameCard title="Skin Knife CS2" price="R$ 240" seller="Lia" rank="◆ RARO" />
      <GameCard title="Gift Card R$100" price="R$ 92" seller="João" story />
    </div>

    <Callout style={{ marginTop: 16 }}>
      <Arrow d="M2,2 Q 18,18 32,8" w={40} h={24} /> cards tilt 3D + badge pulse
    </Callout>
  </Frame>
);

// --- HOME B — Social feed style ---
const HomeB = () => (
  <Frame url="kkmarket.app" tall>
    <TopNav cart={1} />

    {/* Stories row */}
    <div className="sk-box mb-16" style={{ padding: 12 }}>
      <div className="row gap-12" style={{ overflow: "hidden" }}>
        {["seu drop", "Marcos", "Lia", "João", "Beta", "Tier", "Skin", "+"].map((n, i) => (
          <div key={i} className="col gap-6" style={{ alignItems: "center" }}>
            <SkAvatar initials={n[0]} size="lg" ring={i < 5} online={i === 1} />
            <span className="mono" style={{ fontSize: 10 }}>{n}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Quests / missions HUD */}
    <div className="row gap-12 mb-16">
      <div className="sk-box accent grow" style={{ padding: 14 }}>
        <div className="row between">
          <span className="mono" style={{ fontSize: 11 }}>🎯 MISSÃO DIÁRIA</span>
          <span className="mono accent">+25 pts</span>
        </div>
        <div className="bold mt-8" style={{ fontSize: 14 }}>compre seu 1º item da semana</div>
        <div className="xp-bar mt-8"><div className="fill" style={{ width: "0%" }}></div></div>
      </div>
      <div className="sk-box grow" style={{ padding: 14 }}>
        <div className="row between">
          <span className="mono" style={{ fontSize: 11 }}>⚔ DESAFIO</span>
          <span className="mono warn">3/5</span>
        </div>
        <div className="bold mt-8" style={{ fontSize: 14 }}>3 vendas em 7 dias</div>
        <div className="xp-bar mt-8"><div className="fill" style={{ width: "60%", background: "var(--warn)" }}></div></div>
      </div>
      <div className="sk-box grow center" style={{ padding: 14, borderStyle: "dashed" }}>
        <div style={{ fontSize: 22 }}>🏆</div>
        <div className="mono mt-8" style={{ fontSize: 12 }}>ver ranking</div>
      </div>
    </div>

    {/* Feed */}
    <FrameHead title="feed" right={<span className="mono">para você ▾</span>} />
    <div className="col gap-12">
      <div className="sk-box" style={{ padding: 14 }}>
        <div className="row between mb-8">
          <div className="row gap-8">
            <SkAvatar initials="M" online />
            <div>
              <div className="bold" style={{ fontSize: 13 }}>Marcos · <span className="rank-chip gold" style={{ fontSize: 10, padding: "1px 6px" }}>VIP</span></div>
              <div className="mono faint" style={{ fontSize: 11 }}>postou um anúncio · 2min</div>
            </div>
          </div>
          <span className="mono faint">⋯</span>
        </div>
        <div className="row gap-12">
          <SkImg h={120} label="cover" style={{ width: 180, flexShrink: 0 }} />
          <div className="grow">
            <div className="bold mb-8" style={{ fontSize: 16 }}>Conta Gold Valorant — Imortal 2</div>
            <Bars widths={[90, 70]} />
            <div className="row gap-8 mt-12">
              <span className="good bold" style={{ fontSize: 20 }}>R$ 240</span>
              <span className="mono faint" style={{ textDecoration: "line-through" }}>R$ 320</span>
              <span className="sk-tag hot fire" style={{ marginLeft: "auto" }}>-25%</span>
            </div>
            <div className="row gap-6 mt-12">
              <button className="sk-btn primary small">comprar</button>
              <button className="sk-btn small">♡ salvar</button>
              <button className="sk-btn small ghost">▶ preview</button>
            </div>
          </div>
        </div>
        <div className="row gap-16 mt-12 mono faint" style={{ fontSize: 12, paddingTop: 10, borderTop: "1px dashed var(--ink-faint)" }}>
          <span>♡ 124</span><span>💬 18 comentários</span><span>↗ compartilhar</span>
        </div>
      </div>

      <div className="sk-box" style={{ padding: 14 }}>
        <div className="row between mb-8">
          <div className="row gap-8">
            <SkAvatar initials="L" />
            <div className="mono" style={{ fontSize: 12 }}>Lia · 3 anúncios novos</div>
          </div>
          <span className="sk-tag">seguindo</span>
        </div>
        <div className="row gap-8">
          <GameCard title="Skin AK" price="R$ 90" seller="Lia" badge="🔥 hot" />
          <GameCard title="Gold WoW" price="R$ 30" seller="Lia" />
          <GameCard title="Conta Fortnite" price="R$ 110" seller="Lia" rank="◆ RARO" />
        </div>
      </div>
    </div>
  </Frame>
);

// --- CARRINHO A — Full page with summary ---
const CarrinhoA = () => (
  <Frame url="kkmarket.app/carrinho" tall>
    <TopNav cart={3} />
    <div className="h-title lg mb-16">seu carrinho <span className="muted" style={{ fontSize: 18 }}>(3 itens)</span></div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      {/* Items */}
      <div className="col gap-12">
        {[
          { t: "Conta Gold Valorant", s: "Marcos", p: "50,00", auto: true },
          { t: "1000 likes BR Instagram", s: "Marcos", p: "50,00", auto: true },
          { t: "Skin Knife CS2", s: "Lia", p: "240,00", auto: false }
        ].map((it, i) => (
          <div key={i} className="sk-box row gap-12" style={{ padding: 14 }}>
            <SkImg h={80} style={{ width: 90, flexShrink: 0 }} label="" />
            <div className="grow">
              <div className="row between">
                <div className="bold">{it.t}</div>
                <span className="mono faint">✕</span>
              </div>
              <div className="row gap-6 mt-8">
                <SkAvatar initials={it.s[0]} size="sm" />
                <span className="mono" style={{ fontSize: 12 }}>{it.s}</span>
                {it.auto && <span className="sk-tag good lightning" style={{ fontSize: 10 }}>auto</span>}
              </div>
              <div className="row between mt-8">
                <div className="row gap-6">
                  <button className="sk-btn small ghost">−</button>
                  <span className="mono">1</span>
                  <button className="sk-btn small ghost">+</button>
                </div>
                <span className="good bold" style={{ fontSize: 18 }}>R$ {it.p}</span>
              </div>
            </div>
          </div>
        ))}
        <button className="sk-btn ghost full">+ continuar comprando</button>
      </div>

      {/* Summary */}
      <div className="col gap-12" style={{ position: "relative" }}>
        <div className="sk-box" style={{ padding: 16 }}>
          <div className="bold mb-12">resumo</div>
          <div className="row between mono mb-8"><span>subtotal</span><span>R$ 340,00</span></div>
          <div className="row between mono mb-8"><span>taxa</span><span>R$ 5,00</span></div>
          <div className="row between mono mb-8 good"><span>− pontos (50)</span><span>− R$ 5,00</span></div>
          <div style={{ borderTop: "1px dashed var(--ink-faint)", margin: "12px 0" }}></div>
          <div className="row between">
            <span className="bold">total</span>
            <span className="good bold" style={{ fontSize: 22 }}>R$ 340,00</span>
          </div>
          <div className="sk-input mt-12"><span>cupom</span><span style={{ marginLeft: "auto", color: "var(--accent)" }}>aplicar</span></div>
          <button className="sk-btn primary full glow mt-12" style={{ marginTop: 12 }}>finalizar →</button>
          <div className="mono mt-12 center" style={{ fontSize: 11 }}>🔒 compra protegida</div>
        </div>
        <div className="sk-box dashed" style={{ padding: 12 }}>
          <div className="mono" style={{ fontSize: 11 }}>🎁 +34 pts ao comprar</div>
          <div className="xp-bar mt-8"><div className="fill" style={{ width: "68%" }}></div></div>
          <div className="mono faint mt-8" style={{ fontSize: 11 }}>faltam 16 pts pro próximo nível</div>
        </div>
      </div>
    </div>
  </Frame>
);

// --- CARRINHO B — Slide-out drawer over Home ---
const CarrinhoB = () => (
  <Frame url="kkmarket.app" tall>
    <TopNav cart={3} />
    {/* Faded content behind */}
    <div style={{ opacity: 0.3, pointerEvents: "none" }}>
      <div className="sk-box mb-12" style={{ padding: 20 }}>
        <div className="h-title">marketplace</div>
        <Bars widths={[60, 40]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[1,2,3,4].map(i => <div key={i} className="sk-box" style={{ height: 140 }}></div>)}
      </div>
    </div>

    {/* Drawer */}
    <div style={{
      position: "absolute", top: 50, right: 0, bottom: 0,
      width: 340, background: "var(--paper-2)",
      borderLeft: "1.5px solid var(--ink-dim)",
      padding: 18,
      boxShadow: "-12px 0 24px rgba(0,0,0,0.4)",
      display: "flex", flexDirection: "column", gap: 12
    }}>
      <div className="row between">
        <div className="bold">🛒 carrinho · 3</div>
        <span className="mono faint">✕</span>
      </div>
      <div className="sk-box dashed" style={{ padding: 8 }}>
        <div className="mono" style={{ fontSize: 11 }}>🎉 +50 pts grátis se finalizar agora</div>
      </div>

      {["Conta Gold", "1000 likes", "Skin Knife"].map((t, i) => (
        <div key={i} className="row gap-8" style={{ paddingBottom: 10, borderBottom: "1px dashed var(--ink-faint)" }}>
          <SkImg h={48} style={{ width: 48, flexShrink: 0 }} label="" />
          <div className="grow">
            <div className="bold" style={{ fontSize: 13 }}>{t}</div>
            <div className="mono faint" style={{ fontSize: 11 }}>qty 1</div>
          </div>
          <div className="col gap-4" style={{ alignItems: "flex-end" }}>
            <span className="good bold">R$ 50</span>
            <span className="mono faint" style={{ fontSize: 10 }}>✕</span>
          </div>
        </div>
      ))}

      <div style={{ flex: 1 }}></div>
      <div className="row between mono">
        <span>subtotal</span>
        <span>R$ 340,00</span>
      </div>
      <div className="row between">
        <span className="bold">total</span>
        <span className="good bold" style={{ fontSize: 20 }}>R$ 340,00</span>
      </div>
      <button className="sk-btn primary full glow">finalizar →</button>
      <button className="sk-btn ghost full small">continuar comprando</button>
    </div>

    {/* Annotation about the add-to-cart animation */}
    <div className="fly-demo" style={{
      position: "absolute", top: 180, left: 40, right: 380,
      background: "rgba(13,13,18,0.9)"
    }}>
      <span className="mono" style={{ fontSize: 11 }}>card</span>
      <svg className="arc" viewBox="0 0 100 60" preserveAspectRatio="none">
        <path d="M 0 50 Q 50 -10 100 30" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
        <circle cx="50" cy="10" r="6" fill="var(--accent)"/>
      </svg>
      <span className="mono accent" style={{ fontSize: 11 }}>🛒 carrinho</span>
    </div>
    <Callout style={{ position: "absolute", top: 240, left: 40 }}>
      ↑ item "voa" pro carrinho ao clicar (arc tween + counter bump)
    </Callout>
  </Frame>
);

// --- CHECKOUT A — Horizontal stepper, 3 panels ---
const CheckoutA = () => (
  <Frame url="kkmarket.app/checkout" tall>
    <TopNav cart={3} compact />
    {/* Stepper */}
    <div className="row gap-12 mb-16" style={{ justifyContent: "center" }}>
      {["entrega", "pagamento", "confirmar"].map((s, i) => (
        <div key={s} className="row gap-8" style={{ alignItems: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: `1.5px solid ${i <= 1 ? "var(--accent)" : "var(--ink-faint)"}`,
            background: i === 1 ? "var(--accent)" : "transparent",
            color: i === 1 ? "#1a1126" : "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--ui)", fontSize: 12, fontWeight: 700
          }}>{i < 1 ? "✓" : i + 1}</div>
          <span className="mono" style={{ fontSize: 13, color: i <= 1 ? "var(--ink)" : "var(--ink-faint)" }}>{s}</span>
          {i < 2 && <span className="faint">───</span>}
        </div>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      <div className="col gap-12">
        <div className="sk-box">
          <div className="row between mb-12">
            <div className="bold">forma de pagamento</div>
            <span className="rank-chip" style={{ fontSize: 10 }}>🔒 SSL</span>
          </div>
          <div className="row gap-8 mb-12">
            {["💳 cartão", "PIX", "boleto", "🪙 créditos"].map((m, i) => (
              <div key={m} className={`sk-box ${i === 1 ? "accent" : "faint"} grow center`} style={{ padding: 12 }}>
                <div className="mono" style={{ fontSize: 12 }}>{m}</div>
              </div>
            ))}
          </div>
          <div className="sk-box dashed" style={{ padding: 16 }}>
            <div className="center">
              <div style={{ fontSize: 80, opacity: 0.4 }}>▦</div>
              <div className="mono mt-8" style={{ fontSize: 12 }}>QR PIX gerado</div>
              <div className="mono accent mt-8" style={{ fontSize: 11 }}>expira em 15:00</div>
              <button className="sk-btn small mt-12">copiar código</button>
            </div>
          </div>
        </div>

        <div className="sk-box">
          <div className="bold mb-8">entrega digital</div>
          <div className="mono" style={{ fontSize: 13 }}>itens entregues no e-mail e no painel:</div>
          <div className="sk-input mt-8">player@gamemarket.app</div>
        </div>
      </div>

      <div className="sk-box" style={{ padding: 16, height: "fit-content" }}>
        <div className="bold mb-12">resumo</div>
        {["Conta Gold · R$ 50", "1000 likes · R$ 50", "Skin Knife · R$ 240"].map((t, i) => (
          <div key={i} className="row between mono mb-8" style={{ fontSize: 12 }}>
            <span>{t.split(" · ")[0]}</span>
            <span>{t.split(" · ")[1]}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--ink-faint)", margin: "12px 0" }}></div>
        <div className="row between bold">
          <span>total</span><span className="good" style={{ fontSize: 20 }}>R$ 340</span>
        </div>
        <button className="sk-btn primary full glow mt-16">pagar com pix →</button>
        <div className="center mono faint mt-12" style={{ fontSize: 11 }}>ao confirmar, +34 pts</div>
      </div>
    </div>
  </Frame>
);

// --- CHECKOUT B — Single page accordion ---
const CheckoutB = () => (
  <Frame url="kkmarket.app/checkout" tall>
    <TopNav cart={3} compact />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
      <div className="col gap-12">
        <div className="h-title lg mb-8">finalizar pedido</div>

        {/* Accordion: collapsed */}
        <div className="sk-box">
          <div className="row between">
            <div className="row gap-8">
              <div className="rank-chip" style={{ fontSize: 10 }}>✓ 1</div>
              <div className="bold">entrega digital</div>
            </div>
            <span className="mono faint">player@gamemarket.app · editar</span>
          </div>
        </div>

        {/* Accordion: expanded */}
        <div className="sk-box accent">
          <div className="row between mb-12">
            <div className="row gap-8">
              <div className="rank-chip">2</div>
              <div className="bold">como você quer pagar?</div>
            </div>
            <span className="mono faint">−</span>
          </div>

          <div className="col gap-8">
            <div className="sk-box accent row between" style={{ padding: 14 }}>
              <div className="row gap-12">
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "1.5px solid var(--accent)",
                  background: "radial-gradient(var(--accent) 4px, transparent 5px)"
                }}></div>
                <div>
                  <div className="bold">PIX</div>
                  <div className="mono faint" style={{ fontSize: 11 }}>aprovação instantânea · +5% cashback</div>
                </div>
              </div>
              <span className="sk-tag good">+5% pts</span>
            </div>

            {[
              { t: "Cartão de crédito", sub: "até 12x s/ juros", tag: null },
              { t: "Boleto", sub: "compensação em 1-2 dias", tag: null },
              { t: "Saldo GameMarket", sub: "R$ 124,00 disponível", tag: "saldo" }
            ].map((opt, i) => (
              <div key={i} className="sk-box row between faint" style={{ padding: 14 }}>
                <div className="row gap-12">
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "1.5px solid var(--ink-faint)"
                  }}></div>
                  <div>
                    <div className="bold">{opt.t}</div>
                    <div className="mono faint" style={{ fontSize: 11 }}>{opt.sub}</div>
                  </div>
                </div>
                {opt.tag && <span className="sk-tag">{opt.tag}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Accordion: locked */}
        <div className="sk-box faint" style={{ opacity: 0.6 }}>
          <div className="row gap-8">
            <div className="rank-chip" style={{ fontSize: 10, borderColor: "var(--ink-faint)", color: "var(--ink-faint)", background: "transparent" }}>3</div>
            <div className="bold faint">confirmar pedido</div>
          </div>
        </div>
      </div>

      <div className="sk-box" style={{ padding: 16, height: "fit-content", position: "sticky", top: 16 }}>
        <div className="bold mb-12">pedido</div>
        <div className="col gap-8">
          {["Conta Gold", "1000 likes", "Skin Knife"].map((t, i) => (
            <div key={i} className="row gap-8" style={{ alignItems: "center" }}>
              <SkImg h={36} style={{ width: 36, flexShrink: 0 }} label="" />
              <span className="mono grow" style={{ fontSize: 12 }}>{t}</span>
              <span className="good bold" style={{ fontSize: 12 }}>R$ 50</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px dashed var(--ink-faint)", margin: "12px 0" }}></div>
        <div className="row between mono mb-8"><span>subtotal</span><span>R$ 340</span></div>
        <div className="row between mono good mb-8"><span>cashback PIX</span><span>− R$ 17</span></div>
        <div className="row between bold">
          <span>total</span><span className="good" style={{ fontSize: 20 }}>R$ 323</span>
        </div>
        <button className="sk-btn primary full glow mt-16">pagar →</button>
        <Callout style={{ marginTop: 8, justifyContent: "center" }}>
          ✓ confirmação dispara achievement toast
        </Callout>
      </div>
    </div>
  </Frame>
);

Object.assign(window, { HomeA, HomeB, CarrinhoA, CarrinhoB, CheckoutA, CheckoutB });

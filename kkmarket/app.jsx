// ============================================================
// Main app — orchestrates the scrollable wireframe page
// ============================================================

const SECTIONS = [
  { id: "login", num: "01", title: "login", note: "entrar — contraste forte nas headings, glow + floating labels", A: "LoginA", B: "LoginB", labels: ["Centered classic", "Split com painel de jogo"] },
  { id: "cadastro", num: "02", title: "cadastro", note: "criar conta — recompensa de boas-vindas (+50 pts) explícita", A: "CadastroA", B: "CadastroB", labels: ["Single form", "Multi-step com avatar setup"] },
  { id: "home", num: "03", title: "home logada", note: "landing pós-login — explora 2 paradigmas: marketplace vs feed social", A: "HomeA", B: "HomeB", labels: ["Marketplace grid", "Feed social + quests"] },
  { id: "detalhe", num: "04", title: "detalhe do anúncio", note: "página do produto — compra rápida vs imersão visual", A: "DetalheA", B: "DetalheB", labels: ["Image + buy panel", "Full-bleed hero + floating buy"] },
  { id: "carrinho", num: "05", title: "carrinho", note: "ambas mostram a animação 'voar pro carrinho'", A: "CarrinhoA", B: "CarrinhoB", labels: ["Página dedicada + resumo", "Drawer slide-out"] },
  { id: "checkout", num: "06", title: "checkout", note: "PIX como padrão (cashback +5%) — confirmação dispara achievement", A: "CheckoutA", B: "CheckoutB", labels: ["Stepper horizontal", "Accordion single-page"] },
  { id: "dashboard", num: "07", title: "dashboard cliente", note: "foco em pedidos, carteira, pontos, anúncios próprios, wishlist, reviews", A: "DashboardA", B: "DashboardB", labels: ["Sidebar clássica", "HUD gamer (player card + quests)"] },
  { id: "vendedor-painel", num: "08", title: "painel do vendedor", note: "gerenciar anúncios — tabela densa vs kanban drag-and-drop", A: "PainelVendedorA", B: "PainelVendedorB", labels: ["Tabela densa", "Kanban (status como colunas)"] },
  { id: "vendedor-perfil", num: "09", title: "perfil público do vendedor", note: "perfil que o comprador vê — clássico vs cartão de gamer", A: "PerfilVendedorA", B: "PerfilVendedorB", labels: ["Perfil com cover clássico", "Gamer card (RPG-style)"] }
];

const App = () => {
  // Tweaks
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks to CSS vars
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--accent-2", t.accent2);
    r.setProperty("--paper", t.paper);
    r.setProperty("--hand", `"${t.fontHand}", "Caveat", system-ui, sans-serif`);
    document.body.style.background = t.paper;
  }, [t.accent, t.accent2, t.paper, t.fontHand]);

  React.useEffect(() => {
    if (t.showAnnotations) document.body.classList.remove("hide-annotations");
    else document.body.classList.add("hide-annotations");
  }, [t.showAnnotations]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="mono" style={{ color: "var(--ink-dim)", marginBottom: 8 }}>WIREFRAMES · v1 · GameMarket / kkmarket</div>
          <h1>esboços de fluxo <span className="pencil">✎</span></h1>
          <div className="sub">
            9 telas × 2 variações cada. Dark + cores que respiram melhor, com vocabulário visual de game + rede social + marketplace.
            Estilo lo-fi de propósito — a ideia é destravar conversas sobre layout e UX antes do hi-fi.
          </div>
        </div>
        <div className="legend">
          <div className="swatch"><span className="dot" style={{ background: "var(--accent)" }}></span>destaque / CTA</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--good)" }}></span>preço / sucesso</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--warn)" }}></span>rank / aviso</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--hot)" }}></span>hot / promo</div>
        </div>
      </header>

      {/* TOC */}
      <nav className="toc">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`}>{s.num} · {s.title}</a>
        ))}
      </nav>

      {SECTIONS.map(s => {
        const VarA = window[s.A];
        const VarB = window[s.B];
        return (
          <section key={s.id} id={s.id} className="section" data-screen-label={`${s.num} ${s.title}`}>
            <div className="section-head">
              <div className="num">{s.num}</div>
              <div className="title">{s.title}</div>
              <div className="note">{s.note}</div>
            </div>
            <div className="variants">
              <div className="variant">
                <div className="variant-label">
                  <span className="num">A ·</span>
                  <span>{s.labels[0]}</span>
                </div>
                <VarA />
              </div>
              <div className="variant">
                <div className="variant-label">
                  <span className="num">B ·</span>
                  <span>{s.labels[1]}</span>
                  <span className="badge">explora</span>
                </div>
                <VarB />
              </div>
            </div>
          </section>
        );
      })}

      <footer style={{ marginTop: 80, paddingTop: 24, borderTop: "1.5px dashed var(--ink-faint)" }}>
        <div className="mono faint center" style={{ fontSize: 12 }}>
          ✎ wireframes — abra Tweaks no canto pra trocar cores e fontes.
          Quando bater a direção, levantamos pra hi-fi com a paleta + componentes reais.
        </div>
      </footer>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Cores" />
        <TweakColor
          label="destaque (CTA)"
          value={t.accent}
          onChange={v => setTweak("accent", v)}
          options={["#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#f472b6"]}
        />
        <TweakColor
          label="acento 2 (XP / grad)"
          value={t.accent2}
          onChange={v => setTweak("accent2", v)}
          options={["#22d3ee", "#a78bfa", "#34d399", "#fbbf24"]}
        />
        <TweakColor
          label="papel"
          value={t.paper}
          onChange={v => setTweak("paper", v)}
          options={["#0d0d12", "#0a0a0f", "#14141c", "#1a1224", "#0f1419"]}
        />
        <TweakSection label="Tipografia" />
        <TweakRadio
          label="caligrafia"
          value={t.fontHand}
          onChange={v => setTweak("fontHand", v)}
          options={["Kalam", "Caveat", "Patrick Hand"]}
        />
        <TweakSection label="Apresentação" />
        <TweakToggle
          label="anotações ✎"
          value={t.showAnnotations}
          onChange={v => setTweak("showAnnotations", v)}
        />
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

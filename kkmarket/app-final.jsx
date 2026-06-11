// ============================================================
// Final app — apenas variações B, em largura total
// ============================================================

const SECTIONS_B = [
  { id: "login", num: "01", title: "login", note: "split com painel 'arena' + 2FA + welcome bonus", comp: "LoginB" },
  { id: "cadastro", num: "02", title: "cadastro", note: "multi-step com avatar, jogo principal e intenção (comprar/vender)", comp: "CadastroB" },
  { id: "home", num: "03", title: "home logada", note: "feed social-style com stories, quests diárias e desafios", comp: "HomeB" },
  { id: "detalhe", num: "04", title: "detalhe do anúncio", note: "full-bleed hero + buy card flutuante com escassez", comp: "DetalheB" },
  { id: "carrinho", num: "05", title: "carrinho", note: "drawer slide-out com animação 'voar pro carrinho'", comp: "CarrinhoB" },
  { id: "checkout", num: "06", title: "checkout", note: "accordion single-page · PIX padrão com +5% cashback", comp: "CheckoutB" },
  { id: "dashboard", num: "07", title: "dashboard cliente", note: "HUD gamer — player card, XP, quests diárias, achievements", comp: "DashboardB" },
  { id: "vendedor-painel", num: "08", title: "painel do vendedor", note: "kanban drag-and-drop (status como colunas)", comp: "PainelVendedorB" },
  { id: "vendedor-perfil", num: "09", title: "perfil do vendedor", note: "cartão de gamer (RPG-style) com badges, XP e featured", comp: "PerfilVendedorB" }
];

const FinalApp = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

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
    <div className="page" style={{ maxWidth: 1100 }}>
      <header className="page-header">
        <div>
          <div className="mono" style={{ color: "var(--ink-dim)", marginBottom: 8 }}>
            WIREFRAMES · v2 · variação B selecionada · GameMarket
          </div>
          <h1>direção <span className="pencil">✓</span> escolhida</h1>
          <div className="sub">
            9 telas no fluxo final. Vibe HUD gamer + feed social + marketplace.
            Cores ajustadas pra contraste alto em dark mode. Próximo passo: hi-fi com componentes reais.
          </div>
        </div>
        <div className="legend">
          <div className="swatch"><span className="dot" style={{ background: "var(--accent)" }}></span>destaque / CTA</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--good)" }}></span>preço / sucesso</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--warn)" }}></span>rank / aviso</div>
          <div className="swatch"><span className="dot" style={{ background: "var(--hot)" }}></span>hot / promo</div>
        </div>
      </header>

      <nav className="toc">
        {SECTIONS_B.map(s => (
          <a key={s.id} href={`#${s.id}`}>{s.num} · {s.title}</a>
        ))}
      </nav>

      {SECTIONS_B.map(s => {
        const Comp = window[s.comp];
        return (
          <section key={s.id} id={s.id} className="section" data-screen-label={`${s.num} ${s.title}`}>
            <div className="section-head">
              <div className="num">{s.num}</div>
              <div className="title">{s.title}</div>
              <div className="note">{s.note}</div>
            </div>
            <Comp />
          </section>
        );
      })}

      <footer style={{ marginTop: 80, paddingTop: 24, borderTop: "1.5px dashed var(--ink-faint)" }}>
        <div className="mono faint center" style={{ fontSize: 12 }}>
          ✎ direção aprovada — pronto pra hi-fi.
          Os arquivos estão no zip: HTML + CSS + JSX modulares (React via Babel inline).
        </div>
      </footer>

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

ReactDOM.createRoot(document.getElementById("root")).render(<FinalApp />);

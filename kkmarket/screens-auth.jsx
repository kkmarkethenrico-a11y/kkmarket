// ============================================================
// Auth screens: Login + Cadastro (2 variations each)
// ============================================================

// --- LOGIN A — Classic centered card ---
const LoginA = () => (
  <Frame url="kkmarket.app/login" tall>
    <div style={{ maxWidth: 380, margin: "40px auto", position: "relative" }}>
      <div className="center mb-16">
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 12px",
          background: "var(--accent)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 28, color: "#1a1126"
        }}>▶</div>
        <div className="h-title" style={{ fontSize: 28 }}>bem-vindo de volta</div>
        <div className="muted" style={{ fontSize: 13 }}>entre pra continuar a missão</div>
      </div>
      <div className="col gap-16">
        <div className="sk-input-wrap">
          <span className="label">e-mail ou usuário</span>
          <div className="sk-input lg">player@gamemarket.app</div>
        </div>
        <div className="sk-input-wrap">
          <span className="label">senha</span>
          <div className="sk-input lg row between">
            <span>••••••••••</span>
            <span style={{ fontSize: 14 }}>👁</span>
          </div>
        </div>
        <div className="row between mono" style={{ fontSize: 12 }}>
          <span>☐ lembrar de mim</span>
          <span className="accent">esqueci a senha</span>
        </div>
        <button className="sk-btn primary full glow">entrar →</button>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="bar" style={{ flex: 1, height: 1 }}></div>
          <span className="mono" style={{ fontSize: 11 }}>ou</span>
          <div className="bar" style={{ flex: 1, height: 1 }}></div>
        </div>
        <div className="row gap-8">
          <button className="sk-btn full">⌘ Google</button>
          <button className="sk-btn full">🎮 Steam</button>
          <button className="sk-btn full">🎯 Discord</button>
        </div>
        <div className="center mono" style={{ fontSize: 12 }}>
          novo no GameMarket? <span className="accent squiggle">criar conta</span>
        </div>
      </div>

      <div className="note-arrow" style={{ top: 140, right: -120 }}>
        <Arrow d="M2,4 Q -10,20 -40,28" w={80} h={40} />
        <span>floating label aparece on focus</span>
      </div>
      <div className="note-arrow" style={{ bottom: 130, left: -130 }}>
        <span>botão pulsa (ripple)<br/>+ glow on hover</span>
        <Arrow d="M2,16 Q 30,10 56,20" w={60} h={30} />
      </div>
    </div>
  </Frame>
);

// --- LOGIN B — Split screen with gaming side ---
const LoginB = () => (
  <Frame url="kkmarket.app/login" tall>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: 480 }}>
      {/* Left: art panel */}
      <div className="sk-box" style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.04))",
        position: "relative", overflow: "hidden", padding: 24
      }}>
        <div className="rank-chip diamond mb-16">◆ ACCESS GRANTED</div>
        <div className="h-title xl" style={{ marginBottom: 12 }}>
          entre na <span className="accent squiggle">arena</span>
        </div>
        <div className="muted" style={{ fontSize: 14, marginBottom: 24, maxWidth: 220 }}>
          milhares de itens digitais, gold, contas e gift cards
        </div>
        <div className="sk-box dashed" style={{ padding: 12, marginTop: 32 }}>
          <div className="mono" style={{ fontSize: 11 }}>PRÓXIMA RECOMPENSA</div>
          <div className="row between mt-8">
            <span className="bold">Welcome Bonus</span>
            <span className="warn bold">+50 pts</span>
          </div>
          <div className="xp-bar mt-8"><div className="fill" style={{ width: "0%" }}></div></div>
        </div>
        <div style={{
          position: "absolute", bottom: -20, right: -20,
          fontSize: 120, opacity: 0.05
        }}>🎮</div>
      </div>

      {/* Right: form */}
      <div style={{ padding: "8px 16px" }}>
        <div className="row between mb-16">
          <div className="h-title">login</div>
          <span className="mono" style={{ fontSize: 12 }}>2 / 3 — sem conta? <span className="accent">criar</span></span>
        </div>
        <div className="col gap-12">
          <div className="sk-input lg">e-mail / usuário</div>
          <div className="sk-input lg row between">
            <span>senha</span><span>👁</span>
          </div>
          <button className="sk-btn primary full glow">entrar</button>
          <div className="center mono" style={{ fontSize: 11 }}>OU CONECTAR COM</div>
          <div className="row gap-6">
            <button className="sk-btn full small">Google</button>
            <button className="sk-btn full small">Steam</button>
            <button className="sk-btn full small">Discord</button>
          </div>
          <div className="sk-box dashed mt-12" style={{ padding: 10 }}>
            <div className="mono" style={{ fontSize: 11 }}>🔒 LOGIN 2FA</div>
            <div className="row gap-6 mt-8">
              {[..."- - -"].map((_, i) => (
                <div key={i} className="sk-input center" style={{ width: 36, padding: "10px 0" }}>•</div>
              ))}
            </div>
          </div>
          <span className="mono" style={{ fontSize: 11, textAlign: "center" }}>esqueci a senha</span>
        </div>
      </div>
    </div>
  </Frame>
);

// --- CADASTRO A — Single form ---
const CadastroA = () => (
  <Frame url="kkmarket.app/cadastro" tall>
    <div style={{ maxWidth: 460, margin: "16px auto" }}>
      <div className="center mb-16">
        <div className="h-title" style={{ fontSize: 28 }}>criar conta</div>
        <div className="muted" style={{ fontSize: 13 }}>leva menos de 1 minuto. ganhe 50 pts ao confirmar.</div>
      </div>
      <div className="col gap-12">
        <div className="row gap-8">
          <div className="sk-input lg grow">nome completo</div>
          <div className="sk-input lg grow">usuário público</div>
        </div>
        <div className="sk-input lg">e-mail</div>
        <div className="row gap-8">
          <div className="sk-input lg grow">senha</div>
          <div className="sk-input lg grow">confirmar senha</div>
        </div>
        <div className="sk-box dashed">
          <div className="mono" style={{ fontSize: 11 }}>FORÇA DA SENHA</div>
          <div className="xp-bar mt-8"><div className="fill" style={{ width: "62%", background: "var(--warn)" }}></div></div>
          <div className="row gap-12 mt-8 mono" style={{ fontSize: 11 }}>
            <span className="good">✓ 8+ chars</span>
            <span className="good">✓ número</span>
            <span className="muted">○ símbolo</span>
          </div>
        </div>
        <div className="row gap-8">
          <div className="sk-input grow">CPF</div>
          <div className="sk-input" style={{ width: 120 }}>data nasc.</div>
        </div>
        <div className="mono" style={{ fontSize: 12 }}>☐ aceito termos · ☐ quero receber novidades</div>
        <button className="sk-btn primary full glow">criar minha conta →</button>
        <div className="center mono" style={{ fontSize: 12 }}>
          já tem conta? <span className="accent">entrar</span>
        </div>
      </div>
    </div>
  </Frame>
);

// --- CADASTRO B — Multi-step with progress ---
const CadastroB = () => (
  <Frame url="kkmarket.app/cadastro" tall>
    {/* Stepper */}
    <div className="row gap-8 mb-16" style={{ justifyContent: "center" }}>
      {["conta", "perfil", "preferências", "confirmar"].map((s, i) => (
        <div key={s} className="row gap-6" style={{ alignItems: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: `1.5px solid ${i <= 1 ? "var(--accent)" : "var(--ink-faint)"}`,
            background: i === 1 ? "var(--accent)" : "transparent",
            color: i === 1 ? "#1a1126" : i === 0 ? "var(--accent)" : "var(--ink-faint)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--ui)"
          }}>{i < 1 ? "✓" : i + 1}</div>
          <span className="mono" style={{
            fontSize: 12,
            color: i <= 1 ? "var(--ink)" : "var(--ink-faint)"
          }}>{s}</span>
          {i < 3 && <span className="faint">─</span>}
        </div>
      ))}
    </div>

    <div style={{ maxWidth: 480, margin: "8px auto" }}>
      <div className="rank-chip mb-12" style={{ display: "inline-flex" }}>STEP 2 · PERFIL</div>
      <div className="h-title lg mb-8">monte seu <span className="accent squiggle">avatar</span></div>
      <div className="muted mb-16" style={{ fontSize: 13 }}>esse é como outros gamers vão te ver</div>

      <div className="row gap-16 mb-16">
        <div className="col gap-8" style={{ alignItems: "center" }}>
          <SkAvatar initials="?" size="lg" ring />
          <span className="mono accent" style={{ fontSize: 11 }}>+ enviar foto</span>
        </div>
        <div className="col gap-8 grow">
          <div className="sk-input">@ username</div>
          <div className="sk-input">bio curta (opcional)</div>
        </div>
      </div>

      <div className="mono mb-8" style={{ fontSize: 12 }}>ESCOLHA SEU MAIN</div>
      <div className="row gap-8 mb-16" style={{ flexWrap: "wrap" }}>
        {["Valorant", "LoL", "CS2", "Fortnite", "Minecraft", "Outros"].map((g, i) => (
          <span key={g} className={i === 1 ? "sk-tag solid" : "sk-tag"}>{g}</span>
        ))}
      </div>

      <div className="mono mb-8" style={{ fontSize: 12 }}>EU QUERO PRINCIPALMENTE</div>
      <div className="row gap-8 mb-16">
        <div className="sk-box accent grow center" style={{ padding: 18 }}>
          <div style={{ fontSize: 24 }}>🛍</div>
          <div className="bold mt-8" style={{ fontSize: 13 }}>comprar</div>
        </div>
        <div className="sk-box faint grow center" style={{ padding: 18 }}>
          <div style={{ fontSize: 24 }}>💰</div>
          <div className="bold mt-8" style={{ fontSize: 13 }}>vender</div>
        </div>
        <div className="sk-box faint grow center" style={{ padding: 18 }}>
          <div style={{ fontSize: 24 }}>⚡</div>
          <div className="bold mt-8" style={{ fontSize: 13 }}>os dois</div>
        </div>
      </div>

      <div className="row between">
        <button className="sk-btn ghost">← voltar</button>
        <button className="sk-btn primary glow">continuar →</button>
      </div>
    </div>
  </Frame>
);

Object.assign(window, { LoginA, LoginB, CadastroA, CadastroB });

# GameMarket — Wireframes

Wireframes lo-fi para o redesenho do **GameMarket / kkmarket** (Next.js + Nest.js + Supabase).
Estilo: dark, gamer/HUD + social + marketplace, com cores ajustadas para alto contraste.

## Arquivos

- **`Wireframes - Variação B.html`** — direção aprovada (9 telas, largura total)
- **`Wireframes.html`** — comparativo original (9 telas × 2 variações lado a lado)
- `styles.css` — tokens e primitivas sketchy
- `sketch.jsx` — átomos reutilizáveis (Frame, TopNav, GameCard, SkAvatar, etc.)
- `screens-auth.jsx` — Login + Cadastro
- `screens-shop.jsx` — Home, Detalhe, Carrinho, Checkout
- `screens-user.jsx` — Dashboard, Painel/Perfil do vendedor
- `app-final.jsx` / `app.jsx` — orquestradores
- `tweaks-panel.jsx` — painel de tweaks (cor / fonte / anotações)

## Como rodar

Abra o `.html` direto no navegador. React + Babel são carregados via CDN; nenhum build necessário.

## Telas (variação B)

| #  | Tela                         | Direção                                                     |
|----|------------------------------|-------------------------------------------------------------|
| 01 | Login                        | Split com painel "arena" + 2FA + welcome bonus              |
| 02 | Cadastro                     | Multi-step com avatar, jogo principal, intenção             |
| 03 | Home logada                  | Feed social com stories + quests diárias + desafios         |
| 04 | Detalhe do anúncio           | Full-bleed hero com card de compra flutuante                |
| 05 | Carrinho                     | Drawer slide-out com animação "voar pro carrinho"           |
| 06 | Checkout                     | Accordion single-page · PIX padrão com cashback +5%         |
| 07 | Dashboard cliente            | HUD gamer (player card, XP, quests, achievements)           |
| 08 | Painel do vendedor           | Kanban drag-and-drop (status como colunas)                  |
| 09 | Perfil público do vendedor   | Cartão de gamer RPG-style com badges e XP                   |

## Tokens de cor (alta legibilidade em dark)

```
--paper:    #0d0d12   (fundo)
--ink:      #e8e6e3   (texto principal — quase branco)
--ink-dim:  #8b8a86   (texto secundário)
--accent:   #a78bfa   (CTA / destaque — roxo claro)
--accent-2: #22d3ee   (XP bar / gradients)
--good:     #34d399   (preço / sucesso)
--warn:     #fbbf24   (rank ouro / aviso)
--hot:      #fb7185   (promo / urgência)
```

## Próximos passos sugeridos

1. Validar paleta + tokens em hi-fi (componentes reais Next.js)
2. Definir animações: ripple, glow, fly-to-cart (arc tween), achievement toast
3. Mapear o que vai no Nest (backend) vs Supabase (auth, RLS, realtime)
4. Implementar HUD de gamificação (XP, quests, achievements) como sistema separado

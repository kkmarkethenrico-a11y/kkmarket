-- ═══════════════════════════════════════════════════════════
-- Seed Inicial de Categorias
-- Define as categorias principais do marketplace e suas
-- respectivas subcategorias.
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  var_jogos_id UUID := gen_random_uuid();
  var_redes_sociais_id UUID := gen_random_uuid();
  var_bots_id UUID := gen_random_uuid();
  var_scripts_id UUID := gen_random_uuid();
  var_outros_id UUID := gen_random_uuid();
BEGIN

  -- 1. Criação das Categorias Raiz
  INSERT INTO public.categories (id, name, slug, sort_order, is_featured, parent_id) 
  VALUES
    (var_jogos_id, 'Jogos', 'jogos', 1, true, null),
    (var_redes_sociais_id, 'Redes Sociais', 'redes-sociais', 2, false, null),
    (var_bots_id, 'Bots', 'bots', 3, false, null),
    (var_scripts_id, 'Scripts', 'scripts', 4, false, null),
    (var_outros_id, 'Outros Digitais', 'outros-digitais', 5, false, null);

  -- 2. Criação das Subcategorias de Jogos (50 itens com regras específicas)
  INSERT INTO public.categories (parent_id, name, slug, balance_release_days, show_in_menu)
  VALUES
    (var_jogos_id, 'Free Fire', 'free-fire', 4, true),
    (var_jogos_id, 'Valorant', 'valorant', 4, true),
    (var_jogos_id, 'Roblox', 'roblox', 4, true),
    (var_jogos_id, 'League of Legends', 'league-of-legends', 4, true),
    (var_jogos_id, 'Tibia', 'tibia', 4, true),
    (var_jogos_id, 'Fortnite', 'fortnite', 4, true),
    (var_jogos_id, 'PUBG', 'pubg', 4, true),
    (var_jogos_id, 'CS2', 'cs2', 4, true),
    (var_jogos_id, 'Minecraft', 'minecraft', 4, true),
    (var_jogos_id, 'GTA V', 'gta-v', 4, true),
    (var_jogos_id, 'Brawl Stars', 'brawl-stars', 4, true),
    (var_jogos_id, 'Clash of Clans', 'clash-of-clans', 4, true),
    (var_jogos_id, 'Clash Royale', 'clash-royale', 4, true),
    (var_jogos_id, 'Mobile Legends', 'mobile-legends', 4, true),
    (var_jogos_id, 'Honor of Kings', 'honor-of-kings', 4, true),
    (var_jogos_id, 'Genshin Impact', 'genshin-impact', 4, true),
    (var_jogos_id, 'Honkai: Star Rail', 'honkai-star-rail', 4, true),
    (var_jogos_id, 'Ragnarok Online', 'ragnarok-online', 4, true),
    (var_jogos_id, 'MU Online', 'mu-online', 4, true),
    (var_jogos_id, 'Lineage II', 'lineage-ii', 4, true),
    (var_jogos_id, 'DOTA 2', 'dota-2', 4, true),
    (var_jogos_id, 'Overwatch 2', 'overwatch-2', 4, true),
    (var_jogos_id, 'Call of Duty', 'call-of-duty', 4, true),
    (var_jogos_id, 'Rainbow Six Siege', 'rainbow-six-siege', 4, true),
    (var_jogos_id, 'Lost Ark', 'lost-ark', 4, true),
    (var_jogos_id, 'Path of Exile 2', 'path-of-exile-2', 4, true),
    (var_jogos_id, 'Diablo IV', 'diablo-iv', 4, true),
    (var_jogos_id, 'World of Warcraft', 'world-of-warcraft', 4, true),
    (var_jogos_id, 'Albion Online', 'albion-online', 4, true),
    (var_jogos_id, 'Rust', 'rust', 4, true),
    (var_jogos_id, 'Dead by Daylight', 'dead-by-daylight', 4, true),
    (var_jogos_id, 'Apex Legends', 'apex-legends', 4, true),
    (var_jogos_id, 'Rocket League', 'rocket-league', 4, true),
    (var_jogos_id, 'FIFA', 'fifa', 4, true),
    (var_jogos_id, 'Dragon Ball Legends', 'dragon-ball-legends', 4, true),
    (var_jogos_id, 'Naruto Online', 'naruto-online', 4, true),
    (var_jogos_id, 'One Piece Bounty Rush', 'one-piece-bounty-rush', 4, true),
    (var_jogos_id, 'Seven Deadly Sins', 'seven-deadly-sins', 4, true),
    (var_jogos_id, 'Pokemon GO', 'pokemon-go', 4, true),
    (var_jogos_id, 'Pokémon TCG Pocket', 'pokemon-tcg-pocket', 4, true),
    (var_jogos_id, 'Black Desert', 'black-desert', 4, true),
    (var_jogos_id, 'Night Crows', 'night-crows', 4, true),
    (var_jogos_id, 'Throne and Liberty', 'throne-and-liberty', 4, true),
    (var_jogos_id, 'Zenless Zone Zero', 'zenless-zone-zero', 4, true),
    (var_jogos_id, 'Wuthering Waves', 'wuthering-waves', 4, true),
    (var_jogos_id, 'Marvel Rivals', 'marvel-rivals', 4, true),
    (var_jogos_id, 'Stumble Guys', 'stumble-guys', 4, true),
    (var_jogos_id, 'Subway Surfers', 'subway-surfers', 4, true),
    (var_jogos_id, 'IMVU', 'imvu', 4, true),
    (var_jogos_id, 'Habbo Hotel', 'habbo-hotel', 4, true);

  -- 3. Criação das Subcategorias de Redes Sociais
  INSERT INTO public.categories (parent_id, name, slug)
  VALUES
    (var_redes_sociais_id, 'Instagram', 'instagram'),
    (var_redes_sociais_id, 'TikTok', 'tiktok'),
    (var_redes_sociais_id, 'YouTube', 'youtube'),
    (var_redes_sociais_id, 'Twitter/X', 'twitter-x'),
    (var_redes_sociais_id, 'Spotify', 'spotify'),
    (var_redes_sociais_id, 'Facebook', 'facebook'),
    (var_redes_sociais_id, 'Twitch', 'twitch'),
    (var_redes_sociais_id, 'LinkedIn', 'linkedin');

  -- 4. Criação das Subcategorias de Bots
  INSERT INTO public.categories (parent_id, name, slug)
  VALUES
    (var_bots_id, 'Bots para Discord', 'bots-para-discord'),
    (var_bots_id, 'Bots para Telegram', 'bots-para-telegram'),
    (var_bots_id, 'Bots para Instagram', 'bots-para-instagram'),
    (var_bots_id, 'Bots para WhatsApp', 'bots-para-whatsapp'),
    (var_bots_id, 'Bots para Twitch', 'bots-para-twitch');

  -- 5. Criação das Subcategorias de Scripts
  INSERT INTO public.categories (parent_id, name, slug)
  VALUES
    (var_scripts_id, 'Scripts para Jogos', 'scripts-para-jogos'),
    (var_scripts_id, 'Scripts de Automação Web', 'scripts-de-automacao-web'),
    (var_scripts_id, 'Macros', 'macros'),
    (var_scripts_id, 'Extensões de Navegador', 'extensoes-de-navegador');

  -- 6. Criação das Subcategorias de Outros Digitais
  INSERT INTO public.categories (parent_id, name, slug)
  VALUES
    (var_outros_id, 'Gift Cards', 'gift-cards'),
    (var_outros_id, 'Assinaturas Streaming', 'assinaturas-streaming'),
    (var_outros_id, 'Cursos e Treinamentos', 'cursos-e-treinamentos'),
    (var_outros_id, 'Softwares e Licenças', 'softwares-e-licencas'),
    (var_outros_id, 'Créditos de IA', 'creditos-de-ia');

END $$;
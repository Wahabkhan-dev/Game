import Phaser from 'phaser';

export function generateAssets(scene) {
  const g = scene.make.graphics({ add: false });

  // ══════════════════════════════════════════════════════════════════════════
  // ENVIRONMENT  (sky / mountains replaced by real jungle photo)
  // ══════════════════════════════════════════════════════════════════════════

  // GROUND TILE
  if (!scene.textures.exists('ground')) {
    g.clear();
    g.fillStyle(0x2e1a08, 1); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3e2810, 1); g.fillRect(0, 6, 32, 26);
    g.fillStyle(0x1e5c18, 1); g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x289020, 1); g.fillRect(0, 0, 32, 5);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x38a828, 0.9); g.fillRect(i * 4, 0, 2, 3 + (i & 1));
      g.fillStyle(0x50c038, 0.5); g.fillRect(i * 4 + 1, 0, 1, 2);
    }
    g.fillStyle(0x180e04, 0.25);
    g.fillCircle(8, 18, 2); g.fillCircle(22, 24, 2); g.fillCircle(15, 28, 1.5);
    g.generateTexture('ground', 32, 32);
  }

  // PLATFORM
  if (!scene.textures.exists('platform')) {
    g.clear();
    g.fillStyle(0x4a2c12, 1); g.fillRect(0, 0, 80, 20);
    g.fillStyle(0x381e0a, 0.6); g.fillRect(0, 0, 80, 5);
    g.fillStyle(0x5a3a1a, 0.35);
    for (let i = 0; i < 8; i++) g.fillRect(i * 10 + 2, 0, 1, 20);
    g.fillStyle(0x1e5a14, 1); g.fillRect(0, 0, 80, 7);
    g.fillStyle(0x28901c, 0.8); g.fillRect(0, 0, 80, 4);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x38a828, 0.7); g.fillRect(i * 13 + 2, 0, 4, 3);
    }
    g.lineStyle(1, 0x180e04, 0.5); g.strokeRect(0, 0, 80, 20);
    g.generateTexture('platform', 80, 20);
  }

  // ROCK
  if (!scene.textures.exists('rock')) {
    g.clear();
    g.fillStyle(0x585048, 1); g.fillEllipse(22, 20, 44, 36);
    g.fillStyle(0x3a3028, 0.55); g.fillEllipse(28, 26, 26, 20);
    g.fillStyle(0x888070, 0.65); g.fillEllipse(14, 12, 18, 12);
    g.fillStyle(0xa89888, 0.35); g.fillEllipse(12, 10, 10, 7);
    g.fillStyle(0x387020, 0.45); g.fillEllipse(8, 7, 12, 6);
    g.generateTexture('rock', 44, 36);
  }

  // TREE
  g.clear();
  g.fillStyle(0x3a2010, 1); g.fillRect(20, 56, 12, 74);
  g.fillStyle(0x4a2e18, 0.55); g.fillRect(22, 56, 5, 74);
  g.fillStyle(0x281408, 0.6);
  g.fillTriangle(20, 130, 10, 130, 22, 102);
  g.fillTriangle(32, 130, 42, 130, 30, 102);
  g.fillStyle(0x1a4a14, 0.9); g.fillEllipse(26, 66, 52, 36);
  g.fillStyle(0x1e5818, 0.85); g.fillEllipse(26, 50, 46, 32);
  g.fillStyle(0x246020, 0.8);  g.fillEllipse(26, 37, 40, 28);
  g.fillStyle(0x2c6e26, 0.75); g.fillEllipse(26, 25, 32, 24);
  g.fillStyle(0x347a2c, 0.7);  g.fillEllipse(26, 14, 24, 20);
  g.fillStyle(0x58b040, 0.22); g.fillEllipse(17, 30, 16, 10);
  g.fillStyle(0x68c048, 0.18); g.fillEllipse(32, 20, 12, 8);
  g.generateTexture('tree', 52, 130);

  // LOG
  if (!scene.textures.exists('log')) {
    g.clear();
    g.fillStyle(0x6a3e20, 1); g.fillRect(0, 0, 90, 22);
    g.fillStyle(0x4a2a10, 1); g.fillRect(0, 0, 90, 4); g.fillRect(0, 18, 90, 4);
    g.lineStyle(1, 0x3a1a08, 0.3);
    for (let i = 0; i < 9; i++) g.lineBetween(i * 10, 0, i * 10, 22);
    g.fillStyle(0x9a6a3a, 0.2); g.fillEllipse(8, 11, 14, 18);
    g.fillStyle(0x28601a, 0.45); g.fillRect(0, 0, 90, 4);
    g.generateTexture('log', 90, 22);
  }

  // (mountains removed — real jungle photo used instead)

  // FOG
  g.clear();
  for (let i = 0; i < 8; i++) {
    g.fillStyle(0xc0d0b8, 0.025 + i * 0.008);
    g.fillEllipse(80 + i * 90, 40, 220, 75);
  }
  g.generateTexture('fog', 800, 80);

  // FALLEN TREE
  if (!scene.textures.exists('fallen_tree')) {
    g.clear();
    g.fillStyle(0x5a3818, 1); g.fillRect(0, 8, 120, 18);
    g.fillStyle(0x3e2410, 1); g.fillRect(0, 8, 120, 5); g.fillRect(0, 22, 120, 4);
    g.fillStyle(0x4a2e14, 0.5);
    g.fillRect(22, 0, 5, 12); g.fillRect(52, 0, 5, 14); g.fillRect(82, 0, 5, 10);
    g.fillStyle(0x28601a, 0.4); g.fillRect(0, 8, 120, 3);
    g.generateTexture('fallen_tree', 120, 26);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHADOW — real images loaded in BootScene preload; skip procedural fallback
  // ══════════════════════════════════════════════════════════════════════════

  if (!scene.textures.exists('shadow_idle')) {
  function drawShadow(g, legPhase) {
    // legPhase: 0=idle, 1=run-a, 2=run-b, 3=jump

    // --- colour constants ---
    const DARK   = 0x180c04;   // very dark body
    const BODY   = 0x2a1808;   // main fur
    const SADDLE = 0x0e0803;   // black saddle on back
    const TAN    = 0xb87830;   // amber tan
    const LTTAN  = 0xd09848;   // lighter tan
    const CREAM  = 0xe8b870;   // cream belly
    const EYE    = 0x7a3200;   // eye
    const NOSE   = 0x060200;   // nose
    const WHITE  = 0xfaf0e0;   // eye shine

    // ── TAIL (left end, sweeping up) ──────────────────────────────────────
    g.fillStyle(BODY, 1);
    g.fillEllipse(11, 32, 20, 9);
    g.fillEllipse(7,  25, 15, 8);
    g.fillEllipse(5,  19, 12, 7);
    g.fillStyle(DARK, 0.5);
    g.fillEllipse(9,  28, 10, 5);
    g.fillStyle(0x4a2e18, 0.35);
    g.fillEllipse(6, 22, 7, 5);

    // ── BODY ──────────────────────────────────────────────────────────────
    g.fillStyle(BODY, 1);
    g.fillEllipse(48, 46, 62, 30);

    // ── SADDLE (dark patch on back) ───────────────────────────────────────
    g.fillStyle(SADDLE, 1);
    g.fillEllipse(44, 34, 58, 18);
    g.fillStyle(DARK, 0.6);
    g.fillEllipse(42, 31, 50, 12);

    // ── CHEST + BELLY tan ─────────────────────────────────────────────────
    g.fillStyle(TAN, 0.85);
    g.fillEllipse(68, 51, 24, 16);
    g.fillStyle(LTTAN, 0.65);
    g.fillEllipse(56, 55, 22, 10);
    g.fillStyle(CREAM, 0.45);
    g.fillEllipse(52, 57, 14, 7);

    // ── NECK ──────────────────────────────────────────────────────────────
    g.fillStyle(BODY, 1);
    g.fillEllipse(70, 32, 20, 24);
    g.fillStyle(SADDLE, 0.6);
    g.fillEllipse(68, 27, 16, 10);

    // ── HEAD ──────────────────────────────────────────────────────────────
    // skull
    g.fillStyle(BODY, 1);
    g.fillCircle(76, 22, 14);
    // face tan (cheeks + forehead panel)
    g.fillStyle(TAN, 0.8);
    g.fillEllipse(82, 24, 18, 14);
    // lighter face center
    g.fillStyle(LTTAN, 0.55);
    g.fillEllipse(82, 25, 11, 9);

    // ── EARS ──────────────────────────────────────────────────────────────
    // back ear
    g.fillStyle(DARK, 1);
    g.fillTriangle(67, 8, 64, 20, 74, 20);
    // back ear inner
    g.fillStyle(0x3a1808, 0.5);
    g.fillTriangle(67, 11, 66, 19, 72, 19);
    // front ear
    g.fillStyle(BODY, 1);
    g.fillTriangle(77, 6, 73, 20, 84, 20);
    // front ear inner (tan)
    g.fillStyle(TAN, 0.4);
    g.fillTriangle(77, 10, 75, 19, 82, 19);

    // ── MUZZLE (elongated snout pointing right) ───────────────────────────
    g.fillStyle(BODY, 1);
    g.fillEllipse(88, 26, 18, 11);
    // tan muzzle
    g.fillStyle(TAN, 0.75);
    g.fillEllipse(87, 27, 14, 9);
    // muzzle crease
    g.fillStyle(DARK, 0.4);
    g.fillRect(82, 28, 12, 2);
    // lip line
    g.fillStyle(DARK, 0.5);
    g.fillRect(85, 30, 7, 1.5);

    // ── NOSE ──────────────────────────────────────────────────────────────
    g.fillStyle(NOSE, 1);
    g.fillEllipse(94, 23, 7, 5);
    g.fillStyle(0x3a1010, 0.3); // highlight
    g.fillEllipse(92, 22, 3, 2);

    // ── EYE ───────────────────────────────────────────────────────────────
    g.fillStyle(EYE, 1);  g.fillCircle(75, 19, 4);
    g.fillStyle(DARK, 1); g.fillCircle(75, 19, 3);
    g.fillStyle(WHITE, 0.9); g.fillCircle(76, 18, 1.3);
    // GSD tan eyebrow dot
    g.fillStyle(LTTAN, 0.8); g.fillCircle(75, 14, 2.2);

    // ── LEGS ──────────────────────────────────────────────────────────────
    const legW = 9, legH = 24;

    if (legPhase === 0) {
      // idle – all legs straight
      g.fillStyle(BODY, 1);
      g.fillRect(20, 52, legW, legH);  g.fillRect(33, 52, legW - 1, legH - 3);
      g.fillRect(55, 54, legW, legH - 2); g.fillRect(67, 54, legW - 1, legH - 4);
      g.fillStyle(TAN, 0.85);
      g.fillRect(21, 62, 7, 14);  g.fillRect(34, 62, 6, 11);
      g.fillRect(56, 64, 7, 12);  g.fillRect(68, 64, 6, 10);

    } else if (legPhase === 1) {
      // run A – front legs forward, back legs back
      g.fillStyle(BODY, 1);
      g.fillRect(14, 50, legW, legH);  g.fillRect(26, 53, legW - 1, legH - 4);
      g.fillRect(60, 50, legW, legH);  g.fillRect(72, 53, legW - 1, legH - 4);
      g.fillStyle(TAN, 0.85);
      g.fillRect(15, 60, 7, 14);  g.fillRect(27, 62, 6, 11);
      g.fillRect(61, 60, 7, 14);  g.fillRect(73, 62, 6, 10);

    } else if (legPhase === 2) {
      // run B – front legs back, back legs forward (opposite)
      g.fillStyle(BODY, 1);
      g.fillRect(25, 50, legW, legH);  g.fillRect(37, 53, legW - 1, legH - 4);
      g.fillRect(48, 50, legW, legH);  g.fillRect(60, 53, legW - 1, legH - 4);
      g.fillStyle(TAN, 0.85);
      g.fillRect(26, 60, 7, 14);  g.fillRect(38, 62, 6, 11);
      g.fillRect(49, 60, 7, 14);  g.fillRect(61, 62, 6, 10);

    } else {
      // jump – legs tucked/splayed
      g.fillStyle(BODY, 1);
      g.fillRect(16, 55, legW, 18);  g.fillRect(28, 58, legW - 1, 14);
      g.fillRect(58, 55, legW, 18);  g.fillRect(70, 58, legW - 1, 14);
      g.fillStyle(TAN, 0.85);
      g.fillRect(17, 63, 7, 10);  g.fillRect(29, 65, 6, 7);
      g.fillRect(59, 63, 7, 10);  g.fillRect(71, 65, 6, 7);
    }

    // ── PAWS ──────────────────────────────────────────────────────────────
    g.fillStyle(DARK, 1);
    if (legPhase === 1) {
      g.fillEllipse(18,  74, 14, 5); g.fillEllipse(30,  72, 12, 5);
      g.fillEllipse(64,  74, 14, 5); g.fillEllipse(76,  72, 12, 5);
    } else if (legPhase === 2) {
      g.fillEllipse(29,  74, 14, 5); g.fillEllipse(41,  72, 12, 5);
      g.fillEllipse(52,  74, 14, 5); g.fillEllipse(64,  72, 12, 5);
    } else if (legPhase === 3) {
      g.fillEllipse(20,  73, 13, 5); g.fillEllipse(32,  71, 11, 5);
      g.fillEllipse(62,  73, 13, 5); g.fillEllipse(74,  71, 11, 5);
    } else {
      g.fillEllipse(24,  76, 14, 5); g.fillEllipse(37,  74, 12, 5);
      g.fillEllipse(59,  76, 14, 5); g.fillEllipse(71,  74, 12, 5);
    }
  }

  g.clear(); drawShadow(g, 0); g.generateTexture('shadow_idle', 96, 78);
  g.clear(); drawShadow(g, 1); g.generateTexture('shadow_run1',  96, 78);
  g.clear(); drawShadow(g, 2); g.generateTexture('shadow_run2',  96, 78);
  g.clear(); drawShadow(g, 3); g.generateTexture('shadow_jump',  96, 78);
  } // end: !shadow_idle check

  // ══════════════════════════════════════════════════════════════════════════
  // GEMMA — real images loaded in BootScene; procedural fallback only
  // ══════════════════════════════════════════════════════════════════════════
  if (!scene.textures.exists('gemma_idle')) {
  g.clear();
  {
    const GBODY  = 0x9a6020;
    const GFUR   = 0xc07e30;
    const GGOLD  = 0xe0a040;
    const GCREAM = 0xf4cc80;
    const GEYE   = 0x200c00;
    const GNOSE  = 0x100400;
    const GCOL   = 0xcc1828;   // collar red
    const GTAG   = 0xf0c020;   // tag gold

    // fluffy body
    g.fillStyle(GFUR, 1);  g.fillEllipse(34, 42, 52, 32);
    g.fillStyle(GGOLD, 0.7); g.fillEllipse(30, 38, 40, 20); // top golden
    g.fillStyle(GCREAM, 0.5); g.fillEllipse(32, 48, 34, 14); // belly cream

    // tail (right side, fluffy)
    g.fillStyle(GFUR, 1);
    g.fillEllipse(60, 30, 18, 10);
    g.fillEllipse(64, 24, 14, 9);
    g.fillStyle(GGOLD, 0.5); g.fillEllipse(61, 26, 10, 7);

    // neck
    g.fillStyle(GFUR, 1); g.fillEllipse(20, 30, 18, 22);

    // head
    g.fillStyle(GFUR, 1); g.fillCircle(14, 20, 14);
    g.fillStyle(GGOLD, 0.65); g.fillEllipse(11, 21, 18, 14);
    g.fillStyle(GCREAM, 0.45); g.fillEllipse(10, 23, 12, 9);

    // floppy ears
    g.fillStyle(GBODY, 1);
    g.fillEllipse(20, 13, 12, 20);  // right ear (flops down)
    g.fillEllipse(7,  14, 11, 18);  // left ear
    g.fillStyle(0x6a3810, 0.4);
    g.fillEllipse(20, 14, 8, 15);
    g.fillEllipse(7,  15, 7, 13);

    // muzzle (pointing left)
    g.fillStyle(GFUR, 1);   g.fillEllipse(4, 24, 16, 11);
    g.fillStyle(GGOLD, 0.7); g.fillEllipse(5, 25, 12, 9);
    g.fillStyle(GCREAM, 0.5); g.fillEllipse(6, 26, 8, 7);

    // nose
    g.fillStyle(GNOSE, 1); g.fillEllipse(1, 22, 6, 5);
    g.fillStyle(0x3a1010, 0.3); g.fillEllipse(0.5, 21, 2.5, 2);

    // eye
    g.fillStyle(GEYE, 1);  g.fillCircle(13, 18, 4);
    g.fillStyle(0x060200, 1); g.fillCircle(13, 18, 3);
    g.fillStyle(0xfaf0e0, 0.9); g.fillCircle(14, 17, 1.3);

    // collar
    g.fillStyle(GCOL, 1); g.fillRect(10, 30, 20, 5);
    g.fillStyle(GTAG, 1); g.fillCircle(20, 35, 3.5);

    // legs
    g.fillStyle(GFUR, 1);
    g.fillRect(14, 52, 8, 20); g.fillRect(25, 52, 7, 18);
    g.fillRect(42, 52, 8, 20); g.fillRect(53, 52, 7, 18);
    g.fillStyle(GGOLD, 0.7);
    g.fillRect(15, 60, 6, 12); g.fillRect(26, 60, 5, 10);
    g.fillRect(43, 60, 6, 12); g.fillRect(54, 60, 5, 10);

    // paws
    g.fillStyle(GBODY, 0.9);
    g.fillEllipse(18, 72, 12, 5); g.fillEllipse(29, 70, 11, 5);
    g.fillEllipse(46, 72, 12, 5); g.fillEllipse(57, 70, 11, 5);
  }
  g.generateTexture('gemma_idle',  72, 74);
  g.generateTexture('gemma_happy', 72, 74); // same procedural fallback for both
  } // end: !gemma_idle check

  // ══════════════════════════════════════════════════════════════════════════
  // SNAKE (side view, S-curve body)
  // Canvas: 100 × 34
  // ══════════════════════════════════════════════════════════════════════════
  g.clear();
  {
    // body segments (wave shape)
    const segs = [
      {x:10,y:20,rx:18,ry:11}, {x:26,y:14,rx:18,ry:11},
      {x:42,y:20,rx:18,ry:11}, {x:58,y:14,rx:18,ry:11},
      {x:74,y:19,rx:16,ry:10},
    ];
    // shadow under body
    segs.forEach(s => {
      g.fillStyle(0x0a1a04, 0.35); g.fillEllipse(s.x+2, s.y+3, s.rx*2, s.ry*2);
    });
    // dark green base
    segs.forEach(s => {
      g.fillStyle(0x1e4a0c, 1); g.fillEllipse(s.x, s.y, s.rx*2, s.ry*2);
    });
    // stripe pattern
    segs.forEach((s, i) => {
      g.fillStyle(0x143806, 0.6);
      g.fillEllipse(s.x, s.y - 2, s.rx * 1.6, s.ry);
    });
    // belly (lighter)
    segs.forEach(s => {
      g.fillStyle(0x3a7a1a, 0.55);
      g.fillEllipse(s.x, s.y + 2, s.rx * 1.4, s.ry * 0.7);
    });
    // scales hint
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0x0e2e04, 0.4);
      g.fillEllipse(8 + i * 16, 17, 12, 6);
    }

    // HEAD (right side)
    g.fillStyle(0x183a0a, 1); g.fillEllipse(90, 17, 26, 18);
    g.fillStyle(0x204e10, 0.8); g.fillEllipse(88, 15, 20, 12);
    // eye
    g.fillStyle(0xf0e800, 1); g.fillCircle(85, 13, 4);
    g.fillStyle(0x100800, 1); g.fillEllipse(85, 13, 3, 5); // slit pupil
    g.fillStyle(0xffffff, 0.7); g.fillCircle(86, 12, 1.2);
    // nostril
    g.fillStyle(0x0a1804, 0.8); g.fillCircle(97, 15, 2);
    // tongue
    g.fillStyle(0xcc1020, 1);
    g.fillRect(99, 17, 10, 2);
    g.fillRect(107, 14, 3, 2); g.fillRect(107, 19, 3, 2);
  }
  g.generateTexture('snake', 110, 34);

  // ══════════════════════════════════════════════════════════════════════════
  // COLLECTIBLES & INTERACTABLES
  // ══════════════════════════════════════════════════════════════════════════

  // BERRY
  g.clear();
  g.fillStyle(0x7a0820, 1); g.fillCircle(10, 12, 9);
  g.fillStyle(0xaa1834, 1); g.fillCircle(10, 11, 8);
  g.fillStyle(0xcc3050, 0.55); g.fillCircle(8, 9, 4.5);
  g.fillStyle(0xee6080, 0.25); g.fillCircle(7, 8, 2.5);
  g.fillStyle(0x1c5010, 1); g.fillRect(9, 3, 2, 6);
  g.fillStyle(0x287020, 1); g.fillEllipse(13, 5, 9, 6);
  g.generateTexture('berry', 22, 22);

  // MEAT / BEEF (juicy steak with a bone end) — for the meat-collecting round
  g.clear();
  g.fillStyle(0x000000, 0.16); g.fillEllipse(19, 24, 32, 6);              // ground shadow
  g.fillStyle(0xd85a40, 1);    g.fillEllipse(17, 14, 32, 20);             // meat body
  g.fillStyle(0xb84732, 1);    g.fillEllipse(17, 17, 29, 13);             // lower shade
  g.lineStyle(2, 0x8a3324, 1);  g.strokeEllipse(17, 14, 32, 20);          // outline
  g.fillStyle(0xf2e6d2, 1);    g.fillCircle(31, 9, 5); g.fillCircle(31, 17, 5);  // bone end
  g.lineStyle(1.5, 0xd8c4a8, 1); g.strokeCircle(31, 9, 5); g.strokeCircle(31, 17, 5);
  g.fillStyle(0xffb0a0, 0.7);  g.fillEllipse(12, 10, 11, 5);              // sheen
  g.generateTexture('meat', 42, 28);

  // HEART
  g.clear();
  g.fillStyle(0xcc0822, 1);
  g.fillCircle(8, 8, 7); g.fillCircle(18, 8, 7);
  g.fillTriangle(1, 12, 13, 27, 25, 12);
  g.fillStyle(0xee3050, 0.55);
  g.fillCircle(6, 6, 4); g.fillCircle(16, 6, 3);
  g.fillStyle(0xff8898, 0.28); g.fillCircle(5, 5, 2);
  g.generateTexture('heart', 26, 28);

  // KEY
  g.clear();
  g.fillStyle(0xd8aa18, 1); g.fillCircle(9, 9, 9);
  g.fillStyle(0xf0cc30, 0.65); g.fillCircle(7, 7, 5.5);
  g.fillStyle(0xd8aa18, 1); g.fillRect(16, 8, 17, 4);
  g.fillStyle(0xd8aa18, 1); g.fillRect(27, 12, 4, 6); g.fillRect(31, 12, 4, 5);
  g.fillStyle(0x180c00, 1); g.fillCircle(9, 9, 4);
  g.generateTexture('key', 36, 20);

  // OIL BARREL (road obstacle)
  if (!scene.textures.exists('barrel')) {
    g.clear();
    g.fillStyle(0x3a2808, 1); g.fillRect(2, 8, 28, 26);
    g.fillStyle(0x4e3410, 1); g.fillEllipse(16, 8, 32, 12);
    g.fillStyle(0x2a1c04, 1); g.fillEllipse(16, 34, 32, 12);
    g.fillStyle(0x888888, 1); g.fillRect(0, 16, 32, 3); g.fillRect(0, 24, 32, 3);
    g.fillStyle(0x6a4820, 0.5); g.fillRect(5, 10, 5, 20);
    g.generateTexture('barrel', 32, 40);
  }

  // ROAD BARRIER — orange/white construction A-frame (road obstacle)
  if (!scene.textures.exists('road_barrier')) {
    g.clear();
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 4, 58, 22, 3);
    g.fillStyle(0xff6600, 1);
    g.fillRoundedRect(0, 4, 58, 8, 3);
    g.fillRoundedRect(0, 18, 58, 8, 3);
    g.lineStyle(1.5, 0x333333, 0.7); g.strokeRoundedRect(0, 4, 58, 22, 3);
    g.fillStyle(0x555555, 1);
    g.fillTriangle(6, 26, 0, 40, 12, 40);
    g.fillTriangle(52, 26, 46, 40, 58, 40);
    g.generateTexture('road_barrier', 58, 40);
  }

  // TRAFFIC CONE
  if (!scene.textures.exists('cone')) {
    g.clear();
    g.fillStyle(0xff6200, 1); g.fillTriangle(12, 0, 0, 30, 24, 30);
    g.fillStyle(0xffffff, 0.9); g.fillRect(3, 17, 18, 4); g.fillRect(5, 10, 14, 3);
    g.fillStyle(0xcc4400, 0.35); g.fillTriangle(12, 3, 6, 17, 18, 17);
    g.fillStyle(0x777777, 1); g.fillRect(0, 30, 24, 5);
    g.generateTexture('cone', 24, 35);
  }

  // SPIKE
  if (!scene.textures.exists('spike')) {
    g.clear();
    g.fillStyle(0x999999, 1);
    for (let i = 0; i < 4; i++) g.fillTriangle(i * 14, 28, i * 14 + 7, 0, i * 14 + 14, 28);
    g.fillStyle(0xcccccc, 0.55);
    for (let i = 0; i < 4; i++) g.fillTriangle(i * 14 + 2, 26, i * 14 + 7, 4, i * 14 + 9, 14);
    g.generateTexture('spike', 56, 28);
  }

  // CAGE
  g.clear();
  g.fillStyle(0x504028, 0.35); g.fillRect(2, 4, 62, 58);
  g.fillStyle(0x7a6038, 1);
  g.fillRect(2, 4, 62, 4); g.fillRect(2, 58, 62, 4);
  g.fillRect(2, 4, 4, 58); g.fillRect(60, 4, 4, 58);
  for (let i = 0; i <= 5; i++) {
    g.fillStyle(0x9a7848, 1); g.fillRect(10 + i * 10, 4, 3, 58);
    g.fillStyle(0xc0a868, 0.35); g.fillRect(10 + i * 10, 4, 1, 58);
  }
  g.fillStyle(0x8a6838, 0.75);
  g.fillRect(2, 22, 62, 3); g.fillRect(2, 40, 62, 3);
  g.lineStyle(2, 0xeecc30, 0.9); g.strokeRect(22, 14, 22, 44);
  g.fillStyle(0xeecc30, 1); g.fillRoundedRect(29, 38, 8, 10, 2);
  g.lineStyle(2.5, 0xeecc30, 1); g.strokeCircle(33, 36, 6);
  g.generateTexture('cage', 66, 64);

  // SWITCH OFF
  g.clear();
  g.fillStyle(0x3a2818, 1); g.fillRoundedRect(0, 0, 26, 36, 4);
  g.fillStyle(0xeecc30, 1); g.fillRoundedRect(9, 8, 8, 18, 3);
  g.fillStyle(0x22bb22, 1); g.fillCircle(13, 10, 5);
  g.fillStyle(0x44dd44, 0.55); g.fillCircle(12, 9, 2.5);
  g.generateTexture('switch_off', 26, 36);

  // SWITCH ON
  g.clear();
  g.fillStyle(0x3a2818, 1); g.fillRoundedRect(0, 0, 26, 36, 4);
  g.fillStyle(0xeecc30, 1); g.fillRoundedRect(9, 12, 8, 18, 3);
  g.fillStyle(0xdd2000, 1); g.fillCircle(13, 28, 5);
  g.fillStyle(0xff5530, 0.55); g.fillCircle(12, 27, 2.5);
  g.generateTexture('switch_on', 26, 36);

  // PARTICLES
  g.clear();
  g.fillStyle(0x287018, 1); g.fillEllipse(6, 9, 10, 16);
  g.fillStyle(0x389020, 0.65); g.fillEllipse(5, 8, 6, 12);
  g.generateTexture('leaf', 12, 18);

  g.clear();
  g.fillStyle(0xc0a068, 0.7); g.fillCircle(5, 5, 5);
  g.fillStyle(0xdcbc88, 0.38); g.fillCircle(4, 4, 3);
  g.generateTexture('dust', 10, 10);

  g.clear();
  g.fillStyle(0x80b8d8, 0.5); g.fillRect(0, 0, 2, 10);
  g.fillStyle(0xa8d0f0, 0.28); g.fillRect(0, 0, 1, 10);
  g.generateTexture('raindrop', 2, 10);

  g.clear();
  g.fillStyle(0xf8f060, 1);
  g.fillRect(4, 0, 2, 10); g.fillRect(0, 4, 10, 2);
  g.fillStyle(0xffffff, 0.65);
  g.fillRect(4, 2, 2, 6); g.fillRect(2, 4, 6, 2);
  g.generateTexture('sparkle', 10, 10);

  // UI
  g.clear();
  g.fillStyle(0x180e06, 0.92); g.fillRoundedRect(0, 0, 400, 120, 14);
  g.lineStyle(2, 0xf0b830, 0.7); g.strokeRoundedRect(1, 1, 398, 118, 14);
  g.generateTexture('dialog_bg', 400, 120);

  g.clear();
  g.fillStyle(0x6a2e0a, 1); g.fillRoundedRect(0, 0, 190, 52, 12);
  g.fillStyle(0x8a3e14, 0.75); g.fillRoundedRect(3, 3, 184, 22, 8);
  g.lineStyle(2, 0xf0b830, 0.85); g.strokeRoundedRect(1, 1, 188, 50, 12);
  g.generateTexture('button_bg', 190, 52);

  g.destroy();
}

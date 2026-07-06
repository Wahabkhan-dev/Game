import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// L1_HudTheme — UI ASSET LOADER for the Level 1 premium fantasy HUD.
//
// Generates every HUD texture procedurally (dark-walnut wood, gold metallic
// frames, leaf ornaments, gold icons, glossy heart) so the HUD needs no external
// PNGs and renders entirely inside Phaser/WebGL. Also exposes reusable helpers:
//   • makePanel()  — a scalable nine-slice wood panel (graphics fallback)
//   • makeButton() — a circular wood button image
//
// Used ONLY by Level 1 (Header / Footer / HUD Manager). Nothing here touches any
// other level. Guarded by the sentinel 'l1hud_ready' so it builds once.
// ════════════════════════════════════════════════════════════════════════════

export const THEME = {
  WALNUT:   0x2e1c0e,
  WALNUT_D: 0x140c04,
  WALNUT_L: 0x4a3018,
  GOLD:     0xd4a83a,
  GOLD_HI:  0xffe8a0,
  GOLD_DK:  0x8a6018,
  LEAF:     0x6f8a2e,
  LEAF_HI:  0xa8c85a,
  goldTxt:  '#ffe08a',
  goldDim:  '#e8c877',
  darkTxt:  '#2a1a06',
  greenHP:  0x44cc44,
  // nine-slice corner inset used by makePanel()
  SLICE:    28,
};

export function generateHudTextures(scene) {
  if (scene.textures.exists('l1hud_ready')) return;
  const g = scene.make.graphics({ add: false });
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); g.clear(); };
  const T = THEME;

  // ── Wood panel (nine-slice source, 128×128, 28px gold frame) ────────────────
  const woodPanel = () => {
    const S = 128, R = 20;
    // body
    g.fillStyle(T.WALNUT, 1); g.fillRoundedRect(0, 0, S, S, R);
    // top inner highlight (soft light from above)
    g.fillStyle(T.WALNUT_L, 0.5); g.fillRoundedRect(6, 6, S - 12, 46, 14);
    // bottom shadow
    g.fillStyle(T.WALNUT_D, 0.5); g.fillRoundedRect(6, S - 44, S - 12, 38, 14);
    // wood grain
    g.lineStyle(1, T.WALNUT_D, 0.35);
    for (let y = 22; y < S - 16; y += 12) g.lineBetween(14, y, S - 14, y + 2);
    g.lineStyle(1, T.WALNUT_L, 0.18);
    for (let y = 28; y < S - 16; y += 12) g.lineBetween(16, y, S - 16, y + 1);
    // gold frame — outer → mid → inner highlight
    g.lineStyle(5, T.GOLD_DK, 1); g.strokeRoundedRect(3, 3, S - 6, S - 6, R - 2);
    g.lineStyle(2.5, T.GOLD, 1);  g.strokeRoundedRect(3, 3, S - 6, S - 6, R - 2);
    g.lineStyle(1, T.GOLD_HI, 0.85); g.strokeRoundedRect(6, 6, S - 12, S - 12, R - 5);
    // inner shadow line
    g.lineStyle(2, T.WALNUT_D, 0.5); g.strokeRoundedRect(10, 10, S - 20, S - 20, R - 8);
  };
  woodPanel(); gen('l1hud_panel', 128, 128);

  // ── Circular wood button (88×88) ────────────────────────────────────────────
  {
    const c = 44;
    g.fillStyle(T.WALNUT_D, 1); g.fillCircle(c, c, 42);
    g.fillStyle(T.WALNUT, 1);   g.fillCircle(c, c, 38);
    g.fillStyle(T.WALNUT_L, 0.55); g.fillEllipse(c, c - 12, 56, 28);   // top sheen
    g.fillStyle(T.WALNUT_D, 0.4);  g.fillEllipse(c, c + 16, 52, 22);   // bottom shade
    g.lineStyle(4, T.GOLD_DK, 1); g.strokeCircle(c, c, 40);
    g.lineStyle(2, T.GOLD, 1);    g.strokeCircle(c, c, 40);
    g.lineStyle(0.9, T.GOLD_HI, 0.8); g.strokeCircle(c, c, 36.8);
    g.lineStyle(1.5, T.WALNUT_D, 0.5); g.strokeCircle(c, c, 33.5);
  }
  gen('l1hud_btn', 88, 88);

  // ── Leaf ornament sprig (48×34) — gold-green leaves on a golden stem ─────────
  {
    g.lineStyle(3, T.GOLD_DK, 1); g.beginPath(); g.moveTo(4, 28); g.lineTo(44, 8); g.strokePath();
    g.lineStyle(1.5, T.GOLD_HI, 0.8); g.beginPath(); g.moveTo(4, 27); g.lineTo(44, 7); g.strokePath();
    const leaf = (x, y, rot, s) => {
      const ang = rot;
      const lx = Math.cos(ang), ly = Math.sin(ang);
      const px = -ly, py = lx;
      const pts = [
        { x: x, y: y },
        { x: x + lx * 12 * s + px * 6 * s, y: y + ly * 12 * s + py * 6 * s },
        { x: x + lx * 22 * s, y: y + ly * 22 * s },
        { x: x + lx * 12 * s - px * 6 * s, y: y + ly * 12 * s - py * 6 * s },
      ];
      g.fillStyle(T.LEAF, 1); g.fillPoints(pts, true);
      g.fillStyle(T.LEAF_HI, 0.6); g.fillPoints(pts.slice(0, 3), true);
      g.lineStyle(1, T.GOLD_DK, 0.9); g.strokePoints(pts, true);
    };
    leaf(16, 22, -0.5, 1); leaf(26, 16, -0.9, 0.9); leaf(20, 24, -0.1, 0.8);
    g.fillStyle(T.GOLD, 1); g.fillCircle(44, 8, 3);
  }
  gen('l1hud_leaf', 48, 34);

  // ── Gold icon helper ────────────────────────────────────────────────────────
  const goldIcon = (draw, k, w = 40, h = 40) => {
    draw();
    gen(k, w, h);
  };

  // menu (three gold bars)
  goldIcon(() => {
    for (let i = 0; i < 3; i++) {
      g.fillStyle(T.GOLD_DK, 1); g.fillRoundedRect(8, 10 + i * 9 + 1, 24, 5, 2);
      g.fillStyle(T.GOLD, 1);    g.fillRoundedRect(8, 10 + i * 9, 24, 5, 2);
      g.fillStyle(T.GOLD_HI, 0.7); g.fillRoundedRect(9, 10 + i * 9, 12, 2, 1);
    }
  }, 'l1hud_ic_menu');

  // prev (◀) and next (▶) chevrons
  goldIcon(() => {
    g.fillStyle(T.GOLD_DK, 1); g.fillTriangle(27, 8, 27, 32, 11, 20);
    g.fillStyle(T.GOLD, 1);    g.fillTriangle(26, 10, 26, 30, 13, 20);
    g.fillStyle(T.GOLD_HI, 0.7); g.fillTriangle(24, 13, 24, 20, 17, 20);
  }, 'l1hud_ic_prev');
  goldIcon(() => {
    g.fillStyle(T.GOLD_DK, 1); g.fillTriangle(13, 8, 13, 32, 29, 20);
    g.fillStyle(T.GOLD, 1);    g.fillTriangle(14, 10, 14, 30, 27, 20);
    g.fillStyle(T.GOLD_HI, 0.7); g.fillTriangle(16, 13, 16, 20, 23, 20);
  }, 'l1hud_ic_next');

  // dog (bark)
  goldIcon(() => {
    const G = T.GOLD, D = T.GOLD_DK, HI = T.GOLD_HI;
    g.fillStyle(G, 1);
    g.fillEllipse(22, 24, 26, 14);                 // body
    g.fillCircle(9, 20, 7);                          // head
    g.fillTriangle(4, 12, 10, 12, 5, 20);           // ear
    g.fillRect(14, 28, 3, 8); g.fillRect(20, 28, 3, 8); g.fillRect(28, 28, 3, 8); // legs
    g.fillTriangle(34, 20, 36, 12, 30, 18);         // tail
    g.fillStyle(D, 1); g.fillCircle(6, 19, 1.4);    // nose
    g.fillStyle(HI, 0.7); g.fillEllipse(20, 20, 14, 5);
  }, 'l1hud_ic_dog', 44, 40);

  // jump (up arrow)
  goldIcon(() => {
    g.fillStyle(T.GOLD_DK, 1); g.fillTriangle(20, 5, 7, 22, 33, 22);
    g.fillStyle(T.GOLD, 1);    g.fillTriangle(20, 7, 9, 21, 31, 21);
    g.fillStyle(T.GOLD, 1);    g.fillRect(16, 21, 8, 12);
    g.fillStyle(T.GOLD_HI, 0.7); g.fillRect(17, 9, 3, 20);
    // motion arc under
    g.lineStyle(2, T.GOLD, 0.6); g.beginPath(); g.arc(20, 34, 10, 0.15 * Math.PI, 0.85 * Math.PI, false); g.strokePath();
  }, 'l1hud_ic_jump');

  // attack (sword)
  goldIcon(() => {
    g.fillStyle(T.GOLD_HI, 1); g.fillTriangle(24, 6, 30, 12, 12, 30);  // blade
    g.fillStyle(T.GOLD, 1);    g.fillTriangle(24, 8, 28, 12, 13, 27);
    g.fillStyle(T.GOLD_DK, 1); g.fillRect(8, 26, 12, 4);               // guard
    g.fillStyle(T.WALNUT_L, 1); g.fillRect(6, 28, 8, 4);               // hilt
    g.fillStyle(T.GOLD, 1); g.fillCircle(6, 30, 2.5);                  // pommel
  }, 'l1hud_ic_attack');

  // gold star
  goldIcon(() => {
    const cx = 18, cy = 18, R = 15, r = 6.5, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); }
    g.fillStyle(T.GOLD_DK, 1); g.fillPoints(pts.map(p => ({ x: p.x, y: p.y + 1 })), true);
    g.fillStyle(T.GOLD, 1); g.fillPoints(pts, true);
    g.lineStyle(1.5, T.GOLD_HI, 0.9); g.strokePoints(pts, true);
    g.fillStyle(T.GOLD_HI, 0.6); g.fillCircle(14, 13, 3.5);
  }, 'l1hud_star', 36, 36);

  // glossy heart (36×36)
  {
    g.fillStyle(0x7a1020, 1); g.fillCircle(12, 14, 9); g.fillCircle(24, 14, 9); g.fillTriangle(3, 17, 33, 17, 18, 34);
    g.fillStyle(0xe23a4e, 1); g.fillCircle(12, 13, 8); g.fillCircle(24, 13, 8); g.fillTriangle(4, 16, 32, 16, 18, 32);
    g.fillStyle(0xff6a80, 0.9); g.fillEllipse(11, 10, 7, 5);   // gloss
    g.fillStyle(0xffffff, 0.7); g.fillCircle(10, 9, 2);
    g.lineStyle(1.5, 0x5a0a16, 0.8); g.strokeCircle(12, 13, 8); g.strokeCircle(24, 13, 8);
  }
  gen('l1hud_heart', 36, 36);

  // gold coin (36×36) — rimmed, embossed, with a shine
  {
    const c = 18;
    g.fillStyle(T.GOLD_DK, 1); g.fillCircle(c, c + 1.5, 16);   // drop rim
    g.fillStyle(T.GOLD, 1);    g.fillCircle(c, c, 16);          // body
    g.lineStyle(1.6, T.GOLD_DK, 1); g.strokeCircle(c, c, 16);
    g.fillStyle(T.GOLD_HI, 1); g.fillCircle(c, c, 11.5);        // inner face
    g.lineStyle(1, T.GOLD_DK, 0.8); g.strokeCircle(c, c, 11.5);
    g.fillStyle(T.GOLD, 1); g.fillCircle(c, c, 8);              // emboss center
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(c - 4, c - 5, 6, 4);   // shine
  }
  gen('l1hud_coin', 36, 36);

  gen('l1hud_ready', 4, 4);
  g.destroy();
}

// ── Scalable wood panel ────────────────────────────────────────────────────────
// Uses a nine-slice for large panels (so the gold corners never stretch); for
// small panels — where 2×SLICE would exceed the panel — it draws an exact-size
// wood panel with Graphics. Both share the same wood + gold styling.
export function makePanel(scene, x, y, w, h, depth = 44) {
  const s = THEME.SLICE;
  const canSlice = typeof scene.add.nineslice === 'function'
    && scene.textures.exists('l1hud_panel')
    && w >= s * 2 + 16 && h >= s * 2 + 16;
  if (canSlice) {
    return scene.add.nineslice(x, y, 'l1hud_panel', undefined, w, h, s, s, s, s)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
  }
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  drawWoodPanel(g, x, y, w, h, Math.max(6, Math.min(16, Math.floor(h / 3))));
  return g;
}

// Draw a wood panel into an existing Graphics object (used as fallback + accents).
// Thin, elegant gold frame — no thick borders.
export function drawWoodPanel(g, x, y, w, h, r = 12) {
  const T = THEME;
  g.fillStyle(T.WALNUT, 1); g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(T.WALNUT_L, 0.42); g.fillRoundedRect(x + 3, y + 3, w - 6, Math.min(26, h * 0.42), Math.max(2, r - 3));
  g.fillStyle(T.WALNUT_D, 0.42); g.fillRoundedRect(x + 3, y + h - Math.min(20, h * 0.34), w - 6, Math.min(18, h * 0.3), Math.max(2, r - 3));
  g.lineStyle(2.2, T.GOLD_DK, 1);  g.strokeRoundedRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4, r);
  g.lineStyle(1.1, T.GOLD, 1);     g.strokeRoundedRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4, r);
  g.lineStyle(0.8, T.GOLD_HI, 0.75); g.strokeRoundedRect(x + 3.5, y + 3.5, w - 7, h - 7, Math.max(2, r - 3));
}

// Circular wood button image (fixed art, scaled to diameter)
export function makeButton(scene, cx, cy, diameter, depth = 44) {
  const btn = scene.add.image(cx, cy, 'l1hud_btn').setDisplaySize(diameter, diameter)
    .setScrollFactor(0).setDepth(depth);
  return btn;
}

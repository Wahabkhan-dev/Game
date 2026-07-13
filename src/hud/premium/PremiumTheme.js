import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// PremiumTheme — SHARED premium fantasy HUD textures + helpers.
//
// This is a copy of Level 1's L1_HudTheme, generalized for reuse across levels
// (texture keys prefixed `shud_` + sentinel `shud_ready`, so it is fully
// self-contained and never collides with — or depends on — Level 1's own
// `l1hud_*` textures). Level 1 is left completely untouched.
//
// Generates dark-walnut wood + gold-framed panels, leaf ornaments, gold icons,
// glossy heart and coin — all procedurally, no external PNGs. Exposes:
//   • makePanel()  — scalable nine-slice wood panel (graphics fallback)
//   • drawWoodPanel() — draw a wood panel into an existing Graphics
//   • makeButton() — circular wood button image
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
  SLICE:    28,
};

export function generatePremiumHudTextures(scene) {
  if (scene.textures.exists('shud_ready')) return;
  const g = scene.make.graphics({ add: false });
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); g.clear(); };
  const T = THEME;

  // ── Wood panel (nine-slice source, 128×128, 28px gold frame) ────────────────
  const woodPanel = () => {
    const S = 128, R = 20;
    g.fillStyle(T.WALNUT, 1); g.fillRoundedRect(0, 0, S, S, R);
    g.fillStyle(T.WALNUT_L, 0.5); g.fillRoundedRect(6, 6, S - 12, 46, 14);
    g.fillStyle(T.WALNUT_D, 0.5); g.fillRoundedRect(6, S - 44, S - 12, 38, 14);
    g.lineStyle(1, T.WALNUT_D, 0.35);
    for (let y = 22; y < S - 16; y += 12) g.lineBetween(14, y, S - 14, y + 2);
    g.lineStyle(1, T.WALNUT_L, 0.18);
    for (let y = 28; y < S - 16; y += 12) g.lineBetween(16, y, S - 16, y + 1);
    g.lineStyle(5, T.GOLD_DK, 1); g.strokeRoundedRect(3, 3, S - 6, S - 6, R - 2);
    g.lineStyle(2.5, T.GOLD, 1);  g.strokeRoundedRect(3, 3, S - 6, S - 6, R - 2);
    g.lineStyle(1, T.GOLD_HI, 0.85); g.strokeRoundedRect(6, 6, S - 12, S - 12, R - 5);
    g.lineStyle(2, T.WALNUT_D, 0.5); g.strokeRoundedRect(10, 10, S - 20, S - 20, R - 8);
  };
  woodPanel(); gen('shud_panel', 128, 128);

  // ── Circular wood button (88×88) ────────────────────────────────────────────
  {
    const c = 44;
    g.fillStyle(T.WALNUT_D, 1); g.fillCircle(c, c, 42);
    g.fillStyle(T.WALNUT, 1);   g.fillCircle(c, c, 38);
    g.fillStyle(T.WALNUT_L, 0.55); g.fillEllipse(c, c - 12, 56, 28);
    g.fillStyle(T.WALNUT_D, 0.4);  g.fillEllipse(c, c + 16, 52, 22);
    g.lineStyle(4, T.GOLD_DK, 1); g.strokeCircle(c, c, 40);
    g.lineStyle(2, T.GOLD, 1);    g.strokeCircle(c, c, 40);
    g.lineStyle(0.9, T.GOLD_HI, 0.8); g.strokeCircle(c, c, 36.8);
    g.lineStyle(1.5, T.WALNUT_D, 0.5); g.strokeCircle(c, c, 33.5);
  }
  gen('shud_btn', 88, 88);

  // ── Leaf ornament sprig (48×34) ─────────────────────────────────────────────
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
  gen('shud_leaf', 48, 34);

  const goldIcon = (draw, k, w = 40, h = 40) => { draw(); gen(k, w, h); };

  // menu (three gold bars)
  goldIcon(() => {
    for (let i = 0; i < 3; i++) {
      g.fillStyle(T.GOLD_DK, 1); g.fillRoundedRect(8, 10 + i * 9 + 1, 24, 5, 2);
      g.fillStyle(T.GOLD, 1);    g.fillRoundedRect(8, 10 + i * 9, 24, 5, 2);
      g.fillStyle(T.GOLD_HI, 0.7); g.fillRoundedRect(9, 10 + i * 9, 12, 2, 1);
    }
  }, 'shud_ic_menu');

  // attack (sword) — kept for levels that show a contextual attack button
  goldIcon(() => {
    g.fillStyle(T.GOLD_HI, 1); g.fillTriangle(24, 6, 30, 12, 12, 30);
    g.fillStyle(T.GOLD, 1);    g.fillTriangle(24, 8, 28, 12, 13, 27);
    g.fillStyle(T.GOLD_DK, 1); g.fillRect(8, 26, 12, 4);
    g.fillStyle(T.WALNUT_L, 1); g.fillRect(6, 28, 8, 4);
    g.fillStyle(T.GOLD, 1); g.fillCircle(6, 30, 2.5);
  }, 'shud_ic_attack');

  // glossy heart (36×36)
  {
    g.fillStyle(0x7a1020, 1); g.fillCircle(12, 14, 9); g.fillCircle(24, 14, 9); g.fillTriangle(3, 17, 33, 17, 18, 34);
    g.fillStyle(0xe23a4e, 1); g.fillCircle(12, 13, 8); g.fillCircle(24, 13, 8); g.fillTriangle(4, 16, 32, 16, 18, 32);
    g.fillStyle(0xff6a80, 0.9); g.fillEllipse(11, 10, 7, 5);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(10, 9, 2);
    g.lineStyle(1.5, 0x5a0a16, 0.8); g.strokeCircle(12, 13, 8); g.strokeCircle(24, 13, 8);
  }
  gen('shud_heart', 36, 36);

  // gold coin (36×36)
  {
    const c = 18;
    g.fillStyle(T.GOLD_DK, 1); g.fillCircle(c, c + 1.5, 16);
    g.fillStyle(T.GOLD, 1);    g.fillCircle(c, c, 16);
    g.lineStyle(1.6, T.GOLD_DK, 1); g.strokeCircle(c, c, 16);
    g.fillStyle(T.GOLD_HI, 1); g.fillCircle(c, c, 11.5);
    g.lineStyle(1, T.GOLD_DK, 0.8); g.strokeCircle(c, c, 11.5);
    g.fillStyle(T.GOLD, 1); g.fillCircle(c, c, 8);
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(c - 4, c - 5, 6, 4);
  }
  gen('shud_coin', 36, 36);

  // gold key (40×40) — round bow (ring), shaft, two bit teeth, drawn white so
  // it can be tinted per slot (dim when uncollected, gold+glow when collected)
  {
    const bx = 13, by = 13;   // bow center
    g.fillStyle(0xffffff, 1);
    g.fillCircle(bx, by, 8.5);                    // bow (ring outer)
    g.fillStyle(0x000000, 1);
    g.fillCircle(bx, by, 3.6);                    // ring hole (cut-out look)
    g.fillStyle(0xffffff, 1);
    g.fillRect(bx + 5, by - 2.4, 20, 4.8);        // shaft
    g.fillRect(bx + 20, by + 2.4, 3.4, 6);        // tooth 1
    g.fillRect(bx + 25, by + 2.4, 3.4, 8);        // tooth 2
  }
  gen('shud_key', 40, 40);

  gen('shud_ready', 4, 4);
  g.destroy();
}

// ── Scalable wood panel ──────────────────────────────────────────────────────
export function makePanel(scene, x, y, w, h, depth = 44) {
  const s = THEME.SLICE;
  const canSlice = typeof scene.add.nineslice === 'function'
    && scene.textures.exists('shud_panel')
    && w >= s * 2 + 16 && h >= s * 2 + 16;
  if (canSlice) {
    return scene.add.nineslice(x, y, 'shud_panel', undefined, w, h, s, s, s, s)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
  }
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  drawWoodPanel(g, x, y, w, h, Math.max(6, Math.min(16, Math.floor(h / 3))));
  return g;
}

export function drawWoodPanel(g, x, y, w, h, r = 12) {
  const T = THEME;
  g.fillStyle(T.WALNUT, 1); g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(T.WALNUT_L, 0.42); g.fillRoundedRect(x + 3, y + 3, w - 6, Math.min(26, h * 0.42), Math.max(2, r - 3));
  g.fillStyle(T.WALNUT_D, 0.42); g.fillRoundedRect(x + 3, y + h - Math.min(20, h * 0.34), w - 6, Math.min(18, h * 0.3), Math.max(2, r - 3));
  g.lineStyle(2.2, T.GOLD_DK, 1);  g.strokeRoundedRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4, r);
  g.lineStyle(1.1, T.GOLD, 1);     g.strokeRoundedRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4, r);
  g.lineStyle(0.8, T.GOLD_HI, 0.75); g.strokeRoundedRect(x + 3.5, y + 3.5, w - 7, h - 7, Math.max(2, r - 3));
}

export function makeButton(scene, cx, cy, diameter, depth = 44) {
  return scene.add.image(cx, cy, 'shud_btn').setDisplaySize(diameter, diameter)
    .setScrollFactor(0).setDepth(depth);
}

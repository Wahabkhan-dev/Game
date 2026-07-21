import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';

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

  // gold clock (40×40) — timer icon (replaces the 🕒 emoji, which renders
  // differently on every OS/browser). Drawn, so it looks identical everywhere.
  {
    const c = 20;
    g.fillStyle(T.GOLD_DK, 1); g.fillCircle(c, c, 15);
    g.fillStyle(T.GOLD, 1);    g.fillCircle(c, c, 13);
    g.fillStyle(0x140c04, 1);  g.fillCircle(c, c, 10.5);      // dark face
    g.lineStyle(1, T.GOLD_HI, 0.85); g.strokeCircle(c, c, 13);
    // tick marks (12/3/6/9)
    g.fillStyle(T.GOLD_HI, 0.9);
    g.fillRect(c - 0.6, c - 10, 1.2, 2); g.fillRect(c - 0.6, c + 8, 1.2, 2);
    g.fillRect(c - 10, c - 0.6, 2, 1.2); g.fillRect(c + 8, c - 0.6, 2, 1.2);
    // hands
    g.lineStyle(2, T.GOLD_HI, 1); g.lineBetween(c, c, c, c - 7);
    g.lineStyle(2, T.GOLD, 1);    g.lineBetween(c, c, c + 5, c + 3);
    g.fillStyle(T.GOLD_HI, 1); g.fillCircle(c, c, 1.6);       // center pin
  }
  gen('shud_clock', 40, 40);

  // gold checkered finish flag (40×40) — replaces the 🏁 emoji.
  {
    g.fillStyle(T.GOLD_DK, 1); g.fillRect(9, 6, 3, 30);       // pole
    g.fillStyle(T.GOLD, 1);    g.fillRect(9, 6, 1.3, 30);     // pole shine
    const fx = 12, fy = 7, cw = 5, ch = 4, cols = 4, rows = 3;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      g.fillStyle((r + col) % 2 === 0 ? 0x140c04 : T.GOLD, 1);
      g.fillRect(fx + col * cw, fy + r * ch, cw, ch);
    }
    g.lineStyle(1, T.GOLD_DK, 0.9); g.strokeRect(fx, fy, cols * cw, rows * ch);
  }
  gen('shud_flag', 40, 40);

  // gold paw print (40×40) — runner / "you are here" progress marker (replaces
  // the 🐾 / 👧 emoji).
  {
    const cx = 20;
    g.fillStyle(T.GOLD_DK, 1); g.fillEllipse(cx, 27, 17, 14);  // pad shadow
    g.fillStyle(T.GOLD, 1);    g.fillEllipse(cx, 26, 16, 13);  // main pad
    g.fillCircle(cx - 9, 15, 4);   g.fillCircle(cx - 3, 11, 4.2);
    g.fillCircle(cx + 3, 11, 4.2); g.fillCircle(cx + 9, 15, 4);
    g.fillStyle(T.GOLD_HI, 0.5); g.fillEllipse(cx - 2, 23, 8, 5);  // highlight
  }
  gen('shud_paw', 40, 40);

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

// ── Shared Level-1-style title banner FRAME ──────────────────────────────────
// Draws the premium wood/gold banner shell (drop shadow + wood panel + two gold
// leaf ornaments at the edges) so every level's top title banner matches Level 1.
// It only draws the FRAME — the caller keeps its own centered title text on top.
// Returns the created objects so callers can track/destroy them if needed.
export function drawBannerFrame(scene, x, y, w, h, depth = 44) {
  generatePremiumHudTextures(scene);
  const objs = [];
  const sh = scene.add.graphics().setScrollFactor(0).setDepth(depth - 1);
  sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(x + 2, y + 3, w, h, 9);
  objs.push(sh);
  objs.push(makePanel(scene, x, y, w, h, depth));
  const lL = scene.add.image(x + 5, y + h / 2, 'shud_leaf').setScrollFactor(0).setDepth(depth + 1).setScale(0.5);
  const lR = scene.add.image(x + w - 5, y + h / 2, 'shud_leaf').setScrollFactor(0).setDepth(depth + 1).setScale(0.5).setFlipX(true);
  objs.push(lL, lR);
  return objs;
}

// ── Shared timer panel (reusable for all levels) ─────────────────────────────
// Returns { panel: [shadow, panel], timerTxt } — update timerTxt.setText(...).
export function buildTimerPanel(scene, x, y, w, h, timerText, depth = 44) {
  generatePremiumHudTextures(scene);
  const sh = scene.add.graphics().setScrollFactor(0).setDepth(depth - 1);
  sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(x + 2, y + 3, w, h, 9);
  const panel = makePanel(scene, x, y, w, h, depth);
  const timerTxt = scene.add.text(x + w / 2, y + h / 2, timerText, {
    fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
    stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
  return { panel: [sh, panel], timerTxt };
}

// ── Shared menu button (reusable for all levels) ─────────────────────────────
// Wood panel + menu icon + hover glow. onClickFn fires on pointer-up.
// Returns { objs, icon, glow, hit }.
export function buildMenuButton(scene, x, y, w, h, onClickFn, depth = 44) {
  generatePremiumHudTextures(scene);
  const cx = x + w / 2, cy = y + h / 2;
  const sh = scene.add.graphics().setScrollFactor(0).setDepth(depth - 1);
  sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(x + 2, y + 3, w, h, 9);
  const panel = makePanel(scene, x, y, w, h, depth);
  const glow = scene.add.image(cx, cy, 'shud_btn').setDisplaySize(w + 10, h + 10)
    .setScrollFactor(0).setDepth(depth - 1).setTint(0xffd24a).setAlpha(0);
  const icon = scene.add.image(cx, cy, 'shud_ic_menu').setScale(0.5).setScrollFactor(0).setDepth(depth + 1);
  const hit = scene.add.rectangle(cx, cy, w, h, 0, 0)
    .setScrollFactor(0).setDepth(depth + 2).setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => { scene.tweens.add({ targets: icon, scale: 0.58, duration: 120 }); scene.tweens.add({ targets: glow, alpha: 0.35, duration: 150 }); });
  hit.on('pointerout',  () => { scene.tweens.add({ targets: icon, scale: 0.5,  duration: 120 }); scene.tweens.add({ targets: glow, alpha: 0, duration: 150 }); });
  hit.on('pointerdown', () => { icon.y += 1; });
  hit.on('pointerup',   () => { icon.y -= 1; onClickFn?.(); });
  return { objs: [sh, panel, glow, icon, hit], icon, glow, hit };
}

// ── Shared checkpoint banner (runner levels) ─────────────────────────────────
// "CHECKPOINT N — Description" in Level-1 premium style. Returns the text object.
export function buildCheckpointBanner(scene, cpNum, description, depth = 44) {
  const pw = 360, px = W / 2 - pw / 2;
  drawBannerFrame(scene, px, 6, pw, 58, depth - 1);
  return scene.add.text(W / 2, 16, `CHECKPOINT ${cpNum} — ${description}`, {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.goldTxt,
    stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
}

// ── Finalized checkpoint BOARD + item collection row (the approved first-image
// design). Real ui_life_bg wood board holding the "CHECKPOINT N — …" title, with
// a row of the level's real item icons underneath + "0/1" counters + thin gold
// dividers between them. Shown at the board's natural (non-stretched) proportions.
//
// `items`: [{ key, tex, w, h }] — same shape levels already use for ITEMS.
// Returns { cpTxt, itemHud } where cpTxt is the title text (levels update it as
// checkpoints progress) and itemHud[key] = { icon, chk } — the exact contract the
// pickup logic already uses (icon.setAlpha(1) / chk.setText('✓')…).
// ── Shared LEVEL BANNER — real banner-bg.png at the approved L1/L2 size ──────
// 300×62 (the exact render Level 1 & 2 use — natural proportions, NEVER
// stretched wide/flat). Chapter label on top, title below. Every level shows
// this; any checkpoint/objective module then sits just below `bottom`.
// Returns { titleTxt, bottom, midY } — titleTxt so scenes can update the line,
// midY so side clusters (health / timer / coin / menu) can align to the banner.
export function buildLevelBanner(scene, chapterLabel, title, depth = 48) {
  generatePremiumHudTextures(scene);
  const BW = 300, BH = 62, BY = 6, CY = BY + BH / 2;
  scene.add.image(W / 2, CY, 'ui_banner_bg').setDisplaySize(BW, BH)
    .setScrollFactor(0).setDepth(depth);
  scene.add.text(W / 2, BY + BH * 0.36, chapterLabel, {
    fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
    stroke: '#2a1a06', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
  const titleTxt = scene.add.text(W / 2, BY + BH * 0.64, title, {
    fontFamily: 'Georgia, serif', fontSize: '14px', color: THEME.goldTxt,
    stroke: '#3a2408', strokeThickness: 2,
    shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
  return { titleTxt, bottom: BY + BH, midY: CY };
}

// cpNum: a number → title renders "CHECKPOINT N — description"; pass null to
// use `description` verbatim as the full title (e.g. name-collection boards).
// items: [{ key, tex, w, h }] for real art icons, OR [{ key, icon:'🐾', label }]
// for emoji/text slots (no texture needed — e.g. Level 6's puppy names).
export function buildCheckpointBoard(scene, cpNum, description, items, depth = 44, y = 4) {
  generatePremiumHudTextures(scene);
  const pw = 300, ph = 54, px = W / 2 - pw / 2;

  scene.add.image(W / 2, y + ph / 2, 'ui_life_bg').setDisplaySize(pw, ph)
    .setScrollFactor(0).setDepth(depth);
  const titleStr = cpNum != null ? `CHECKPOINT ${cpNum} — ${description}` : description;
  const cpTxt = scene.add.text(W / 2, y + 13, titleStr, {
    fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
    stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);

  const n = items.length;
  const insetX = 36;
  const step = n > 1 ? Math.min(44, (pw - insetX * 2) / (n - 1)) : 0;
  const startX = px + insetX;
  const iy = y + 35;

  const itemHud = {};
  items.forEach((it, i) => {
    const ix = startX + i * step;
    let icon;
    if (it.tex) {
      icon = scene.add.image(ix, iy, it.tex).setDisplaySize(it.w * 0.32, it.h * 0.32)
        .setScrollFactor(0).setDepth(depth + 1).setAlpha(0.4);
    } else {
      icon = scene.add.text(ix, iy, it.icon || (it.label || '?').slice(0, 6).toUpperCase(), {
        fontFamily: it.icon ? undefined : 'Georgia, serif',
        fontStyle: it.icon ? undefined : 'bold',
        fontSize: it.icon ? '15px' : '6px', color: '#e8dcc8',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setAlpha(0.4);
    }
    const chk = scene.add.text(ix, iy + 11, '0/1', {
      fontFamily: 'Georgia, serif', fontSize: '7px', color: '#aab',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
    itemHud[it.key] = { icon, chk };
    if (i < n - 1) {
      const div = scene.add.graphics().setScrollFactor(0).setDepth(depth + 1);
      div.lineStyle(1, THEME.GOLD_DK, 0.5);
      div.lineBetween(ix + step / 2, iy - 11, ix + step / 2, iy + 11);
    }
  });

  return { cpTxt, itemHud };
}

// ── Real-art timer panel (ui_time_bg pocket-watch). Returns the countdown text
// object; the scene owns the tick + colour changes. ───────────────────────────
export function buildTimerArt(scene, x, y, w, h, text, depth = 44) {
  generatePremiumHudTextures(scene);
  scene.add.image(x + w / 2, y + h / 2, 'ui_time_bg').setDisplaySize(w, h)
    .setScrollFactor(0).setDepth(depth);
  return scene.add.text(x + w * 0.62, y + h * 0.52, text, {
    fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
    stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
}

// ── Real-art coin panel (ui_coin_bg wolf medallion). Returns the count text
// object; the scene owns the value. ───────────────────────────────────────────
export function buildCoinArt(scene, x, y, w, h, count, depth = 44) {
  generatePremiumHudTextures(scene);
  scene.add.image(x + w / 2, y + h / 2, 'ui_coin_bg').setDisplaySize(w, h)
    .setScrollFactor(0).setDepth(depth);
  return scene.add.text(x + w * 0.66, y + h * 0.52, `${count}`, {
    fontFamily: 'Georgia, serif', fontSize: '13px', color: THEME.goldTxt,
    stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
}

// ── UNIFIED Level-2 header (the exact approved design) ───────────────────────
// One horizontal row of real painted art: health/life board (LEFT) · banner
// (CENTER) · timer · coin · menu (RIGHT), all centred on the banner midline.
// Every level uses this so they look identical. Timer is optional (pass
// cfg.timer as seconds to show a countdown panel, or omit for puzzle scenes).
//
// cfg: { chapterLabel, title, timer?, coin? (bool, default true), coinValue?,
//        lives? (default 3), hp? (default 3), onMenu, depth? (default 48) }
// Returns { midY, bottom, titleTxt, hearts:[], hpBars:[], setHP(n), setLives(n),
//           timerTxt, coinTxt, menuImg } — scenes assign these to their own
// fields and drive gameplay through them.
export function buildStandardHeader(scene, cfg = {}) {
  const {
    chapterLabel = '', title = '', timer = null, coin = true, coinValue = 0,
    lives = 3, hp = 3, onMenu, depth = 48,
  } = cfg;
  generatePremiumHudTextures(scene);
  const D = depth;

  // banner (centre) — real art at the approved L1/L2 size
  const ban = buildLevelBanner(scene, chapterLabel, title, D);
  const midY = ban.midY;

  // health / life board (left), centred on the banner midline
  const HPx = 8, HPh = 42, HPy = midY - HPh / 2, HPw = 140;
  scene.add.image(HPx, HPy, 'ui_life_bg').setOrigin(0, 0)
    .setDisplaySize(HPw, HPh).setScrollFactor(0).setDepth(D);
  const colX = [HPx + 39, HPx + 70, HPx + 101];
  const hearts = colX.map((cx, i) => {
    const h = scene.add.image(cx, HPy + 13, 'heart').setDisplaySize(22, 20)
      .setScrollFactor(0).setDepth(D + 1);
    if (i >= lives) h.setTint(0x444444).setAlpha(0.25);
    return h;
  });
  const hpBars = colX.map(cx => scene.add.image(cx, HPy + 30, 'ui_health_bar')
    .setDisplaySize(26, 8).setScrollFactor(0).setDepth(D + 1));
  const setHP = (n) => hpBars.forEach((b, i) => {
    if (i < n) { b.clearTint(); b.setAlpha(1); } else { b.setTint(0x444444); b.setAlpha(0.25); }
  });
  const setLives = (n) => hearts.forEach((h, i) => {
    if (i < n) { h.clearTint(); h.setAlpha(1); } else { h.setTint(0x444444); h.setAlpha(0.25); }
  });
  setHP(hp);

  // right cluster: timer · coin · menu (right→left), centred on the midline
  const mSz = 38, mCx = W - 16 - mSz / 2, mCy = midY;
  const coinW = 60, coinX = (mCx - mSz / 2) - 8 - coinW, coinY = midY - 20;
  const tmrW = 72, tmrX = coinX - 8 - tmrW, tmrY = midY - 20;

  let timerTxt = null;
  if (timer != null) timerTxt = buildTimerArt(scene, tmrX, tmrY, tmrW, 40, `${timer}s`, D);

  let coinTxt = null;
  if (coin !== false) coinTxt = buildCoinArt(scene, coinX, coinY, coinW, 40, coinValue, D);

  // menu medallion
  const menuImg = scene.add.image(mCx, mCy, 'ui_menu_bg').setDisplaySize(mSz, mSz)
    .setScrollFactor(0).setDepth(D + 1);
  const hit = scene.add.circle(mCx, mCy, mSz / 2 + 3, 0, 0)
    .setScrollFactor(0).setDepth(D + 2).setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => scene.tweens.add({ targets: menuImg, displayWidth: mSz * 1.12, displayHeight: mSz * 1.12, duration: 120 }));
  hit.on('pointerout',  () => scene.tweens.add({ targets: menuImg, displayWidth: mSz, displayHeight: mSz, duration: 120 }));
  hit.on('pointerdown', () => { menuImg.y += 1; });
  hit.on('pointerup',   () => { menuImg.y -= 1; onMenu?.(); });

  return { midY, bottom: ban.bottom, titleTxt: ban.titleTxt, hearts, hpBars, setHP, setLives, timerTxt, coinTxt, menuImg };
}

// ── Finalized Game-Menu modal (approved via Theme Design) ────────────────────
// Premium wood/gold panel + leaf ornaments + Resume/Restart/Settings/Exit, for
// scenes that DON'T extend BaseLevelScene (so can't use its _openPauseMenu()).
// Purely presentational + button wiring — caller owns physics pause/resume and
// the open/closed flag; destroy the returned array to close the modal.
export function openGameMenuModal(scene, { onResume, onRestart, onExit, onSettings } = {}) {
  generatePremiumHudTextures(scene);
  const kill = [];
  const MD = 90;
  const W2 = W / 2, H2 = H / 2;
  const PW = 260, PH = onSettings ? 260 : 222, px = W2 - PW / 2, py = H2 - PH / 2;

  kill.push(scene.add.rectangle(W2, H2, W, H, 0x000000, 0.72)
    .setScrollFactor(0).setDepth(MD).setInteractive());

  const sh = scene.add.graphics().setScrollFactor(0).setDepth(MD);
  sh.fillStyle(0x000000, 0.4); sh.fillRoundedRect(px + 3, py + 5, PW, PH, 16);
  kill.push(sh);
  kill.push(makePanel(scene, px, py, PW, PH, MD + 1));
  kill.push(scene.add.image(px + 22, py + 30, 'shud_leaf').setScale(0.5).setScrollFactor(0).setDepth(MD + 3));
  kill.push(scene.add.image(px + PW - 22, py + 30, 'shud_leaf').setScale(0.5).setScrollFactor(0).setDepth(MD + 3).setFlipX(true));

  kill.push(scene.add.text(W2, py + 28, 'Game Menu', {
    fontFamily: 'Georgia, serif', fontSize: '17px', color: THEME.goldTxt,
    stroke: '#3a2408', strokeThickness: 2,
    shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(MD + 3));

  const div = scene.add.graphics().setScrollFactor(0).setDepth(MD + 3);
  div.lineStyle(1, THEME.GOLD, 0.4); div.lineBetween(px + 22, py + 48, px + PW - 22, py + 48);
  kill.push(div);

  const BTNS = [
    { label: '▶   Resume',   action: () => onResume?.() },
    { label: '↺   Restart',  action: () => onRestart?.() },
    ...(onSettings ? [{ label: '⚙   Settings', action: () => onSettings?.() }] : []),
    { label: '✕   Exit',     action: () => onExit?.() },
  ];
  BTNS.forEach((b, i) => {
    const by = py + 62 + i * 46, bw = PW - 44, bh = 38, bx = px + 22;
    const g = scene.add.graphics().setScrollFactor(0).setDepth(MD + 2);
    const draw = (hover) => {
      g.clear();
      g.fillStyle(hover ? THEME.WALNUT_L : THEME.WALNUT_D, hover ? 0.95 : 0.9);
      g.fillRoundedRect(bx, by, bw, bh, 9);
      g.lineStyle(1.5, hover ? THEME.GOLD : THEME.GOLD_DK, hover ? 1 : 0.8);
      g.strokeRoundedRect(bx, by, bw, bh, 9);
    };
    draw(false);
    kill.push(g);
    const t = scene.add.text(bx + bw / 2, by + bh / 2, b.label, {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: THEME.goldTxt,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(MD + 3);
    kill.push(t);
    const hit = scene.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0, 0)
      .setScrollFactor(0).setDepth(MD + 4).setInteractive({ useHandCursor: true });
    kill.push(hit);
    hit.on('pointerover', () => { draw(true); t.setColor('#ffffff'); });
    hit.on('pointerout',  () => { draw(false); t.setColor(THEME.goldTxt); });
    hit.on('pointerup',   () => b.action());
  });

  return kill;
}

// ── Standalone menu button (for scenes with NO persistent header) ────────────
// Brief puzzle/build/nursery scenes (checkpoint mini-games, decorate, nursery)
// are launched as their own scene with no banner/header, so there was
// previously no way to pause or exit mid-activity. This draws the real
// menu-bg medallion top-right and manages its own open/close + modal state
// internally — the caller doesn't need its own togglePause(). Binds ESC too.
// Returns { toggle } in case the caller wants to trigger it programmatically.
export function addStandaloneMenuButton(scene, { onRestart, onExit, x, y, size = 34, depth = 90 } = {}) {
  generatePremiumHudTextures(scene);
  const mSz = size;
  const mCx = x ?? (W - 16 - mSz / 2);
  const mCy = y ?? (mSz / 2 + 10);
  let paused = false, pauseObjs = null;

  const toggle = () => {
    if (paused) {
      pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} });
      pauseObjs = null; paused = false; scene.tweens.resumeAll();
      return;
    }
    paused = true; scene.tweens.pauseAll();
    pauseObjs = openGameMenuModal(scene, {
      onResume: () => toggle(),
      onRestart: onRestart || (() => {
        pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} }); paused = false; scene.tweens.resumeAll();
        scene.cameras.main.fadeOut(350, 0, 0, 0); scene.time.delayedCall(380, () => scene.scene.restart());
      }),
      onExit: onExit || (() => {
        scene.tweens.resumeAll();
        scene.cameras.main.fadeOut(450, 0, 0, 0); scene.time.delayedCall(480, () => scene.scene.start('Menu'));
      }),
    });
  };

  const menuImg = scene.add.image(mCx, mCy, 'ui_menu_bg').setDisplaySize(mSz, mSz).setScrollFactor(0).setDepth(depth);
  const hit = scene.add.circle(mCx, mCy, mSz / 2 + 3, 0, 0).setScrollFactor(0).setDepth(depth + 1).setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => scene.tweens.add({ targets: menuImg, displayWidth: mSz * 1.12, displayHeight: mSz * 1.12, duration: 120 }));
  hit.on('pointerout',  () => scene.tweens.add({ targets: menuImg, displayWidth: mSz, displayHeight: mSz, duration: 120 }));
  hit.on('pointerdown', () => { menuImg.y += 1; });
  hit.on('pointerup',   () => { menuImg.y -= 1; toggle(); });

  const escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  escKey.on('down', () => toggle());

  return { toggle };
}

import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';
import {
  THEME, generatePremiumHudTextures, makePanel,
  drawBannerFrame, buildTimerPanel, buildMenuButton, buildCheckpointBanner,
} from '../hud/premium/PremiumTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// ThemeDesignScene — DEV/QA showcase of the FINALIZED premium HUD components.
//
// One screen that renders every shared building block exactly as it will look
// in-game, so the design can be approved ONCE and then rolled out level-by-level:
//   • Health / Life panel (glossy hearts + green HP bars)
//   • Title banner (chapter label + title + leaf ornaments)
//   • Coin display     • Timer panel
//   • Checkpoint banner (runner levels)
//   • Menu button → opens the premium wood/gold Game-Menu modal
//
// Purely presentational. Not part of the level flow — reachable from Dev/QA only.
// ════════════════════════════════════════════════════════════════════════════

const D = 20;   // base depth for showcase chrome (modal sits far above)

export class ThemeDesignScene extends Phaser.Scene {
  constructor() { super('ThemeDesign'); }

  create() {
    generatePremiumHudTextures(this);
    this._modalOpen = false;

    // ── backdrop (dark forest wash so gold/wood reads correctly) ──────────────
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x14201a, 0x14201a, 0x0a120c, 0x0a120c, 1);
    bg.fillRect(0, 0, W, H);
    // subtle vignette panels so each row is visually grouped
    for (let y = 0; y < H; y += 4) {
      bg.fillStyle(0x000000, 0.04); bg.fillRect(0, y, W, 1);
    }

    this.add.text(W / 2, 12, '🎨  THEME DESIGN — Finalized HUD Components', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(D);

    // ── SECTION 1 — full in-game header bar (real composition) ────────────────
    this._sectionLabel(30, '1 · Full header bar (in-game layout)');
    this._buildHeaderBar(40);

    // ── SECTION 2 — individual components, labelled ───────────────────────────
    this._sectionLabel(92, '2 · Components');

    // Health / Life — real lifebg.png art
    this._chip(20, 100, 168, 58, 'LIFE / HEALTH');
    this._buildHealthPanel(30, 112);

    // Coin — real coin-bg.png art (gold wolf medallion + wood plaque)
    this._chip(202, 100, 110, 58, 'COIN');
    this._buildCoinPanel(222, 104, 70, 52, D + 2);

    // Timer — real time-bg.png art (pocket watch + wood plaque)
    this._chip(326, 100, 110, 58, 'TIMER');
    this._buildTimerImg(336, 104, 88, 52, '60s', D + 2);

    // Banner — real banner-bg.png art
    this._chip(450, 100, 330, 58, 'BANNER');
    this._buildMiniBanner(515, 101, 200, 56);

    // ── SECTION 3 — checkpoint banner + item collection (runner levels) ───────
    this._sectionLabel(170, '3 · Checkpoint banner + item collection (runner levels)');
    this._buildCheckpointWithItems(184);

    // ── SECTION 4 — checkpoint progress bar (bottom track, runner levels) ─────
    this._sectionLabel(254, '4 · Checkpoint tracker (Level 1 style)');
    this._buildCheckpointProgressBar(268);

    // ── SECTION 5 — menu button → modal ────────────────────────────────────────
    this._sectionLabel(320, '5 · Menu button  →  click to open the Game-Menu modal');
    this._buildMenuImg(W / 2, 352, 52, D + 2);
    this.add.text(W / 2, 376, '⬑ click the button', {
      fontFamily: 'Georgia, serif', fontSize: '10px', color: THEME.goldDim,
    }).setOrigin(0.5).setDepth(D);

    // ── Back to menu ──────────────────────────────────────────────────────────
    this._backBtn(W / 2, 424, '‹ Back to Menu', () => this.scene.start('Menu'));
  }

  // ── section heading ─────────────────────────────────────────────────────────
  _sectionLabel(y, text) {
    this.add.text(20, y, text, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldDim,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(D);
  }

  // ── labelled framed chip around a component sample ────────────────────────────
  _chip(x, y, w, h, label) {
    const g = this.add.graphics().setDepth(D - 1);
    g.fillStyle(0x000000, 0.28); g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, THEME.GOLD_DK, 0.5); g.strokeRoundedRect(x, y, w, h, 8);
    this.add.text(x + 8, y + 8, label, {
      fontFamily: 'Georgia, serif', fontSize: '8px', color: THEME.goldDim,
    }).setDepth(D);
  }

  // ── full header bar exactly like the real game top row (new art assets) ──────
  _buildHeaderBar(y) {
    // health (left) — lifebg.png
    this._buildHealthPanel(16, y, D + 1);
    // banner (center) — banner-bg.png
    this._buildMiniBanner((W - 300) / 2, y - 6, 300, 62, D + 1, 'LEVEL 1', "SHADOW'S JOURNEY");
    // right cluster: timer · coin · menu
    const menuX = W - 16 - 40;
    this._buildCoinPanel(menuX - 10 - 60, y, 60, 44, D + 1);        // coin-bg.png
    this._buildTimerImg(menuX - 10 - 60 - 10 - 74, y, 74, 44, '57s', D + 1); // time-bg.png
    this._buildMenuImg(menuX + 20, y + 21, 40, D + 1);              // menu-bg.png
  }

  // ── MENU BUTTON: menu-bg.png medallion (gem + hamburger bars baked in) ────────
  _buildMenuImg(cx, cy, size, depth = D + 2) {
    const img = this.add.image(cx, cy, 'ui_menu_bg').setDisplaySize(size, size).setDepth(depth);
    const hit = this.add.circle(cx, cy, size / 2 + 2, 0xffffff, 0)
      .setDepth(depth + 2).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.tweens.add({ targets: img, displayWidth: size * 1.12, displayHeight: size * 1.12, duration: 120 }));
    hit.on('pointerout',  () => this.tweens.add({ targets: img, displayWidth: size, displayHeight: size, duration: 120 }));
    hit.on('pointerdown', () => { img.y += 1; });
    hit.on('pointerup',   () => { img.y -= 1; this._openMenuModal(); });
    return img;
  }

  // ── HEALTH: lifebg.png board + heart.png hearts + health-bar.png HP segments ──
  _buildHealthPanel(x, y, depth = D + 2) {
    const wdt = 140, hgt = 44;
    this.add.image(x, y, 'ui_life_bg').setOrigin(0, 0).setDisplaySize(wdt, hgt).setDepth(depth);
    const hy = y + 14, hx = [x + 36, x + 70, x + 104];
    for (let i = 0; i < 3; i++) {
      this.add.image(hx[i], hy, 'heart').setDisplaySize(24, 22).setDepth(depth + 1);
    }
    // HP bars (all full) — real health-bar.png gem segments
    const bx0 = x + 18, by = y + 31, bw = 32, bh = 9, gap = 4;
    for (let i = 0; i < 3; i++) {
      const bx = bx0 + i * (bw + gap);
      this.add.image(bx + bw / 2, by, 'ui_health_bar').setDisplaySize(bw, bh).setDepth(depth + 1);
    }
  }

  // ── COIN: coin-bg.png (gold wolf medallion + wood plaque for the count) ──────
  _buildCoinPanel(x, y, w, h, depth) {
    this.add.image(x + w / 2, y + h / 2, 'ui_coin_bg').setDisplaySize(w, h).setDepth(depth);
    this.add.text(x + w * 0.72, y + h * 0.52, '5', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth + 1);
  }

  // ── TIMER: time-bg.png (pocket watch + wood plaque for the countdown) ────────
  _buildTimerImg(x, y, w, h, text, depth = D + 2) {
    this.add.image(x + w / 2, y + h / 2, 'ui_time_bg').setDisplaySize(w, h).setDepth(depth);
    return this.add.text(x + w * 0.68, y + h * 0.54, text, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth + 1);
  }

  // ── BANNER: banner-bg.png art + chapter label + title ────────────────────────
  _buildMiniBanner(x, y, w, h, depth = D + 2, chapter = 'LEVEL 1', title = "SHADOW'S JOURNEY") {
    this.add.image(x + w / 2, y + h / 2, 'ui_banner_bg').setDisplaySize(w, h).setDepth(depth);
    this.add.text(x + w / 2, y + h * 0.40, chapter, {
      fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
      stroke: '#2a1a06', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth + 2);
    this.add.text(x + w / 2, y + h * 0.66, title, {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: THEME.goldTxt,
      stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(depth + 2);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GAME-MENU MODAL — premium wood/gold. This is the FINALIZED modal we roll out.
  // ════════════════════════════════════════════════════════════════════════════
  _openMenuModal() {
    if (this._modalOpen) return;
    this._modalOpen = true;
    const kill = [];
    const MD = 90;   // modal depth base

    kill.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
      .setDepth(MD).setInteractive());

    const PW = 260, PH = 260, px = (W - PW) / 2, py = (H - PH) / 2;
    // shadow + wood panel
    const sh = this.add.graphics().setDepth(MD);
    sh.fillStyle(0x000000, 0.4); sh.fillRoundedRect(px + 3, py + 5, PW, PH, 16);
    kill.push(sh);
    kill.push(makePanel(this, px, py, PW, PH, MD + 1));
    // leaf ornaments on the title
    kill.push(this.add.image(px + 22, py + 30, 'shud_leaf').setScale(0.5).setDepth(MD + 3));
    kill.push(this.add.image(px + PW - 22, py + 30, 'shud_leaf').setScale(0.5).setDepth(MD + 3).setFlipX(true));

    kill.push(this.add.text(W / 2, py + 28, 'Game Menu', {
      fontFamily: 'Georgia, serif', fontSize: '17px', color: THEME.goldTxt,
      stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(MD + 3));

    const div = this.add.graphics().setDepth(MD + 3);
    div.lineStyle(1, THEME.GOLD, 0.4); div.lineBetween(px + 22, py + 48, px + PW - 22, py + 48);
    kill.push(div);

    const close = () => { kill.forEach(o => { try { o.destroy(); } catch (_) {} }); this._modalOpen = false; };

    const BTNS = [
      { label: '▶   Resume',   action: close },
      { label: '↺   Restart',  action: () => { close(); } },
      { label: '⚙   Settings', action: () => {} },
      { label: '✕   Exit',     action: () => { close(); this.scene.start('Menu'); } },
    ];
    BTNS.forEach((b, i) => {
      const by = py + 62 + i * 46, bw = PW - 44, bh = 38, bx = px + 22;
      const g = this.add.graphics().setDepth(MD + 2);
      const draw = (hover) => {
        g.clear();
        g.fillStyle(hover ? THEME.WALNUT_L : THEME.WALNUT_D, hover ? 0.95 : 0.9);
        g.fillRoundedRect(bx, by, bw, bh, 9);
        g.lineStyle(1.5, hover ? THEME.GOLD : THEME.GOLD_DK, hover ? 1 : 0.8);
        g.strokeRoundedRect(bx, by, bw, bh, 9);
      };
      draw(false);
      kill.push(g);
      const t = this.add.text(bx + bw / 2, by + bh / 2, b.label, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: THEME.goldTxt,
      }).setOrigin(0.5).setDepth(MD + 3);
      kill.push(t);
      const hit = this.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0, 0)
        .setDepth(MD + 4).setInteractive({ useHandCursor: true });
      kill.push(hit);
      hit.on('pointerover', () => { draw(true); t.setColor('#ffffff'); });
      hit.on('pointerout',  () => { draw(false); t.setColor(THEME.goldTxt); });
      hit.on('pointerup',   () => b.action());
    });
  }

  // ── checkpoint banner + item collection progress row ─────────────────────────
  // Exact replica of the real in-game checkpoint HUD (L4/L5/L6 runner _buildHUD):
  // one 360×58 banner with the checkpoint title, then ALL items (across every
  // checkpoint, not just the current one) laid out in a row underneath with
  // thin gold divider lines between each, all starting at "0/1".
  _buildCheckpointWithItems(y, depth = D + 2) {
    const pw = 380, ph = 64, px = (W - pw) / 2;
    // lifebg.png board (wide aspect matches the checkpoint strip perfectly)
    this.add.image(W / 2, y + ph / 2, 'ui_life_bg').setDisplaySize(pw, ph).setDepth(depth);
    this.add.text(W / 2, y + 14, 'CHECKPOINT 1 — Collect Stethoscope & Water Bowl', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth + 2);

    const items = [
      { icon: '🩺' }, { icon: '🪵' }, { icon: '🧺' }, { icon: '🧣' }, { icon: '💡' },
    ];
    const iy = y + 40;
    items.forEach((it, i) => {
      const ix = px + 52 + i * 58;
      this.add.text(ix, iy, it.icon, { fontSize: '20px' })
        .setOrigin(0.5).setDepth(depth + 1).setAlpha(0.4);
      this.add.text(ix, iy + 14, '0/1', {
        fontFamily: 'Georgia, serif', fontSize: '9px', color: '#aab',
      }).setOrigin(0.5).setDepth(depth + 2);
      if (i < items.length - 1) {
        const div = this.add.graphics().setDepth(depth + 1);
        div.lineStyle(1, THEME.GOLD_DK, 0.5);
        div.lineBetween(ix + 28, iy - 12, ix + 28, iy + 14);
      }
    });
  }

  // ── Checkpoint PROGRESS BAR — exact replica of Level 1's footer tracker
  // (L1_Footer.buildProgressBar): slim wood track + dark groove + green fill +
  // diamond connectors + glowing pulsing checkpoint circles (Z1/Z2/Z3/🏁) with
  // gold rings + labels above + 🐾 paw runner marker.
  _buildCheckpointProgressBar(y, depth = D + 2) {
    const LEFT = 70, RIGHT = W - 70, BAR_W = RIGHT - LEFT, TY = y + 22;

    // shadow + slim wood track (rounded end caps)
    const sh = this.add.graphics().setDepth(depth - 1);
    sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(LEFT - 10, TY - 8, BAR_W + 20, 16, 7);
    makePanel(this, LEFT - 10, TY - 9, BAR_W + 20, 18, depth);

    // dark inset groove
    const groove = this.add.graphics().setDepth(depth + 1);
    groove.fillStyle(0x120904, 1); groove.fillRoundedRect(LEFT - 2, TY - 2, BAR_W + 4, 4, 2);

    // green fill (~55% progress, for illustration)
    const pct = 0.55;
    this.add.rectangle(LEFT, TY, Math.max(2, pct * BAR_W), 3, THEME.greenHP, 1)
      .setOrigin(0, 0.5).setDepth(depth + 2);

    // checkpoints — evenly spaced: Z1 / Z2 / Z3 / 🏁
    const zones = [
      { label: 'Z1', color: 0x44cc44 },
      { label: 'Z2', color: 0xf5c840 },
      { label: 'Z3', color: 0xee5522 },
      { label: '🏁', color: 0x8fd0ff },
    ];
    const xAt = (i) => LEFT + (i / (zones.length - 1)) * BAR_W;

    // diamond connectors between successive checkpoints
    for (let i = 0; i < zones.length - 1; i++) {
      const mx = (xAt(i) + xAt(i + 1)) / 2;
      const dg = this.add.graphics().setDepth(depth + 2);
      dg.fillStyle(THEME.GOLD, 0.9);
      dg.fillPoints([{ x: mx, y: TY - 3 }, { x: mx + 3, y: TY }, { x: mx, y: TY + 3 }, { x: mx - 3, y: TY }], true);
    }

    // glowing pulsing checkpoint circles + labels
    zones.forEach((z, i) => {
      const bx = xAt(i);
      const glow = this.add.circle(bx, TY, 8, z.color, 0.28).setDepth(depth + 2);
      this.tweens.add({ targets: glow, scale: { from: 0.8, to: 1.3 }, alpha: { from: 0.3, to: 0.08 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const ring = this.add.graphics().setDepth(depth + 3);
      ring.fillStyle(0x140c04, 1); ring.fillCircle(bx, TY, 5);
      ring.fillStyle(z.color, 1); ring.fillCircle(bx, TY, 3.5);
      ring.fillStyle(0xffffff, 0.5); ring.fillCircle(bx - 1, TY - 1, 1.2);
      ring.lineStyle(1.5, THEME.GOLD, 1); ring.strokeCircle(bx, TY, 5.5);
      this.add.text(bx, TY - 15, z.label, {
        fontFamily: 'Georgia, serif', fontSize: '8px', color: THEME.goldTxt, stroke: '#1a0f04', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(depth + 3);
    });

    // 🐾 paw runner marker, positioned along the fill
    this.add.text(LEFT + pct * BAR_W, TY - 2, '🐾', { fontSize: '11px' })
      .setOrigin(0.5, 1).setDepth(depth + 4);
  }

  // ── small wood back button ────────────────────────────────────────────────────
  _backBtn(cx, cy, label, cb) {
    const bw = 160, bh = 34, bx = cx - bw / 2, by = cy - bh / 2;
    makePanel(this, bx, by, bw, bh, D + 1);
    const t = this.add.text(cx, cy, label, {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(D + 2);
    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setDepth(D + 3).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => t.setColor('#ffffff'));
    hit.on('pointerout',  () => t.setColor(THEME.goldTxt));
    hit.on('pointerup',   cb);
  }
}

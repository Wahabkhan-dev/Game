import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { THEME, makePanel } from './L1_HudTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// L1_Header — the premium fantasy TOP HUD for Level 1, on ONE horizontal row.
//
// Reusable components (all Phaser Containers, camera-anchored, ≈10% of height):
//   • HealthPanel  (LEFT)   — 3 glossy hearts + 3 green HP bars ONLY (no star/coin)
//   • TitleBanner  (CENTER) — CHAPTER 1 / SHADOW'S JOURNEY, screen-centered, leaves
//   • TimerPanel   (RIGHT)  — 🕒 timer
//   • CoinPanel    (RIGHT)  — gold coin icon + count
//   • MenuButton   (RIGHT)  — square wood button, three gold lines, hover glow
//
// Health panel matches the banner height; timer/coin are smaller; menu matches
// the timer height; the three right components share equal spacing. Exposes the
// live objects the shared base logic expects (hearts[], hpGraphics, pointsTxt,
// timerTxt) + drawHP(hp).
// ════════════════════════════════════════════════════════════════════════════

const D    = 44;   // HUD visual depth
const DHIT = 49;   // interactive hit-zone depth

// margins + row metrics (800×450 design space)
const M_TOP = 10, M_SIDE = 16;
const ROW_H = 42;                 // big panels (health & banner)
const SM_H  = 28;                 // small panels (timer / coin / menu)
const BIG_Y = M_TOP;              // 10
const SM_Y  = M_TOP + (ROW_H - SM_H) / 2;   // 17  → small panels vertically centred

// LEFT
const HP = { x: M_SIDE, y: BIG_Y, w: 128, h: ROW_H };

// RIGHT cluster (laid out right→left with equal gaps): Menu · Coin · Timer
const GAP  = 10;
const MENU = { w: 32, h: SM_H, x: W - M_SIDE - 32, y: SM_Y };
const COIN = { w: 50, h: SM_H, x: 0, y: SM_Y };
const TMR  = { w: 64, h: SM_H, x: 0, y: SM_Y };
COIN.x = MENU.x - GAP - COIN.w;
TMR.x  = COIN.x - GAP - TMR.w;

// CENTER (screen-centred banner)
const BAN = { w: 300, h: ROW_H, x: (W - 300) / 2, y: BIG_Y };

export class L1Header {
  constructor(scene, config, onMenu) {
    this.scene = scene;
    this.config = config;
    this.onMenu = onMenu;
    this.hearts = [];
  }

  build() {
    this.c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(D);
    this._buildHealthPanel();
    this._buildTitleBanner();
    this._buildTimerPanel();
    this._buildCoinPanel();
    this._buildMenuButton();
    return this;
  }

  // ── HealthPanel (LEFT) — hearts + HP bars ONLY ──────────────────────────────
  _buildHealthPanel() {
    const s = this.scene;
    this._shadow(HP.x, HP.y, HP.w, HP.h);
    this.c.add(makePanel(s, HP.x, HP.y, HP.w, HP.h, D));

    // 3 glossy hearts, evenly spaced (top row)
    const hy = HP.y + 12;
    const hx = [HP.x + 28, HP.x + 64, HP.x + 100];
    const lives = this._lives();
    for (let i = 0; i < 3; i++) {
      const h = s.add.image(hx[i], hy, 'l1hud_heart').setScale(0.54).setScrollFactor(0).setDepth(D + 1);
      if (i >= lives) { h.setTint(0x444444).setAlpha(0.25); }
      this.c.add(h);
      this.hearts.push(h);
    }

    // 3 green HP bars (bottom row, drawn by drawHP)
    this.hpGraphics = s.add.graphics().setScrollFactor(0).setDepth(D + 1);
    this.c.add(this.hpGraphics);
    this.hpLayout = { x: HP.x + 8, y: HP.y + 27, bw: 34, bh: 6, gap: 5 };
  }

  drawHP(hp) {
    const g = this.hpGraphics; if (!g) return;
    const { x, y, bw, bh, gap } = this.hpLayout;
    const col = hp >= 3 ? 0x44cc44 : hp === 2 ? 0xeecc00 : 0xff3b2e;
    g.clear();
    for (let i = 0; i < 3; i++) {
      const bx = x + i * (bw + gap);
      g.fillStyle(0x140c04, 1); g.fillRoundedRect(bx, y, bw, bh, 2.5);
      g.lineStyle(1, THEME.GOLD_DK, 0.9); g.strokeRoundedRect(bx, y, bw, bh, 2.5);
      if (i < hp) {
        g.fillStyle(col, 1); g.fillRoundedRect(bx + 1.5, y + 1.5, bw - 3, bh - 3, 1.5);
        g.fillStyle(0xffffff, 0.28); g.fillRoundedRect(bx + 2.5, y + 1.5, bw - 5, 1.6, 1);
      }
    }
  }

  // ── TitleBanner (CENTER) — screen-centred ───────────────────────────────────
  _buildTitleBanner() {
    const s = this.scene;
    this._shadow(BAN.x, BAN.y, BAN.w, BAN.h);
    this.c.add(makePanel(s, BAN.x, BAN.y, BAN.w, BAN.h, D));

    this.c.add(s.add.text(W / 2, BAN.y + 12, 'CHAPTER 1', {
      fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
      stroke: '#2a1a06', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));

    const title = s.add.text(W / 2, BAN.y + 28, "SHADOW'S JOURNEY", {
      fontFamily: 'Georgia, serif', fontSize: '17px',
      color: THEME.goldTxt, stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(title);

    const lL = s.add.image(BAN.x + 4, BAN.y + BAN.h / 2, 'l1hud_leaf').setScrollFactor(0).setDepth(D + 2).setScale(0.52);
    const lR = s.add.image(BAN.x + BAN.w - 4, BAN.y + BAN.h / 2, 'l1hud_leaf').setScrollFactor(0).setDepth(D + 2).setScale(0.52).setFlipX(true);
    this.c.add([lL, lR]);
  }

  // ── TimerPanel (RIGHT) ──────────────────────────────────────────────────────
  _buildTimerPanel() {
    const s = this.scene;
    if (!this.config.timer) return;
    this._shadow(TMR.x, TMR.y, TMR.w, TMR.h);
    this.c.add(makePanel(s, TMR.x, TMR.y, TMR.w, TMR.h, D));
    this.timerTxt = s.add.text(TMR.x + TMR.w / 2, TMR.y + TMR.h / 2, `🕒 ${this.config.timer}s`, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(this.timerTxt);
  }

  // ── CoinPanel (RIGHT) — gold coin icon + count (pointsTxt shows number only) ─
  _buildCoinPanel() {
    const s = this.scene;
    this._shadow(COIN.x, COIN.y, COIN.w, COIN.h);
    this.c.add(makePanel(s, COIN.x, COIN.y, COIN.w, COIN.h, D));
    const coin = s.add.image(COIN.x + 14, COIN.y + COIN.h / 2, 'l1hud_coin').setScale(0.52).setScrollFactor(0).setDepth(D + 2);
    const pts = s.registry.get('points') || 0;
    this.pointsTxt = s.add.text(COIN.x + 28, COIN.y + COIN.h / 2, `${pts}`, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add([coin, this.pointsTxt]);
  }

  // ── MenuButton (RIGHT) ──────────────────────────────────────────────────────
  _buildMenuButton() {
    const s = this.scene;
    const cx = MENU.x + MENU.w / 2, cy = MENU.y + MENU.h / 2;
    this._shadow(MENU.x, MENU.y, MENU.w, MENU.h);
    const panel = makePanel(s, MENU.x, MENU.y, MENU.w, MENU.h, D);
    const icon = s.add.image(cx, cy, 'l1hud_ic_menu').setScale(0.5).setScrollFactor(0).setDepth(D + 2);
    const glow = s.add.image(cx, cy, 'l1hud_btn').setDisplaySize(MENU.w + 10, MENU.h + 10)
      .setScrollFactor(0).setDepth(D - 1).setTint(0xffd24a).setAlpha(0);
    this.c.add([glow, panel, icon]);

    const hit = s.add.rectangle(cx, cy, MENU.w, MENU.h, 0, 0)
      .setScrollFactor(0).setDepth(DHIT).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { s.tweens.add({ targets: icon, scale: 0.58, duration: 120 }); s.tweens.add({ targets: glow, alpha: 0.35, duration: 150 }); });
    hit.on('pointerout',  () => { s.tweens.add({ targets: icon, scale: 0.5,  duration: 120 }); s.tweens.add({ targets: glow, alpha: 0, duration: 150 }); });
    hit.on('pointerdown', () => { icon.y += 1; });
    hit.on('pointerup',   () => { icon.y -= 1; this.onMenu?.(); });
  }

  // soft drop shadow behind a panel
  _shadow(x, y, w, h) {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(D - 2);
    g.fillStyle(0x000000, 0.28); g.fillRoundedRect(x + 2, y + 3, w, h, 9);
    this.c.add(g);
  }

  _lives() {
    const v = this.scene.registry.get('lives');
    return (v !== null && v !== undefined) ? v : 3;
  }
}

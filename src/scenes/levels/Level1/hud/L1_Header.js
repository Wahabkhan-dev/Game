import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { THEME } from './L1_HudTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// L1_Header — the premium fantasy TOP HUD for Level 1, on ONE horizontal row.
//
// FINALIZED ART VERSION — uses the real painted assets (assets/images/all/),
// approved via the Dev/QA "Theme Design" showcase, instead of procedural
// wood-panel graphics:
//   • HealthPanel  (LEFT)   — ui_life_bg board + heart.png hearts + ui_health_bar HP segments
//   • TitleBanner  (CENTER) — ui_banner_bg art, CHAPTER 1 / SHADOW'S JOURNEY on top
//   • TimerPanel   (RIGHT)  — ui_time_bg pocket-watch art + countdown text
//   • CoinPanel    (RIGHT)  — ui_coin_bg wolf-medallion art + count
//   • MenuButton   (RIGHT)  — ui_menu_bg medallion (gem + bars baked in), hover/press
//
// Exposes the live objects the shared base logic expects (hearts[], hpGraphics,
// pointsTxt, timerTxt) + drawHP(hp), so BaseLevelScene/Level1Scene gameplay code
// is completely unaffected by this reskin.
// ════════════════════════════════════════════════════════════════════════════

const D    = 44;   // HUD visual depth
const DHIT = 49;   // interactive hit-zone depth

// margins + row metrics (800×450 design space)
const M_TOP = 8, M_SIDE = 16;

// CENTER — banner (banner-bg.png, ~4.8:1 aspect). This is the tallest element,
// so every other component centres itself on ITS vertical midline (ROW_CY) —
// that's the single shared baseline that keeps the whole row visually level.
const BAN = { w: 300, h: 62, x: (W - 300) / 2, y: M_TOP };
const BAN_CY = BAN.y + BAN.h / 2;
const ROW_CY = BAN_CY;

// LEFT — health board (lifebg.png, ~3.2:1 aspect), centred on ROW_CY
const HP = { x: M_SIDE, w: 140, h: 42 };
HP.y = ROW_CY - HP.h / 2;

// RIGHT cluster (laid out right→left with equal gaps): Menu · Coin · Timer,
// all centred on ROW_CY so the whole row reads as one unit.
const GAP  = 8;
const MENU = { w: 38, h: 38, x: 0, y: 0 };
const COIN = { w: 60, h: 44, x: 0, y: 0 };
const TMR  = { w: 74, h: 44, x: 0, y: 0 };
MENU.x = W - M_SIDE - MENU.w; MENU.y = ROW_CY - MENU.h / 2;
COIN.x = MENU.x - GAP - COIN.w; COIN.y = ROW_CY - COIN.h / 2;
TMR.x  = COIN.x - GAP - TMR.w;  TMR.y  = ROW_CY - TMR.h / 2;

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

  // ── HealthPanel (LEFT) — lifebg.png board + heart.png + ui_health_bar HP ────
  _buildHealthPanel() {
    const s = this.scene;
    this.c.add(s.add.image(HP.x, HP.y, 'ui_life_bg').setOrigin(0, 0)
      .setDisplaySize(HP.w, HP.h).setScrollFactor(0).setDepth(D));

    // 3 real hearts, evenly spaced (top row) — same x-centres as the HP bars below
    // so hearts and bars line up in tidy columns, inset clear of the gold end-caps
    const colX = [HP.x + 39, HP.x + 70, HP.x + 101];
    const hy = HP.y + 13;
    const lives = this._lives();
    for (let i = 0; i < 3; i++) {
      const h = s.add.image(colX[i], hy, 'heart').setDisplaySize(22, 20).setScrollFactor(0).setDepth(D + 1);
      if (i >= lives) { h.setTint(0x444444).setAlpha(0.25); }
      this.c.add(h);
      this.hearts.push(h);
    }

    // 3 HP segments (bottom row) — real health-bar.png gem art per pip
    const barY = HP.y + 30, bw = 26, bh = 8;
    this.hpLayout = { colX, y: barY, bw, bh };
    this.hpGraphics = [];
    for (let i = 0; i < 3; i++) {
      const bar = s.add.image(colX[i], barY, 'ui_health_bar')
        .setDisplaySize(bw, bh).setScrollFactor(0).setDepth(D + 1);
      this.c.add(bar);
      this.hpGraphics.push(bar);
    }
  }

  drawHP(hp) {
    const bars = this.hpGraphics; if (!bars || !bars.length) return;
    bars.forEach((bar, i) => {
      if (i < hp) { bar.clearTint(); bar.setAlpha(1); }
      else { bar.setTint(0x444444).setAlpha(0.25); }
    });
  }

  // ── TitleBanner (CENTER) — banner-bg.png art, screen-centred ───────────────
  _buildTitleBanner() {
    const s = this.scene;
    this.c.add(s.add.image(W / 2, BAN_CY, 'ui_banner_bg').setDisplaySize(BAN.w, BAN.h)
      .setScrollFactor(0).setDepth(D));

    this.c.add(s.add.text(W / 2, BAN.y + BAN.h * 0.36, 'LEVEL 1', {
      fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
      stroke: '#2a1a06', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));

    const title = s.add.text(W / 2, BAN.y + BAN.h * 0.64, "SHADOW'S JOURNEY", {
      fontFamily: 'Georgia, serif', fontSize: '16px',
      color: THEME.goldTxt, stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(title);
  }

  // ── TimerPanel (RIGHT) — time-bg.png pocket-watch art ───────────────────────
  _buildTimerPanel() {
    const s = this.scene;
    if (!this.config.timer) return;
    this.c.add(s.add.image(TMR.x + TMR.w / 2, TMR.y + TMR.h / 2, 'ui_time_bg')
      .setDisplaySize(TMR.w, TMR.h).setScrollFactor(0).setDepth(D));
    this.timerTxt = s.add.text(TMR.x + TMR.w * 0.62, TMR.y + TMR.h * 0.52, `${this.config.timer}s`, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(this.timerTxt);
  }

  // ── CoinPanel (RIGHT) — coin-bg.png wolf-medallion art ──────────────────────
  _buildCoinPanel() {
    const s = this.scene;
    this.c.add(s.add.image(COIN.x + COIN.w / 2, COIN.y + COIN.h / 2, 'ui_coin_bg')
      .setDisplaySize(COIN.w, COIN.h).setScrollFactor(0).setDepth(D));
    const pts = s.registry.get('points') || 0;
    this.pointsTxt = s.add.text(COIN.x + COIN.w * 0.66, COIN.y + COIN.h * 0.52, `${pts}`, {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(this.pointsTxt);
  }

  // ── MenuButton (RIGHT) — menu-bg.png medallion (gem + bars baked in) ────────
  _buildMenuButton() {
    const s = this.scene;
    const cx = MENU.x + MENU.w / 2, cy = MENU.y + MENU.h / 2;
    const img = s.add.image(cx, cy, 'ui_menu_bg').setDisplaySize(MENU.w, MENU.h)
      .setScrollFactor(0).setDepth(D + 1);
    this.c.add(img);

    const hit = s.add.circle(cx, cy, MENU.w / 2 + 3, 0, 0)
      .setScrollFactor(0).setDepth(DHIT).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => s.tweens.add({ targets: img, displayWidth: MENU.w * 1.12, displayHeight: MENU.h * 1.12, duration: 120 }));
    hit.on('pointerout',  () => s.tweens.add({ targets: img, displayWidth: MENU.w, displayHeight: MENU.h, duration: 120 }));
    hit.on('pointerdown', () => { img.y += 1; });
    hit.on('pointerup',   () => { img.y -= 1; this.onMenu?.(); });
  }

  _lives() {
    const v = this.scene.registry.get('lives');
    return (v !== null && v !== undefined) ? v : 3;
  }
}

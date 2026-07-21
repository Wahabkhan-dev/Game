import { W } from '../../config/GameConfig.js';
import { THEME } from './PremiumTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// PremiumHeader — SHARED premium fantasy TOP HUD (finalized real-art version,
// ported from Level 1's L1_Header). One horizontal row: HealthPanel (LEFT),
// TitleBanner (CENTER), TimerPanel + CoinPanel + MenuButton (RIGHT). The
// chapter label + title come from `cfg` so every level using PremiumHUD shows
// its own text, in the exact same approved wood/gold + painted-art style.
// ════════════════════════════════════════════════════════════════════════════

const D = 44, DHIT = 49;
const M_TOP = 8, M_SIDE = 16;

// CENTER — banner (banner-bg.png, ~4.8:1 aspect). Tallest element — every other
// component centres on ITS vertical midline (ROW_CY) so the row reads as one unit.
const BAN = { w: 300, h: 62, x: (W - 300) / 2, y: M_TOP };
const BAN_CY = BAN.y + BAN.h / 2;
const ROW_CY = BAN_CY;

// LEFT — health board (lifebg.png, ~3.2:1 aspect), centred on ROW_CY
const HP = { x: M_SIDE, w: 140, h: 42 };
HP.y = ROW_CY - HP.h / 2;

// RIGHT cluster (laid out right→left with equal gaps): Menu · Coin · Timer,
// all centred on ROW_CY.
const GAP = 8;
const MENU = { w: 38, h: 38, x: 0, y: 0 };
const COIN = { w: 60, h: 44, x: 0, y: 0 };
const TMR  = { w: 74, h: 44, x: 0, y: 0 };
MENU.x = W - M_SIDE - MENU.w; MENU.y = ROW_CY - MENU.h / 2;
COIN.x = MENU.x - GAP - COIN.w; COIN.y = ROW_CY - COIN.h / 2;
TMR.x  = COIN.x - GAP - TMR.w;  TMR.y  = ROW_CY - TMR.h / 2;

export class PremiumHeader {
  constructor(scene, cfg, onMenu) {
    this.scene = scene;
    this.cfg = cfg;
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

    // 3 real hearts, evenly spaced (top row), inset clear of the gold end-caps
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

    this.c.add(s.add.text(W / 2, BAN.y + BAN.h * 0.36, this.cfg.chapterLabel || '', {
      fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
      stroke: '#2a1a06', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));

    const title = s.add.text(W / 2, BAN.y + BAN.h * 0.64, this.cfg.title || '', {
      fontFamily: 'Georgia, serif', fontSize: '16px',
      color: THEME.goldTxt, stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(title);
  }

  // ── TimerPanel (RIGHT) — time-bg.png pocket-watch art ───────────────────────
  _buildTimerPanel() {
    const s = this.scene;
    if (!this.cfg.timer) return;
    this.c.add(s.add.image(TMR.x + TMR.w / 2, TMR.y + TMR.h / 2, 'ui_time_bg')
      .setDisplaySize(TMR.w, TMR.h).setScrollFactor(0).setDepth(D));
    this.timerTxt = s.add.text(TMR.x + TMR.w * 0.62, TMR.y + TMR.h * 0.52, `${this.cfg.timer}s`, {
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

import { W } from '../../config/GameConfig.js';
import { THEME, makePanel } from './PremiumTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// PremiumHeader — SHARED premium fantasy TOP HUD (copied from L1_Header,
// generalized). One horizontal row: HealthPanel (LEFT), TitleBanner (CENTER),
// TimerPanel + CoinPanel + MenuButton (RIGHT). The chapter label + title come
// from `cfg` so every level shows its own, in the same premium wood/gold style.
// ════════════════════════════════════════════════════════════════════════════

const D = 44, DHIT = 49;
const M_TOP = 10, M_SIDE = 16;
const ROW_H = 42, SM_H = 28;
const BIG_Y = M_TOP;
const SM_Y  = M_TOP + (ROW_H - SM_H) / 2;

const HP = { x: M_SIDE, y: BIG_Y, w: 128, h: ROW_H };
const GAP = 10;
const MENU = { w: 32, h: SM_H, x: W - M_SIDE - 32, y: SM_Y };
const COIN = { w: 50, h: SM_H, x: 0, y: SM_Y };
const TMR  = { w: 64, h: SM_H, x: 0, y: SM_Y };
COIN.x = MENU.x - GAP - COIN.w;
TMR.x  = COIN.x - GAP - TMR.w;
const BAN = { w: 300, h: ROW_H, x: (W - 300) / 2, y: BIG_Y };

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

  _buildHealthPanel() {
    const s = this.scene;
    this._shadow(HP.x, HP.y, HP.w, HP.h);
    this.c.add(makePanel(s, HP.x, HP.y, HP.w, HP.h, D));

    const hy = HP.y + 12;
    const hx = [HP.x + 28, HP.x + 64, HP.x + 100];
    const lives = this._lives();
    for (let i = 0; i < 3; i++) {
      const h = s.add.image(hx[i], hy, 'shud_heart').setScale(0.54).setScrollFactor(0).setDepth(D + 1);
      if (i >= lives) { h.setTint(0x444444).setAlpha(0.25); }
      this.c.add(h);
      this.hearts.push(h);
    }

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

  _buildTitleBanner() {
    const s = this.scene;
    this._shadow(BAN.x, BAN.y, BAN.w, BAN.h);
    this.c.add(makePanel(s, BAN.x, BAN.y, BAN.w, BAN.h, D));

    this.c.add(s.add.text(W / 2, BAN.y + 12, this.cfg.chapterLabel || '', {
      fontFamily: 'Georgia, serif', fontSize: '9px', color: THEME.goldDim,
      stroke: '#2a1a06', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));

    const title = s.add.text(W / 2, BAN.y + 28, this.cfg.title || '', {
      fontFamily: 'Georgia, serif', fontSize: '17px',
      color: THEME.goldTxt, stroke: '#3a2408', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add(title);

    const lL = s.add.image(BAN.x + 4, BAN.y + BAN.h / 2, 'shud_leaf').setScrollFactor(0).setDepth(D + 2).setScale(0.52);
    const lR = s.add.image(BAN.x + BAN.w - 4, BAN.y + BAN.h / 2, 'shud_leaf').setScrollFactor(0).setDepth(D + 2).setScale(0.52).setFlipX(true);
    this.c.add([lL, lR]);
  }

  _buildTimerPanel() {
    const s = this.scene;
    if (!this.cfg.timer) return;
    this._shadow(TMR.x, TMR.y, TMR.w, TMR.h);
    this.c.add(makePanel(s, TMR.x, TMR.y, TMR.w, TMR.h, D));
    // Drawn gold clock icon (identical on every OS) instead of the 🕒 emoji.
    const clock = s.add.image(TMR.x + 15, TMR.y + TMR.h / 2, 'shud_clock')
      .setScale(0.46).setScrollFactor(0).setDepth(D + 2);
    this.timerTxt = s.add.text(TMR.x + 27, TMR.y + TMR.h / 2, `${this.cfg.timer}s`, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add([clock, this.timerTxt]);
  }

  _buildCoinPanel() {
    const s = this.scene;
    this._shadow(COIN.x, COIN.y, COIN.w, COIN.h);
    this.c.add(makePanel(s, COIN.x, COIN.y, COIN.w, COIN.h, D));
    const coin = s.add.image(COIN.x + 14, COIN.y + COIN.h / 2, 'shud_coin').setScale(0.52).setScrollFactor(0).setDepth(D + 2);
    const pts = s.registry.get('points') || 0;
    this.pointsTxt = s.add.text(COIN.x + 28, COIN.y + COIN.h / 2, `${pts}`, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2);
    this.c.add([coin, this.pointsTxt]);
  }

  _buildMenuButton() {
    const s = this.scene;
    const cx = MENU.x + MENU.w / 2, cy = MENU.y + MENU.h / 2;
    this._shadow(MENU.x, MENU.y, MENU.w, MENU.h);
    const panel = makePanel(s, MENU.x, MENU.y, MENU.w, MENU.h, D);
    const icon = s.add.image(cx, cy, 'shud_ic_menu').setScale(0.5).setScrollFactor(0).setDepth(D + 2);
    const glow = s.add.image(cx, cy, 'shud_btn').setDisplaySize(MENU.w + 10, MENU.h + 10)
      .setScrollFactor(0).setDepth(D - 1).setTint(0xffd24a).setAlpha(0);
    this.c.add([glow, panel, icon]);

    const hit = s.add.rectangle(cx, cy, MENU.w, MENU.h, 0, 0)
      .setScrollFactor(0).setDepth(DHIT).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { s.tweens.add({ targets: icon, scale: 0.58, duration: 120 }); s.tweens.add({ targets: glow, alpha: 0.35, duration: 150 }); });
    hit.on('pointerout',  () => { s.tweens.add({ targets: icon, scale: 0.5,  duration: 120 }); s.tweens.add({ targets: glow, alpha: 0, duration: 150 }); });
    hit.on('pointerdown', () => { icon.y += 1; });
    hit.on('pointerup',   () => { icon.y -= 1; this.onMenu?.(); });
  }

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

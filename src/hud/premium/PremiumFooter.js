import { W, H } from '../../config/GameConfig.js';
import { THEME, makePanel, makeButton } from './PremiumTheme.js';

// ════════════════════════════════════════════════════════════════════════════
// PremiumFooter — SHARED premium carved-wood checkpoint bar (copied from
// L1_Footer, generalized). Draws a gold-framed wood track with evenly-spaced
// glowing zone nodes + diamond connectors + labels + a runner marker, plus an
// optional contextual Attack button (hidden until a boss fight).
//
// `zones` is data-driven: any number of { label, color } entries. The fill line
// grows with the player's world progress and takes the color of the segment the
// runner is currently in (green→gold→red style). Exposes update(playerWorldX),
// setAttackVisible(v), and destroy().
// ════════════════════════════════════════════════════════════════════════════

const D = 44, DHIT = 49;
const M_SIDE = 18, M_BOT = 16;
const BAR_L = 120, BAR_R = W - 120, BAR_W = BAR_R - BAR_L;
const BAR_Y = H - 26;
const BTN = 38, ICON = 0.5;
const ATK_X = W - M_SIDE - BTN / 2;
const ATK_Y = H - M_BOT - BTN - 26;

export class PremiumFooter {
  constructor(scene, cfg = {}) {
    this.scene = scene;
    this.cfg = cfg;
    this.worldW = cfg.worldWidth || 2000;
    this.zones = cfg.zones || [];
    this.runnerEmoji = cfg.runnerEmoji || '🐾';
  }

  build() {
    this.c  = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(D);
    this.bc = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(D + 2);
    this._buildProgressBar();
    this._buildAttackButton();
    return this;
  }

  _buildProgressBar() {
    const s = this.scene, TY = BAR_Y;

    const sh = s.add.graphics().setScrollFactor(0).setDepth(D - 1);
    sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(BAR_L - 10, TY - 8, BAR_W + 20, 16, 7);
    this.c.add(sh);
    this.c.add(makePanel(s, BAR_L - 10, TY - 9, BAR_W + 20, 18, D));

    const groove = s.add.graphics().setScrollFactor(0).setDepth(D + 1);
    groove.fillStyle(0x120904, 1); groove.fillRoundedRect(BAR_L - 2, TY - 2, BAR_W + 4, 4, 2);
    this.c.add(groove);

    this._fill = s.add.rectangle(BAR_L, TY, 2, 3, THEME.greenHP, 1)
      .setScrollFactor(0).setDepth(D + 2).setOrigin(0, 0.5);
    this.c.add(this._fill);

    const zones = this.zones;
    const n = Math.max(zones.length, 1);
    const xAt = (i) => BAR_L + (n > 1 ? (i / (n - 1)) : 0) * BAR_W;

    // diamond connectors between successive checkpoints
    for (let i = 0; i < n - 1; i++) {
      const mx = (xAt(i) + xAt(i + 1)) / 2;
      const dg = s.add.graphics().setScrollFactor(0).setDepth(D + 2);
      dg.fillStyle(THEME.GOLD, 0.9);
      dg.fillPoints([{ x: mx, y: TY - 3 }, { x: mx + 3, y: TY }, { x: mx, y: TY + 3 }, { x: mx - 3, y: TY }], true);
      this.c.add(dg);
    }

    // glowing checkpoint circles + labels
    zones.forEach((z, i) => {
      const bx = xAt(i);
      const color = z.color ?? 0xf5c840;
      const glow = s.add.circle(bx, TY, 8, color, 0.28).setScrollFactor(0).setDepth(D + 2);
      s.tweens.add({ targets: glow, scale: { from: 0.8, to: 1.3 }, alpha: { from: 0.3, to: 0.08 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const ring = s.add.graphics().setScrollFactor(0).setDepth(D + 3);
      ring.fillStyle(0x140c04, 1); ring.fillCircle(bx, TY, 5);
      ring.fillStyle(color, 1); ring.fillCircle(bx, TY, 3.5);
      ring.fillStyle(0xffffff, 0.5); ring.fillCircle(bx - 1, TY - 1, 1.2);
      ring.lineStyle(1.5, THEME.GOLD, 1); ring.strokeCircle(bx, TY, 5.5);
      const lbl = s.add.text(bx, TY - 15, z.label, {
        fontFamily: 'Georgia, serif', fontSize: '8px', color: THEME.goldTxt, stroke: '#1a0f04', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3);
      this.c.add([glow, ring, lbl]);
    });

    this._runner = s.add.text(BAR_L, TY - 2, this.runnerEmoji, { fontSize: '11px' })
      .setScrollFactor(0).setDepth(D + 4).setOrigin(0.5, 1);
    this.c.add(this._runner);
  }

  update(playerWorldX) {
    if (!this._fill) return;
    const pct = Math.min(Math.max(playerWorldX / this.worldW, 0), 1);
    this._fill.width = Math.max(2, pct * BAR_W);
    this._runner.x = BAR_L + pct * BAR_W;
    const n = this.zones.length;
    if (n >= 2) {
      const seg = Math.min(Math.floor(pct * (n - 1)), n - 2);
      const col = this.zones[seg]?.color ?? THEME.greenHP;
      this._fill.setFillStyle(col);
    }
  }

  // ── Contextual boss Attack button (hidden until shown) ───────────────────────
  _buildAttackButton() {
    const s = this.scene, cx = ATK_X, cy = ATK_Y;
    const sh = s.add.graphics().setScrollFactor(0).setDepth(D - 1);
    sh.fillStyle(0x000000, 0.30); sh.fillCircle(cx + 1.5, cy + 2.5, BTN / 2);
    const glow = s.add.image(cx, cy, 'shud_btn').setDisplaySize(BTN + 12, BTN + 12)
      .setScrollFactor(0).setDepth(D - 1).setTint(0xffd24a).setAlpha(0);
    const img = makeButton(s, cx, cy, BTN, D);
    const icon = s.add.image(cx, cy, 'shud_ic_attack').setScale(ICON).setScrollFactor(0).setDepth(D + 1);
    this.bc.add([sh, glow, img, icon]);

    const hit = s.add.rectangle(cx, cy, BTN + 6, BTN + 6, 0, 0).setScrollFactor(0).setDepth(DHIT).setInteractive({ useHandCursor: true });
    const pressBtn = (down) => {
      s.tweens.add({ targets: img, y: cy + (down ? 1.5 : 0), scaleX: down ? BTN / 88 * 0.94 : BTN / 88, scaleY: down ? BTN / 88 * 0.94 : BTN / 88, duration: 90 });
      s.tweens.add({ targets: icon, y: cy + (down ? 1.5 : 0), scale: down ? ICON * 0.94 : ICON, duration: 90 });
    };
    hit.on('pointerover', () => s.tweens.add({ targets: glow, alpha: 0.4, duration: 150 }));
    hit.on('pointerout',  () => { s.tweens.add({ targets: glow, alpha: 0, duration: 150 }); pressBtn(false); });
    hit.on('pointerdown', () => { pressBtn(true); if (s._doSnakeAttack) s._doSnakeAttack(); });
    hit.on('pointerup',   () => pressBtn(false));
    hit.on('pointerupoutside', () => pressBtn(false));

    this._attack = { sh, glow, img, icon, hit };
    this.setAttackVisible(false);
  }

  setAttackVisible(v) {
    const a = this._attack; if (!a) return;
    [a.sh, a.glow, a.img, a.icon].forEach(o => o.setVisible(v).setActive(v));
    if (a.hit) { a.hit.setVisible(v); v ? a.hit.setInteractive({ useHandCursor: true }) : a.hit.disableInteractive(); }
    if (v) {
      a.icon.setScale(ICON * 0.5);
      this.scene.tweens.add({ targets: a.icon, scale: ICON, duration: 260, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: a.glow, alpha: { from: 0, to: 0.5 }, duration: 400, yoyo: true, repeat: -1 });
    } else {
      this.scene.tweens.killTweensOf(a.glow); a.glow.setAlpha(0);
    }
  }

  destroy() {
    this.c?.destroy(); this.bc?.destroy();
  }
}

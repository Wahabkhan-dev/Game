import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L9BaseScene, L9 } from './L9BaseScene.js';
import { generateL9Assets } from './L9Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — PART 1 · STAGE 2: "Unwrapping!"  🎀
//
// A cosy living room. The gifts Gleeda collected sit under the tree. Tap each one
// to unwrap it — the wrapped box pops open with confetti and a surprise (toy,
// treat, candy cane, ornament) springs out. Gamma and a couple of puppies watch.
// When every gift is open → celebration → the Bow Run (Part 2).
//
// A calm tap-interaction scene (no running), mirroring the Level-8 Feeding scene.
// ════════════════════════════════════════════════════════════════════════════

const WRAP_TEX = ['l9_gift_red', 'l9_gift_green', 'l9_gift_gold', 'l9_gift_blue', 'l9_gift_pink', 'l9_gift_purple', 'l9_gift_white', 'l9_gift_stripe'];
const SURPRISES = ['l9_toy_ball', 'l9_toy_bone', 'l9_candy', 'l9_ornament', 'l9_star'];

export class L9_UnwrapScene extends L9BaseScene {
  constructor() { super('L9_Unwrap'); }

  create() {
    generateL9Assets(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this._done = false;

    this.buildRoomBg();

    // how many gifts were collected in the run (default to full set)
    this._total = Phaser.Math.Clamp(this.registry.get('l9_gifts') ?? WRAP_TEX.length, 1, WRAP_TEX.length);
    this._opened = 0;

    // watchers: Gamma + two eager puppies
    this.add.image(150, 300, 'l9_gamma').setDisplaySize(150, 106).setDepth(4);
    this.add.image(250, 320, 'l9_puppy').setDisplaySize(70, 62).setDepth(4).setTint(0xf0d0a0);
    this.add.image(310, 326, 'l9_puppy').setDisplaySize(64, 56).setDepth(4).setTint(0xd8b088);

    this.buildTopBanner('LEVEL 9 · PART 1', '🎀 Unwrapping Time!', 'Tap each gift to open it');
    this.buildHearts();
    this.buildScore();
    this._progress = this.buildProgressBar('🎁 GIFTS OPENED', this._total);

    this._buildGifts();

    this.time.delayedCall(400, () => this.toast('🎀 Tap each wrapped gift to open it!', 2600));
  }

  _buildGifts() {
    // lay the gifts out in a tidy 2-row grid on the floor / rug
    const cols = Math.min(4, this._total);
    const rows = Math.ceil(this._total / cols);
    const gapX = 120, gapY = 96;
    const startX = W / 2 - ((cols - 1) * gapX) / 2 + 60;   // nudge right of the watchers
    const startY = 230;

    this._gifts = [];
    for (let i = 0; i < this._total; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const gx = startX + col * gapX, gy = startY + row * gapY;
      const tex = WRAP_TEX[i % WRAP_TEX.length];

      const glow = this.add.image(gx, gy, 'l9_glow').setScale(0.5).setAlpha(0.3).setDepth(9).setTint(0xffe6a0);
      this.tweens.add({ targets: glow, alpha: 0.55, scale: 0.7, duration: 900, yoyo: true, repeat: -1 });
      const box = this.add.image(gx, gy, tex).setDisplaySize(64, 64).setDepth(10);
      this.tweens.add({ targets: box, y: gy - 6, duration: 800 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const tap = this.add.text(gx, gy + 40, '👆 open', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7a5a3a' }).setOrigin(0.5).setDepth(10);

      const gift = { gx, gy, box, glow, tap, opened: false };
      const hit = this.add.rectangle(gx, gy, 70, 80, 0, 0).setDepth(11).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (!gift.opened) box.setScale(box.scaleX * 1.06); });
      hit.on('pointerout',  () => { if (!gift.opened) box.setDisplaySize(64, 64); });
      hit.on('pointerdown', () => this._openGift(gift, i, hit));
      this._gifts.push(gift);
    }
  }

  _openGift(gift, i, hit) {
    if (gift.opened || this._done) return;
    gift.opened = true;
    hit.disableInteractive();
    gift.tap.destroy();
    this.tweens.killTweensOf(gift.box);
    this.tweens.killTweensOf(gift.glow);

    // little shake, then pop to the opened box + surprise springing out
    this.tweens.add({ targets: gift.box, angle: 8, duration: 60, yoyo: true, repeat: 2, onComplete: () => {
      gift.box.setTexture('l9_gift_open').setDisplaySize(64, 64).setAngle(0);
      this.confetti(gift.gx, gift.gy - 10);
      this.sparkleBurst(gift.gx, gift.gy, 14);
      this.cameras.main.shake(120, 0.004);

      const stex = SURPRISES[i % SURPRISES.length];
      const surprise = this.add.image(gift.gx, gift.gy, stex).setDisplaySize(40, 40).setDepth(12).setScale(0.2);
      this.tweens.add({ targets: surprise, y: gift.gy - 34, scaleX: 1, scaleY: 1, duration: 420, ease: 'Back.easeOut' });
      this.tweens.add({ targets: surprise, y: gift.gy - 40, duration: 900, yoyo: true, repeat: -1, delay: 420, ease: 'Sine.easeInOut' });
      gift.glow.setAlpha(0.5);

      this.addScore(120);
      this._opened++;
      this._progress(this._opened);
      if (this._opened >= this._total) this.time.delayedCall(700, () => this._allOpened());
      else this.toast(`🎉 ${this._opened} / ${this._total} opened!`, 1000);
    }});
  }

  _allOpened() {
    if (this._done) return;
    this._done = true;
    this.addScore(200);
    for (let k = 0; k < 4; k++) this.time.delayedCall(k * 220, () => this.confetti(Phaser.Math.Between(180, 620), 120));
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x1c4a2e, 0).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: ov, alpha: 0.45, duration: 500 });
    this.add.text(W / 2, H / 2 - 30, '🎉 All Gifts Opened!', { fontSize: '30px', fontFamily: 'Georgia, serif', color: '#ffe6a0', stroke: '#0a1a0e', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.text(W / 2, H / 2 + 14, "Now let's find bows for the puppies!", { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);

    // Continue button (so the player enjoys the moment, then taps on)
    const bx = W / 2 - 110, by = H / 2 + 50, bw = 220, bh = 40;
    const g = this.add.graphics().setScrollFactor(0).setDepth(111);
    const draw = (h) => { g.clear(); g.fillStyle(h ? 0x3a9a5e : L9.GREEN, 1); g.fillRoundedRect(bx, by, bw, bh, 11); g.lineStyle(2, L9.GOLD, 0.9); g.strokeRoundedRect(bx, by, bw, bh, 11); };
    draw(false);
    const t = this.add.text(W / 2, by + bh / 2, '🎀  Go find the bows →', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(112);
    const hit = this.add.rectangle(W / 2, by + bh / 2, bw, bh, 0, 0).setScrollFactor(0).setDepth(113).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true)); hit.on('pointerout', () => draw(false));
    hit.on('pointerup', () => this._goBow());
    this.tweens.add({ targets: t, alpha: { from: 0.6, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
    // safety auto-advance if the player just waits
    this.time.delayedCall(7000, () => this._goBow());
  }

  _goBow() {
    if (this._advanced) return;
    this._advanced = true;
    this.goToScene('L9_BowRun');
  }
}

import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L9BaseScene, L9 } from './L9BaseScene.js';
import { generateL9Assets } from './L9Assets.js';
import { showStoryCard } from '../../../utils/VideoOverlay.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — PART 1 · STAGE 2: "Unwrapping!"  🎀
//
// A cosy living room. The 7 puppies (same roster as the Bow-Tie finale) each
// wait with their own wrapped gift in front of them. Tap a gift to unwrap it —
// it pops open with confetti and a surprise (toy, treat, candy cane, ornament)
// springs out. When every gift is open → celebration → the Bow Run (Part 2).
//
// A calm tap-interaction scene (no running), mirroring the Level-8 Feeding scene.
// ════════════════════════════════════════════════════════════════════════════

const PUPS = ['Max', 'Bella', 'Coco', 'Milo', 'Daisy', 'Luna', 'Teddy'];
const WRAP_TEX = ['l9_gift_red', 'l9_gift_green', 'l9_gift_gold', 'l9_gift_blue', 'l9_gift_pink', 'l9_gift_purple', 'l9_gift_white', 'l9_gift_stripe'];
const SURPRISES = ['l9_toy_ball', 'l9_toy_bone', 'l9_candy', 'l9_ornament', 'l9_star'];

export class L9_UnwrapScene extends L9BaseScene {
  constructor() { super('L9_Unwrap'); }

  // Real bg/ground art (see L9_GiftRunScene/L9_BowRunScene) — loaded here too
  // so a debug-menu jump straight into this scene can't beat the other Level 9
  // scenes to generateL9Assets() and lock in the procedural fallback instead.
  preload() {
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l9_sky',          'assets/images/level 09/bg-l9.jpg');
    load('l9_ground',       'assets/images/level 09/bottom-l9.jpg');
    load('l9_puppy_real',   'assets/images/level 09/puppy-without-bow.png');
    load('l9_room_bg_real', 'assets/images/level 09/after-decoration.png');
  }

  create() {
    generateL9Assets(this);
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this._done = false;

    this.buildRoomBg();

    this._total = PUPS.length;
    this._opened = 0;

    this.buildTopBanner('LEVEL 9 · PART 1', '🎀 Unwrapping Time!', 'Tap each gift to open it');
    this.buildHearts();
    this.buildScore();
    this._progress = this.buildProgressBar('🎁 GIFTS OPENED', this._total);

    this._buildGifts();

    this.time.delayedCall(400, () => this.toast('🎀 Tap each wrapped gift to open it!', 2600));
  }

  // Same row placement as Level 8's Feeding scene / the Bow-Tie finale (fixed
  // 92px gap, anchored near the bottom, real puppy art at 51×96) — each puppy
  // gets its own gift floating in front of it, ready to be tapped open.
  _buildGifts() {
    const startX = 130, gap = 92, py = H - 96;
    const pupSrc = this.textures.get('l9_puppy_real').getSourceImage();
    const pupRatio = pupSrc.width / pupSrc.height;
    const pupH = 96, pupW = pupH * pupRatio;

    this._gifts = [];
    PUPS.forEach((name, i) => {
      const x = startX + i * gap;

      // the waiting puppy
      this.add.ellipse(x, py + 34, 62, 14, 0x000000, 0.14).setDepth(4);
      const pup = this.add.image(x, py, 'l9_puppy_real').setDisplaySize(pupW, pupH).setDepth(6);
      this.tweens.add({ targets: pup, y: py - 4, duration: 900 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const plate = this.add.graphics().setDepth(6);
      plate.fillStyle(0x1c4a2e, 0.9); plate.fillRoundedRect(x - 34, py + 30, 68, 18, 6);
      plate.lineStyle(1.5, L9.GOLD, 0.8); plate.strokeRoundedRect(x - 34, py + 30, 68, 18, 6);
      this.add.text(x, py + 39, name, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setDepth(7);

      // its gift, floating in front of it
      const gx = x, gy = py - pupH / 2 - 34;
      const tex = WRAP_TEX[i % WRAP_TEX.length];
      const glow = this.add.image(gx, gy, 'l9_glow').setScale(0.5).setAlpha(0.3).setDepth(9).setTint(0xffe6a0);
      this.tweens.add({ targets: glow, alpha: 0.55, scale: 0.7, duration: 900, yoyo: true, repeat: -1 });
      const box = this.add.image(gx, gy, tex).setDisplaySize(52, 52).setDepth(10);
      this.tweens.add({ targets: box, y: gy - 6, duration: 800 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const tap = this.add.text(gx, gy - 36, '👆 open', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7a5a3a' }).setOrigin(0.5).setDepth(10);

      const gift = { gx, gy, box, glow, tap, opened: false };
      const hit = this.add.rectangle(gx, gy, 58, 66, 0, 0).setDepth(11).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (!gift.opened) box.setScale(box.scaleX * 1.06); });
      hit.on('pointerout',  () => { if (!gift.opened) box.setDisplaySize(52, 52); });
      hit.on('pointerdown', () => this._openGift(gift, i, hit));
      this._gifts.push(gift);
    });
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
      gift.box.setTexture('l9_gift_open').setDisplaySize(52, 52).setAngle(0);
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
    this.playStoryVideos(['l9_gift_open'], () => {
      showStoryCard(this, "🎁 Gifts opened with joy...\nnow let's find the perfect bows! 🎀", () => {
        this.playStoryVideos(['l9_bow_intro'], () => this.goToScene('L9_BowRun'));
      });
    });
  }
}

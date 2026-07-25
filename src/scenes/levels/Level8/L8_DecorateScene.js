import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 7+8 — DECORATE THE HOME  →  HAPPY PUPPY HOME!
// Magic Bag Reveal: tap the enchanted sack to reveal each collected Christmas
// prop one at a time. Once all six have appeared, tap the center of the
// screen to cast the final spell — an instant full-screen transformation
// swaps the bare room for the fully decorated Christmas scene.
// ════════════════════════════════════════════════════════════════════════════
const PROPS_DIR = 'assets/images/level8/christmas props/';
const PROPS = [
  { tex: 'l8_prop_garland',   file: '03.png', label: '🎄 Garland' },
  { tex: 'l8_prop_tree',      file: '04.png', label: '🎄 Christmas Tree' },
  { tex: 'l8_prop_wreath',    file: '05.png', label: '🎄 Wreath' },
  { tex: 'l8_prop_stockings', file: '06.png', label: '🧦 Stockings' },
  { tex: 'l8_prop_lights',    file: '07.png', label: '✨ Fairy Lights' },
  { tex: 'l8_prop_lantern',   file: '08.png', label: '🏮 Lantern' },
];
const MAGIC_TAPS_NEEDED = 5;

export class L8_DecorateScene extends L8BaseScene {
  constructor() { super('L8_Decorate'); }

  preload() {
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l8_deco_bg_before', `${PROPS_DIR}before-decoration.png`);
    load('l8_deco_bg_after',  `${PROPS_DIR}after-decoration.png`);
    load('l8_magic_bag',      'assets/images/level8/bag.png');
    PROPS.forEach(p => load(p.tex, `${PROPS_DIR}${p.file}`));
  }

  create() {
    generateL8Assets(this);
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this._revealIdx = 0;
    this._revealing = false;
    this._bagDone = false;
    this._magicTaps = 0;
    this._finished = false;
    this._done = false;

    this._bg = this.add.image(W / 2, H / 2, 'l8_deco_bg_before').setDisplaySize(W, H).setDepth(-40);

    this.buildTopBanner(7, 'Decorate the Home', 'Tap the magic bag to reveal each decoration!');
    this.buildHearts();
    this._setCount = this.buildCounterPill('🎁', 'PROPS REVEALED', PROPS.length);

    this._buildBag();

    this.time.delayedCall(400, () => this.toast('✨ Tap the magic bag to reveal a decoration!'));
  }

  // ── Step 1: Magic Bag Reveal ─────────────────────────────────────────────
  _buildBag() {
    const bagSrc = this.textures.get('l8_magic_bag').getSourceImage();
    const bagH = 190, bagW = bagH * (bagSrc.width / bagSrc.height);
    const bx = W / 2, by = 265;

    this._bagGlow = this.add.circle(bx, by, 95, 0xffe27a, 0.2).setDepth(9);
    this.tweens.add({ targets: this._bagGlow, alpha: 0.36, scale: 1.15, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this._bagImg = this.add.image(bx, by, 'l8_magic_bag').setDisplaySize(bagW, bagH).setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: this._bagImg, y: by - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this._bagImg.on('pointerdown', () => this._onBagTap());

    this._bagLabel = this.add.text(bx, by + bagH / 2 + 30, '👆 Tap the Magic Bag!', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: this._bagLabel, alpha: 0.45, duration: 650, yoyo: true, repeat: -1 });

    this._bagSparkleEvt = this.time.addEvent({ delay: 650, loop: true, callback: () => {
      if (this._bagDone) { this._bagSparkleEvt.remove(); return; }
      const s = this.add.image(bx + Phaser.Math.Between(-36, 36), by - bagH / 2 + 10, 'l8_spark')
        .setScale(0.45).setAlpha(0.85).setDepth(11);
      this.tweens.add({ targets: s, y: s.y - 26, alpha: 0, duration: 800, onComplete: () => s.destroy() });
    }});
  }

  _onBagTap() {
    if (this._revealing || this._bagDone || this._busy) return;
    this._revealing = true;
    this.tweens.add({ targets: this._bagImg, scaleX: this._bagImg.scaleX * 1.1, scaleY: this._bagImg.scaleY * 0.9, duration: 100, yoyo: true, ease: 'Quad.easeOut' });
    this.cameras.main.flash(90, 255, 240, 190, false);
    this.sparkleBurst(this._bagImg.x, this._bagImg.y - 60, 14, false);
    this.time.delayedCall(160, () => this._revealProp());
  }

  _revealProp() {
    const p = PROPS[this._revealIdx];
    const src = this.textures.get(p.tex).getSourceImage();
    const targetH = 210, targetW = targetH * (src.width / src.height);
    const cx = W / 2, cy = H / 2 - 15;

    const glow = this.add.rectangle(cx, cy, targetW + 40, targetH + 40, 0xfff3c4, 0.4).setDepth(29).setScale(0);
    this.tweens.add({ targets: glow, scale: 1, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => glow.destroy() });

    const img = this.add.image(cx, cy, p.tex).setDepth(30).setAlpha(0).setScale(0);
    this._revealImg = img;
    this.sparkleBurst(cx, cy, 20, false);

    const label = this.add.text(cx, cy + targetH / 2 + 24, p.label, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(31).setAlpha(0);
    this._revealLabel = label;

    this.tweens.add({
      targets: img, alpha: 1, scaleX: targetW / src.width, scaleY: targetH / src.height,
      duration: 420, ease: 'Back.easeOut',
      onComplete: () => {
        this.addScore(150);
        this._revealIdx++;
        this._setCount(this._revealIdx);
        this.toast(`${p.label} revealed! (${this._revealIdx}/${PROPS.length})`, 1200);
        this.time.delayedCall(950, () => this._dismissProp());
      }
    });
    this.tweens.add({ targets: label, alpha: 1, duration: 300, delay: 320 });
  }

  _dismissProp() {
    const img = this._revealImg, label = this._revealLabel;
    if (!img) return;
    this.sparkleBurst(img.x, img.y, 16, false);
    this.tweens.add({
      targets: [img, label], alpha: 0, scale: 0.5, y: '-=36', duration: 380, ease: 'Cubic.easeIn',
      onComplete: () => {
        img.destroy(); label?.destroy();
        this._revealImg = null; this._revealLabel = null;
        this._revealing = false;
        if (this._revealIdx >= PROPS.length) this._finishBag();
      }
    });
  }

  _finishBag() {
    this._bagDone = true;
    this.toast('🎉 All decorations revealed!', 1400);
    this.time.delayedCall(700, () => {
      this._bagImg.disableInteractive();
      this.tweens.add({
        targets: [this._bagImg, this._bagGlow, this._bagLabel], alpha: 0, y: '-=40', duration: 500,
        onComplete: () => {
          this._bagImg.destroy(); this._bagGlow.destroy(); this._bagLabel.destroy();
          this._startMagicCasting();
        }
      });
    });
  }

  // ── Step 2: Final Magic Decoration ───────────────────────────────────────
  _startMagicCasting() {
    this._magicTaps = 0;
    this.toast('🪄 Tap anywhere to cast magic!', 1800);

    this._castPrompt = this.add.text(W / 2, H - 46, '🪄 Tap anywhere to cast magic!', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 3
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: this._castPrompt, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });

    this._castZone = this.add.rectangle(W / 2, H / 2, W, H, 0, 0).setDepth(14).setInteractive({ useHandCursor: true });
    this._castZone.on('pointerdown', (pointer) => this._onMagicTap(pointer));
  }

  _onMagicTap(pointer) {
    if (this._finished || this._busy) return;
    const x = pointer?.x ?? W / 2, y = pointer?.y ?? H / 2;
    this._magicTaps++;
    this.addScore(40);

    this.cameras.main.flash(90, 255, 245, 210, false);
    this.sparkleBurst(x, y, 18, false);

    const ring = this.add.circle(x, y, 14, 0xffe27a, 0).setDepth(16);
    ring.setStrokeStyle(4, 0xffe27a, 0.9);
    this.tweens.add({ targets: ring, scale: 6, alpha: 0, duration: 550, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const star = this.add.image(x, y, 'l8_star').setScale(0.5).setDepth(17)
        .setTint([0xffe27a, 0xff9ec4, 0x9ecfff, 0xb0f0a0][i % 4]);
      this.tweens.add({ targets: star, x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60, alpha: 0, scale: 0.9, angle: 180, duration: 600, ease: 'Cubic.easeOut', onComplete: () => star.destroy() });
    }

    if (this._magicTaps >= MAGIC_TAPS_NEEDED) this._triggerFinalTransformation();
    else this.toast(`✨ Casting magic... (${this._magicTaps}/${MAGIC_TAPS_NEEDED})`, 800);
  }

  _triggerFinalTransformation() {
    this._finished = true;
    this._castZone?.disableInteractive();
    this.time.delayedCall(150, () => {
      this._castZone?.destroy(); this._castPrompt?.destroy();
      this._playFinalTransition();
    });
  }

  // ── Step 3: Full-Screen Decoration Reveal ────────────────────────────────
  _playFinalTransition() {
    this.cameras.main.shake(320, 0.01);
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 110, () => this.sparkleBurst(W / 2, H / 2, 28, false));

    for (let i = 0; i < 26; i++) {
      this.time.delayedCall(i * 26, () => {
        const sx = Phaser.Math.Between(0, W);
        const star = this.add.image(sx, -20, 'l8_star').setScale(Phaser.Math.FloatBetween(0.35, 0.85)).setDepth(201).setAlpha(0.95);
        this.tweens.add({ targets: star, y: H + 20, angle: 340, duration: Phaser.Math.Between(800, 1400), onComplete: () => star.destroy() });
      });
    }

    const glow = this.add.rectangle(W / 2, H / 2, W, H, 0xfff3c4, 0).setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: glow, alpha: 0.92, duration: 320, yoyo: true, onComplete: () => glow.destroy() });

    this.cameras.main.flash(650, 255, 255, 255, false);

    this.time.delayedCall(360, () => {
      this._bg.setTexture('l8_deco_bg_after').setDisplaySize(W, H);
    });

    this.time.delayedCall(1500, () => {
      this.toast('🏠🎄 The home is beautifully decorated!', 1800);
      this.time.delayedCall(1500, () => this._finish());
    });
  }

  // ── Celebration + level complete ──────────────────────────────────────────
  _finish() {
    if (this._done) return;
    this._done = true;
    this.toast('🎉 The home is ready!', 1400);
    this.time.delayedCall(700, () => this._celebrate());
  }

  _celebrate() {
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0xfff6e8, 0).setDepth(50);
    this.tweens.add({ targets: ov, alpha: 0.2, duration: 500 });

    this.add.text(W / 2, 120, '🎄 Home Sweet Home! 🎄', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 5
    }).setOrigin(0.5).setDepth(57);
    this.add.text(W / 2, 154, 'Merry & Bright, All Decorated!', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#e0567a', stroke: '#fff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(57);

    // floating festive hearts
    this._heartTimer = this.time.addEvent({ delay: 260, loop: true, callback: () => {
      const h = this.add.image(Phaser.Math.Between(120, 700), H - 40, 'l8_heart').setScale(0.5).setDepth(56);
      this.tweens.add({ targets: h, y: h.y - 150, alpha: 0, duration: 1500, onComplete: () => h.destroy() });
    }});

    this.time.delayedCall(2000, () => {
      if (this._heartTimer) this._heartTimer.remove();
      this.playStoryVideos(['l8_end'], () => this._levelComplete());
    });
  }

  _levelComplete() {
    const score = this.registry.get('l8_score') ?? 0;
    const stars = score >= 2600 ? 3 : score >= 1700 ? 2 : 1;
    this.registry.set('l8_complete', true);
    this.registry.set('l8_stars', stars);

    const { td, py, ph } = this.openPanel('🏆 Level Complete!', 'Puppy Care Day done!', { w: 440, h: 280 });
    // stars
    for (let i = 0; i < 3; i++) {
      const s = this.add.image(W / 2 - 60 + i * 60, py + 110, 'l8_star').setScale(0).setDepth(103);
      td.push(s);
      this.time.delayedCall(300 + i * 220, () => {
        this.tweens.add({ targets: s, scale: i < stars ? 1.4 : 0.9, duration: 350, ease: 'Back.easeOut' });
        if (i < stars) { s.setTint(0xffffff); this.sparkleBurst(s.x, s.y, 8, false); }
        else s.setTint(0x999999);
      });
    }
    td.push(this.add.text(W / 2, py + 158, `Score  ${score}`, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 36, '🐾  Finish', 0x6ad06a, () => {
      if (this._heartTimer) this._heartTimer.remove();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(740, () => { this._wakeLoop(); this.scene.start('EndScene'); });
    }, 200, 46);
  }
}

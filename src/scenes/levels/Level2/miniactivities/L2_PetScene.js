import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { createTrustMeter, addBondAtmosphere } from './L2_TrustMeter.js';

// L2 Mini-Activity 2 — Pet Gemma: tap 5 times to reach 50% trust
export class L2_PetScene extends Phaser.Scene {
  constructor() { super('L2_Pet'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.5).setTint(0x121a14).setDepth(-5);
    }
    // Warm bonding vignette
    this.add.rectangle(400, 225, 800, 450, 0x1a0a14, 0.42).setDepth(-4);
    this.add.rectangle(400, 40, 800, 90, 0x000000, 0.45).setDepth(-3);
    this.add.rectangle(400, 430, 800, 60, 0x000000, 0.45).setDepth(-3);
    this.add.tileSprite(400, H - 11, 800, 70, 'ground').setTileScale(0.14, 0.14).setDepth(5);

    // Soft aura + floating hearts behind characters
    addBondAtmosphere(this, { auraX: 430, auraY: 360 });

    // Title panel
    const tp = this.add.graphics().setDepth(20);
    tp.fillStyle(0x1a0a12, 0.92); tp.fillRoundedRect(150, 12, 500, 38, 12);
    tp.lineStyle(2, 0xff88bb, 0.6); tp.strokeRoundedRect(150, 12, 500, 38, 12);
    this.add.text(400, 31, '🐾 Pet Gemma to build trust!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#3a0820', strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);

    // Polished trust meter (0% → 50%)
    this._trust = createTrustMeter(this, W / 2, 78, { w: 330, startPct: 0 });

    // Gleeda + Gemma — grass surface at y=418; +4/+3 compensates PNG transparent bottom padding
    this.add.image(160, 422, 'gleeda_idle').setDisplaySize(120, 70).setOrigin(0.5, 1).setDepth(8);
    this._gemmaImg = this.add.image(500, 421, 'gemma_happy').setDisplaySize(140, 77).setOrigin(0.5, 1).setDepth(8);

    // Tap hint arrows above Gemma
    const arrow = this.add.text(500, 315, '👇 TAP!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: arrow, y: 325, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    // Invisible tap button over Gemma (centered on Gemma: bottom 421, height 77 → center ~383)
    const gBtn = this.add.rectangle(500, 383, 160, 90, 0xffffff, 0.01)
      .setDepth(25).setInteractive({ useHandCursor: true });

    // Pulsing glow around Gemma
    const glow = this.add.circle(500, 383, 70, 0xffcc44, 0.1).setDepth(7);
    this.tweens.add({ targets: glow, alpha: 0.22, scaleX: 1.15, scaleY: 1.15, duration: 700, yoyo: true, repeat: -1 });

    this._taps = 0;
    this._done = false;

    const doTap = () => {
      if (this._done || this._taps >= 5) return;
      this._taps++;
      const pct = this._taps * 10;   // 5 taps → 50% trust
      this._trust.setPct(pct);
      this.cameras.main.shake(55, 0.004);

      // Bounce Gemma — kill prior tween first so y never drifts
      this.tweens.killTweensOf(this._gemmaImg);
      this._gemmaImg.y = 421;
      this.tweens.add({ targets: this._gemmaImg, y: 408, duration: 150, yoyo: true });

      // Paw popup
      const paw = this.add.text(
        500 + (Math.random() - 0.5) * 70, 290, '🐾',
        { fontSize: '22px' }
      ).setDepth(30);
      this.tweens.add({ targets: paw, y: paw.y - 50, alpha: 0, duration: 700, onComplete: () => paw.destroy() });

      // Heart every 2 taps
      if (this._taps % 2 === 0) {
        const h = this.add.image(500, 310, 'heart').setDepth(28).setScale(0.7);
        this.tweens.add({ targets: h, y: 260, alpha: 0, duration: 900, onComplete: () => h.destroy() });
      }

      if (this._taps >= 5) {
        this._done = true;
        arrow.destroy();
        this.cameras.main.flash(400, 120, 50, 100);

        const total = (this.registry.get('points') || 0) + 2;
        this.registry.set('points', total);
        this.add.text(W / 2, H / 2 - 30, '💛 Gemma feels safe!', {
          fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a',
          stroke: '#1a0802', strokeThickness: 3
        }).setOrigin(0.5).setDepth(40);
        this.add.text(W / 2, H / 2 + 4, `+2 ⭐   (Total: ${total})`, {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd86a',
          stroke: '#1a0802', strokeThickness: 3
        }).setOrigin(0.5).setDepth(40);

        this.time.delayedCall(2200, () => {
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.time.delayedCall(650, () => this.scene.start('L2_Rhythm'));
        });
      }
    };

    gBtn.on('pointerdown', doTap);
    const spKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spKey.on('down', doTap);

    this.time.delayedCall(700, () => {
      const hint = this.add.text(W / 2, H - 55, 'TAP Gemma or press SPACE  (5 times)', {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c9956b', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: hint, alpha: 0, delay: 3000, duration: 800, onComplete: () => hint.destroy() });
    });
  }
}

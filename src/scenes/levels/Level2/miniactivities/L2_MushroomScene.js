import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { BaseLevelScene } from '../../BaseLevelScene.js';

// L2 Mini-Activity B — Mushroom Glow
// Collect 4 glowing mushrooms in the dark jungle, then return them to Gemma.
export class L2_MushroomScene extends BaseLevelScene {
  constructor() { super('L2_Mushroom'); }

  create() {
    const config = {
      worldWidth: 2200,
      startX: 220, startY: 370,
      timer: 65,
      character: 'gleeda',
      chapterName: 'Bonus — Light the Dark Path!',
      objective: 'Collect 4 glowing mushrooms and\nbring them back to Gemma! 🍄',
      platforms: [
        { x:  480, y: 308, w: 72, h: 14 },
        { x:  880, y: 278, w: 72, h: 14 },
        { x: 1300, y: 300, w: 72, h: 14 },
        { x: 1720, y: 272, w: 72, h: 14 },
      ],
      gaps: [
        { x:  615, w: 100 },
        { x: 1065, w: 108 },
        { x: 1490, w: 100 },
      ],
      rocks: [],
    };

    this.initLevel(config);

    // ── Generate mushroom sprite ──────────────────────────────────────────
    if (!this.textures.exists('mush_glow')) {
      const mg = this.make.graphics({ add: false });
      mg.fillStyle(0x33cc66, 1);
      mg.fillEllipse(20, 13, 38, 24);
      mg.fillStyle(0x55ff99, 0.55);
      mg.fillEllipse(14, 9, 16, 10);
      mg.fillStyle(0x22aa44, 1);
      mg.fillRect(14, 22, 12, 14);
      mg.fillStyle(0x88ffcc, 0.3);
      mg.fillRect(16, 23, 6, 3);
      mg.lineStyle(2, 0x115522, 0.7);
      mg.strokeEllipse(20, 13, 38, 24);
      mg.generateTexture('mush_glow', 40, 36);
      mg.destroy();
    }

    // Dark jungle atmosphere
    this.cameras.main.setBackgroundColor('#030806');
    this.add.rectangle(W / 2, H / 2, W * 4, H, 0x010503, 0.78).setScrollFactor(0).setDepth(-3);

    if (this.textures.exists('jungle_bg')) {
      this.add.tileSprite(W / 2, H / 2, W, H, 'jungle_bg')
        .setScrollFactor(0).setDepth(-5).setAlpha(0.4).setTint(0x061206);
    }

    // Ambient candles
    [200, 560, 920, 1270, 1620, 1960].forEach(cx => {
      const c = this.add.text(cx, H - 52, '🕯️', { fontSize: '17px' }).setDepth(7);
      this.tweens.add({ targets: c, alpha: 0.3, duration: 380 + Math.random() * 260, yoyo: true, repeat: -1 });
    });

    // Hanging vines
    [340, 730, 1140, 1540, 1880].forEach(vx => {
      const vine = this.add.graphics().setDepth(6);
      vine.lineStyle(3, 0x1a3a0a, 0.55);
      vine.lineBetween(vx, 0, vx + (Math.random() - 0.5) * 28, H - 80);
    });

    // ── Gemma on the left, waiting in the dark ────────────────────────────
    this._gemmaX = 70;
    this._gemmaY = H - 32;

    this._gemmaImg = this.add.image(this._gemmaX, this._gemmaY, 'gemma_idle')
      .setDisplaySize(110, 62).setOrigin(0.5, 1).setDepth(9).setTint(0x88bbaa);
    this.tweens.add({
      targets: this._gemmaImg, y: this._gemmaY - 5,
      duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Scared bubble
    this._bubbleTxt = this.add.text(this._gemmaX + 14, this._gemmaY - 80, '😨 It\'s dark!', {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#88ffaa', stroke: '#010803', strokeThickness: 2,
      backgroundColor: '#010e05', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: this._bubbleTxt, y: this._gemmaY - 86, duration: 750, yoyo: true, repeat: -1 });

    // Glow under Gemma (activates after all mushrooms collected)
    this._gemmaGlow = this.add.circle(this._gemmaX, this._gemmaY - 10, 44, 0x44ff88, 0).setDepth(8);

    // Return trigger zone
    this._returnZone = this.physics.add.staticImage(this._gemmaX + 80, this._gemmaY - 40, null)
      .setSize(80, 90).setAlpha(0).refreshBody();

    // ── 4 glowing mushrooms on platforms ─────────────────────────────────
    const mushDefs = [
      { x:  480, y: 284 },
      { x:  880, y: 254 },
      { x: 1300, y: 276 },
      { x: 1720, y: 248 },
    ];

    this._collected  = 0;
    this._readyReturn = false;
    this._levelDone  = false;

    this._mushHUD = this.add.text(W - 16, 16, '🍄 0 / 4', {
      fontSize: '15px', fontFamily: 'Georgia, serif',
      color: '#88ff99', stroke: '#020a02', strokeThickness: 2
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(35);

    mushDefs.forEach((md, i) => {
      const mush  = this.physics.add.staticImage(md.x, md.y, 'mush_glow')
        .setDisplaySize(40, 36).setDepth(9).refreshBody();
      const glow  = this.add.ellipse(md.x, md.y + 14, 58, 16, 0x44ff88, 0.38).setDepth(8);
      const light = this.add.circle(md.x, md.y, 42, 0x44ff88, 0.07).setDepth(7);

      this.tweens.add({ targets: mush, y: md.y - 9, duration: 760 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: glow,  scaleX: 1.4, alpha: 0.6, duration: 730 + i * 80, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: light, scaleX: 1.6, scaleY: 1.6, alpha: 0.14, duration: 900 + i * 100, yoyo: true, repeat: -1 });

      this.physics.add.overlap(this.shadow, mush, () => {
        if (mush.getData('taken')) return;
        mush.setData('taken', true);
        mush.destroy(); glow.destroy(); light.destroy();
        this._onMushroomCollected(md.x, md.y);
      });
    });

    // Return trigger
    this.physics.add.overlap(this.shadow, this._returnZone, () => {
      if (!this._levelDone && this._readyReturn) {
        this._levelDone = true;
        this._deliverMushrooms();
      } else if (!this._levelDone && this._collected > 0 && !this._readyReturn && !this._hintedReturn) {
        this._hintedReturn = true;
        this._showMessage('Collect all 4 mushrooms first! 🍄');
      }
    });

    this.time.delayedCall(900, () =>
      this._showMessage('The jungle is dark! Collect 4 glowing mushrooms then bring them back! 🍄')
    );
  }

  _onMushroomCollected(mx, my) {
    this._collected++;
    this._mushHUD.setText(`🍄 ${this._collected} / 4`);
    this.cameras.main.flash(200, 20, 120, 40);

    const pop = this.add.text(mx, my - 20, '+1 🍄', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#88ff99', stroke: '#020a02', strokeThickness: 3
    }).setDepth(22);
    this.tweens.add({ targets: pop, y: pop.y - 60, alpha: 0, duration: 850, onComplete: () => pop.destroy() });

    const ripple = this.add.circle(mx, my, 18, 0x44ff88, 0.7).setDepth(20);
    this.tweens.add({ targets: ripple, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 500, onComplete: () => ripple.destroy() });

    if (this._collected >= 4) {
      this._readyReturn = true;
      this._mushHUD.setText('🍄 4 / 4 ✓ — Return to Gemma!').setColor('#88ff44');
      this._showMessage('All mushrooms found! Run back to Gemma! 💛', 3000);

      // Gemma glows brightly to guide player back
      this.tweens.add({
        targets: this._gemmaGlow,
        alpha: { from: 0.18, to: 0.6 }, scaleX: { from: 1, to: 1.6 }, scaleY: { from: 1, to: 1.6 },
        duration: 480, yoyo: true, repeat: -1
      });

      // Arrow pointer above player
      this._returnArrow = this.add.text(this.shadow.x, this.shadow.y - 55, '◀ Go back!', {
        fontSize: '14px', fontFamily: 'Georgia, serif',
        color: '#88ff99', stroke: '#010803', strokeThickness: 2
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: this._returnArrow, alpha: 0.3, duration: 480, yoyo: true, repeat: -1 });
    }
  }

  _deliverMushrooms() {
    if (this._returnArrow) this._returnArrow.destroy();
    this._bubbleTxt.setText('💛 I can see now!');
    this._gemmaGlow.destroy();
    this.shadow.setVelocityX(0);
    this._mushHUD.setText('🍄 4 / 4  ✓').setColor('#88ff44');

    // Gemma bounces happily
    this.tweens.add({
      targets: this._gemmaImg, y: '-=18',
      duration: 220, yoyo: true, repeat: 4
    });

    // Green sparkle burst
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 90, () => {
        const spark = this.add.ellipse(
          this._gemmaX + (Math.random() - 0.5) * 80,
          this._gemmaY - 30 + (Math.random() - 0.5) * 40,
          14, 14, 0x44ff88, 0.9
        ).setDepth(60);
        this.tweens.add({ targets: spark, y: spark.y - 80, alpha: 0, scaleX: 3, scaleY: 3, duration: 900, onComplete: () => spark.destroy() });
      });
    }

    // Heart burst
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 120, () => {
        const h = this.add.image(
          this._gemmaX + (Math.random() - 0.5) * 60,
          this._gemmaY - 30, 'heart'
        ).setDepth(60).setScale(0.7);
        this.tweens.add({ targets: h, y: h.y - 80, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
      });
    }

    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(700, 20, 180, 60);
    this._showMessage('Path lit! 🍄 Gemma can see the jungle now! 🌑', 3000);
    this._givePoints(3);

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => {
        this.registry.set('l2_resumeZone', 3);
        this.scene.start('Level2');
      });
    });
  }

  update() {
    if (this._returnArrow && this.shadow) {
      this._returnArrow.setPosition(this.shadow.x, this.shadow.y - 55);
    }
    this._updateBgParallax();
    this.updateMovement();
  }
}

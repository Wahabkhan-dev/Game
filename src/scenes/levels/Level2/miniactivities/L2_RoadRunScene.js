import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { BaseLevelScene } from '../../BaseLevelScene.js';

// L2 Mini-Activity A — Road Run
// Collect 4 supply bags Gemma dropped, then return them to her.
export class L2_RoadRunScene extends BaseLevelScene {
  constructor() { super('L2_RoadRun'); }

  create() {
    const config = {
      worldWidth: 2200,
      startX: 220, startY: 370,
      timer: 65,
      character: 'gleeda',
      chapterName: 'Bonus — Collect Gemma\'s Supplies!',
      objective: 'Gemma dropped 4 bags while running!\nCollect them all and bring them back to her! 🎒',
      platforms: [
        { x:  520, y: 310, w: 72, h: 14 },
        { x:  920, y: 278, w: 72, h: 14 },
        { x: 1330, y: 300, w: 72, h: 14 },
        { x: 1750, y: 270, w: 72, h: 14 },
      ],
      gaps: [
        { x:  650, w: 100 },
        { x: 1100, w: 108 },
        { x: 1530, w: 100 },
      ],
      rocks: [],
    };

    this.initLevel(config);

    // ── Generate bag sprite ───────────────────────────────────────────────
    if (!this.textures.exists('supply_bag')) {
      const bg = this.make.graphics({ add: false });
      bg.fillStyle(0x8B4513, 1);
      bg.fillRoundedRect(2, 10, 26, 22, 4);
      bg.fillStyle(0x5a2a08, 1);
      bg.fillRoundedRect(8, 2, 14, 11, 3);
      bg.fillStyle(0xD2691E, 0.7);
      bg.fillRect(4, 11, 22, 5);
      bg.fillStyle(0xffcc88, 0.35);
      bg.fillRect(6, 13, 10, 2);
      bg.lineStyle(2, 0x3a1a04, 0.8);
      bg.strokeRoundedRect(2, 10, 26, 22, 4);
      bg.generateTexture('supply_bag', 30, 34);
      bg.destroy();
    }

    // Road background tile
    if (this.textures.exists('road_bg')) {
      this._roadTile = this.add.tileSprite(W / 2, H / 2, W, H, 'road_bg')
        .setScrollFactor(0).setDepth(-4);
    }

    // Road surface
    this.add.rectangle(1100, 414, 2220, 20, 0x3d3d4a, 1).setDepth(6);
    this.add.rectangle(1100, 437, 2220, 26, 0x2a2a38, 1).setDepth(6);

    // Pothole visuals over gaps
    [{ x: 650, w: 100 }, { x: 1100, w: 108 }, { x: 1530, w: 100 }].forEach(g => {
      const gr = this.add.graphics().setDepth(8);
      gr.fillStyle(0x050302, 1);
      gr.fillRect(g.x, H - 46, g.w, 52);
    });

    // Street lamps
    [150, 750, 1250, 1850].forEach(lx => {
      this.add.image(lx, 424, 'street_lamp').setOrigin(0.5, 1).setDisplaySize(50, 175).setDepth(7);
    });

    // Traffic cones
    [380, 830, 1180, 1620].forEach(cx => {
      this.add.image(cx, 424, 'cone').setOrigin(0.5, 1).setDisplaySize(20, 32).setDepth(7);
    });

    // ── Gemma on the left waiting for her bags ────────────────────────────
    this._gemmaX = 70;
    this._gemmaY = H - 32;

    this._gemmaImg = this.add.image(this._gemmaX, this._gemmaY, 'gemma_idle')
      .setDisplaySize(110, 62).setOrigin(0.5, 1).setDepth(9);
    this.tweens.add({
      targets: this._gemmaImg, y: this._gemmaY - 5,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Worried bubble above Gemma
    this._bubbleTxt = this.add.text(this._gemmaX + 12, this._gemmaY - 78, '😟 My bags!', {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 2,
      backgroundColor: '#1a0d06', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: this._bubbleTxt, y: this._gemmaY - 84, duration: 700, yoyo: true, repeat: -1 });

    // Glow under Gemma (lights up when all bags collected)
    this._gemmaGlow = this.add.circle(this._gemmaX, this._gemmaY - 10, 44, 0xffcc00, 0).setDepth(8);

    // Return trigger zone just to the right of Gemma
    this._returnZone = this.physics.add.staticImage(this._gemmaX + 80, this._gemmaY - 40, null)
      .setSize(80, 90).setAlpha(0).refreshBody();

    // ── 4 supply bags on platforms ────────────────────────────────────────
    const bagDefs = [
      { x:  520, y: 288 },
      { x:  920, y: 256 },
      { x: 1330, y: 278 },
      { x: 1750, y: 248 },
    ];

    this._collected  = 0;
    this._readyReturn = false;
    this._levelDone  = false;

    this._bagHUD = this.add.text(W - 16, 16, '🎒 0 / 4', {
      fontSize: '15px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(35);

    bagDefs.forEach((bd, i) => {
      const bag = this.physics.add.staticImage(bd.x, bd.y, 'supply_bag')
        .setDisplaySize(30, 34).setDepth(9).refreshBody();
      const glow = this.add.ellipse(bd.x, bd.y + 14, 52, 14, 0xffaa44, 0.35).setDepth(8);

      this.tweens.add({ targets: bag, y: bd.y - 9, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: glow, scaleX: 1.3, alpha: 0.6, duration: 680 + i * 70, yoyo: true, repeat: -1 });

      this.physics.add.overlap(this.shadow, bag, () => {
        if (bag.getData('taken')) return;
        bag.setData('taken', true);
        bag.destroy(); glow.destroy();
        this._onBagCollected(bd.x, bd.y);
      });
    });

    // Return trigger: only fires when all bags collected
    this.physics.add.overlap(this.shadow, this._returnZone, () => {
      if (!this._levelDone && this._readyReturn) {
        this._levelDone = true;
        this._deliverBags();
      } else if (!this._levelDone && this._collected > 0 && !this._readyReturn && !this._hintedReturn) {
        this._hintedReturn = true;
        this._showMessage('Collect all 4 bags first! 🎒');
      }
    });

    this.time.delayedCall(900, () =>
      this._showMessage('Gemma dropped her bags! Collect all 4 then bring them back! 🎒')
    );
  }

  _onBagCollected(bx, by) {
    this._collected++;
    this._bagHUD.setText(`🎒 ${this._collected} / 4`);
    this.cameras.main.flash(150, 80, 120, 20);

    const sp = this.add.image(bx, by - 20, 'sparkle').setDepth(20);
    this.tweens.add({ targets: sp, scale: 2, alpha: 0, duration: 450, onComplete: () => sp.destroy() });

    const pop = this.add.text(bx, by - 30, '+1 🎒', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#ffcc44', stroke: '#1a0802', strokeThickness: 3
    }).setDepth(22);
    this.tweens.add({ targets: pop, y: pop.y - 55, alpha: 0, duration: 850, onComplete: () => pop.destroy() });

    if (this._collected >= 4) {
      this._readyReturn = true;
      this._bagHUD.setText('🎒 4 / 4 ✓ — Return to Gemma!').setColor('#ffcc44');
      this._showMessage('All bags found! Run back to Gemma! 💛', 3000);

      // Gemma glows to guide player back
      this.tweens.add({
        targets: this._gemmaGlow,
        alpha: { from: 0.15, to: 0.55 }, scaleX: { from: 1, to: 1.5 }, scaleY: { from: 1, to: 1.5 },
        duration: 520, yoyo: true, repeat: -1
      });

      // Arrow pointing left above player
      this._returnArrow = this.add.text(this.shadow.x, this.shadow.y - 55, '◀ Go back!', {
        fontSize: '14px', fontFamily: 'Georgia, serif',
        color: '#ffcc44', stroke: '#1a0802', strokeThickness: 2
      }).setOrigin(0.5).setDepth(30).setScrollFactor(1);
      this.tweens.add({ targets: this._returnArrow, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  _deliverBags() {
    if (this._returnArrow) this._returnArrow.destroy();
    this._bubbleTxt.setText('💛 Thank you!');
    this._gemmaGlow.destroy();
    this.shadow.setVelocityX(0);
    this._bagHUD.setText('🎒 4 / 4  ✓').setColor('#ffcc44');

    // Gemma bounces happily
    this.tweens.add({
      targets: this._gemmaImg, y: '-=18',
      duration: 220, yoyo: true, repeat: 4
    });

    // Heart burst
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 110, () => {
        const h = this.add.image(
          this._gemmaX + (Math.random() - 0.5) * 60,
          this._gemmaY - 30, 'heart'
        ).setDepth(60).setScale(0.7);
        this.tweens.add({ targets: h, y: h.y - 85, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
      });
    }

    this.cameras.main.shake(280, 0.009);
    this.cameras.main.flash(500, 80, 160, 20);
    this._showMessage('Gemma has her supplies! Off to the jungle! 🌿', 3000);
    this._givePoints(3);

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => {
        this.registry.set('l2_resumeZone', 2);
        this.scene.start('Level2');
      });
    });
  }

  update() {
    if (this._roadTile) this._roadTile.tilePositionX = this.cameras.main.scrollX * 0.7;
    if (this._returnArrow && this.shadow) {
      this._returnArrow.setPosition(this.shadow.x, this.shadow.y - 55);
    }
    this._updateBgParallax();
    this.updateMovement();
  }
}

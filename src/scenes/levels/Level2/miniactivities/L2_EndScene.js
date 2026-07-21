import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';

// Level 2 End — 3 stars celebration, Play Level 3 button
export class L2_EndScene extends Phaser.Scene {
  constructor() { super('L2_End'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(900, 0, 0, 0);

    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.65).setTint(0x0a1a0a).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.3).setDepth(-4);
    this.add.tileSprite(400, H - 11, 800, 70, 'ground').setTileScale(0.14, 0.14).setDepth(5);

    // Gleeda and Gemma — grass surface at y=418; +4/+3 compensates PNG transparent bottom padding
    const gleedaImg = this.add.image(220, 422, 'gleeda_idle').setDisplaySize(120, 70).setOrigin(0.5, 1).setDepth(8).setAlpha(0);
    const gemmaImg  = this.add.image(530, 421, 'gemma_happy').setDisplaySize(140, 77).setOrigin(0.5, 1).setDepth(9).setAlpha(0);

    this.tweens.add({ targets: gleedaImg, alpha: 1, duration: 800, delay: 300 });
    this.tweens.add({ targets: gemmaImg,  alpha: 1, duration: 800, delay: 600 });

    // Gentle head-bob on Gemma
    this.time.delayedCall(1500, () => {
      this.tweens.add({ targets: gemmaImg, y: '+=6', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Title
    const title = this.add.text(400, 74, '🎉 Chapter 2 Complete! 🎉', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: 66, duration: 700, delay: 500 });

    const sub = this.add.text(400, 118, 'Gleeda rescued Gemma!\nThe journey continues... 🐾💛', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5e0b0',
      align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 700, delay: 1000 });

    // 3 stars — pop in one by one
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(300 + i * 70, 182, '⭐', { fontSize: '40px' })
        .setOrigin(0.5).setDepth(22).setAlpha(0).setScale(0);
      this.tweens.add({
        targets: star, alpha: 1, scale: 1, duration: 420, delay: 1200 + i * 320, ease: 'Back.easeOut',
        onComplete: () => this.cameras.main.flash(200, 100, 140, 20)
      });
    }

    // TRUST 100% badge
    this.time.delayedCall(1600, () => {
      const badge = this.add.rectangle(400, 228, 200, 34, 0x2a0015, 1).setDepth(22).setStrokeStyle(2, 0xff55aa, 0.8);
      this.add.text(400, 228, '💖 TRUST  100%', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff88bb', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(23);
      this.tweens.add({ targets: badge, alpha: { from: 0, to: 1 }, duration: 600 });
    });

    // Continue button
    this.time.delayedCall(2800, () => {
      const contBg = this.add.rectangle(400, 254, 260, 52, 0x3a2010, 1)
        .setDepth(30).setStrokeStyle(2, 0xf5c87a, 0.8).setInteractive({ useHandCursor: true });
      const contTxt = this.add.text(400, 254, '▶  Play Level 3', {
        fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5e0b0'
      }).setOrigin(0.5).setDepth(31);

      this.tweens.add({ targets: [contBg, contTxt], alpha: { from: 0.4, to: 1 }, duration: 900, yoyo: true, repeat: -1 });

      contBg.on('pointerup', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('Level3'));
      });
      contBg.on('pointerover', () => contBg.setFillStyle(0x5a3820));
      contBg.on('pointerout',  () => contBg.setFillStyle(0x3a2010));
    });

    // Continuous hearts + sparkles
    this.time.addEvent({
      delay: 500, loop: true, callback: () => {
        const key  = Math.random() > 0.5 ? 'heart' : 'sparkle';
        const item = this.add.image(150 + Math.random() * 500, H - 30 - Math.random() * 50, key)
          .setDepth(26).setScale(0.5 + Math.random() * 0.5);
        this.tweens.add({ targets: item, y: item.y - 110, alpha: 0, duration: 1300, onComplete: () => item.destroy() });
      }
    });

    // Leaf fall
    this.time.addEvent({
      delay: 650, loop: true, callback: () => {
        const leaf = this.add.image(Math.random() * 800, -10, 'leaf').setAlpha(0.4).setDepth(15);
        this.tweens.add({
          targets: leaf, y: H + 20, x: `+=${(Math.random() - 0.5) * 80}`,
          rotation: `+=${Math.PI * 2}`, alpha: 0,
          duration: 4000 + Math.random() * 2000, onComplete: () => leaf.destroy()
        });
      }
    });
  }
}

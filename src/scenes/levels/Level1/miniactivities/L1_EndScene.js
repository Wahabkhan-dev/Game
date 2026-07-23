import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { showLevelCompleteModal } from '../../../../utils/EndModals.js';

// Final scene — Stars reward, unlock Level 2
export class L1_EndScene extends Phaser.Scene {
  constructor() { super('L1_End'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(900, 0, 0, 0);
    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.65).setTint(0x0a1a0a).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.35).setDepth(-4);
    this.add.tileSprite(400, H - 11, 800, 70, 'ground').setTileScale(0.14, 0.14).setDepth(5);

    // Ground surface: grass top ≈ H-32 = 418
    const groundY = H - 32;

    const shadowImg = this.add.image(300, groundY - 35, 'shadow_idle').setDisplaySize(130, 71).setDepth(8).setAlpha(0);

    // ── Gemma's cage (same realistic style as L1_FoodScene) ──────────────
    const gemmaX = 510, cageW = 130, cageH = 110;
    const cageL = gemmaX - cageW / 2, cageT = groundY - cageH;

    const cageBack = this.add.graphics().setDepth(7).setAlpha(0);
    cageBack.fillStyle(0x1a1208, 1);
    cageBack.fillRect(cageL, cageT, cageW, cageH);
    cageBack.lineStyle(2, 0x3a2e10, 1);
    cageBack.strokeRect(cageL, cageT, cageW, cageH);
    cageBack.lineStyle(3, 0x2a2010, 0.9);
    for (let row = 1; row <= 4; row++) {
      const by = cageT + (cageH / 5) * row;
      cageBack.lineBetween(cageL + 4, by, cageL + cageW - 4, by);
    }

    const gemmaImg = this.add.image(gemmaX, groundY - 32, 'gemma_idle').setDisplaySize(118, 65).setDepth(8).setAlpha(0);

    const cageFront = this.add.graphics().setDepth(10).setAlpha(0);
    const barCount = 7, barGap = cageW / (barCount + 1);
    cageFront.lineStyle(5, 0x4a3a18, 1);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b;
      cageFront.lineBetween(bx, cageT + 3, bx, groundY - 2);
    }
    cageFront.lineStyle(6, 0x4a3a18, 1);
    cageFront.lineBetween(cageL, cageT + 3, cageL + cageW, cageT + 3);
    cageFront.lineBetween(cageL, cageT + cageH * 0.45, cageL + cageW, cageT + cageH * 0.45);
    cageFront.lineBetween(cageL, groundY - 2, cageL + cageW, groundY - 2);
    cageFront.lineStyle(2, 0xc8a040, 0.35);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b - 1;
      cageFront.lineBetween(bx, cageT + 3, bx, groundY - 2);
    }

    this.tweens.add({ targets: shadowImg, alpha: 1, duration: 800, delay: 400 });
    this.tweens.add({ targets: [cageBack, gemmaImg, cageFront], alpha: 1, duration: 800, delay: 700 });
    this.time.delayedCall(1500, () => {
      this.tweens.add({ targets: gemmaImg, y: '-=6', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    const title = this.add.text(400, 80, '🎉 Chapter 1 Complete! 🎉', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: 72, duration: 700, delay: 600 });

    const sub = this.add.text(400, 124, 'Shadow saved Gemma!\nYou are AMAZING! 🐾💛', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#f5e0b0', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 700, delay: 1000 });

    for (let i = 0; i < 3; i++) {
      const star = this.add.text(300 + i * 70, 190, '⭐', { fontSize: '40px' }).setOrigin(0.5).setDepth(22).setAlpha(0).setScale(0);
      this.tweens.add({
        targets: star, alpha: 1, scale: 1, duration: 420, delay: 1200 + i * 320, ease: 'Back.easeOut',
        onComplete: () => this.cameras.main.flash(200, 100, 140, 20)
      });
    }

    // After the celebration, show points + Menu/Next Level — no more
    // auto-advancing straight into Level 2.
    this.time.delayedCall(5200, () => {
      const points = this.registry.get('points') || 0;
      showLevelCompleteModal(this, points, { nextLevelKey: 'Level2' });
    });

    this.time.addEvent({
      delay: 550, loop: true, callback: () => {
        const key  = Math.random() > 0.5 ? 'heart' : 'sparkle';
        const item = this.add.image(180 + Math.random() * 440, H - 32 - Math.random() * 50, key).setDepth(26).setScale(0.5 + Math.random() * 0.5);
        this.tweens.add({ targets: item, y: item.y - 110, alpha: 0, duration: 1300, onComplete: () => item.destroy() });
      }
    });

    this.time.addEvent({
      delay: 700, loop: true, callback: () => {
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

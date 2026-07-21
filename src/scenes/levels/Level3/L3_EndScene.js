import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL3Assets } from './L3Assets.js';

// Level 3 Success — emotional ending: Gamma & puppies safe, Gleeda cries happily
export class L3_EndScene extends Phaser.Scene {
  constructor() { super('L3_End'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0a1020');
    this.cameras.main.fadeIn(1100, 0, 0, 0);

    const health = this.registry.get('l3_health') || 100;
    const coins  = this.registry.get('l3_coins')  || 0;

    // Warm lighting overlay (golden glow — emotional success)
    if (this.textures.exists('jungle_bg')) {
      this.add.image(W / 2, H / 2, 'jungle_bg').setDisplaySize(W, H).setAlpha(0.12).setTint(0x201008).setDepth(-5);
    }
    this.add.rectangle(W / 2, H / 2, W, H, 0x020810, 0.5).setDepth(-4);

    // Warm floor glow
    const floorGlow = this.add.graphics().setDepth(-3);
    floorGlow.fillStyle(0xf5c87a, 0.06);
    floorGlow.fillRect(0, H - 100, W, 100);

    // Hospital floor for characters
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x101820, 1); g.fillRect(0, H - 70, W, 70);
    g.lineStyle(1, 0x1a2c40, 0.6); g.lineBetween(0, H - 70, W, H - 70);

    // ── CHARACTERS ───────────────────────────────────────────────────────────

    // Gleeda (left, facing right, crying happily)
    const gleedaImg = this.add.image(170, H - 52, 'gleeda_idle')
      .setDisplaySize(120, 70).setOrigin(0.5, 1).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: gleedaImg, alpha: 1, duration: 800, delay: 600 });

    // Gamma (center, happy)
    const gammaImg = this.add.image(400, H - 50, 'gemma_happy')
      .setDisplaySize(160, 88).setOrigin(0.5, 1).setDepth(9).setAlpha(0);
    this.tweens.add({ targets: gammaImg, alpha: 1, duration: 900, delay: 900 });

    // Gentle Gamma head-bob
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: gammaImg, y: gammaImg.y - 6, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // ── TITLE ─────────────────────────────────────────────────────────────────

    const titleBg = this.add.graphics().setDepth(18);
    titleBg.fillStyle(0x080412, 0.94);
    titleBg.fillRoundedRect(W / 2 - 320, 28, 640, 56, 10);
    titleBg.lineStyle(2, 0xf5c87a, 0.65);
    titleBg.strokeRoundedRect(W / 2 - 320, 28, 640, 56, 10);

    const title = this.add.text(W / 2, 56, '🎉  Level 3 Complete  🎉', {
      fontSize: '27px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setDepth(19).setAlpha(0).setScale(0.8);
    this.tweens.add({ targets: title, alpha: 1, scaleX: 1, scaleY: 1, duration: 600, delay: 500, ease: 'Back.easeOut' });

    const sub = this.add.text(W / 2, 102, 'Gamma is safe and recovering! 💛', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5e0b0'
    }).setOrigin(0.5).setDepth(19).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 1000 });

    // ── DIALOGUE ─────────────────────────────────────────────────────────────

    this.time.delayedCall(1600, () => {
      const bubble = this.add.graphics().setDepth(20);
      bubble.fillStyle(0x0a0a1a, 0.9); bubble.fillRoundedRect(200, H - 192, 260, 60, 8);
      bubble.lineStyle(2, 0xf5c87a, 0.5); bubble.strokeRoundedRect(200, H - 192, 260, 60, 8);
      bubble.fillTriangle(220, H - 132, 210, H - 115, 230, H - 115);
      this.add.text(330, H - 162, '"We made it, Gamma...\n    You\'re safe now. 💛"', {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#f5e0b0', fontStyle: 'italic', lineSpacing: 4
      }).setOrigin(0.5).setDepth(21);
    });

    // ── STARS + REWARDS ───────────────────────────────────────────────────────

    this.time.delayedCall(1200, () => {
      for (let i = 0; i < 3; i++) {
        const star = this.add.text(W / 2 - 44 + i * 44, 148, '⭐', { fontSize: '36px' })
          .setOrigin(0.5).setDepth(22).setAlpha(0).setScale(0);
        this.tweens.add({
          targets: star, alpha: 1, scale: 1, duration: 380, delay: i * 300, ease: 'Back.easeOut',
          onComplete: () => this.cameras.main.flash(200, 100, 140, 20)
        });
      }
    });

    // Rewards panel
    this.time.delayedCall(2000, () => {
      const rg = this.add.graphics().setDepth(18);
      rg.fillStyle(0x0a0a1a, 0.9); rg.fillRoundedRect(W / 2 - 200, 192, 400, 96, 10);
      rg.lineStyle(2, 0xf5c87a, 0.6); rg.strokeRoundedRect(W / 2 - 200, 192, 400, 96, 10);

      const rewards = [
        { label: `🪙 COINS`, val: `${coins + 250}` },
        { label: `⭐ SCORE`,  val: '1500' },
        { label: `❤️ TRUST`,  val: `${Math.round(health)}%` },
      ];
      rewards.forEach((r, i) => {
        const rx = W / 2 - 120 + i * 120;
        this.add.text(rx, 218, r.label, {
          fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88aacc'
        }).setOrigin(0.5).setDepth(19);
        this.add.text(rx, 244, r.val, {
          fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(19);
      });
    });

    // ── SPARKLE RAIN ──────────────────────────────────────────────────────────

    this.time.delayedCall(1500, () => {
      this.time.addEvent({
        delay: 200, loop: true, callback: () => {
          const sp = this.add.image(
            80 + Math.random() * 640, H / 2 + (Math.random() - 0.5) * 120, 'sparkle'
          ).setDepth(25).setScale(0.8 + Math.random() * 0.8);
          this.tweens.add({ targets: sp, y: sp.y - 90, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 1200, onComplete: () => sp.destroy() });
        }
      });

      // Heart rain
      this.time.addEvent({
        delay: 500, loop: true, callback: () => {
          const h = this.add.image(100 + Math.random() * 600, H - 30 - Math.random() * 30, 'heart')
            .setDepth(24).setScale(0.5 + Math.random() * 0.4);
          this.tweens.add({ targets: h, y: h.y - 100, alpha: 0, duration: 1400, onComplete: () => h.destroy() });
        }
      });
    });

    // ── BUTTONS ───────────────────────────────────────────────────────────────

    this.time.delayedCall(3000, () => {
      const menuBg = this.add.rectangle(W / 2 - 100, 316, 180, 44, 0x1a0e06, 1)
        .setDepth(30).setStrokeStyle(2, 0xf5c87a, 0.8).setInteractive({ useHandCursor: true });
      this.add.text(W / 2 - 100, 316, '↩  Main Menu', {
        fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5e0b0'
      }).setOrigin(0.5).setDepth(31);
      menuBg.on('pointerup', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('Menu'));
      });
      menuBg.on('pointerover', () => menuBg.setFillStyle(0x3a2010));
      menuBg.on('pointerout',  () => menuBg.setFillStyle(0x1a0e06));

      // Replay
      const repBg = this.add.rectangle(W / 2 + 110, 316, 180, 44, 0x0a2820, 1)
        .setDepth(30).setStrokeStyle(2, 0x44f5a0, 0.7).setInteractive({ useHandCursor: true });
      this.add.text(W / 2 + 110, 316, '🔄  Play Again', {
        fontSize: '15px', fontFamily: 'Georgia, serif', color: '#88ffcc'
      }).setOrigin(0.5).setDepth(31);
      repBg.on('pointerup', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('Level3'));
      });
      repBg.on('pointerover', () => repBg.setFillStyle(0x1a4830));
      repBg.on('pointerout',  () => repBg.setFillStyle(0x0a2820));

      this.tweens.add({ targets: [menuBg, repBg], alpha: { from: 0.5, to: 1 }, duration: 700, yoyo: true, repeat: 1 });
    });
  }
}

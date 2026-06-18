import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL3Assets } from './L3Assets.js';

// Level 3 intro — brief story beat then launches car driving phase
export class Level3Scene extends Phaser.Scene {
  constructor() { super('Level3'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#070912');
    this.cameras.main.fadeIn(900, 0, 0, 0);

    if (this.textures.exists('jungle_bg')) {
      this.add.image(W / 2, H / 2, 'jungle_bg').setDisplaySize(W, H).setAlpha(0.2).setTint(0x060a1a).setDepth(-5);
    }
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(-4);

    // Rain atmosphere
    for (let i = 0; i < 60; i++) {
      const r = this.add.image(Math.random() * W, Math.random() * H, 'raindrop')
        .setDepth(1).setAlpha(0.3 + Math.random() * 0.25).setRotation(-0.15);
      this.tweens.add({ targets: r, y: r.y + H + 20, duration: 1400 + Math.random() * 600, repeat: -1, delay: Math.random() * 1400 });
    }

    // Chapter title
    const titleBg = this.add.graphics().setDepth(10);
    titleBg.fillStyle(0x080412, 0.95);
    titleBg.fillRoundedRect(W / 2 - 300, H / 2 - 100, 600, 60, 10);
    titleBg.lineStyle(2, 0xf5c87a, 0.6);
    titleBg.strokeRoundedRect(W / 2 - 300, H / 2 - 100, 600, 60, 10);

    // Story text
    const story = this.add.text(W / 2, H / 2 + 10,
      'Gamma is critically injured.\nGleeda must drive through the stormy night\nto reach the hospital — before it\'s too late.\n\n🚗  Phase 1: Car Journey  →  🏥  Phase 2: Hospital Treatment', {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5e0b0',
        align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const tap = this.add.text(W / 2, H / 2 + 118, '▶  TAP TO BEGIN', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    // Characters
    const gleeda = this.add.image(190, H / 2 + 60, 'gleeda_idle').setDisplaySize(100, 58).setOrigin(0.5).setDepth(8).setAlpha(0);
    const gemma  = this.add.image(600, H / 2 + 65, 'gemma_idle').setDisplaySize(120, 66).setOrigin(0.5).setDepth(8).setAlpha(0).setTint(0xff8888);

    // Car
    const car = this.add.image(400, H / 2 + 60, 'l3_car').setDisplaySize(120, 68).setOrigin(0.5).setDepth(9).setAlpha(0);

    this.tweens.add({ targets: [gleeda, gemma, car], alpha: 1, duration: 700, delay: 500 });
    this.tweens.add({ targets: car, x: 420, duration: 900, delay: 400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    // Fade in text
    const allTxt = [story, tap];
    this.tweens.add({ targets: allTxt, alpha: 1, duration: 700, delay: 600 });
    this.tweens.add({ targets: tap, alpha: 0.5, duration: 600, yoyo: true, repeat: -1, delay: 1200 });

    // Title with dramatic reveal
    let titleTxt;
    this.time.delayedCall(200, () => {
      titleTxt = this.add.text(W / 2, H / 2 - 70, 'CHAPTER 3 — RACE TO SAVE GAMMA', {
        fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3
      }).setOrigin(0.5).setDepth(12).setAlpha(0).setScale(0.8);
    });

    this.time.delayedCall(400, () => {
      if (titleTxt) this.tweens.add({ targets: titleTxt, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    });

    // Start on any input
    this.input.once('pointerdown', this._start, this);
    this.input.keyboard.once('keydown', this._start, this);
  }

  _start() {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('L3_Drive'));
  }
}

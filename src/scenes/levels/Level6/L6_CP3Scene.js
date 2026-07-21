import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL6Assets } from './L6Assets.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { addStandaloneMenuButton } from '../../../hud/premium/PremiumTheme.js';

// ── L5 CP3 — Choose Gamma's comfort item: pick the right one ────────────────────
export class L6_CP3Scene extends Phaser.Scene {
  constructor() { super('L6_CP3'); }

  create() {
    generateL6Assets(this);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(0);
    // Premium wood/gold panel (shared Level-1 modal art), procedural fallback
    if (!drawModalPanelBg(this, 120, 40, 560, 370, 1)) {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x120e08, 0.97); g.fillRoundedRect(120, 40, 560, 370, 16);
      g.lineStyle(2.5, 0xf5c87a, 0.85); g.strokeRoundedRect(120, 40, 560, 370, 16);
    }
    addStandaloneMenuButton(this);

    this.add.text(W / 2, 68, '🐕 Comfort Gamma', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this.add.text(W / 2, 98, 'Gamma is cold and scared.\nWhat does she need most right now?', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center' }).setOrigin(0.5).setDepth(2);

    // Gamma sprite
    if (this.textures.exists('gemma_idle'))
      this.add.image(W / 2, 180, 'gemma_idle').setDisplaySize(120, 68).setOrigin(0.5).setDepth(3);
    else
      this.add.text(W / 2, 180, '🐕', { fontSize: '52px' }).setOrigin(0.5).setDepth(3);

    const choices = [
      { emoji: '🧣', label: 'Warm Blanket', correct: true },
      { emoji: '🎾', label: 'Tennis Ball',  correct: false },
      { emoji: '🍖', label: 'Dog Treat',    correct: false },
    ];

    choices.forEach((c, i) => {
      const x = 210 + i * 190, y = 290;
      const card = this.add.rectangle(x, y, 130, 80, 0x1a2a3a, 0.95).setStrokeStyle(2, 0x4a7a9a, 1).setDepth(3).setInteractive({ useHandCursor: true });
      this.add.text(x, y - 14, c.emoji, { fontSize: '30px' }).setOrigin(0.5).setDepth(4);
      this.add.text(x, y + 20, c.label, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#dfe8f5' }).setOrigin(0.5).setDepth(4);

      card.on('pointerdown', () => {
        if (c.correct) {
          card.setFillStyle(0x143a24);
          this.cameras.main.flash(200, 80, 200, 100);
          this.add.text(x, y - 46, '💛 Perfect!', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffdd44', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(5);
          this.time.delayedCall(800, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(320, () => this.events.emit('cp-done'));
          });
        } else {
          card.setFillStyle(0x3a1414);
          this.cameras.main.shake(160, 0.01);
          this.add.text(x, y - 46, '❌ Try again', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ff6666', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(5);
          this.time.delayedCall(600, () => card.setFillStyle(0x1a2a3a));
          this.events.emit('cp-done-damage');
        }
      });
    });

    const skip = this.add.text(W / 2, 370, '⏭ Skip', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#888', backgroundColor: '#222', padding: { x: 14, y: 7 } }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => { this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(220, () => this.events.emit('cp-done')); });
  }
}

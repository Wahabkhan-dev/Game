import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL6Assets } from './L6Assets.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { addStandaloneMenuButton } from '../../../hud/premium/PremiumTheme.js';

// ── L5 CP2 — Match the Equipment: tap the 4 correct items in order ─────────────
export class L6_CP2Scene extends Phaser.Scene {
  constructor() { super('L6_CP2'); }

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

    this.add.text(W / 2, 68, '💉 Prepare the Kit', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this._prompt = this.add.text(W / 2, 100, '', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center' }).setOrigin(0.5).setDepth(2);

    const sequence = ['🩺', '💊', '♨️', '🧣'];
    const labels   = ['Stethoscope', 'Medicine', 'Heating Pad', 'Blanket'];
    // Show in shuffled grid
    const shuffled = Phaser.Utils.Array.Shuffle([...sequence]);
    const positions = [{ x: 210, y: 230 }, { x: 330, y: 230 }, { x: 450, y: 230 }, { x: 570, y: 230 }];
    let step = 0;

    // Progress dots
    const dots = sequence.map((_, i) => this.add.circle(W / 2 - 45 + i * 30, 155, 8, 0x1a3040, 1).setStrokeStyle(1.5, 0xf5c87a, 0.7).setDepth(3));
    const updatePrompt = () => this._prompt.setText(step < sequence.length ? `Tap: ${labels[sequence.indexOf(sequence[step])]}  ${sequence[step]}` : '');
    updatePrompt();

    const cards = shuffled.map((emoji, i) => {
      const card = this.add.rectangle(positions[i].x, positions[i].y, 90, 90, 0x1a2a3a, 0.95).setStrokeStyle(2, 0x4a7a9a, 1).setDepth(3).setInteractive({ useHandCursor: true });
      const txt = this.add.text(positions[i].x, positions[i].y, emoji, { fontSize: '36px' }).setOrigin(0.5).setDepth(4);
      card.on('pointerdown', () => {
        if (step >= sequence.length) return;
        if (emoji === sequence[step]) {
          card.disableInteractive();
          card.setFillStyle(0x143a24);
          this.add.text(positions[i].x + 28, positions[i].y - 28, '✓', { fontSize: '18px', color: '#88ff88', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(5);
          dots[step].setFillStyle(0x44aaff, 1);
          this.cameras.main.flash(80, 50, 180, 80);
          step++;
          updatePrompt();
          if (step >= sequence.length) {
            this.time.delayedCall(700, () => {
              this.cameras.main.fadeOut(300, 0, 0, 0);
              this.time.delayedCall(320, () => this.events.emit('cp-done'));
            });
          }
        } else {
          this.cameras.main.shake(120, 0.008);
          this.tweens.add({ targets: card, x: positions[i].x + 8, duration: 50, yoyo: true, repeat: 3 });
        }
      });
      return { card, txt };
    });

    const skip = this.add.text(W / 2, 370, '⏭ Skip', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#888', backgroundColor: '#222', padding: { x: 14, y: 7 } }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => { this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(220, () => this.events.emit('cp-done')); });
  }
}

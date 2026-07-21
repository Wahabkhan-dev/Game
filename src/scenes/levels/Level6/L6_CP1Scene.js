import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL6Assets } from './L6Assets.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { addStandaloneMenuButton } from '../../../hud/premium/PremiumTheme.js';

// ── L5 CP1 — Sort the Supplies: drag 4 medical items into the correct bag ──────
export class L6_CP1Scene extends Phaser.Scene {
  constructor() { super('L6_CP1'); }

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

    this.add.text(W / 2, 68, '🏥 Sort the Supplies', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(2);
    this.add.text(W / 2, 96, 'Drag each item into the medical bag!', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870' }).setOrigin(0.5).setDepth(2);

    // Target bag
    const bag = this.add.graphics().setDepth(2);
    bag.fillStyle(0x1a3a5a, 0.8); bag.fillRoundedRect(W / 2 - 70, 240, 140, 110, 14);
    bag.lineStyle(3, 0x44aaff, 0.9); bag.strokeRoundedRect(W / 2 - 70, 240, 140, 110, 14);
    this.add.text(W / 2, 295, '🎒\nMedical\nBag', { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#88ccff', align: 'center' }).setOrigin(0.5).setDepth(3);

    const items = ['🩺', '💊', '🧪', '🧣'];
    const positions = [{ x: 170, y: 180 }, { x: 300, y: 160 }, { x: 490, y: 175 }, { x: 580, y: 200 }];
    let placed = 0;

    items.forEach((emoji, i) => {
      const obj = this.add.text(positions[i].x, positions[i].y, emoji, { fontSize: '38px' })
        .setOrigin(0.5).setDepth(5).setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(obj);
      const home = { x: positions[i].x, y: positions[i].y };
      obj.on('drag', (p, x, y) => { obj.x = x; obj.y = y; });
      obj.on('dragend', () => {
        if (obj.x > W / 2 - 70 && obj.x < W / 2 + 70 && obj.y > 240 && obj.y < 350) {
          obj.disableInteractive();
          this.tweens.add({ targets: obj, x: W / 2 - 30 + placed * 22, y: 295, scale: 0.7, duration: 200 });
          placed++;
          this.cameras.main.flash(80, 100, 200, 80);
          if (placed >= 4) {
            this.time.delayedCall(600, () => {
              this.cameras.main.fadeOut(300, 0, 0, 0);
              this.time.delayedCall(320, () => this.events.emit('cp-done'));
            });
          }
        } else {
          this.tweens.add({ targets: obj, x: home.x, y: home.y, duration: 200, ease: 'Back.easeOut' });
        }
      });
    });

    // Skip
    const skip = this.add.text(W / 2, 370, '⏭ Skip', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#888', backgroundColor: '#222', padding: { x: 14, y: 7 } }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => { this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(220, () => this.events.emit('cp-done')); });
  }
}

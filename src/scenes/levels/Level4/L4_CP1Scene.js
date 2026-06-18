import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { drawCPModal } from './L4Modal.js';

// L4 Checkpoint 1 — Build the Frame (Drag & Drop Puzzle)
// Player collected Wood & Roof. Must assemble the house blueprint to start the build.
// Puzzle: drag wood/roof pieces to their spots in the blueprint frame.
export class L4_CP1Scene extends Phaser.Scene {
  constructor() { super('L4_CP1'); }

  create() {
    drawCPModal(this, '🔨', 'Build the Frame!', 'Drag the wood & roof pieces into the blueprint');

    // Blueprint frame (where pieces fit) — centered inside the compact card
    const frameX = W / 2, frameY = 250;
    this.add.rectangle(frameX, frameY, 150, 94, 0x16314a, 0.8).setDepth(3).setStrokeStyle(3, 0x6aaaff, 1);
    this.add.text(frameX, frameY - 58, '🏠 Gamma\'s House', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#9ccbff' }).setOrigin(0.5).setDepth(4);

    // House pieces to drag (2 roof + 2 wood) — start in the card corners
    const pieces = [
      { id: 0, label: 'Roof', emoji: '🔺', targetX: frameX - 42, targetY: frameY - 26, startX: 198, startY: 168 },
      { id: 1, label: 'Roof', emoji: '🔺', targetX: frameX + 42, targetY: frameY - 26, startX: W - 198, startY: 168 },
      { id: 2, label: 'Wood', emoji: '🟫', targetX: frameX - 42, targetY: frameY + 26, startX: 198, startY: 338 },
      { id: 3, label: 'Wood', emoji: '🟫', targetX: frameX + 42, targetY: frameY + 26, startX: W - 198, startY: 338 }
    ];

    this._placed = 0;
    this._pieces = pieces.map(p => {
      const piece = this.add.text(p.startX, p.startY, p.emoji, { fontSize: '44px' }).setOrigin(0.5).setDepth(10).setInteractive({ draggable: true, useHandCursor: true });
      const snap = { x: p.targetX, y: p.targetY, placed: false };

      this.input.setDraggable(piece);
      piece.on('drag', (pointer, dragX, dragY) => {
        piece.x = dragX;
        piece.y = dragY;
      });

      piece.on('dragend', () => {
        const dist = Phaser.Math.Distance.Between(piece.x, piece.y, snap.x, snap.y);
        if (dist < 40) {
          // Snapped!
          piece.x = snap.x;
          piece.y = snap.y;
          piece.setInteractive({ draggable: false });
          snap.placed = true;
          this._placed++;
          this.tweens.add({ targets: piece, scale: 1.2, duration: 100, yoyo: true });
          if (this._placed === pieces.length) this._win();
        } else {
          // Snap back
          this.tweens.add({ targets: piece, x: p.startX, y: p.startY, duration: 300, ease: 'Power2.easeOut' });
        }
      });

      return piece;
    });

    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);

    this._done = false;
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.flash(500, 150, 200, 100);
    this.add.text(W / 2, 200, '✅ Frame Built!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 250, 'Gamma\'s house is taking shape!', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#bfe0ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(20);
    const total = this.registry.get('points');
    this.add.text(W / 2, 352, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => this.events.emit('cp-done'));
  }
}

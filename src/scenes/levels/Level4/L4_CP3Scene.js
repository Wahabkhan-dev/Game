import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { drawCPModal } from './L4Modal.js';

// L4 Checkpoint 3 — Welcome Gamma Home (Decision Puzzle)
// Player collected Bedding & Bowl. Gamma is nervous in her new house — pick the
// right comfort item to settle her in. Correct (cozy bed) +2 pts, wrong = retry.
export class L4_CP3Scene extends Phaser.Scene {
  constructor() { super('L4_CP3'); }

  create() {
    drawCPModal(this, '🐶', 'Welcome Gamma Home!', 'Gamma feels nervous in her new house. What will settle her in?');

    // Gamma (nervous in the new home)
    this.add.text(W / 2, 178, '🐶', { fontSize: '56px' }).setOrigin(0.5).setDepth(5);

    // Item choices (3 choices, only 1 is correct) — laid out inside the panel
    const choices = [
      { item: '🦴', label: 'Bone', correct: false, x: 250 },
      { item: '🛏️', label: 'Cozy Bed', correct: true, x: W / 2 },
      { item: '🏐', label: 'Ball', correct: false, x: 550 }
    ];

    this._done = false;
    this._choices = choices.map((c) => {
      const box = this.add.rectangle(c.x, 300, 88, 96, 0x2a3a50, 0.8).setDepth(4).setStrokeStyle(2, 0x6aaa88, 0.9);
      const emoji = this.add.text(c.x, 290, c.item, { fontSize: '42px' }).setOrigin(0.5).setDepth(5);
      const label = this.add.text(c.x, 338, c.label, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#bfe0ff' }).setOrigin(0.5).setDepth(5);

      const btn = this.add.rectangle(c.x, 300, 88, 96, 0xffffff, 0.001).setDepth(6).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this._choose(c.correct));

      return { box, emoji, label, btn, correct: c.correct };
    });

    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
  }

  _choose(isCorrect) {
    if (this._done) return;
    this._done = true;

    if (isCorrect) {
      this._win();
    } else {
      this._fail();
    }
  }

  _win() {
    this.cameras.main.flash(600, 150, 200, 100);
    this.add.text(W / 2, 160, '🐶 → 🥰', { fontSize: '36px' }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 215, '✅ Gamma feels at home!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 262, 'Cozy and safe in her new bed!', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#bfe0ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(20);
    const total = this.registry.get('points');
    this.add.text(W / 2, 352, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2200, () => this.events.emit('cp-done'));
  }

  _fail() {
    this.cameras.main.shake(300, 0.012);
    this.cameras.main.flash(160, 200, 80, 40);
    this.add.text(W / 2, 180, '🐶 😟', { fontSize: '36px' }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 240, '❌ That made her more nervous!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 272, '-1 HP  •  Try again!', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffaa88', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(20);
    // Emit with damage flag
    this.time.delayedCall(1800, () => {
      this.events.emit('cp-done-damage', { hp: 1 });
    });
  }
}

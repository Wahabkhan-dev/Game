import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { drawCPModal } from './L4Modal.js';

// L4 Checkpoint 2 — Nail & Paint Pattern (Sequence Memory)
// Player collected Nails & Paint. Must fix the wall by repeating the build order.
// 3 rounds, pattern grows each round, 2 lives.
const SPOTS = [
  { x: 290, y: 250, symbol: '🔨' },
  { x: 400, y: 250, symbol: '🪵' },
  { x: 510, y: 250, symbol: '🎨' },
];
const ROUNDS = 3;
const LIVES = 2;

export class L4_CP2Scene extends Phaser.Scene {
  constructor() { super('L4_CP2'); }

  create() {
    drawCPModal(this, '🎨', 'Nail & Paint Pattern!', 'Watch the build order, then repeat it!');

    this._roundTxt = this.add.text(W / 2, 158, `Round 1 / ${ROUNDS}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(5);
    this._lifeTxt = this.add.text(632, 150, '❤️'.repeat(LIVES), { fontSize: '16px' }).setOrigin(1, 0).setDepth(5);

    // Buttons
    this._spots = SPOTS.map((s, i) => {
      const btn = this.add.circle(s.x, s.y, 40, 0x4a6a5a, 1).setDepth(5).setStrokeStyle(2, 0x88ddaa, 0.8).setInteractive({ useHandCursor: true });
      const sym = this.add.text(s.x, s.y, s.symbol, { fontSize: '32px' }).setOrigin(0.5).setDepth(6);
      btn.on('pointerdown', () => this._tap(i));
      return { btn, sym, glow: null };
    });

    this._seq = Array.from({ length: ROUNDS }, () => Phaser.Math.Between(0, SPOTS.length - 1));
    this._round = 1;
    this._lives = LIVES;
    this._inIdx = 0;
    this._phase = 'show';
    this._done = false;

    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);

    this.time.delayedCall(700, () => this._showSequence());
  }

  _flash(i, color = 0xffff88) {
    const s = this._spots[i];
    s.btn.setFillStyle(color, 1);
    this.tweens.add({ targets: s.btn, scaleX: 1.4, scaleY: 1.4, duration: 200, yoyo: true,
      onComplete: () => s.btn.setFillStyle(0x4a6a5a, 1).setScale(1) });
  }

  _showSequence() {
    this._phase = 'show';
    this._roundTxt.setText(`Round ${this._round} / ${ROUNDS}`);
    let step = 0;
    const playNext = () => {
      if (this._done) return;
      if (step >= this._round) {
        this._phase = 'input'; this._inIdx = 0;
        return;
      }
      this._flash(this._seq[step]);
      step++;
      this.time.delayedCall(600, playNext);
    };
    this.time.delayedCall(300, playNext);
  }

  _tap(i) {
    if (this._done || this._phase !== 'input') return;
    if (i === this._seq[this._inIdx]) {
      this._flash(i, 0x88ff88);
      this._inIdx++;
      if (this._inIdx >= this._round) {
        this._phase = 'wait';
        if (this._round >= ROUNDS) { this._win(); return; }
        this._round++;
        this.time.delayedCall(800, () => this._showSequence());
      }
    } else {
      // Wrong
      this._flash(i, 0xff4444);
      this.cameras.main.shake(200, 0.01);
      this._lives--;
      this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
      if (this._lives <= 0) { this._fail(); return; }
      this._phase = 'wait';
      this.time.delayedCall(900, () => this._showSequence());
    }
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.flash(600, 150, 200, 80);
    this.add.text(W / 2, 210, '🎨 Wall Finished!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 256, 'Nailed & painted — looking great!', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#bfe0ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(20);
    const total = this.registry.get('points');
    this.add.text(W / 2, 352, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => this.events.emit('cp-done'));
  }

  _fail() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, 250, '❌ Wrong pattern!\nTry again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}

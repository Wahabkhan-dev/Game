import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { openL2Modal } from './L2Modal.js';

// L2 Checkpoint Overlay — Catch the Supplies (skill / reaction)
// Launched on top of the paused platformer. Emits 'cp-done' when won.
// Move the basket to catch GOOD supplies, dodge falling rocks.
const GOOD  = ['🎒', '🍞', '💧', '🧰', '🩹', '🥫'];
const BAD   = ['🪨', '🌵', '💣'];
const NEED  = 7;     // supplies to catch
const LIVES = 3;
const TIME  = 30;

export class L2_CatchScene extends Phaser.Scene {
  constructor() { super('L2_Catch'); }

  create() {
    // Level-1-style contained modal with a themed background
    openL2Modal(this, '🧺', 'Catch the Supplies!', 'Move with the mouse or ← →. Catch supplies, dodge rocks!', 'l2mg_bg_catch');

    // Play bounds = inside the modal card
    this._L = 150; this._R = 650; this._top = 96; this._floor = 408;

    // Basket (real sprite)
    this._basket = this.add.image(W / 2, this._floor - 12, 'l2mg_basket').setDisplaySize(62, 58).setDepth(10);
    this._basketBase = this._basket.scaleX;
    this._basketX = W / 2;

    // State + HUD
    this._caught = 0; this._lives = LIVES; this._timeLeft = TIME; this._done = false;
    this._items = [];
    this._caughtTxt = this.add.text(140, 96, `Caught:  0 / ${NEED}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setDepth(5);
    this._lifeTxt   = this.add.text(140, 116, '❤️'.repeat(LIVES), { fontSize: '13px' }).setDepth(5);
    this._timeTxt   = this.add.text(660, 96, `⏱ ${TIME}s`, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0).setDepth(5);

    // Controls
    this.input.on('pointermove', p => { this._basketX = Phaser.Math.Clamp(p.x, this._L, this._R); });
    this._keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');

    // Falling speed ramps up
    this._fallSpeed = 0.14;
    this._spawnTimer = this.time.addEvent({ delay: 880, loop: true, callback: () => this._spawn() });
    this._timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this._done) return;
      this._timeLeft--;
      this._timeTxt.setText(`⏱ ${this._timeLeft}s`).setColor(this._timeLeft <= 8 ? '#ff4466' : '#f5c87a');
      this._fallSpeed += 0.006;             // gets harder
      if (this._timeLeft <= 0) this._fail("⏱ Out of time! The supplies scattered.");
    }});

    this._spawn(); this._spawn();
  }

  _spawn() {
    if (this._done) return;
    const bad = Math.random() < 0.34;
    const emoji = bad ? Phaser.Math.RND.pick(BAD) : Phaser.Math.RND.pick(GOOD);
    const x = this._L + Math.random() * (this._R - this._L);
    const t = this.add.text(x, this._top, emoji, { fontSize: '30px' }).setOrigin(0.5).setDepth(8);
    this._items.push({ t, vy: this._fallSpeed * (0.85 + Math.random() * 0.4), bad });
  }

  update(time, delta) {
    if (this._done) return;
    const d = Math.min(delta, 40);
    // Keyboard movement
    const step = 0.45 * d;
    if (this._keys.LEFT.isDown  || this._keys.A.isDown) this._basketX = Math.max(this._L, this._basketX - step);
    if (this._keys.RIGHT.isDown || this._keys.D.isDown) this._basketX = Math.min(this._R, this._basketX + step);
    this._basket.x = this._basketX;

    const catchY = this._floor - 38;
    for (let i = this._items.length - 1; i >= 0; i--) {
      const it = this._items[i];
      it.t.y += it.vy * d;
      // caught?
      if (it.t.y >= catchY && it.t.y <= catchY + 40 && Math.abs(it.t.x - this._basketX) < 42) {
        this._items.splice(i, 1);
        if (it.bad) this._hit(it.t);
        else        this._grab(it.t);
        continue;
      }
      // missed past the floor
      if (it.t.y > this._floor + 6) {
        this._items.splice(i, 1);
        it.t.destroy();
      }
    }
  }

  _grab(t) {
    t.destroy();
    this._caught++;
    this._caughtTxt.setText(`Caught:  ${this._caught} / ${NEED}`);
    this.tweens.add({ targets: this._basket, scaleX: this._basketBase * 1.18, scaleY: this._basketBase * 0.85, duration: 90, yoyo: true });
    const plus = this.add.text(this._basketX, this._floor - 50, '+1', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: plus, y: plus.y - 26, alpha: 0, duration: 600, onComplete: () => plus.destroy() });
    if (this._caught >= NEED) this._win();
  }

  _hit(t) {
    t.destroy();
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(180, 160, 0, 0);
    this._lives--;
    this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
    if (this._lives <= 0) this._fail("💥 Too many rocks! The basket broke.");
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._timer.remove();
    this._items.forEach(it => it.t.destroy()); this._items = [];
    this.cameras.main.flash(500, 60, 200, 80);
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this.add.text(W / 2, H / 2 - 14, '✅ Supplies recovered!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2 + 22, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1300, () => this.events.emit('cp-done'));
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._timer.remove();
    this._items.forEach(it => it.t.destroy()); this._items = [];
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, H / 2, msg + '\nTry again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}

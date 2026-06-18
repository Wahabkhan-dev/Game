import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { openL2Modal } from './L2Modal.js';

// L2 Checkpoint Overlay — Dodge the Hazards (quick reaction / whack-a-mole)
// Tap each creature before it bites you. Emits 'cp-done' when won.
const HAZARDS = ['🐍', '🕷️', '🦂', '🦟'];
const NEED  = 10;    // creatures to whack
const LIVES = 3;
const SPOTS = [
  { x: 195, y: 200 }, { x: 335, y: 190 }, { x: 475, y: 200 }, { x: 615, y: 190 },
  { x: 195, y: 320 }, { x: 335, y: 330 }, { x: 475, y: 320 }, { x: 615, y: 330 },
];

export class L2_DodgeScene extends Phaser.Scene {
  constructor() { super('L2_Dodge'); }

  create() {
    openL2Modal(this, '🐍', 'Dodge the Hazards!', 'Tap each creature FAST — before it bites you!', 'l2mg_bg_dodge');

    // Real bush sprite at each spot (creature pops up over it)
    const bImg = this.textures.get('l2mg_bush').getSourceImage();
    const bw = 86, bh = 86 * (bImg.height / bImg.width);
    SPOTS.forEach(s => {
      this.add.image(s.x, s.y + 40, 'l2mg_bush').setOrigin(0.5, 1).setDisplaySize(bw, bh).setDepth(3);
    });

    this._whacked = 0; this._lives = LIVES; this._done = false;
    this._window = 1450;                 // ms a hazard stays before biting (ramps down)
    this._active = new Array(SPOTS.length).fill(null);

    this._whackTxt = this.add.text(140, 98, `Whacked:  0 / ${NEED}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setDepth(6);
    this._lifeTxt  = this.add.text(660, 98, '❤️'.repeat(LIVES), { fontSize: '14px' }).setOrigin(1, 0).setDepth(6);

    this._spawnTimer = this.time.addEvent({ delay: 820, loop: true, callback: () => this._spawn() });
    this.time.delayedCall(250, () => this._spawn());
  }

  _spawn() {
    if (this._done) return;
    const free = [];
    this._active.forEach((a, i) => { if (!a) free.push(i); });
    if (!free.length) return;
    const idx = Phaser.Math.RND.pick(free);
    const s = SPOTS[idx];
    const emoji = Phaser.Math.RND.pick(HAZARDS);

    const haz = this.add.text(s.x, s.y, emoji, { fontSize: '40px' }).setOrigin(0.5).setDepth(5).setScale(0);
    const hit = this.add.circle(s.x, s.y, 34, 0xffffff, 0.001).setDepth(6).setInteractive({ useHandCursor: true });
    const rec = { haz, hit, biteEvt: null, gone: false };
    this._active[idx] = rec;

    this.tweens.add({ targets: haz, scale: 1, duration: 130, ease: 'Back.easeOut' });
    this.tweens.add({ targets: haz, y: s.y - 6, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 130 });

    const clear = () => { rec.gone = true; if (rec.biteEvt) rec.biteEvt.remove(); this.tweens.killTweensOf(haz); try { hit.destroy(); } catch (_) {} this._active[idx] = null; };

    hit.on('pointerdown', () => {
      if (rec.gone || this._done) return;
      clear();
      this.tweens.add({ targets: haz, scale: 1.5, alpha: 0, angle: 40, duration: 160, onComplete: () => haz.destroy() });
      const star = this.add.text(s.x, s.y - 10, '💥', { fontSize: '26px' }).setOrigin(0.5).setDepth(7);
      this.tweens.add({ targets: star, scale: 1.6, alpha: 0, duration: 320, onComplete: () => star.destroy() });
      this._whacked++;
      this._whackTxt.setText(`Whacked:  ${this._whacked} / ${NEED}`);
      this._window = Math.max(950, this._window - 12);   // gets faster
      if (this._whacked >= NEED) this._win();
    });

    rec.biteEvt = this.time.delayedCall(this._window, () => {
      if (rec.gone || this._done) return;
      clear();
      this.tweens.add({ targets: haz, y: s.y + 26, alpha: 0, duration: 200, onComplete: () => haz.destroy() });
      this.cameras.main.shake(200, 0.012); this.cameras.main.flash(160, 160, 0, 0);
      this._lives--;
      this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
      if (this._lives <= 0) this._fail("🐍 Bitten too many times!");
    });
  }

  _clearAll() {
    this._active.forEach(rec => { if (rec) { rec.gone = true; if (rec.biteEvt) rec.biteEvt.remove(); try { rec.haz.destroy(); rec.hit.destroy(); } catch (_) {} } });
    this._active = new Array(SPOTS.length).fill(null);
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._clearAll();
    this.cameras.main.flash(500, 60, 200, 80);
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this.add.text(W / 2, H / 2 - 14, '✅ Path cleared!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2 + 22, `+2 ⭐   (Total: ${total})`, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1300, () => this.events.emit('cp-done'));
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this._spawnTimer.remove(); this._clearAll();
    this.cameras.main.shake(300, 0.012);
    this.add.text(W / 2, H / 2, msg + '\nTry again!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1700, () => this.scene.restart());
  }
}

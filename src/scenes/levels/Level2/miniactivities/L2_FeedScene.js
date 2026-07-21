import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { addBondAtmosphere } from './L2_TrustMeter.js';

// L2 Trust Mini-Activity — Feed Gemma (drag & drop care game)
// Chain:  Calm Gemma → THIS → Pet → Rhythm → End
// Drag the SAFE foods into the bowl. Toxic foods (chocolate, grapes…) hurt — avoid them!
const SAFE  = ['l2feed_meat', 'l2feed_bone', 'l2feed_chicken', 'l2feed_cheese'];
const TOXIC = ['l2feed_choc', 'l2feed_grapes', 'l2feed_candy', 'l2feed_mushroom'];
const NEED  = 4;     // safe foods to feed
const LIVES = 2;     // wrong drags allowed
const TIME  = 30;    // seconds (real-challenge)

export class L2_FeedScene extends Phaser.Scene {
  constructor() { super('L2_Feed'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    if (this.textures.exists('l2feed_bg')) {
      this.add.image(W / 2, H / 2, 'l2feed_bg').setDisplaySize(W, H).setDepth(-5);
    } else if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.42).setTint(0x121a14).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.18).setDepth(-4);
    addBondAtmosphere(this, { auraX: 560, auraY: 360 });

    // Title
    const tp = this.add.graphics().setDepth(20);
    tp.fillStyle(0x1a0a12, 0.92); tp.fillRoundedRect(150, 10, 500, 38, 12);
    tp.lineStyle(2, 0xff88bb, 0.6); tp.strokeRoundedRect(150, 10, 500, 38, 12);
    this.add.text(400, 29, '🦴 Feed Gemma the safe foods!', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#3a0820', strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);
    this.add.text(400, 58, 'Drag GOOD food to the bowl. Avoid the foods dogs can\'t eat! 🚫🍫', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0a8', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);

    // Characters
    if (this.textures.exists('gleeda_idle'))
      this.add.image(120, 422, 'gleeda_idle').setDisplaySize(110, 65).setOrigin(0.5, 1).setDepth(8);
    this._gemma = this.textures.exists('gemma_happy')
      ? this.add.image(640, 421, 'gemma_happy').setDisplaySize(150, 82).setOrigin(0.5, 1).setDepth(8)
      : this.add.text(640, 360, '🐶', { fontSize: '70px' }).setOrigin(0.5, 1).setDepth(8);

    // Bowl (drop target) — real sprite
    const bowlX = 560, bowlY = 330;
    this.add.ellipse(bowlX, bowlY + 22, 130, 24, 0x000000, 0.18).setDepth(6);
    if (this.textures.exists('l2feed_bowl')) {
      const bImg = this.textures.get('l2feed_bowl').getSourceImage();
      const bw = 150, bh = bw * (bImg.height / bImg.width);
      this.add.image(bowlX, bowlY, 'l2feed_bowl').setDisplaySize(bw, bh).setDepth(7);
    }
    this.add.text(bowlX, bowlY - 54, '🍽️ BOWL', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(9);
    this._bowlZone = new Phaser.Geom.Circle(bowlX, bowlY, 78);
    this._bowlX = bowlX; this._bowlY = bowlY;

    // HUD — fed counter, lives, timer
    this._fed = 0; this._lives = LIVES; this._timeLeft = TIME; this._done = false;
    this._fedTxt = this.add.text(16, 78, `Fed:  0 / ${NEED}`, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2 }).setDepth(20);
    this._lifeTxt = this.add.text(16, 100, '❤️'.repeat(LIVES), { fontSize: '14px' }).setDepth(20);
    this._timeTxt = this.add.text(W - 16, 78, `⏱ ${TIME}s`, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0).setDepth(20);

    this._timer = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this._done) return;
      this._timeLeft--;
      this._timeTxt.setText(`⏱ ${this._timeLeft}s`).setColor(this._timeLeft <= 8 ? '#ff4466' : '#f5c87a');
      if (this._timeLeft <= 0) this._fail("⏱ Too slow! Gemma is still hungry…");
    }});

    this._spawnFoods();
    this._wireDrag();
  }

  _spawnFoods() {
    // 4 safe + 4 toxic, shuffled across the bottom shelf
    const items = [];
    Phaser.Utils.Array.Shuffle([...SAFE]).slice(0, NEED).forEach(e => items.push({ tex: e, safe: true }));
    Phaser.Utils.Array.Shuffle([...TOXIC]).slice(0, 4).forEach(e => items.push({ tex: e, safe: false }));
    Phaser.Utils.Array.Shuffle(items);

    const startX = 80, gap = 88, rowY = 200;
    this._foods = items.map((it, i) => {
      const fx = startX + i * gap, fy = rowY;
      // little plate under each
      this.add.ellipse(fx, fy + 26, 52, 16, 0x2a2418, 0.6).setDepth(9);
      const img = this.textures.get(it.tex).getSourceImage();
      const ih = 52, iw = ih * (img.width / img.height);
      const t = this.add.image(fx, fy, it.tex).setDisplaySize(Math.min(iw, 66), ih).setDepth(12)
        .setInteractive({ draggable: true, useHandCursor: true });
      t.setData('safe', it.safe); t.setData('ox', fx); t.setData('oy', fy); t.setData('used', false);
      t.setData('base', t.scaleX);
      this.tweens.add({ targets: t, y: fy - 6, duration: 600 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return t;
    });
  }

  _wireDrag() {
    this.input.on('dragstart', (p, o) => { if (!o.getData('used')) { this.tweens.killTweensOf(o); o.setDepth(40); o.setScale(o.getData('base') * 1.25); } });
    this.input.on('drag', (p, o, dx, dy) => { if (!o.getData('used')) o.setPosition(dx, dy); });
    this.input.on('dragend', (p, o) => {
      if (this._done || o.getData('used')) return;
      o.setScale(o.getData('base'));
      if (Phaser.Geom.Circle.Contains(this._bowlZone, o.x, o.y)) {
        if (o.getData('safe')) this._feed(o);
        else                   this._badFood(o);
      } else {
        this.tweens.add({ targets: o, x: o.getData('ox'), y: o.getData('oy'), duration: 220, ease: 'Back.easeOut',
          onComplete: () => { if (!o.getData('used')) this.tweens.add({ targets: o, y: o.getData('oy') - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); } });
      }
    });
  }

  _feed(o) {
    o.setData('used', true); o.disableInteractive();
    const fb = o.getData('base');
    this.tweens.add({ targets: o, x: this._bowlX, y: this._bowlY - 4, scaleX: fb * 0.4, scaleY: fb * 0.4, alpha: 0, duration: 280, ease: 'Cubic.easeIn', onComplete: () => o.destroy() });
    this._fed++;
    this._fedTxt.setText(`Fed:  ${this._fed} / ${NEED}`);
    this.cameras.main.flash(120, 30, 160, 50);
    // happy bounce + heart
    this.tweens.add({ targets: this._gemma, y: this._gemma.y - 10, duration: 130, yoyo: true });
    if (this.textures.exists('heart')) {
      const h = this.add.image(this._bowlX, this._bowlY - 30, 'heart').setDepth(30).setScale(0.7);
      this.tweens.add({ targets: h, y: h.y - 45, alpha: 0, duration: 800, onComplete: () => h.destroy() });
    }
    if (this._fed >= NEED) this._win();
  }

  _badFood(o) {
    o.setData('used', true); o.disableInteractive();
    this.cameras.main.shake(220, 0.01);
    this.cameras.main.flash(220, 160, 0, 0);
    const x = this.add.text(o.x, o.y - 30, '🚫', { fontSize: '30px' }).setOrigin(0.5).setDepth(41);
    this.tweens.add({ targets: x, alpha: 0, y: x.y - 24, duration: 700, onComplete: () => x.destroy() });
    // toss it back off the bowl
    this.tweens.add({ targets: o, x: o.getData('ox'), y: o.getData('oy'), angle: 360, duration: 360, onComplete: () => o.destroy() });
    this._lives--;
    this._lifeTxt.setText('❤️'.repeat(Math.max(0, this._lives)) + '🖤'.repeat(LIVES - Math.max(0, this._lives)));
    if (this._lives <= 0) this._fail("Gemma got an upset tummy! Try again 🤢");
  }

  _win() {
    if (this._done) return;
    this._done = true;
    this._timer.remove();
    this.cameras.main.flash(500, 60, 200, 80);
    if (this._gemma.setTexture && this.textures.exists('gemma_happy')) this._gemma.setTexture('gemma_happy');
    for (let i = 0; i < 14; i++) this.time.delayedCall(i * 60, () => {
      const sp = this.add.image(this._gemma.x + (Math.random() - 0.5) * 120, 300 + (Math.random() - 0.5) * 80,
        this.textures.exists('sparkle') ? 'sparkle' : '__DEFAULT').setDepth(35).setScale(1.5);
      this.tweens.add({ targets: sp, y: sp.y - 60, alpha: 0, duration: 800, onComplete: () => sp.destroy() });
    });
    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    this.add.text(W / 2, H / 2 - 30, '💛 Gemma is happy and full!', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.add.text(W / 2, H / 2 + 4, `+2 ⭐   (Total: ${total})`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(1900, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L2_Pet'));
    });
  }

  _fail(msg) {
    if (this._done) return;
    this._done = true;
    this._timer.remove();
    this.cameras.main.shake(300, 0.012);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(45);
    this.add.text(W / 2, H / 2, msg, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff7070', stroke: '#000', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setDepth(46);
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(450, 0, 0, 0);
      this.time.delayedCall(500, () => this.scene.restart());
    });
  }
}

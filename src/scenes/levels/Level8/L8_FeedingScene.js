import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 3+4 — PUPPY FEEDING TIME
// Seven hungry puppies sit in a row, each thinking of the food it wants. Drag
// the matching food from the tray onto the right puppy. Foods ↔ puppies are a
// 1:1 match, so every tray item feeds exactly one pup. Feed all 7 to finish.
// ════════════════════════════════════════════════════════════════════════════
const FOODS = [
  { kind: 'bone', tex: 'l8_food_bone', label: 'Biscuit' },
  { kind: 'milk', tex: 'l8_food_milk', label: 'Milk' },
  { kind: 'bowl', tex: 'l8_food_bowl', label: 'Kibble' },
  { kind: 'can',  tex: 'l8_food_can',  label: 'Can' },
  { kind: 'bag',  tex: 'l8_food_bag',  label: 'Treats' },
  { kind: 'meat', tex: 'l8_food_meat', label: 'Meat' },
  { kind: 'jar',  tex: 'l8_food_jar',  label: 'Jar' },
];
const PUP_TINTS = [0xffffff, 0xeccaa2, 0xcf9d6a, 0xf3ddc0, 0xc68a55, 0xa9794a, 0x8a6240];

export class L8_FeedingScene extends L8BaseScene {
  constructor() { super('L8_Feeding'); }

  preload() {
    const F = 'assets/images/level8/food/';
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l8_food_bag',  `${F}l8_food_bag.png`);
    load('l8_food_milk', `${F}l8_food_milk.png`);
    load('l8_food_bone', `${F}l8_food_bone.png`);
    load('l8_food_bowl', `${F}l8_food_bowl.png`);
    load('l8_food_can',  `${F}l8_food_can.png`);
    load('l8_food_jar',  `${F}l8_food_jar.png`);
    load('l8_food_meat', `${F}l8_food_meat.png`);
  }

  create() {
    generateL8Assets(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.add.image(W / 2, H / 2, 'l8_feed_bg').setDisplaySize(W, H).setDepth(-40);

    this._fed = 0;
    this._done = false;

    // mother Gamma watching from the left
    this.add.image(64, H - 70, 'l8_gamma').setDisplaySize(150, 106).setDepth(8).setFlipX(true);

    this.buildTopBanner(3, 'Puppy Feeding Time', 'Drag the right food to each hungry pup!');
    this.buildHearts();
    this._setBar = this.buildProgressBar('🐶 PUPPIES FED', 7);

    this._buildPuppies();
    this._buildTray();

    this.time.delayedCall(400, () => this.toast('💭 Each pup shows the food it wants — drag it over!'));
  }

  _buildPuppies() {
    // bijection: shuffle the 7 foods, one wanted kind per puppy
    const wants = Phaser.Utils.Array.Shuffle(FOODS.slice());
    this._puppies = [];
    const n = 7, startX = 130, gap = 92, py = H - 96;
    for (let i = 0; i < n; i++) {
      const x = startX + i * gap;
      const want = wants[i];
      const pup = this.add.image(x, py, 'l8_puppy').setDisplaySize(78, 68).setDepth(12).setTint(PUP_TINTS[i]);
      this.tweens.add({ targets: pup, y: py - 5, duration: Phaser.Math.Between(700, 1000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // empty bowl in front
      const bowl = this.add.image(x, py + 36, 'l8_food_bowl').setDisplaySize(46, 38).setDepth(11).setAlpha(0.35).setTint(0x888888);
      // thought bubble with wanted food
      const bub = this.add.image(x + 26, py - 56, 'l8_bubble').setDisplaySize(58, 54).setDepth(30);
      const wantIcon = this.add.image(x + 26, py - 62, want.tex).setDisplaySize(30, 30).setDepth(31);
      // breathing pulse — each object tweens relative to its own display scale
      [bub, wantIcon].forEach(obj => {
        const sx = obj.scaleX, sy = obj.scaleY;
        this.tweens.add({ targets: obj, scaleX: { from: sx * 0.92, to: sx }, scaleY: { from: sy * 0.92, to: sy }, duration: 900, yoyo: true, repeat: -1 });
      });
      this._puppies.push({ x, py, want: want.kind, pup, bowl, bub, wantIcon, fed: false });
    }
  }

  _buildTray() {
    // tray backing
    const tg = this.add.graphics().setDepth(38);
    tg.fillStyle(0x6a3fa0, 0.85); tg.fillRoundedRect(W / 2 - 290, 74, 580, 56, 14);
    tg.lineStyle(2, 0xffd23a, 0.8); tg.strokeRoundedRect(W / 2 - 290, 74, 580, 56, 14);
    this.add.text(W / 2 - 282, 70, 'FOOD TRAY', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffe08a' }).setDepth(39);

    const n = FOODS.length, startX = W / 2 - 240, gap = 80, ty = 102;
    this._tray = FOODS.map((f, i) => {
      const homeX = startX + i * gap;
      const icon = this.add.image(homeX, ty, f.tex).setDisplaySize(44, 44).setDepth(40).setInteractive({ useHandCursor: true });
      this.input.setDraggable(icon);
      icon.setData('kind', f.kind); icon.setData('homeX', homeX); icon.setData('homeY', ty);
      this.add.text(homeX, ty + 24, f.label, { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff' }).setOrigin(0.5).setDepth(40);
      return icon;
    });

    this.input.on('dragstart', (p, obj) => { obj.setDepth(60).setDisplaySize(obj.displayWidth * 1.15, obj.displayHeight * 1.15); });
    this.input.on('drag', (p, obj, dx, dy) => { obj.setPosition(dx, dy); });
    this.input.on('dragend', (p, obj) => this._onDrop(obj));
  }

  _onDrop(icon) {
    if (this._done) { this._snapBack(icon); return; }
    const kind = icon.getData('kind');
    let target = null, best = 9999;
    for (const pp of this._puppies) {
      if (pp.fed) continue;
      const d = Phaser.Math.Distance.Between(icon.x, icon.y, pp.x, pp.py);
      if (d < 80 && d < best) { best = d; target = pp; }
    }
    if (target && target.want === kind) {
      this._feed(target, icon);
    } else if (target) {
      // right place, wrong food
      this.cameras.main.shake(120, 0.006);
      this.toast('🤔 That pup wants a different food!', 1200);
      this.tweens.add({ targets: target.pup, angle: { from: -6, to: 6 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => target.pup.setAngle(0) });
      this._snapBack(icon);
    } else {
      this._snapBack(icon);
    }
  }

  _snapBack(icon) {
    icon.setDepth(40);
    this.tweens.add({ targets: icon, x: icon.getData('homeX'), y: icon.getData('homeY'), displayWidth: 44, displayHeight: 44, duration: 220, ease: 'Back.easeOut' });
  }

  _feed(pp, icon) {
    pp.fed = true;
    this._fed++;
    this._setBar(this._fed);
    // bowl fills up (pop without resetting its display size)
    pp.bowl.clearTint().setAlpha(1);
    this.tweens.add({ targets: pp.bowl, scaleX: pp.bowl.scaleX * 1.25, scaleY: pp.bowl.scaleY * 1.25, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    // hide want bubble, happy bounce, heart
    this.tweens.add({ targets: [pp.bub, pp.wantIcon], scale: 0, alpha: 0, duration: 220, onComplete: () => { pp.bub.destroy(); pp.wantIcon.destroy(); } });
    this.tweens.add({ targets: pp.pup, y: pp.py - 22, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    this.sparkleBurst(pp.x, pp.py - 10, 10);
    const heart = this.add.image(pp.x, pp.py - 30, 'l8_heart').setScale(0.5).setDepth(35);
    this.tweens.add({ targets: heart, y: heart.y - 50, alpha: 0, scale: 0.9, duration: 900, onComplete: () => heart.destroy() });
    this.addScore?.(150);
    this._snapBack(icon);
    if (this._fed >= 7) this.time.delayedCall(500, () => this._finish());
    else this.toast(`🐶 Yum! ${this._fed}/7 fed`, 1000);
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x6a3fa0, 0).setDepth(110);
    this.tweens.add({ targets: ov, alpha: 0.35, duration: 500 });
    this.add.text(W / 2, H / 2 - 30, '🎉 All Puppies Fed!', {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 5
    }).setOrigin(0.5).setDepth(111);
    this.add.text(W / 2, H / 2 + 12, 'Full and happy! Now let’s build their home 🏡', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(111);
    // floating hearts
    for (let i = 0; i < 14; i++) this.time.delayedCall(i * 110, () => {
      const h = this.add.image(Phaser.Math.Between(120, 680), H / 2 + 60, 'l8_heart').setScale(0.5).setDepth(112);
      this.tweens.add({ targets: h, y: h.y - 140, alpha: 0, duration: 1500, onComplete: () => h.destroy() });
    });
    this.time.delayedCall(2000, () => this.goToScene('L8_HomeRun'));
  }
}

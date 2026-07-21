import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 7+8 — DECORATE THE HOME  →  HAPPY PUPPY HOME!
// Drag each collected item from the tray into its glowing slot in the room.
// Place all 8 to reveal the finished home, the whole family, and LEVEL COMPLETE.
// ════════════════════════════════════════════════════════════════════════════
const SLOTS = [
  { key: 'picture',      tex: 'l8_item_picture',      label: 'Picture', x: 210, y: 150, w: 70,  h: 62 },
  { key: 'plant',        tex: 'l8_item_plant',        label: 'Plant',   x: 736, y: 250, w: 64,  h: 64 },
  { key: 'bed',          tex: 'l8_item_bed',          label: 'Bed',     x: 165, y: 352, w: 100, h: 62 },
  { key: 'foodstation',  tex: 'l8_item_foodstation',  label: 'Food',    x: 300, y: 372, w: 84,  h: 52 },
  { key: 'waterstation', tex: 'l8_item_waterstation', label: 'Water',   x: 398, y: 372, w: 84,  h: 52 },
  { key: 'tunnel',       tex: 'l8_item_tunnel',       label: 'Tunnel',  x: 560, y: 360, w: 100, h: 62 },
  { key: 'toybasket',    tex: 'l8_item_toybasket',    label: 'Toys',    x: 662, y: 346, w: 84,  h: 60 },
  { key: 'rug',          tex: 'l8_item_rug',          label: 'Rug',     x: 432, y: 404, w: 110, h: 50 },
];
const PUP_TINTS = [0xffffff, 0xeccaa2, 0xcf9d6a, 0xf3ddc0, 0xc68a55, 0xa9794a, 0x8a6240];

export class L8_DecorateScene extends L8BaseScene {
  constructor() { super('L8_Decorate'); }

  preload() {
    const HI = 'assets/images/level8/home-item/';
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l8_item_bed',          `${HI}l8_item_bed.png`);
    load('l8_item_foodstation',  `${HI}l8_item_foodstation.png`);
    load('l8_item_waterstation', `${HI}l8_item_waterstation.png`);
    load('l8_item_toybasket',    `${HI}l8_item_toybasket.png`);
    load('l8_item_picture',      `${HI}l8_item_picture.png`);
    load('l8_item_plant',        `${HI}l8_item_plant.png`);
    load('l8_item_rug',          `${HI}l8_item_rug.png`);
    load('l8_item_tunnel',       `${HI}l8_item_tunnel.png`);
  }

  create() {
    generateL8Assets(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.add.image(W / 2, H / 2, 'l8_room_bg').setDisplaySize(W, H).setDepth(-40);

    this._placed = 0;
    this._done = false;

    this.buildTopBanner(7, 'Decorate the Home', 'Drag each item to its glowing spot!');
    this.buildHearts();
    this._setCount = this.buildCounterPill('🏠', 'HOME DECORATED', SLOTS.length);

    this._buildSlots();
    this._buildTray();

    this.time.delayedCall(400, () => this.toast('🎨 Drag the items into the dashed slots!'));
  }

  _buildSlots() {
    this._slots = SLOTS.map(s => {
      const ph = this.add.image(s.x, s.y, 'l8_slot').setDisplaySize(s.w + 14, s.h + 14).setDepth(4).setAlpha(0.9);
      this.tweens.add({ targets: ph, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });
      const lbl = this.add.text(s.x, s.y, s.label, {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 3
      }).setOrigin(0.5).setDepth(5);
      return { ...s, ph, lbl, filled: false };
    });
  }

  _buildTray() {
    const tg = this.add.graphics().setDepth(38);
    tg.fillStyle(0x6a3fa0, 0.9); tg.fillRoundedRect(20, H - 52, W - 40, 44, 12);
    tg.lineStyle(2, 0xffd23a, 0.8); tg.strokeRoundedRect(20, H - 52, W - 40, 44, 12);

    const order = Phaser.Utils.Array.Shuffle(SLOTS.slice());
    const n = order.length, startX = 70, gap = (W - 140) / (n - 1), ty = H - 30;
    this._tray = order.map((s, i) => {
      const homeX = startX + i * gap;
      const icon = this.add.image(homeX, ty, s.tex).setDisplaySize(46, 36).setDepth(40).setInteractive({ useHandCursor: true });
      this.input.setDraggable(icon);
      icon.setData('key', s.key); icon.setData('homeX', homeX); icon.setData('homeY', ty);
      return icon;
    });

    this.input.on('dragstart', (p, obj) => { obj.setDepth(60).setScale(obj.scaleX * 1.2, obj.scaleY * 1.2); });
    this.input.on('drag', (p, obj, dx, dy) => { obj.setPosition(dx, dy); });
    this.input.on('dragend', (p, obj) => this._onDrop(obj));
  }

  _onDrop(icon) {
    if (this._done) { this._snapBack(icon); return; }
    const key = icon.getData('key');
    let target = null, best = 9999;
    for (const s of this._slots) {
      if (s.filled) continue;
      const d = Phaser.Math.Distance.Between(icon.x, icon.y, s.x, s.y);
      if (d < 90 && d < best) { best = d; target = s; }
    }
    if (target && target.key === key) this._place(target, icon);
    else {
      if (target) { this.cameras.main.shake(120, 0.006); this.toast('🤔 That goes in a different spot!', 1200); }
      this._snapBack(icon);
    }
  }

  _snapBack(icon) {
    icon.setDepth(40);
    this.tweens.add({ targets: icon, x: icon.getData('homeX'), y: icon.getData('homeY'), displayWidth: 46, displayHeight: 36, duration: 220, ease: 'Back.easeOut' });
  }

  _place(slot, icon) {
    slot.filled = true;
    this._placed++;
    this._setCount(this._placed);
    icon.disableInteractive();
    this.input.setDraggable(icon, false);
    // fade the placeholder, snap the item into the slot at full size
    this.tweens.add({ targets: [slot.ph, slot.lbl], alpha: 0, duration: 200, onComplete: () => { slot.ph.destroy(); slot.lbl.destroy(); } });
    this.tweens.add({ targets: icon, x: slot.x, y: slot.y, displayWidth: slot.w, displayHeight: slot.h, depth: 6, duration: 280, ease: 'Back.easeOut' });
    icon.setDepth(6);
    this.sparkleBurst(slot.x, slot.y, 10);
    this.addScore?.(100);
    if (this._placed >= SLOTS.length) this.time.delayedCall(450, () => this._finish());
    else this.toast(`✨ Placed! ${this._placed}/${SLOTS.length}`, 900);
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    this.toast('🎉 The home is ready!', 1400);
    // family arrives
    this.time.delayedCall(700, () => this._happyHome());
  }

  _happyHome() {
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0xfff6e8, 0).setDepth(50);
    this.tweens.add({ targets: ov, alpha: 0.2, duration: 500 });
    // Gleeda + Gamma + 7 puppies on the rug
    const gleeda = this.add.image(150, H - 70, 'l8_runner_idle').setDisplaySize(70, 108).setDepth(55).setAlpha(0);
    const gamma = this.add.image(250, H - 64, 'l8_gamma').setDisplaySize(150, 106).setDepth(55).setAlpha(0);
    this.tweens.add({ targets: [gleeda, gamma], alpha: 1, duration: 500 });
    for (let i = 0; i < 7; i++) {
      const px = 340 + i * 60, py = H - 52;
      const pup = this.add.image(px, py + 30, 'l8_puppy').setDisplaySize(58, 50).setDepth(55).setAlpha(0).setTint(PUP_TINTS[i]);
      this.time.delayedCall(300 + i * 120, () => {
        this.tweens.add({ targets: pup, alpha: 1, y: py, duration: 350, ease: 'Back.easeOut' });
        this.sparkleBurst(px, py, 6);
      });
    }
    // floating hearts
    this._heartTimer = this.time.addEvent({ delay: 260, loop: true, callback: () => {
      const h = this.add.image(Phaser.Math.Between(120, 700), H - 40, 'l8_heart').setScale(0.5).setDepth(56);
      this.tweens.add({ targets: h, y: h.y - 150, alpha: 0, duration: 1500, onComplete: () => h.destroy() });
    }});

    this.add.text(W / 2, 120, '🐾 Happy Puppy Home! 🐾', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 5
    }).setOrigin(0.5).setDepth(57);
    this.add.text(W / 2, 154, 'A Happy, Healthy Family!', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#e0567a', stroke: '#fff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(57);

    this.time.delayedCall(2400, () => this._levelComplete());
  }

  _levelComplete() {
    const score = this.registry.get('l8_score') ?? 0;
    const stars = score >= 2600 ? 3 : score >= 1700 ? 2 : 1;
    this.registry.set('l8_complete', true);
    this.registry.set('l8_stars', stars);

    const { td, py, ph } = this.openPanel('🏆 Level Complete!', 'Puppy Care Day done!', { w: 440, h: 280 });
    // stars
    for (let i = 0; i < 3; i++) {
      const s = this.add.image(W / 2 - 60 + i * 60, py + 110, 'l8_star').setScale(0).setDepth(103);
      td.push(s);
      this.time.delayedCall(300 + i * 220, () => {
        this.tweens.add({ targets: s, scale: i < stars ? 1.4 : 0.9, duration: 350, ease: 'Back.easeOut' });
        if (i < stars) { s.setTint(0xffffff); this.sparkleBurst(s.x, s.y, 8, false); }
        else s.setTint(0x999999);
      });
    }
    td.push(this.add.text(W / 2, py + 158, `Score  ${score}`, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 36, '🐾  Finish', 0x6ad06a, () => {
      if (this._heartTimer) this._heartTimer.remove();
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(740, () => { this._wakeLoop(); this.scene.start('EndScene'); });
    }, 200, 46);
  }
}

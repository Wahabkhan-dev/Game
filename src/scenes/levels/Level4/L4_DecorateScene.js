import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL4Assets, generateL4StreetAssets } from './L4Assets.js';

// ── Level 4 — Build Scene: the player SELECTS each collected material from a
// tray to raise Gamma's real dog house, in the home garage. Nothing builds by
// default — you must pick the right material for each step.
const HX = 470, HY = 374;          // house base centre / bottom (on the garage floor)

// Build steps — each needs a specific material chosen from the tray.
const STEPS = [
  { need: 'wood',  label: 'Lay the Wood Frame',  reveal: 0.40 },
  { need: 'roof',  label: 'Fit the Roof',         reveal: 0.72 },
  { need: 'nails', label: 'Hammer the Nails',     reveal: 0.88, nails: true },
  { need: 'paint', label: 'Paint the House',      reveal: 1.00, paint: true },
  { need: 'bed',   label: 'Add the Cozy Bed',     reveal: 1.00, prop: 'l4_bed' },
  { need: 'bowl',  label: 'Set the Food Bowl',    reveal: 1.00, prop: 'l4_food_bowl' },
];

// Tray materials (the 6 things collected on the run)
const TRAY = [
  { key: 'wood',  tex: 'l4_wood',      label: 'Wood' },
  { key: 'roof',  tex: 'l4_roof',      label: 'Roof' },
  { key: 'nails', tex: 'l4_nails',     label: 'Nails' },
  { key: 'paint', tex: 'l4_paint',     label: 'Paint' },
  { key: 'bed',   tex: 'l4_bed',       label: 'Bedding' },
  { key: 'bowl',  tex: 'l4_food_bowl', label: 'Bowl' },
];

export class L4_DecorateScene extends Phaser.Scene {
  constructor() { super('L4_Decorate'); }

  create(data) {
    generateL4Assets(this);
    generateL4StreetAssets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this._coins = (data && data.coins) || 0;

    // ── Home garage background (real image if added, vector fallback otherwise) ──
    this.add.image(W / 2, H / 2, 'l4_garage_bg').setDisplaySize(W, H).setDepth(-20);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.10).setDepth(-9);

    // Title + progress bar
    this.add.text(W / 2, 22, '🔨 Build Gamma\'s House!', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffe0b0', stroke: '#3a1e08', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);
    const bx = W / 2 - 150, by = 48;
    this.add.graphics().setDepth(40).fillStyle(0x22160a, 0.9).fillRoundedRect(bx, by, 300, 16, 8);
    this._progFill = this.add.graphics().setDepth(41);
    this._progTxt = this.add.text(W / 2, by + 8, '0%', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(42);
    this._progBX = bx; this._progBY = by;

    // Prompt (top, under the bar)
    this._promptBg = this.add.graphics().setDepth(40);
    this._promptBg.fillStyle(0x1a2230, 0.92); this._promptBg.fillRoundedRect(W / 2 - 205, 74, 410, 40, 10);
    this._promptBg.lineStyle(2, 0x4a6080, 0.8); this._promptBg.strokeRoundedRect(W / 2 - 205, 74, 410, 40, 10);
    this._promptTxt = this.add.text(W / 2, 86, '', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#cfe0f5', align: 'center' }).setOrigin(0.5).setDepth(41);
    this._tipTxt = this.add.text(W / 2, 104, '', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88a0c0' }).setOrigin(0.5).setDepth(41);

    // Gamma watching
    this._gamma = this.add.image(140, HY + 4, this.textures.exists('gemma_idle') ? 'gemma_idle' : 'l4_food_bowl')
      .setOrigin(0.5, 1).setDisplaySize(140, 80).setDepth(8);
    this._gammaScale = this._gamma.scaleX;   // remember display scale for later tweens
    this._gammaBob = this.tweens.add({ targets: this._gamma, y: HY, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── The real house, revealed bottom-up as steps complete ──
    const src = this.textures.get('l4_house_finished').getSourceImage();
    this._houseTexW = src.width; this._houseTexH = src.height;
    this._hh = 184; this._hw = this._hh * (src.width / src.height);
    this._houseTop = HY - this._hh;
    this.add.ellipse(HX, HY + 4, this._hw * 0.9, 22, 0x000000, 0.18).setDepth(3);
    this._pad = this.add.graphics().setDepth(4);
    this._pad.fillStyle(0x8a5a28, 0.85); this._pad.fillRect(HX - this._hw * 0.42, HY - 6, this._hw * 0.84, 8);
    this._houseImg = this.add.image(HX, HY, 'l4_house_finished').setOrigin(0.5, 1).setDisplaySize(this._hw, this._hh).setDepth(5);

    this._stage = 0;
    this._reveal = 0;
    this._busy = false;
    this._setReveal(0);

    this._buildTray();

    this._step = 0;
    this._startStep();
  }

  // ── Material tray the player selects from ───────────────────────────────────
  _buildTray() {
    const n = TRAY.length, x0 = 130, gap = (W - 2 * x0) / (n - 1), y = 414;
    this._slots = TRAY.map((m, i) => {
      const cx = x0 + i * gap;
      const box = this.add.graphics().setDepth(34);
      this._drawSlot(box, cx, y, 0x2a3550, 0x6aaa88);
      const ic = this.textures.get(m.tex).getSourceImage();
      const iw = 44, ih = 44 * (ic.height / ic.width);
      const img = this.add.image(cx, y - 4, m.tex).setDisplaySize(iw, Math.min(ih, 44)).setDepth(35);
      const label = this.add.text(cx, y + 26, m.label, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#dfe8f5' }).setOrigin(0.5).setDepth(35);
      const hit = this.add.rectangle(cx, y, 72, 72, 0xffffff, 0.001).setDepth(36).setInteractive({ useHandCursor: true });
      const slot = { key: m.key, cx, y, box, img, label, hit, used: false, pulse: null, baseScale: img.scaleX };
      hit.on('pointerdown', () => this._pick(slot));
      return slot;
    });
  }

  _drawSlot(g, cx, y, fill, stroke) {
    g.clear();
    g.fillStyle(fill, 0.85); g.fillRoundedRect(cx - 36, y - 36, 72, 72, 10);
    g.lineStyle(2, stroke, 0.9); g.strokeRoundedRect(cx - 36, y - 36, 72, 72, 10);
  }

  _slotFor(key) { return this._slots.find(s => s.key === key); }

  // ── STEP FLOW ───────────────────────────────────────────────────────────────
  _startStep() {
    if (this._step >= STEPS.length) { this._finish(); return; }
    const st = STEPS[this._step];
    this._needed = st.need;
    this._busy = false;
    this._promptTxt.setText(`Step ${this._step + 1}/${STEPS.length}:  ${st.label}`);
    this._tipTxt.setText(`Tap the ${this._slotFor(st.need) ? this._labelFor(st.need) : st.need} in the tray below 👇`);

    // Gentle pulse on the correct material so kids know what to pick
    const slot = this._slotFor(st.need);
    if (slot) {
      this._drawSlot(slot.box, slot.cx, slot.y, 0x3a5a3a, 0xffe14a);
      const b = slot.baseScale;
      slot.pulse = this.tweens.add({ targets: slot.img, scaleX: { from: b, to: b * 1.18 }, scaleY: { from: b, to: b * 1.18 }, duration: 520, yoyo: true, repeat: -1 });
    }
  }

  _labelFor(key) { return (TRAY.find(t => t.key === key) || {}).label || key; }

  _pick(slot) {
    if (this._busy || slot.used) return;
    if (slot.key !== this._needed) {
      // Wrong material — gentle nudge, no penalty
      this.cameras.main.shake(140, 0.005);
      this.tweens.add({ targets: slot.box, x: { from: 0, to: 6 }, duration: 60, yoyo: true, repeat: 3 });
      this._flashMsg(`Not yet — we need ${this._labelFor(this._needed)} first!`);
      return;
    }
    this._busy = true;
    // stop the hint pulse and mark this slot as used
    if (slot.pulse) { slot.pulse.stop(); slot.img.setScale(slot.baseScale); slot.pulse = null; }
    slot.used = true;
    slot.hit.disableInteractive();
    this._drawSlot(slot.box, slot.cx, slot.y, 0x223018, 0x4a7a4a);
    slot.img.setAlpha(0.45);
    this.add.text(slot.cx + 22, slot.y - 22, '✓', { fontSize: '18px', color: '#7bff9a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(37);

    const st = STEPS[this._step];
    // material flies from the tray to the house
    const fly = this.add.image(slot.cx, slot.y - 4, slot.img.texture.key).setDisplaySize(slot.img.displayWidth, slot.img.displayHeight).setDepth(38);
    const flyBase = fly.scaleX;
    this.tweens.add({
      targets: fly, x: HX, y: this._houseTop + this._hh * 0.5, scaleX: flyBase * 0.5, scaleY: flyBase * 0.5, alpha: 0.2, duration: 450, ease: 'Sine.easeIn',
      onComplete: () => {
        fly.destroy();
        if (st.nails) { this._startNails(st); }
        else if (st.paint) { this._startPaint(st); }
        else { this._applyStep(st); }
      }
    });
  }

  // Tap each of the 4 nails after selecting Nails
  _startNails(st) {
    let left = 4;
    const t = this._houseTop, b = HY;
    const spots = [[HX - this._hw * 0.3, t + this._hh * 0.32], [HX + this._hw * 0.3, t + this._hh * 0.32],
                   [HX - this._hw * 0.3, b - this._hh * 0.2], [HX + this._hw * 0.3, b - this._hh * 0.2]];
    this._tipTxt.setText('Tap each glowing nail! 🔨');
    spots.forEach(([nx, ny]) => {
      const ring = this.add.circle(nx, ny, 12, 0xffee44, 0).setStrokeStyle(2, 0xffee44, 0.9).setDepth(31).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: ring, scale: 1.3, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
      ring.once('pointerdown', () => {
        this.tweens.killTweensOf(ring); ring.destroy();
        const hammer = this.add.text(nx + 16, ny - 18, '🔨', { fontSize: '24px' }).setOrigin(0.5).setDepth(33);
        this.tweens.add({ targets: hammer, angle: -40, x: nx + 4, y: ny - 8, duration: 120, yoyo: true, onComplete: () => hammer.destroy() });
        this.cameras.main.shake(80, 0.004);
        this._sparkle(nx, ny);
        if (--left <= 0) this._applyStep(st);
      });
    });
  }

  // Swipe to paint after selecting Paint
  _startPaint(st) {
    const my = this._houseTop + this._hh * 0.5;
    this._tipTxt.setText('Swipe back and forth across the house! 🖌️');
    const brush = this.add.text(HX - this._hw * 0.4, my, '🖌️', { fontSize: '28px' }).setDepth(32);
    this.tweens.add({ targets: brush, x: HX + this._hw * 0.4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const zone = this.add.rectangle(HX, my, this._hw, this._hh * 0.7, 0xffffff, 0.001).setDepth(30).setInteractive({ useHandCursor: true, draggable: true });
    let lastX = null, prog = 0;
    const paintMove = (p) => {
      if (!p.isDown) { lastX = null; return; }
      if (lastX !== null) prog = Phaser.Math.Clamp(prog + Math.abs(p.x - lastX) / 520, 0, 1);
      lastX = p.x;
      if (Math.random() < 0.3) this._sparkle(p.x, p.y);
      if (prog >= 1) {
        this.input.off('pointermove', paintMove);
        brush.destroy(); zone.destroy();
        this._applyStep(st);
      }
    };
    this.input.on('pointermove', paintMove);
    this._paintMove = paintMove;
  }

  _applyStep(st) {
    if (this._paintMove) { this.input.off('pointermove', this._paintMove); this._paintMove = null; }
    this._stage++;
    this.cameras.main.flash(180, 80, 200, 90);
    this._sparkle(HX, this._houseTop + 20);

    // reveal more of the house
    this.tweens.addCounter({ from: this._reveal, to: st.reveal, duration: 450, ease: 'Sine.easeOut', onUpdate: t => this._setReveal(t.getValue()) });

    // comfort prop
    if (st.prop && this.textures.exists(st.prop)) {
      const img = this.textures.get(st.prop).getSourceImage();
      let ph, px, py, depth;
      if (st.prop === 'l4_bed') {
        // Small — tucked INSIDE the door opening (door is in the left third of the house)
        ph = 30; px = HX - this._hw * 0.09; py = HY - this._hh * 0.20; depth = 6;
      } else {
        // Food bowl on the grass right IN FRONT of the entrance
        ph = 42; px = HX - this._hw * 0.04; py = HY + 10; depth = 9;
      }
      const obj = this.add.image(px, py, st.prop).setOrigin(0.5, 1).setDisplaySize(ph * (img.width / img.height), ph).setDepth(depth).setAlpha(0);
      const base = obj.scaleX;                       // the scale that gives the target display size
      obj.setScale(base * 0.4);
      this.tweens.add({ targets: obj, alpha: 1, scaleX: base, scaleY: base, duration: 350, ease: 'Back.easeOut' });
    }

    this._setProgress();
    this._step++;
    this.time.delayedCall(550, () => this._startStep());
  }

  _flashMsg(txt) {
    if (this._msg) { try { this._msg.destroy(); } catch (_) {} }
    this._msg = this.add.text(W / 2, 130, txt, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffd0a0', stroke: '#3a1505', strokeThickness: 3 }).setOrigin(0.5).setDepth(45);
    this.tweens.add({ targets: this._msg, alpha: 0, y: 120, delay: 900, duration: 500, onComplete: () => { try { this._msg.destroy(); } catch (_) {} } });
  }

  // ── Reveal the real house bottom→top (crop in texture space) ─────────────────
  _setReveal(frac) {
    this._reveal = Phaser.Math.Clamp(frac, 0, 1);
    const ch = this._houseTexH * this._reveal;
    this._houseImg.setCrop(0, this._houseTexH - ch, this._houseTexW, ch);
    this._houseImg.setVisible(this._reveal > 0.001);
  }

  _setProgress() {
    const pct = Math.round((this._stage / STEPS.length) * 100);
    this._progFill.clear();
    this._progFill.fillStyle(0x44cc55, 1);
    this._progFill.fillRoundedRect(this._progBX, this._progBY, 300 * (this._stage / STEPS.length), 16, 8);
    this._progTxt.setText(`${pct}%`);
  }

  // ── FINAL CUTSCENE ──────────────────────────────────────────────────────────
  _finish() {
    this._setReveal(1);
    this._promptTxt.setText('🎉 The house is ready!');
    this._tipTxt.setText('');
    if (this._gammaBob) { this._gammaBob.stop(); this._gammaBob = null; }   // stop bob so the walk-in is smooth
    this.tweens.add({ targets: this._gamma, x: HX - 6, duration: 1400, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.textures.exists('gemma_happy')) this._gamma.setTexture('gemma_happy');
        this.tweens.add({ targets: this._gamma, y: this._gamma.y + 6, duration: 200, yoyo: true, repeat: 2,
          onComplete: () => {
            this.tweens.add({ targets: this._gamma, x: HX, alpha: 0, scaleX: this._gammaScale * 0.7, scaleY: this._gammaScale * 0.7, duration: 700,
              onComplete: () => {
                this._heartBurst();
                if (this.textures.exists('gleeda_idle'))
                  this.add.image(HX - this._hw * 0.62, HY + 4, 'gleeda_idle').setOrigin(0.5, 1).setDisplaySize(80, 98).setDepth(8);
                this.add.text(W / 2, 150, '💛 Gamma loves her new home! 💛', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#3a0820', strokeThickness: 3 }).setOrigin(0.5).setDepth(45).setAlpha(0).setData('fin', 1);
                this.children.list.filter(c => c.getData && c.getData('fin')).forEach(c => this.tweens.add({ targets: c, alpha: 1, duration: 500 }));
                this.time.delayedCall(2000, () => this._reward());
              } });
          } });
      } });
  }

  _heartBurst() {
    for (let i = 0; i < 16; i++) this.time.delayedCall(i * 80, () => {
      const h = this.add.text(HX + (Math.random() - 0.5) * 80, this._houseTop + 40, '❤️', { fontSize: `${14 + Math.random() * 12}px` }).setOrigin(0.5).setDepth(40);
      this.tweens.add({ targets: h, y: h.y - 80, alpha: 0, duration: 1100, onComplete: () => h.destroy() });
    });
    this.cameras.main.flash(500, 255, 180, 200);
  }

  // ── REWARD SCREEN ───────────────────────────────────────────────────────────
  _reward() {
    try { this.registry.set('points', (this.registry.get('points') || 0) + 500); } catch (_) {}
    try { localStorage.setItem('shadowgamma_level4_done', '1'); } catch (_) {}

<<<<<<< Updated upstream
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(60);
    const cg = this.add.graphics().setDepth(61);
    cg.fillStyle(0xfdf0e8, 1); cg.fillRoundedRect(W / 2 - 170, H / 2 - 120, 340, 240, 18);
    cg.lineStyle(3, 0xf5c84a, 1); cg.strokeRoundedRect(W / 2 - 170, H / 2 - 120, 340, 240, 18);
=======
    // _finish() faded Gamma out to alpha 0 for the heart-burst beat — bring her
    // back into view here so the "settling down to sleep" animation is visible.
    this.tweens.killTweensOf(this._gamma);
    this._gamma.setPosition(HX, HY).setScale(this._gammaScale).setAlpha(1);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0820, 0).setDepth(50);
    this.tweens.add({ targets: dim, alpha: 0.42, duration: 1200 });
>>>>>>> Stashed changes

    this.add.text(W / 2, H / 2 - 92, 'LEVEL 4 COMPLETE! 🎉', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#d94060', stroke: '#fdf0e8', strokeThickness: 2 }).setOrigin(0.5).setDepth(62);
    ['⭐', '⭐', '⭐'].forEach((s, i) => {
      const st = this.add.text(W / 2 - 34 + i * 34, H / 2 - 50, s, { fontSize: '30px' }).setOrigin(0.5).setDepth(62).setScale(0.2);
      this.tweens.add({ targets: st, scale: 1, duration: 350, delay: 250 + i * 160, ease: 'Back.easeOut' });
    });
    if (this.textures.exists('l4_coin')) this.add.image(W / 2 - 56, H / 2 - 2, 'l4_coin').setDisplaySize(26, 26).setDepth(62);
    this.add.text(W / 2 - 38, H / 2 - 2, '+500', { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#d4a020' }).setOrigin(0, 0.5).setDepth(62);
    this.add.text(W / 2 + 36, H / 2 - 2, '⭐ +1', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#e0a020' }).setOrigin(0, 0.5).setDepth(62);

    const next = this.add.text(W / 2 - 70, H / 2 + 64, 'Next', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#44aa44', padding: { x: 20, y: 10 } }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });
    const replay = this.add.text(W / 2 + 70, H / 2 + 64, 'Replay', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#884422', padding: { x: 16, y: 10 } }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Menu')); });
    replay.on('pointerdown', () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Level4')); });

    this.time.addEvent({ delay: 200, repeat: 20, callback: () => this._sparkle(W / 2 - 130 + Math.random() * 260, H / 2 - 100 + Math.random() * 220) });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2, d = 14 + Math.random() * 24;
      const s = this.add.image(x, y, this.textures.exists('l4_sparkle') ? 'l4_sparkle' : 'l4_coin').setScale(0.6).setDepth(63);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, scale: 1.2, duration: 600, onComplete: () => s.destroy() });
    }
  }
}

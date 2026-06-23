import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 2 — GARAGE PUNCTURE REPAIR  (industrial garage)
// Find tools → lift the car → remove the tire → repair the puncture → inflate.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage2Scene extends L7BaseScene {
  constructor() { super('L7_Stage2'); }

  init(data) {}

  preload() {
    const P = 'assets/images/Level7/Stage2/';
    const files = ['l7_s2_bg', 'l7_jeep_side', 'l7_jeep_fixed', 'l7_tire', 'l7_tire_flat', 'l7_jack', 'l7_wrench', 'l7_patchkit', 'l7_lugnut', 'l7_patch'];
    files.forEach(k => {
      // Remove any procedurally-generated placeholder so the real PNG is used instead
      if (this.textures.exists(k)) this.textures.remove(k);
      this.load.image(k, `${P}${k}.png`);
    });
    this.load.on('loaderror', (file) => console.error(`[L7_Stage2] load error: ${file?.key}`));
  }

  // size an image by target HEIGHT, preserving its native aspect ratio (art has padding)
  _wh(key, h) { const s = this.textures.get(key).getSourceImage(); return [h * s.width / s.height, h]; }
  _ai(key, x, y, h, oy = 0.5, depth = 5) { const [w, hh] = this._wh(key, h); return this.add.image(x, y, key).setOrigin(0.5, oy).setDisplaySize(w, hh).setDepth(depth); }

  create() {
    generateL7Assets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#1a1d22');

    this.add.image(W / 2, H / 2, 'l7_s2_bg').setDisplaySize(W, H).setDepth(-10);

    this._jeepBaseY = 398;
    this._jeep = this._ai('l7_jeep_side', W / 2 + 18, this._jeepBaseY, 168, 1, 5);
    this._hubX = this._jeep.x + this._jeep.displayWidth * 0.295;
    this._hubY = this._jeepBaseY - this._jeep.displayHeight * 0.205;
    this._wheelH = 60;
    this._flatTire = null;

    this.buildStageHUD(2, 'Fix the Puncture',
      ['Find the tools', 'Lift the jeep', 'Remove the tyre', 'Repair the puncture', 'Inflate & refit']);

    this.time.delayedCall(500, () => this._beginStep(1));
  }

  _beginStep(n) {
    this._step = n;
    const steps = {
      1: ['🧰', 'Find the Tools', 'Search the garage and click the\njack, wrench and patch kit.', () => this._stepFindTools()],
      2: ['🔧', 'Lift the Jeep', 'Tap PUMP (or SPACE) to raise\nthe jeep on the jack.',         () => this._stepLift()],
      3: ['⚙️', 'Remove the Tyre', 'Click each lug nut to unscrew it,\nthen pull the tyre off.',     () => this._stepRemove()],
      4: ['🩹', 'Repair the Puncture', 'Drag the patch onto the hole,\nthen press SEAL.',            () => this._stepRepair()],
      5: ['💨', 'Inflate the Tyre', 'Hold to pump air. Keep the needle\nin the GREEN zone until full!', () => this._stepInflate()],
    };
    const [e, t, d, fn] = steps[n];
    this.activityIntro(e, t, d, fn);
  }

  _nextStep(objIdx, msg) {
    this.completeObjective(objIdx);
    this.toast(msg, 1800);
    if (this._step >= 5) {
      this.time.delayedCall(900, () => this._finishStage());
    } else {
      this.time.delayedCall(900, () => this._beginStep(this._step + 1));
    }
  }

  _finishStage() {
    if (this._flatTire) this._flatTire.destroy();
    if (this.textures.exists('l7_jeep_fixed')) {
      const [jw, jh] = this._wh('l7_jeep_fixed', 168);
      this._jeep.setTexture('l7_jeep_fixed').setDisplaySize(jw, jh);
    } else {
      const good = this._ai('l7_tire', this._hubX, this._hubY - 26, this._wheelH, 0.5, 6);
      this.tweens.add({ targets: good, y: this._hubY, duration: 400 });
    }
    this.tweens.add({ targets: this._jeep, y: this._jeepBaseY, duration: 400 });
    this.cameras.main.flash(300, 120, 220, 140);
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', 'L7_Stage3');
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this._wakeLoop();
        this.scene.start('L7_Stage3');
      });
    });
  }

  // ── Step 1: Find tools (in-scene hidden objects) ───────────────────────────
  _stepFindTools() {
    const tools = [
      { tex: 'l7_jack',     x: 132, y: 416, h: 50, name: 'Jack' },      // on the floor, left
      { tex: 'l7_wrench',   x: 648, y: 408, h: 40, name: 'Wrench' },    // floor, right of jeep
      { tex: 'l7_patchkit', x: 512, y: 286, h: 44, name: 'Patch Kit' }, // on a shelf
    ];
    this.add.text(W / 2, 92, '🧰 Find:  Jack • Wrench • Patch Kit', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fde8c0', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);

    // small inventory tray at the bottom — each found tool drops into its slot
    const trayY = H - 32, slotX = [W / 2 - 56, W / 2, W / 2 + 56], SLOT = 40, ICON = 32;
    const tray = this.add.graphics().setDepth(38);
    tray.fillStyle(0x10141e, 0.9); tray.fillRoundedRect(W / 2 - 92, trayY - 24, 184, 48, 10);
    tray.lineStyle(2, 0xf0a830, 0.7); tray.strokeRoundedRect(W / 2 - 92, trayY - 24, 184, 48, 10);
    slotX.forEach(sx => { tray.lineStyle(1, 0x5a6a82, 0.6); tray.strokeRoundedRect(sx - SLOT / 2, trayY - SLOT / 2, SLOT, SLOT, 6); });
    this.add.text(W / 2, trayY - 33, '🧰 TOOLS', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setDepth(39);

    let found = 0;
    tools.forEach((tl, i) => {
      const img = this._ai(tl.tex, tl.x, tl.y, tl.h, 0.5, 15).setAlpha(0.55).setInteractive({ useHandCursor: true });
      const glow = this.add.circle(tl.x, tl.y, 18, 0xffe9a0, 0.14).setDepth(14);
      this.tweens.add({ targets: glow, alpha: 0.32, scale: 1.2, duration: 700, yoyo: true, repeat: -1 });
      img.on('pointerdown', () => {
        img.disableInteractive(); glow.destroy();
        this.sparkleBurst(tl.x, tl.y, 8);
        // shrink to fit the slot and drop into the bottom tray
        const factor = ICON / Math.max(img.displayWidth, img.displayHeight);
        img.setDepth(40);
        this.tweens.add({ targets: img, x: slotX[i], y: trayY, scaleX: img.scaleX * factor, scaleY: img.scaleY * factor, alpha: 1, duration: 420, ease: 'Cubic.easeInOut' });
        found++;
        this.toast(`✓ ${tl.name} found (${found}/3)`, 1400);
        if (found >= 3) this._nextStep(0, '🧰 All tools ready!');
      });
    });
  }

  // ── Step 2: Lift the jeep (pump gauge) ─────────────────────────────────────
  _stepLift() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔧 Lift the Jeep', 'Tap PUMP or press SPACE to raise it!', { w: 420, h: 320 });
    let val = 0;
    const barX = W / 2, barTop = py + 90, barH = 150;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(102);
    frame.fillStyle(0x0a0f18, 1); frame.fillRoundedRect(barX - 30, barTop, 60, barH, 8);
    frame.lineStyle(2, 0x5a6a82, 1); frame.strokeRoundedRect(barX - 30, barTop, 60, barH, 8);
    td.push(frame);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(103); td.push(fill);
    const pct = this.add.text(barX, barTop - 18, '0%', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setScrollFactor(0).setDepth(103); td.push(pct);
    const jeepBaseY = this._jeep.y;
    const draw = () => {
      fill.clear();
      const h = (val / 100) * (barH - 6);
      fill.fillStyle(val > 90 ? 0x7dff88 : 0x44aadd, 1);
      fill.fillRoundedRect(barX - 27, barTop + (barH - 3) - h, 54, h, 6);
      pct.setText(Math.floor(val) + '%');
    };
    draw();
    const pump = () => {
      if (val >= 100) return;
      val = Math.min(100, val + 9);
      draw();
      this._jeep.y = jeepBaseY - (val / 100) * 26;
      if (this._flatTire) this._flatTire.y = this._hubY - (val / 100) * 26;
      this.cameras.main.shake(60, 0.003);
      if (val >= 100) { this.time.delayedCall(400, () => { close(); this._nextStep(1, '🔧 Jeep lifted!'); }); }
    };
    this.panelButton(td, W / 2, py + ph - 40, '⬆  PUMP', 0x7dff88, pump, 180, 46);
    const sp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    sp.on('down', pump);
    this._cleanupKeys = () => sp.removeAllListeners();
    td.push({ destroy: () => sp.removeAllListeners() });
  }

  // ── Step 3: Remove the tyre (unscrew lug nuts) ─────────────────────────────
  _stepRemove() {
    const { td, close, px, py, pw, ph } = this.openPanel('⚙️ Remove the Tyre', 'Click all 5 lug nuts.', { w: 440, h: 330 });
    const cx = W / 2, cy = py + 150;
    // the FLAT tyre is the one being taken off (shown face-on so the bolt circle reads)
    const [tw, th] = this._wh('l7_tire_flat', 168);
    const tire = this.add.image(cx, cy, 'l7_tire_flat').setDisplaySize(tw, th).setScrollFactor(0).setDepth(102); td.push(tire);
    const [lw, lh] = this._wh('l7_lugnut', 30);
    const NUT_R = 30;   // bolt-circle radius on the rim
    let removed = 0;
    const nuts = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const nx = cx + Math.cos(a) * NUT_R, ny = cy + Math.sin(a) * NUT_R;
      const nut = this.add.image(nx, ny, 'l7_lugnut').setDisplaySize(lw, lh).setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
      td.push(nut); nuts.push(nut);
      nut.on('pointerdown', () => {
        if (nut.getData('off')) return;
        nut.setData('off', true);
        this.tweens.add({ targets: nut, angle: 720, x: nx + Math.cos(a) * 90, y: ny + Math.sin(a) * 90, alpha: 0, duration: 500, onComplete: () => nut.destroy() });
        this.sparkleBurst(nx, ny, 5, false);
        removed++;
        if (removed >= 5) {
          this.time.delayedCall(400, () => {
            this.panelButton(td, cx, py + ph - 36, '⬅  Pull Tyre Off', 0x7dff88, () => {
              this.tweens.add({ targets: tire, x: cx - 220, angle: -90, alpha: 0, duration: 500, onComplete: () => { close(); if (this._flatTire) this._flatTire.setVisible(false); this._nextStep(2, '⚙️ Tyre removed!'); } });
            }, 200, 42);
          });
        }
      });
    }
  }

  // ── Step 4: Repair the puncture (drag patch + seal) ────────────────────────
  _stepRepair() {
    const { td, close, px, py, pw, ph } = this.openPanel('🩹 Repair the Puncture', 'Drag the patch onto the red hole.', { w: 480, h: 330 });
    const cx = W / 2, cy = py + 150;
    const [tw, th] = this._wh('l7_tire_flat', 152);
    const tire = this.add.image(cx, cy, 'l7_tire_flat').setDisplaySize(tw, th).setScrollFactor(0).setDepth(102); td.push(tire);
    const holeX = cx + 38, holeY = cy - 18;
    const hole = this.add.circle(holeX, holeY, 7, 0xcc2a2a, 1).setScrollFactor(0).setDepth(103).setStrokeStyle(2, 0x661010); td.push(hole);
    const ring = this.add.circle(holeX, holeY, 16, 0xcc2a2a, 0).setScrollFactor(0).setDepth(103).setStrokeStyle(2, 0xff6666, 0.8); td.push(ring);
    this.tweens.add({ targets: ring, scale: 1.4, alpha: { from: 0.8, to: 0 }, duration: 900, repeat: -1 });

    const [paw, pah] = this._wh('l7_patch', 44);
    const patch = this.add.image(px + 70, py + ph - 60, 'l7_patch').setDisplaySize(paw, pah).setScrollFactor(0).setDepth(105).setInteractive({ draggable: true, useHandCursor: true });
    td.push(patch); this.input.setDraggable(patch);
    td.push(this.add.text(px + 70, py + ph - 30, 'patch', { fontSize: '10px', color: '#b8c4d4' }).setOrigin(0.5).setScrollFactor(0).setDepth(105));
    let placed = false;
    patch.on('drag', (p, x, y) => { if (!placed) patch.setPosition(x, y); });
    patch.on('dragend', () => {
      if (Phaser.Math.Distance.Between(patch.x, patch.y, holeX, holeY) < 28) {
        placed = true; patch.setPosition(holeX, holeY); patch.disableInteractive();
        hole.setVisible(false); ring.setVisible(false);
        this.panelButton(td, cx, py + ph - 34, '🔥  SEAL', 0x7dff88, () => {
          this.cameras.main.flash(300, 200, 160, 80);
          this.sparkleBurst(holeX, holeY, 10, false);
          this.time.delayedCall(500, () => { close(); this._nextStep(3, '🩹 Puncture sealed!'); });
        }, 160, 42);
      } else {
        this.tweens.add({ targets: patch, x: px + 70, y: py + ph - 60, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  // ── Step 5: Inflate (pressure balancing) ───────────────────────────────────
  _stepInflate() {
    const { td, close, px, py, pw, ph } = this.openPanel('💨 Inflate the Tyre', 'Hold PUMP to add air. Keep the needle GREEN!', { w: 460, h: 330 });
    const cx = W / 2, cy = py + 175, R = 80;
    // gauge arc
    const gauge = this.add.graphics().setScrollFactor(0).setDepth(102); td.push(gauge);
    gauge.fillStyle(0x0a0f18, 1); gauge.fillCircle(cx, cy, R + 14);
    gauge.lineStyle(3, 0x5a6a82, 1); gauge.strokeCircle(cx, cy, R + 14);
    // zones along a 180° arc (left=empty, right=full)
    const a0 = Math.PI, a1 = 0; // 180°..0°
    const ang = (t) => a0 + (a1 - a0) * t; // t 0..1
    // red low, green target 0.62..0.86, red overfill
    gauge.lineStyle(14, 0x33aa55, 1); gauge.beginPath(); gauge.arc(cx, cy, R, ang(0.62), ang(0.86), false); gauge.strokePath();
    gauge.lineStyle(14, 0x884444, 0.6); gauge.beginPath(); gauge.arc(cx, cy, R, ang(0), ang(0.62), false); gauge.strokePath();
    gauge.lineStyle(14, 0xcc3333, 1); gauge.beginPath(); gauge.arc(cx, cy, R, ang(0.86), ang(1), false); gauge.strokePath();
    td.push(this.add.text(cx, cy + 26, 'PRESSURE', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#9ab0c8' }).setOrigin(0.5).setScrollFactor(0).setDepth(103));

    const needle = this.add.graphics().setScrollFactor(0).setDepth(104); td.push(needle);
    let pressure = 0, holdT = 0; // holdT = accumulated time in green
    const target = 2.0; // seconds in green to win
    const progTxt = this.add.text(cx, py + ph - 64, 'Hold to inflate…', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#fde8c0' }).setOrigin(0.5).setScrollFactor(0).setDepth(103); td.push(progTxt);

    let holding = false;
    const drawNeedle = () => {
      needle.clear();
      const a = ang(Phaser.Math.Clamp(pressure, 0, 1));
      needle.lineStyle(4, 0xffe066, 1);
      needle.lineBetween(cx, cy, cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6));
      needle.fillStyle(0xffe066, 1); needle.fillCircle(cx, cy, 6);
    };
    drawNeedle();

    const loop = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      const dt = 0.03;
      pressure += (holding ? 0.9 : -0.55) * dt;
      pressure = Phaser.Math.Clamp(pressure, 0, 1);
      drawNeedle();
      const inGreen = pressure >= 0.62 && pressure <= 0.86;
      if (inGreen) { holdT += dt; progTxt.setColor('#7dff88'); progTxt.setText(`Holding steady… ${Math.floor(holdT / target * 100)}%`); }
      else if (pressure > 0.86) { progTxt.setColor('#ff6666'); progTxt.setText('Too much! Ease off!'); }
      else { progTxt.setColor('#fde8c0'); progTxt.setText('Keep pumping…'); }
      if (holdT >= target) {
        loop.remove();
        this.cameras.main.flash(300, 120, 220, 140);
        this.time.delayedCall(400, () => { close(); this._nextStep(4, '💨 Perfect pressure!'); });
      }
    }});
    td.push({ destroy: () => loop.remove() });

    // hold controls (button + E key)
    const btnHit = this.panelButton(td, cx, py + ph - 34, '💨  HOLD TO PUMP', 0x7dff88, () => {}, 220, 42);
    btnHit.on('pointerdown', () => { holding = true; });
    btnHit.on('pointerup',   () => { holding = false; });
    btnHit.on('pointerout',  () => { holding = false; });
    const eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => { holding = true; });
    eKey.on('up',   () => { holding = false; });
    td.push({ destroy: () => eKey.removeAllListeners() });
  }
}

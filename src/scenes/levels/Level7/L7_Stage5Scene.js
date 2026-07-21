import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';

const PUP_X = W / 2 + 30, PUP_Y = 300;
const PUP_TINTS = [0xfff0e0, 0xc89858, 0x9a7040];

// ════════════════════════════════════════════════════════════════════════════
// STAGE 5 — TREAT THE PUPPIES  (veterinary hospital, emotional)
// Pup 1: temperature + medicine • Pup 2: heartbeat + injection • Pup 3: bandage + recovery
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage5Scene extends L7BaseScene {
  constructor() { super('L7_Stage5'); }

  create() {
    generateL7Assets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#c4d2da');

    this.add.image(W / 2, H / 2, 'l7_s5_bg').setDisplaySize(W, H).setDepth(-10);
    this.add.image(PUP_X, PUP_Y + 56, 'l7_exam_table').setOrigin(0.5, 1).setDisplaySize(250, 106).setDepth(2);

    // Gamma watches over from the side
    this._gamma = this.add.image(120, 392, 'l7_gamma').setOrigin(0.5, 1).setDisplaySize(160, 112).setDepth(3);
    this.tweens.add({ targets: this._gamma, y: 388, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // The puppy on the table
    this._puppy = this.add.image(PUP_X, PUP_Y, 'l7_puppy').setDisplaySize(120, 88).setDepth(5).setTint(PUP_TINTS[0]);
    this.tweens.add({ targets: this._puppy, scaleX: { from: 0.55, to: 0.57 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // patients status (3 pups)
    this._patientIcons = [];
    for (let i = 0; i < 3; i++) {
      const ic = this.add.image(W - 150 + i * 44, 70, 'l7_puppy').setDisplaySize(40, 30).setDepth(61).setTint(PUP_TINTS[i]).setAlpha(0.45);
      this.add.text(W - 150 + i * 44, 90, `P${i + 1}`, { fontSize: '9px', color: '#456' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
      this._patientIcons.push(ic);
    }

    this.buildStageHUD(5, 'Treat the Puppies',
      ['Pup 1 — temperature', 'Pup 1 — medicine', 'Pup 2 — heartbeat', 'Pup 2 — injection', 'Pup 3 — bandage', 'Pup 3 — recovery']);

    this._taskObjs = [];
    this.time.delayedCall(600, () => this._beginTask(1));
  }

  _clearTask() {
    this._taskObjs.forEach(o => { try { this.tweens.killTweensOf(o); if (o.destroy) o.destroy(); } catch (_) {} });
    this._taskObjs = [];
    if (this._taskBanner) { this._taskBanner.destroy(); this._taskBanner = null; }
  }

  _setPuppy(idx) {
    this._puppy.setTint(PUP_TINTS[idx]);
    this.cameras.main.flash(200, 255, 255, 255);
    this.tweens.add({ targets: this._puppy, scale: { from: 0.45, to: 0.55 }, duration: 350, ease: 'Back.easeOut' });
  }

  _bannerTask(text, color = '#2a4a6a') {
    if (this._taskBanner) this._taskBanner.destroy();
    this._taskBanner = this.add.text(W / 2, 110, text, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color, align: 'center',
      stroke: '#ffffff', strokeThickness: 3, backgroundColor: '#ffffffcc', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
  }

  _beginTask(n) {
    this._task = n;
    const tasks = {
      1: ['🌡️', 'Check Temperature', 'Drag the thermometer onto\nthe puppy and hold.',         0, () => this._tTemperature()],
      2: ['💊', 'Give Medicine',     'Drag the medicine to the\npuppy\'s mouth.',               0, () => this._tMedicine()],
      3: ['💚', 'Heart Monitor',     'Press A · S · D in rhythm\nas the beats reach the line.', 1, () => this._tHeartbeat()],
      4: ['💉', 'Give Injection',    'Drag the syringe to the spot,\nthen HOLD steady to inject.',1, () => this._tInjection()],
      5: ['🩹', 'Bandage the Wound', 'Drag the bandages onto\nthe wound to cover it.',          2, () => this._tBandage()],
      6: ['❤️', 'Recovery & Comfort','Stroke the puppy to soothe it\nback to health.',          2, () => this._tRecovery()],
    };
    const [e, t, d, pupIdx, fn] = tasks[n];
    if (this._curPup !== pupIdx) { this._curPup = pupIdx; this._setPuppy(pupIdx); }
    this.activityIntro(e, t, d, () => { this._bannerTask(`${e}  ${t}`); fn(); });
  }

  _taskDone(objIdx, msg) {
    this.completeObjective(objIdx);
    this.sparkleBurst(PUP_X, PUP_Y, 14);
    this.toast(msg, 1800);
    this._clearTask();
    // mark patient done after its 2nd task
    if (objIdx % 2 === 1 || this._task === 6) {
      const pi = Math.floor((this._task - 1) / 2);
      if (this._patientIcons[pi]) { this._patientIcons[pi].setAlpha(1); this.tweens.add({ targets: this._patientIcons[pi], scale: { from: 1.4, to: 1 }, duration: 300 }); }
    }
    if (this._task >= 6) this.time.delayedCall(900, () => this._allSafe());
    else this.time.delayedCall(900, () => this._beginTask(this._task + 1));
  }

  _allSafe() {
    this._busy = true;
    this.add.text(W / 2, H / 2 - 30, '🐾 All Puppies Safe!', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#2a7a4a', stroke: '#fff', strokeThickness: 4
    }).setOrigin(0.5).setDepth(80);
    for (let i = 0; i < 16; i++) {
      this.time.delayedCall(i * 120, () => {
        const hX = Phaser.Math.Between(W / 2 - 140, W / 2 + 140);
        const h = this.add.image(hX, PUP_Y, 'l7_heart').setScale(0.6).setDepth(70);
        this.tweens.add({ targets: h, y: h.y - 140, alpha: 0, scale: 1.1, duration: 1600, onComplete: () => h.destroy() });
      });
    }
    this.cameras.main.flash(500, 255, 240, 200);
    this.time.delayedCall(2200, () => {
      this.registry.set('lives', this._lives);
      this.registry.set('l7_checkpoint', 'L7_COMPLETE');
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(740, () => {
        this._wakeLoop();
        this.scene.start('EndScene');
      });
    });
  }

  // ── Task 1: Temperature (drag thermometer + hold) ──────────────────────────
  _tTemperature() {
    const th = this.add.image(W / 2 - 250, 360, 'l7_thermometer').setDisplaySize(80, 26).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(th); this._taskObjs.push(th);
    const reading = this.add.text(PUP_X, PUP_Y - 70, '39.5°C', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#cc3333', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    this._taskObjs.push(reading);
    let measuring = false;
    th.on('drag', (p, x, y) => { if (!measuring) th.setPosition(x, y); });
    th.on('dragend', () => {
      if (Phaser.Math.Distance.Between(th.x, th.y, PUP_X, PUP_Y) < 70) {
        measuring = true; th.disableInteractive(); th.setPosition(PUP_X - 20, PUP_Y + 6);
        this._bannerTask('🌡️  Measuring… hold still');
        this.tweens.addCounter({ from: 39.5, to: 38.4, duration: 1800, onUpdate: t => {
          const v = t.getValue(); reading.setText(v.toFixed(1) + '°C'); reading.setColor(v > 39 ? '#cc3333' : v > 38.7 ? '#dd8822' : '#2a8a4a');
        }, onComplete: () => { this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(300, () => this._taskDone(0, '🌡️ Temperature stabilising!')); } });
      } else {
        this.tweens.add({ targets: th, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  // ── Task 2: Medicine (drag correct bottle) ─────────────────────────────────
  _tMedicine() {
    const mouthX = PUP_X - 44, mouthY = PUP_Y - 6;
    const ring = this.add.circle(mouthX, mouthY, 16, 0x44aadd, 0).setDepth(40).setStrokeStyle(2, 0x44aadd, 0.8);
    this.tweens.add({ targets: ring, scale: 1.5, alpha: { from: 0.8, to: 0 }, duration: 900, repeat: -1 });
    this._taskObjs.push(ring);
    const med = this.add.image(W / 2 - 250, 360, 'l7_medicine').setDisplaySize(50, 64).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(med); this._taskObjs.push(med);
    this._taskObjs.push(this.add.text(W / 2 - 250, 400, 'medicine', { fontSize: '10px', color: '#456' }).setOrigin(0.5).setDepth(40));
    med.on('drag', (p, x, y) => med.setPosition(x, y));
    med.on('dragend', () => {
      if (Phaser.Math.Distance.Between(med.x, med.y, mouthX, mouthY) < 50) {
        med.disableInteractive();
        this.tweens.add({ targets: med, x: mouthX, y: mouthY - 6, angle: 40, duration: 300, yoyo: true, onComplete: () => {
          this.cameras.main.flash(200, 120, 220, 140);
          for (let i = 0; i < 4; i++) { const d = this.add.circle(mouthX, mouthY, 3, 0x8a5a2a, 0.8).setDepth(42); this.tweens.add({ targets: d, y: d.y + 12, alpha: 0, duration: 400, delay: i * 60, onComplete: () => d.destroy() }); }
          this.time.delayedCall(400, () => this._taskDone(1, '💊 Medicine given — good pup!'));
        } });
      } else {
        this.tweens.add({ targets: med, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  // ── Task 3: Heartbeat rhythm (A / S / D lanes) ─────────────────────────────
  _tHeartbeat() {
    const lanes = ['A', 'S', 'D'];
    const laneX = [W / 2 - 90, W / 2, W / 2 + 90];
    const hitY = 360, topY = 150;
    // hit line + lane labels + buttons
    const line = this.add.rectangle(W / 2, hitY, 300, 4, 0x33aa66, 0.9).setDepth(40); this._taskObjs.push(line);
    const btns = [];
    lanes.forEach((k, i) => {
      const lbl = this.add.text(laneX[i], hitY + 34, k, {
        fontSize: '20px', fontFamily: 'Georgia, serif', color: '#2a6a4a', stroke: '#fff', strokeThickness: 4,
        backgroundColor: '#ffffffcc', padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setDepth(41).setInteractive({ useHandCursor: true });
      lbl.on('pointerdown', () => this._hbHit(i));
      this._taskObjs.push(lbl); btns.push(lbl);
    });
    // EKG monitor accent
    const ekg = this.add.text(W / 2, topY - 28, '💚 PRESS IN RHYTHM', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#2a7a4a', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    this._taskObjs.push(ekg);

    this._hbNotes = [];
    this._hbHits = 0; this._hbTotal = 8; this._hbSpawned = 0; this._hbLaneX = laneX; this._hbHitY = hitY; this._hbTopY = topY;
    this._hbDone = false;

    // spawn notes on a timer
    this._hbSpawn = this.time.addEvent({ delay: 800, loop: true, callback: () => {
      if (this._hbSpawned >= this._hbTotal) { this._hbSpawn.remove(); return; }
      this._hbSpawned++;
      const lane = Phaser.Math.Between(0, 2);
      const note = this.add.image(laneX[lane], topY, 'l7_heart').setDisplaySize(34, 34).setDepth(40);
      note.setData('lane', lane); note.setData('hitOk', false);
      this._hbNotes.push(note); this._taskObjs.push(note);
    }});

    // keyboard
    this._hbKeys = this.input.keyboard.addKeys('A,S,D');
    this._taskObjs.push({ destroy: () => { this._hbSpawn?.remove(); } });
  }

  _hbHit(lane) {
    if (this._hbDone) return;
    // find nearest note in lane near hit line
    let best = null, bestD = 9999;
    for (const n of this._hbNotes) {
      if (n.getData('lane') !== lane || n.getData('hitOk')) continue;
      const d = Math.abs(n.y - this._hbHitY);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best && bestD < 40) {
      best.setData('hitOk', true);
      this._hbHits++;
      this.sparkleBurst(best.x, this._hbHitY, 6);
      this.tweens.add({ targets: best, scale: 0.7, alpha: 0, duration: 200, onComplete: () => best.destroy() });
      this.cameras.main.flash(80, 60, 200, 100);
    } else {
      this.cameras.main.shake(80, 0.004);
    }
  }

  // ── Task 4: Injection (drag + hold steady) ─────────────────────────────────
  _tInjection() {
    const spotX = PUP_X + 6, spotY = PUP_Y + 8;
    const ring = this.add.circle(spotX, spotY, 14, 0xff5577, 0).setDepth(40).setStrokeStyle(2, 0xff5577, 0.9);
    this.tweens.add({ targets: ring, scale: 1.6, alpha: { from: 0.9, to: 0 }, duration: 800, repeat: -1 });
    this._taskObjs.push(ring);
    const syr = this.add.image(W / 2 - 250, 360, 'l7_syringe').setDisplaySize(90, 30).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(syr); this._taskObjs.push(syr);
    let placed = false;
    syr.on('drag', (p, x, y) => { if (!placed) syr.setPosition(x, y); });
    syr.on('dragend', () => {
      if (!placed && Phaser.Math.Distance.Between(syr.x, syr.y, spotX, spotY) < 46) {
        placed = true; syr.setPosition(spotX - 30, spotY - 14);
        this._bannerTask('💉  HOLD the button to inject slowly');
        // hold-to-inject bar
        const fr = this.add.graphics().setDepth(41); fr.lineStyle(2, 0xffffff, 0.9); fr.fillStyle(0x00000055, 1); fr.fillRoundedRect(spotX - 60, spotY - 60, 120, 14, 5); fr.strokeRoundedRect(spotX - 60, spotY - 60, 120, 14, 5); this._taskObjs.push(fr);
        const bar = this.add.graphics().setDepth(42); this._taskObjs.push(bar);
        let prog = 0, holding = false, done = false;
        const draw = () => { bar.clear(); bar.fillStyle(0x44dd66, 1); bar.fillRoundedRect(spotX - 58, spotY - 58, 116 * prog / 100, 10, 4); };
        draw();
        const btn = this.add.text(W / 2, 400, '💉 HOLD TO INJECT', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#2a8a4a', padding: { x: 16, y: 9 } }).setOrigin(0.5).setDepth(43).setInteractive({ useHandCursor: true });
        this._taskObjs.push(btn);
        btn.on('pointerdown', () => holding = true); btn.on('pointerup', () => holding = false); btn.on('pointerout', () => holding = false);
        const loop = this.time.addEvent({ delay: 30, loop: true, callback: () => {
          if (done) return;
          prog += holding ? 1.4 : -0.8; prog = Phaser.Math.Clamp(prog, 0, 100); draw();
          if (prog >= 100) { done = true; loop.remove(); this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(300, () => this._taskDone(3, '💉 Injection complete!')); }
        }});
        this._taskObjs.push({ destroy: () => loop.remove() });
      } else if (!placed) {
        this.tweens.add({ targets: syr, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  // ── Task 5: Bandage (drag strips onto wound) ───────────────────────────────
  _tBandage() {
    const woundX = PUP_X + 24, woundY = PUP_Y + 14;
    const wound = this.add.circle(woundX, woundY, 12, 0xcc3333, 0.9).setDepth(40).setStrokeStyle(2, 0x882222);
    this._taskObjs.push(wound);
    let wraps = 0; const need = 3;
    const counter = this.add.text(PUP_X, PUP_Y - 70, `Wraps: 0/${need}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#2a4a6a', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    this._taskObjs.push(counter);
    const makeStrip = () => {
      const s = this.add.image(W / 2 - 250, 350, 'l7_bandage').setDisplaySize(56, 36).setDepth(42).setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(s); this._taskObjs.push(s);
      s.on('drag', (p, x, y) => s.setPosition(x, y));
      s.on('dragend', () => {
        if (Phaser.Math.Distance.Between(s.x, s.y, woundX, woundY) < 46) {
          s.disableInteractive();
          this.tweens.add({ targets: s, x: woundX, y: woundY, angle: wraps * 25 - 25, scale: 0.5, duration: 200 });
          wraps++; counter.setText(`Wraps: ${wraps}/${need}`); this.sparkleBurst(woundX, woundY, 5);
          if (wraps >= need) { wound.setVisible(false); this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(400, () => this._taskDone(4, '🩹 Wound bandaged!')); }
          else makeStrip();
        } else {
          this.tweens.add({ targets: s, x: W / 2 - 250, y: 350, duration: 250, ease: 'Back.easeOut' });
        }
      });
    };
    makeStrip();
  }

  // ── Task 6: Recovery (stroke to comfort) ───────────────────────────────────
  _tRecovery() {
    const meterY = 150;
    this.add.text(W / 2, meterY - 22, '❤️ Stroke the puppy to comfort it', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#2a7a4a', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    const fr = this.add.graphics().setDepth(40); fr.lineStyle(2, 0x2a7a4a, 0.9); fr.fillStyle(0xffffff, 0.6); fr.fillRoundedRect(W / 2 - 120, meterY, 240, 16, 8); fr.strokeRoundedRect(W / 2 - 120, meterY, 240, 16, 8);
    this._taskObjs.push(fr);
    const bar = this.add.graphics().setDepth(41); this._taskObjs.push(bar);
    let comfort = 0, done = false, lastX = null, lastY = null;
    const draw = () => { bar.clear(); bar.fillStyle(0xff5577, 1); bar.fillRoundedRect(W / 2 - 118, meterY + 2, 236 * comfort / 100, 12, 6); };
    draw();
    // interactive zone over puppy
    const zone = this.add.zone(PUP_X, PUP_Y, 150, 110).setInteractive({ useHandCursor: true });
    this._taskObjs.push(zone);
    const onMove = (p) => {
      if (done) return;
      if (lastX != null) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, lastX, lastY);
        if (d > 4 && Phaser.Math.Distance.Between(p.x, p.y, PUP_X, PUP_Y) < 90) {
          comfort = Math.min(100, comfort + d * 0.12); draw();
          if (Math.random() > 0.7) { const h = this.add.image(p.x, p.y, 'l7_heart').setScale(0.4).setDepth(45); this.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 700, onComplete: () => h.destroy() }); }
          if (comfort >= 100 && !done) { done = true; this.cameras.main.flash(300, 255, 200, 200); this._puppy.setTint(0xffffff); this.tweens.add({ targets: this._puppy, scale: 0.6, duration: 300, yoyo: true }); this.time.delayedCall(400, () => this._taskDone(5, '❤️ Puppy 3 recovered!')); }
        }
      }
      lastX = p.x; lastY = p.y;
    };
    this.input.on('pointermove', onMove);
    this._taskObjs.push({ destroy: () => this.input.off('pointermove', onMove) });
  }

  update() {
    if (this._paused) return;
    // heartbeat note falling + keyboard
    if (this._hbNotes && !this._hbDone) {
      for (let i = this._hbNotes.length - 1; i >= 0; i--) {
        const n = this._hbNotes[i];
        if (!n.active) { this._hbNotes.splice(i, 1); continue; }
        n.y += 2.6;
        if (n.y > this._hbHitY + 50 && !n.getData('hitOk')) { n.destroy(); this._hbNotes.splice(i, 1); }
      }
      if (this._hbKeys) {
        if (Phaser.Input.Keyboard.JustDown(this._hbKeys.A)) this._hbHit(0);
        if (Phaser.Input.Keyboard.JustDown(this._hbKeys.S)) this._hbHit(1);
        if (Phaser.Input.Keyboard.JustDown(this._hbKeys.D)) this._hbHit(2);
      }
      // finished?
      if (this._hbSpawned >= this._hbTotal && this._hbNotes.length === 0) {
        this._hbDone = true;
        if (this._hbHits >= Math.ceil(this._hbTotal * 0.6)) {
          this.cameras.main.flash(250, 120, 220, 140);
          this.time.delayedCall(300, () => this._taskDone(2, `💚 Heartbeat steady! (${this._hbHits}/${this._hbTotal})`));
        } else {
          this.toast('💗 Not quite — let\'s try the rhythm again', 1800);
          this.time.delayedCall(1200, () => { this._clearTask(); this._hbNotes = null; this._beginTask(3); });
        }
        this._hbKeys = null;
      }
    }
  }
}

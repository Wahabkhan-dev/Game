import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';
import { showLevelCompleteModal } from '../../../utils/EndModals.js';

const PUP_X = W / 2 + 30, PUP_Y = 300;

// ════════════════════════════════════════════════════════════════════════════
// STAGE 5 — TREAT THE PUPPIES  (veterinary hospital, emotional)
// Pup 1: temperature + medicine • Pup 2: heartbeat + injection • Pup 3: bandage + recovery
//
// Background is Level 3's real hospital art (l3_hospital_bg, already loaded
// globally by BootScene) and the puppy is Level 5's real puppy_in_basket.png
// (own key below, so Level 5's own preload is untouched). Treatment is
// divided evenly, 2 tasks per dog — once a dog's 2nd task is done, the puppy
// vanishes in a sparkle burst and a fresh one pops in for the next dog.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage5Scene extends L7BaseScene {
  constructor() { super('L7_Stage5'); }

  preload() {
    if (!this.textures.exists('l7_s5_puppy_basket')) {
      this.load.image('l7_s5_puppy_basket', 'assets/images/Level 5/treatment/puppy_in_basket.png');
    }
  }

  create() {
    generateL7Assets(this);
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#c4d2da');

    const bgKey = this.textures.exists('l3_hospital_bg') ? 'l3_hospital_bg' : 'l7_s5_bg';
    this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(-10);
    this.add.image(PUP_X, PUP_Y + 56, 'l7_exam_table').setOrigin(0.5, 1).setDisplaySize(250, 106).setDepth(2);

    // The puppy on the table — real art (puppy_in_basket.png), no per-pup
    // tint (a flat color wash would just muddy the real illustration; which
    // of the 3 pups is active is shown by the task banner text, and by the
    // magic swap in _setPuppy() when a new dog's turn begins).
    this._puppyKey = this.textures.exists('l7_s5_puppy_basket') ? 'l7_s5_puppy_basket' : 'l7_puppy';
    const pupSrc = this.textures.get(this._puppyKey).getSourceImage();
    this._puppyDispH = 100; this._puppyDispW = this._puppyDispH * (pupSrc.width / pupSrc.height);
    this._puppy = this.add.image(PUP_X, PUP_Y, this._puppyKey).setDisplaySize(this._puppyDispW, this._puppyDispH).setDepth(5);
    // Base scale from setDisplaySize() above — the breathing/pop tweens below
    // scale RELATIVE to this, never as an absolute value (an absolute value
    // tuned for the old tiny procedural texture would blow the real image up
    // to several times its intended size once swapped onto this image's
    // actual native pixel dimensions).
    this._puppyBaseScale = this._puppy.scaleX;
    this._breathe();

    this.buildStageHUD(5, 'Treat the Puppies',
      ['Pup 1 — temperature', 'Pup 1 — medicine', 'Pup 2 — heartbeat', 'Pup 2 — injection', 'Pup 3 — bandage', 'Pup 3 — recovery']);

    this._taskObjs = [];
    this.time.delayedCall(600, () => this._beginTask(1));
  }

  // Idle breathing tween — pulled out to its own method so the magic puppy
  // swap (_setPuppy) can restart it on the freshly-arrived puppy image.
  _breathe() {
    this._breatheTween = this.tweens.add({
      targets: this._puppy, scaleX: this._puppyBaseScale * 0.98, duration: 1100,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _clearTask() {
    this._taskObjs.forEach(o => { try { this.tweens.killTweensOf(o); if (o.destroy) o.destroy(); } catch (_) {} });
    this._taskObjs = [];
    if (this._taskBanner) { this._taskBanner.destroy(); this._taskBanner = null; }
  }

  // idx===0 is the very first call (the puppy just created in create() is
  // already showing) — nothing to swap yet. For idx 1/2 (a new dog's turn),
  // the old puppy vanishes in a sparkle burst and a fresh one pops in, so
  // treatment reads as 3 distinct dogs handled one at a time, not one dog
  // re-tinted three times.
  _setPuppy(idx) {
    if (idx === 0) return;
    const old = this._puppy;
    this.tweens.killTweensOf(old);
    this.cameras.main.flash(200, 255, 255, 255);
    this.sparkleBurst(old.x, old.y, 16);
    this.tweens.add({
      targets: old, scale: 0, alpha: 0, angle: 20, duration: 300, ease: 'Back.easeIn',
      onComplete: () => {
        old.destroy();
        const fresh = this.add.image(PUP_X, PUP_Y, this._puppyKey)
          .setDisplaySize(0, 0).setDepth(5).setAlpha(0);
        this._puppy = fresh;
        this.sparkleBurst(PUP_X, PUP_Y, 16);
        this.tweens.add({
          targets: fresh, displayWidth: this._puppyDispW, displayHeight: this._puppyDispH,
          alpha: 1, duration: 340, ease: 'Back.easeOut',
          onComplete: () => this._breathe(),
        });
      },
    });
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
    if (this._task >= 6) this.time.delayedCall(900, () => this._allSafe());
    else this.time.delayedCall(900, () => this._beginTask(this._task + 1));
  }

  // No "All Puppies Safe!" celebration screen (falling hearts etc.) — the
  // video is the celebration. Straight into it, then straight into the
  // level-complete modal once it ends (no automatic scene cut in between).
  _allSafe() {
    this._busy = true;
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', 'L7_COMPLETE');
    // V7 plays once all 5 stages are done, then the level-complete modal.
    this.playStoryVideos(['l7_v7'], () => {
      const points = this.registry.get('points') ?? 0;
      // No "Thank you for playing" ruby-heart celebration screen (EndScene)
      // anymore — the points modal's only button returns to the Menu.
      showLevelCompleteModal(this, points, { menuKey: 'Menu' });
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
          if (comfort >= 100 && !done) {
            done = true;
            this.cameras.main.flash(300, 255, 200, 200);
            // Relative pop, same as the puppy-swap animation — an absolute
            // scale here would blow the real image up to several times its
            // intended size instead of a gentle happy bounce.
            const s = this._puppyBaseScale;
            this.tweens.add({ targets: this._puppy, scale: { from: s, to: s * 1.3 }, duration: 300, yoyo: true });
            this.time.delayedCall(400, () => this._taskDone(5, '❤️ Puppy 3 recovered!'));
          }
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

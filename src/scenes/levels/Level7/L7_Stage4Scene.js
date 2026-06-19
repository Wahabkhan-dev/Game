import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';

const TOTAL = 6400;          // distance to hospital
const CAR_Y = 372;           // player jeep y
const ROAD_TOP = 130;        // where obstacles appear

// ════════════════════════════════════════════════════════════════════════════
// STAGE 4 — DRIVE TO HOSPITAL  (rainy city highway)
// Avoid traffic → road block → quick-time swerve → steep climb → final drive.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage4Scene extends L7BaseScene {
  constructor() { super('L7_Stage4'); }

  create() {
    generateL7Assets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#10172a');

    this.add.image(W / 2, H / 2, 'l7_s4_sky').setDisplaySize(W, H).setDepth(-30);
    this._road = this.add.tileSprite(W / 2, H / 2 + 60, W, 330, 'l7_s4_road').setDepth(-20);

    this._distance = 0;
    this._speed = 3.0;
    this._hp = 3;
    this._invuln = false;
    this._obstacles = [];
    this._spawnAcc = 0;
    this._qteFired = false;
    this._climbFired = false;
    this._phase = 'traffic';
    this._finishing = false;
    this._objMarks = [false, false, false, false, false];

    // Player jeep
    this._car = this.add.image(W / 2, CAR_Y, 'l7_jeep_rear').setDisplaySize(96, 88).setDepth(20);
    this._headlights = this.add.graphics().setDepth(19);

    this.buildStageHUD(4, 'Drive to the Hospital',
      ['Avoid the traffic', 'Pass the road block', 'Quick-time swerve', 'Climb the hill', 'Reach the hospital']);
    this._buildDriveHUD();
    this._buildControls();
    this.buildRain(150, 0xbcd0ff);

    this.time.delayedCall(500, () => this.toast('🚗 Drive! ◀ ▶ / A D to swerve and dodge obstacles!', 3000));
  }

  _buildControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
  }

  _buildDriveHUD() {
    this._hpG = this.add.graphics().setScrollFactor(0).setDepth(61);
    this._drawHP();
    // distance bar
    const x = W / 2 - 150, y = H - 22;
    this.add.text(x - 6, y, '🚗', { fontSize: '14px' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(61);
    this.add.text(x + 306, y, '🏥', { fontSize: '14px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    const fr = this.add.graphics().setScrollFactor(0).setDepth(60);
    fr.fillStyle(0x0a0f1a, 0.8); fr.fillRoundedRect(x, y - 6, 300, 12, 6); fr.lineStyle(1.5, 0x5a6a82, 0.8); fr.strokeRoundedRect(x, y - 6, 300, 12, 6);
    this._distBar = this.add.graphics().setScrollFactor(0).setDepth(61);
    this._distBarPos = { x, y };
  }

  _drawHP() {
    this._hpG.clear();
    for (let i = 0; i < 3; i++) {
      const x = W - 92 + i * 26, y = 54;
      this._hpG.fillStyle(i < this._hp ? 0xff5577 : 0x3a1a22, 1);
      this._hpG.fillCircle(x, y, 8);
      this._hpG.lineStyle(1.5, 0x882233, 1); this._hpG.strokeCircle(x, y, 8);
    }
  }

  _drawDist() {
    const { x, y } = this._distBarPos;
    this._distBar.clear();
    this._distBar.fillStyle(0x44aadd, 1);
    this._distBar.fillRoundedRect(x + 2, y - 4, Math.max(0, (this._distance / TOTAL) * 296), 8, 4);
  }

  // ── lane geometry (perspective) ─────────────────────────────────────────────
  laneX(frac, y) {
    // interpolate from narrow top to wide bottom by y
    const t = (y - ROAD_TOP) / (CAR_Y + 30 - ROAD_TOP);
    const topX = 300 + frac * 200;
    const botX = 80 + frac * 640;
    return topX + (botX - topX) * Phaser.Math.Clamp(t, 0, 1);
  }

  update(time, delta) {
    if (this._paused || this._busy) return;
    const dt = delta / 1000;

    // road scroll + distance
    this._road.tilePositionY -= this._speed * 2.4;
    this._distance += this._speed;
    this._drawDist();

    // player steering
    const ts = window._touchState || {};
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    let vx = 0;
    if (left)  vx = -260; if (right) vx = 260;
    this._car.x = Phaser.Math.Clamp(this._car.x + vx * dt, 110, 690);
    this._car.setAngle(vx < 0 ? -7 : vx > 0 ? 7 : 0);
    // headlight cones
    this._headlights.clear();
    this._headlights.fillStyle(0xfff3c0, 0.10);
    this._headlights.fillTriangle(this._car.x - 22, CAR_Y - 30, this._car.x - 70, ROAD_TOP + 20, this._car.x + 10, ROAD_TOP + 20);
    this._headlights.fillTriangle(this._car.x + 22, CAR_Y - 30, this._car.x + 70, ROAD_TOP + 20, this._car.x - 10, ROAD_TOP + 20);

    this.updateRain();
    this._updatePhase();
    this._updateObstacles(dt);
  }

  _updatePhase() {
    if (this._finishing) return;
    const d = this._distance;
    if (!this._objMarks[0] && d > 1700) { this._objMarks[0] = true; this.completeObjective(0); this.toast('🚧 Road block ahead — weave through!'); this._phase = 'roadblock'; }
    if (d > 2900 && !this._qteFired) { this._qteFired = true; this._phase = 'qte'; this._runQTE(); }
    if (!this._objMarks[1] && d > 2900) { this._objMarks[1] = true; this.completeObjective(1); }
    if (d > 4400 && !this._climbFired) { this._climbFired = true; this._phase = 'climb'; this._runClimb(); }
    if (d >= TOTAL) this._reachHospital();
  }

  _updateObstacles(dt) {
    if (this._phase === 'qte' || this._phase === 'climb' || this._finishing) return;
    // spawn
    this._spawnAcc += dt;
    const interval = this._phase === 'roadblock' ? 0.7 : 1.0;
    if (this._spawnAcc > interval) {
      this._spawnAcc = 0;
      this._spawnObstacle();
    }
    // move
    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const o = this._obstacles[i];
      o.t += dt * 0.55 * (this._speed / 3);
      const y = ROAD_TOP + o.t * (CAR_Y + 30 - ROAD_TOP);
      const x = this.laneX(o.frac, y);
      const sc = 0.32 + o.t * 0.85;
      o.img.setPosition(x, y).setScale(o.baseScale * sc).setDepth(10 + Math.floor(o.t * 10));
      // collision near player
      if (!o.hit && o.t > 0.74 && o.t < 1.02 && Math.abs(x - this._car.x) < 46) {
        o.hit = true; this._takeHit(); this.tweens.add({ targets: o.img, alpha: 0, scale: o.img.scale * 1.3, duration: 250, onComplete: () => o.img.destroy() });
        this._obstacles.splice(i, 1); continue;
      }
      if (o.t >= 1.05) { o.img.destroy(); this._obstacles.splice(i, 1); }
    }
  }

  _spawnObstacle() {
    const frac = Phaser.Utils.Array.GetRandom([0.2, 0.5, 0.8]);
    let tex, baseScale;
    if (this._phase === 'roadblock') { const r = Math.random(); tex = r < 0.5 ? 'l7_cone2' : 'l7_barrier'; baseScale = tex === 'l7_cone2' ? 1 : 0.9; }
    else { tex = Math.random() < 0.7 ? 'l7_car_red' : 'l7_cone2'; baseScale = 1; }
    const img = this.add.image(this.laneX(frac, ROAD_TOP), ROAD_TOP, tex).setDepth(10);
    this._obstacles.push({ img, frac, t: 0, baseScale, hit: false });
  }

  _takeHit() {
    if (this._invuln || this._finishing) return;
    this._invuln = true;
    this._hp--; this._drawHP();
    this.cameras.main.shake(260, 0.014);
    this.cameras.main.flash(160, 200, 60, 60);
    this._car.setTint(0xff5555);
    this.tweens.add({ targets: this._car, alpha: 0.4, duration: 120, yoyo: true, repeat: 4, onComplete: () => { this._car.clearTint(); this._car.setAlpha(1); } });
    if (this._hp <= 0) {
      this.loseLife(() => { this._hp = 3; this._drawHP(); this._car.setPosition(W / 2, CAR_Y); this._invuln = false; this._clearObstacles(); });
    } else {
      this.toast(`💥 Crash! ${this._hp} HP left`, 1400);
      this.time.delayedCall(1100, () => { this._invuln = false; });
    }
  }

  _clearObstacles() {
    this._obstacles.forEach(o => o.img.destroy());
    this._obstacles = [];
  }

  // ── Quick-Time Event: press SPACE to swerve ────────────────────────────────
  _runQTE() {
    this._clearObstacles();
    this._busy = true;
    const td = [];
    td.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setScrollFactor(0).setDepth(100));
    // a stalled truck blocking
    td.push(this.add.image(W / 2, 250, 'l7_car_red').setDisplaySize(120, 170).setDepth(101).setTint(0xaaaaaa));
    td.push(this.add.text(W / 2, 90, '⚠️  TRUCK AHEAD!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ffcc33', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    td.push(this.add.text(W / 2, 130, 'PRESS  [ SPACE ]  to SWERVE!', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    // shrinking time bar
    const barW = 360, bx = W / 2 - barW / 2, by = 320;
    const fr = this.add.graphics().setScrollFactor(0).setDepth(102); fr.lineStyle(2, 0xffffff, 0.7); fr.strokeRoundedRect(bx, by, barW, 18, 6); td.push(fr);
    const bar = this.add.graphics().setScrollFactor(0).setDepth(103); td.push(bar);
    let tLeft = 1.6; const total = 1.6; let resolved = false;
    const tick = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      tLeft -= 0.03;
      bar.clear(); const frac = Phaser.Math.Clamp(tLeft / total, 0, 1);
      bar.fillStyle(frac > 0.4 ? 0x44dd66 : 0xff5555, 1); bar.fillRoundedRect(bx + 2, by + 2, (barW - 4) * frac, 14, 5);
      if (tLeft <= 0 && !resolved) finish(false);
    }});

    const finish = (ok) => {
      if (resolved) return; resolved = true;
      tick.remove(); sp.removeAllListeners();
      if (ok) {
        this.tweens.add({ targets: this._car, x: W / 2 + 120, duration: 200, yoyo: true });
        this.sparkleBurst(W / 2, 250, 12, false);
        this.completeObjective(2);
        this.toast('🌀 Nice swerve!');
      } else {
        this._hp = Math.max(0, this._hp - 1); this._drawHP();
        this.cameras.main.shake(300, 0.02); this.cameras.main.flash(200, 200, 60, 60);
        this.completeObjective(2);
        this.toast('💥 Clipped it! -1 HP', 1500);
      }
      td.forEach(o => { try { o.destroy(); } catch (_) {} });
      this.time.delayedCall(500, () => { this._busy = false; this._phase = 'traffic'; this._invuln = false; if (this._hp <= 0) this.loseLife(() => { this._hp = 3; this._drawHP(); this._car.setPosition(W / 2, CAR_Y); }); });
    };
    const sp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    sp.on('down', () => finish(true));
    // tapping screen also works
    td[0].setInteractive().on('pointerdown', () => finish(true));
  }

  // ── Steep Climb: tap to keep momentum ──────────────────────────────────────
  _runClimb() {
    this._clearObstacles();
    this._busy = true;
    const td = [];
    td.push(this.add.rectangle(W / 2, H / 2, W, H, 0x1a1208, 0.5).setScrollFactor(0).setDepth(100));
    td.push(this.add.text(W / 2, 90, '⛰️  STEEP CLIMB!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ffcc33', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    td.push(this.add.text(W / 2, 128, 'TAP / SPACE rapidly to climb!', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    // climb bar
    const barW = 360, bx = W / 2 - barW / 2, by = 300;
    const fr = this.add.graphics().setScrollFactor(0).setDepth(102); fr.lineStyle(2, 0xffffff, 0.7); fr.strokeRoundedRect(bx, by, barW, 24, 8); td.push(fr);
    const bar = this.add.graphics().setScrollFactor(0).setDepth(103); td.push(bar);
    // road tilts visually
    this.tweens.add({ targets: this._road, angle: -4, duration: 400 });
    this.tweens.add({ targets: this._car, y: CAR_Y - 12, duration: 400 });

    let prog = 0; let done = false;
    const draw = () => { bar.clear(); bar.fillStyle(prog > 80 ? 0x7dff88 : 0xffaa33, 1); bar.fillRoundedRect(bx + 2, by + 2, (barW - 4) * prog / 100, 20, 6); };
    draw();
    const climb = () => { if (done) return; prog = Math.min(100, prog + 7); draw(); this.cameras.main.shake(40, 0.003); if (prog >= 100) finish(); };
    const drain = this.time.addEvent({ delay: 60, loop: true, callback: () => { if (!done) { prog = Math.max(0, prog - 2); draw(); } } });
    const finish = () => {
      if (done) return; done = true;
      drain.remove(); sp.removeAllListeners();
      this.tweens.add({ targets: this._road, angle: 0, duration: 400 });
      this.tweens.add({ targets: this._car, y: CAR_Y, duration: 400 });
      this.completeObjective(3); this.sparkleBurst(this._car.x, this._car.y, 12); this.toast('⛰️ Over the top!');
      td.forEach(o => { try { o.destroy(); } catch (_) {} });
      this.time.delayedCall(500, () => { this._busy = false; this._phase = 'traffic'; this._speed = 3.4; });
    };
    const sp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    sp.on('down', climb);
    td[0].setInteractive().on('pointerdown', climb);
    td.push({ destroy: () => { drain.remove(); sp.removeAllListeners(); } });
  }

  // ── Final drive → hospital reveal ──────────────────────────────────────────
  _reachHospital() {
    if (this._finishing) return;
    this._finishing = true;
    this._busy = true;
    this._clearObstacles();
    this.completeObjective(4);
    // hospital rises into view
    const hosp = this.add.image(W / 2, ROAD_TOP - 20, 'l7_hospital').setDisplaySize(230, 130).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: hosp, y: 180, alpha: 1, scale: 1.6, duration: 1600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this._car, y: 300, scale: 1.1, duration: 1600 });
    this.cameras.main.flash(400, 255, 240, 180);
    this.time.delayedCall(1800, () => {
      this.completeStage('L7_Cutscene', 'Hospital Reached!', {
        slides: [
          { bg: 'l7_hospital', emoji: '🏥', charTex: 'gleeda_idle', text: 'Tyres screech to a stop under the glowing red cross. Glenda scoops up the trembling pups and rushes through the sliding doors.' },
          { bg: 'l7_s5_bg', emoji: '🩺', charTex: 'gleeda_idle', text: '"Please, help them." The vet nods and wheels over the exam table. Three tiny lives — and only steady hands can save them now.' },
        ],
        next: 'L7_Stage5', nextData: {}
      });
    });
  }
}

import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL7Assets } from './L7Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 4 — DRIVE TO HOSPITAL  (rainy city highway)
// Level-3 side-view driving STYLE, with Level 7's own hurdles & mini-activities:
//   Avoid Traffic · Road Block · Quick-Time Event · Steep Climb · Final Drive
// Uses the same car sprite + position as Level 3 (l3_car @ CAR_X).
// ════════════════════════════════════════════════════════════════════════════
const ROAD_TOP = 312;
const ROAD_H   = 100;
const DRIVE_Y  = ROAD_TOP + 60;   // wheel-contact surface
const CAR_X    = 200;             // same as Level 3

const CFG = {
  TOTAL:    9600,
  MAX:      6.4,
  ACCEL:    0.22,
  FRICTION: 0.10,
  BRAKE:    0.42,
  SAFE_CLOSE: 2.3,   // max safe closing speed onto traffic (else you rear-end)
  DMG:      24,
  SLOW:     1.7,     // hit a speed-breaker faster than this = damage
  ZONE:     34,
  // ── Hurdles that make sense for a single-lane brake-driver ────────────────
  BREAKERS: [1500, 2900, 5400, 8600],   // Speed Breakers (brake!)
  SIGNALS:  [2100, 4400, 7700],         // Traffic Lights (stop on red)
  BLOCKS:   [3500, 6900],               // Road Block (stop + clear)
  QTES:     [4900, 8100],               // Quick-Time Event (swerve a branch)
  CLIMB:    6200,                       // Steep Climb (hold gas)
  HOSPITAL: 9600,                       // Final Drive
};

// use the repaired jeep from the puncture stage (same vehicle the whole journey)
const CAR_TEX = (scene) => scene.textures.exists('l7_jeep_fixed') ? 'l7_jeep_fixed'
                         : scene.textures.exists('l3_car') ? 'l3_car' : 'l7_jeep_side';

export class L7_Stage4Scene extends Phaser.Scene {
  constructor() { super('L7_Stage4'); }

  preload() {
    if (!this.textures.exists('l7_jeep_fixed')) this.load.image('l7_jeep_fixed', 'assets/images/Level7/Stage2/l7_jeep_fixed.png');
    if (!this.textures.exists('l3_car')) this.load.image('l3_car', 'assets/images/Level 3/l3_car.png');
  }

  create() {
    generateL7Assets(this);
    this.cameras.main.setBackgroundColor('#0c1322');
    this.cameras.main.fadeIn(700, 0, 0, 0);

    this._health   = 100;
    this._distance = 0;
    this._speed    = 0;
    this._done     = false;
    this._blocking = false;
    this._invuln   = false;
    this._rain     = [];

    this._buildBackground();
    this._buildRoad();
    this._buildCar();
    this._buildBreakers();
    this._buildSignals();
    this._buildBlocks();
    this._buildQTEs();
    this._buildClimb();
    this._buildHospital();
    this._buildRain();
    this._buildHUD();
    this._buildObjectives();
    this._buildControls();

    this.time.delayedCall(600, () => this._toast('🚗 ▶/D = accelerate · ◀/A = brake.  Slow for 🛑 breakers & 🚦 red lights!', 4000));
  }

  // ── BACKGROUND ───────────────────────────────────────────────────────────────
  _buildBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0c1322, 1).setDepth(-20);
    this._sky = this.add.tileSprite(W / 2, H / 2 - 30, W, H, 'l7_s4_sky').setDepth(-15);
    this._fog = this.add.tileSprite(W / 2, ROAD_TOP - 50, W, 110, 'l7_fog').setDepth(-6).setAlpha(0.4);
    const fl = this.add.rectangle(W / 2, H / 2, W, H, 0xbcd0f0, 0).setDepth(-4);
    this.time.addEvent({ delay: 7000, loop: true, callback: () => { if (!this._done) this.tweens.add({ targets: fl, alpha: 0.18, duration: 110, yoyo: true }); } });
  }

  // ── LAYERED ASPHALT ROAD ────────────────────────────────────────────────────
  _buildRoad() {
    const RS = ROAD_TOP;
    const roadG = this.add.graphics().setDepth(1).setScrollFactor(0);
    roadG.fillStyle(0x242636, 1); roadG.fillRect(0, RS, W, ROAD_H);
    roadG.fillStyle(0x2e3044, 1); roadG.fillRect(0, RS + 8, W, ROAD_H - 8);
    roadG.fillStyle(0x3a4a66, 0.12); roadG.fillRect(0, RS + 8, W, 16);

    const bg = this.add.graphics().setDepth(0).setScrollFactor(0);
    const deckBot = RS + ROAD_H, underH = H - deckBot;
    bg.fillStyle(0x12152a, 1); bg.fillRect(0, deckBot, W, underH);
    bg.fillStyle(0x363a54, 1); bg.fillRect(0, deckBot, W, 8);
    bg.fillStyle(0x44485e, 1); bg.fillRect(0, deckBot, W, 3);
    for (let px = 40; px < W + 60; px += 180) {
      bg.fillStyle(0x1c1f38, 1); bg.fillRect(px, deckBot + 7, 26, underH - 7);
      bg.fillStyle(0x282c44, 0.9); bg.fillRect(px + 3, deckBot + 7, 8, underH - 7);
      bg.fillStyle(0x303250, 1); bg.fillRect(px - 3, deckBot + 6, 32, 5);
    }
    bg.fillStyle(0x20223a, 1); bg.fillRect(0, H - 6, W, 6);

    this.add.rectangle(W / 2, RS + 2, W, 4, 0xf0c040, 1).setDepth(3).setScrollFactor(0);
    this.add.rectangle(W / 2, DRIVE_Y - 24, W, 2, 0xffffff, 0.12).setDepth(3).setScrollFactor(0);
    this.add.rectangle(W / 2, DRIVE_Y + 18, W, 2, 0xffffff, 0.12).setDepth(3).setScrollFactor(0);
    this.add.rectangle(W / 2, RS + ROAD_H - 3, W, 6, 0x4a4a55, 1).setDepth(3).setScrollFactor(0);

    this._dashGfx  = this.add.graphics().setDepth(3).setScrollFactor(0);
    this._jointGfx = this.add.graphics().setDepth(2).setScrollFactor(0);
  }

  _drawDashes() {
    const off = Math.floor(this._distance) % 60;
    this._dashGfx.clear(); this._dashGfx.fillStyle(0xffffff, 0.8);
    for (let dx = -(off + 60); dx < W + 60; dx += 60) this._dashGfx.fillRect(dx, DRIVE_Y - 5, 40, 3);
  }
  _drawJoints() {
    const P = 120, off = Math.floor(this._distance) % P;
    this._jointGfx.clear(); this._jointGfx.lineStyle(1, 0x3a3c50, 1);
    for (let dx = -(off + P); dx < W + P; dx += P) this._jointGfx.lineBetween(dx, ROAD_TOP + 4, dx, ROAD_TOP + ROAD_H - 4);
  }

  // ── PLAYER CAR (repaired jeep from the puncture stage) with spinning wheels ──
  _buildCar() {
    const tex = CAR_TEX(this);
    const isJeep = (tex === 'l7_jeep_fixed' || tex === 'l7_jeep_side');
    const src = this.textures.get(tex).getSourceImage();
    const bh = isJeep ? 104 : 82;                 // body display height
    const bw = bh * src.width / src.height;       // preserve aspect
    const carY = DRIVE_Y + (isJeep ? 8 : 17);     // sit wheels on the road
    this._carGroundY = carY;
    this._carShadow = this.add.ellipse(CAR_X, DRIVE_Y + 2, bw * 0.78, 12, 0x000000, 0.3).setDepth(4);
    // body + two spinning wheels in one container (bob/tilt/swerve together)
    const body = this.add.image(0, 0, tex).setOrigin(0.5, 1).setDisplaySize(bw, bh);
    // wheel placement + look depends on which vehicle
    const wTex = isJeep ? 'l7_jeepwheel' : 'l7_carwheel';
    const wSize = isJeep ? 42 : 28;
    const wx = isJeep ? bw * 0.305 : 39;
    const wy = isJeep ? -bh * 0.16 : -15;
    const wr = this.add.image(-wx, wy, wTex).setDisplaySize(wSize, wSize);   // rear (left)
    const wf = this.add.image(wx, wy, wTex).setDisplaySize(wSize, wSize);    // front (right)
    this._wheels = [wr, wf];
    this._carC = this.add.container(CAR_X, carY, [body, wr, wf]).setDepth(9);
    this._beam = this.add.graphics().setDepth(8);
  }

  // ── HURDLE: SPEED BREAKERS (brake or take damage) ──────────────────────────
  _buildBreakers() {
    const RS = DRIVE_Y;
    this._breakers = CFG.BREAKERS.map((dist) => {
      const gfx = this.add.graphics().setDepth(7);
      const VW = 24, top = ROAD_TOP + 6, bot = ROAD_TOP + ROAD_H - 6, BAND = 9;
      gfx.fillStyle(0x000000, 0.3); gfx.fillRect(-VW / 2 - 3, top, VW + 6, bot - top);
      for (let by = top; by < bot; by += BAND) {
        const bh = Math.min(BAND, bot - by), row = Math.floor((by - top) / BAND);
        gfx.fillStyle(row % 2 === 0 ? 0xffcc00 : 0x1a1a22, 1); gfx.fillRect(-VW / 2, by, VW, bh);
      }
      gfx.fillStyle(0xffffff, 0.2); gfx.fillRect(-VW / 2, top, 3, bot - top);
      const warn = this.add.graphics().setDepth(7);
      warn.fillStyle(0xccccdd, 1); warn.fillRect(-2, RS - 90, 4, 40);
      warn.fillStyle(0xffee00, 1); warn.fillTriangle(0, RS - 96, -18, RS - 70, 18, RS - 70);
      warn.lineStyle(1.5, 0x1a1a22, 1); warn.strokeTriangle(0, RS - 96, -18, RS - 70, 18, RS - 70);
      warn.fillStyle(0x1a1a22, 1); warn.fillRect(-2, RS - 90, 4, 13); warn.fillCircle(0, RS - 73, 2.5);
      return { dist, gfx, warn, triggered: false };
    });
  }
  _checkBreakers() {
    for (const b of this._breakers) {
      if (!b.triggered && this._distance >= b.dist - CFG.ZONE) {
        b.triggered = true;
        this._completeObj(0);
        if (this._speed > CFG.SLOW) this._hitObstacle('🛑 Speed breaker!');
        else { this.tweens.add({ targets: this._carC, y: this._carGroundY - 5, duration: 160, yoyo: true }); this._floatTxt('✅ Smooth!', '#88ffaa', 14); }
      }
    }
  }

  // ── HURDLE: TRAFFIC LIGHTS (must stop on red) ───────────────────────────────
  _buildSignals() {
    const RS = DRIVE_Y;
    this._signals = CFG.SIGNALS.map((dist) => {
      const g = this.add.graphics().setDepth(8);
      g.fillStyle(0x707080, 1); g.fillRect(-3, RS - 168, 6, 116);
      g.fillStyle(0x55566a, 1); g.fillRect(-8, RS - 55, 16, 6);
      g.fillStyle(0x111118, 1); g.fillRoundedRect(-22, RS - 168, 44, 86, 8);
      g.lineStyle(2.5, 0x444456, 1); g.strokeRoundedRect(-22, RS - 168, 44, 86, 8);
      const red = this.add.circle(0, RS - 150, 11, 0xff2200, 1).setDepth(9);
      const yel = this.add.circle(0, RS - 124, 11, 0xffaa00, 0.2).setDepth(9);
      const grn = this.add.circle(0, RS - 98, 11, 0x004400, 0.25).setDepth(9);
      const zebra = this.add.graphics().setDepth(4);
      for (let zi = 0; zi < 8; zi++) { zebra.fillStyle(zi % 2 === 0 ? 0xffffff : 0x111122, zi % 2 === 0 ? 0.7 : 0.4); zebra.fillRect(-40 + zi * 10, ROAD_TOP, 10, ROAD_H); }
      return { dist, g, red, yel, grn, zebra, state: 'green', forced: false, passed: false };
    });
  }
  _setSig(sig, state) {
    sig.state = state; const r = state === 'red';
    sig.red.setFillStyle(r ? 0xff2200 : 0x440000, r ? 1 : 0.18);
    sig.grn.setFillStyle(!r ? 0x00dd55 : 0x004400, !r ? 1 : 0.18);
  }
  _checkSignals() {
    for (const sig of this._signals) {
      if (!sig.forced && this._distance >= sig.dist - 470) {
        sig.forced = true; this._setSig(sig, 'red'); this._toast('🚦 Red light ahead — brake to stop!', 2000);
        this.time.delayedCall(2800, () => { if (!this._done && !sig.passed) { this._setSig(sig, 'green'); this._completeObj(1); this._toast('🟢 Green — go!', 1400); } });
      }
      if (sig.state === 'red' && !sig.passed) {
        const stopX = sig.dist - 28;
        if (this._distance >= stopX) {
          if (this._speed > 1.6 && !this._invuln) this._hitObstacle('🚦 Ran the red!');
          this._distance = stopX; this._speed = 0;   // car holds at the stop line
        }
      }
      if (sig.state === 'green' && !sig.passed && this._distance >= sig.dist) sig.passed = true;
    }
  }

  // ── HURDLE 2: ROAD BLOCKS (stop + mash to clear) ───────────────────────────
  _buildBlocks() {
    this._blocks = CFG.BLOCKS.map((dist) => {
      const img = this.add.image(0, DRIVE_Y + 6, 'l7_barrier').setOrigin(0.5, 1).setDisplaySize(96, 54).setDepth(8);
      const sign = this.add.text(0, DRIVE_Y - 70, '🚧 ROAD\nBLOCK', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffcc66', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(8);
      return { dist, img, sign, solved: false, triggered: false };
    });
  }

  // ── HURDLE 3: QUICK-TIME EVENTS (tap to swerve in time) ────────────────────
  _buildQTEs() {
    this._qtes = CFG.QTES.map((dist) => {
      // a fallen branch lying across the road — you press to swerve around it
      const img = this.add.image(0, DRIVE_Y + 8, 'l7_fallentree').setOrigin(0.5, 1).setDisplaySize(122, 66).setDepth(8);
      const sign = this.add.text(0, DRIVE_Y - 78, '⚠️ FALLEN\nBRANCH', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ff8866', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(8);
      return { dist, img, sign, done: false, triggered: false };
    });
  }

  // ── HURDLE 4: STEEP CLIMB (hold gas) ───────────────────────────────────────
  _buildClimb() {
    this._climb = { dist: CFG.CLIMB, solved: false, triggered: false };
    this._climbSign = this.add.text(0, DRIVE_Y - 70, '⛰️ STEEP\nCLIMB', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffd27a', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(8);
  }

  // ── FINAL DRIVE: hospital ───────────────────────────────────────────────────
  _buildHospital() {
    this._hosp = this.add.image(0, ROAD_TOP + 6, 'l7_hospital').setOrigin(0.5, 1).setDisplaySize(300, 170).setDepth(6);
    this._hospTxt = this.add.text(0, ROAD_TOP - 96, '🏥 ANIMAL HOSPITAL', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(10);
    const endG = this.add.graphics().setDepth(3);
    for (let ci = 0; ci < 2; ci++) for (let bi = 0; bi < Math.ceil(ROAD_H / 10); bi++) {
      endG.fillStyle((ci + bi) % 2 === 0 ? 0x111118 : 0xffffff, 1);
      endG.fillRect(-12 + ci * 12, ROAD_TOP + bi * 10, 12, 10);
    }
    this._finishG = endG;
  }

  // ── RAIN ────────────────────────────────────────────────────────────────────
  _buildRain() {
    this._rainGfx = this.add.graphics().setDepth(14).setScrollFactor(0);
    for (let i = 0; i < 170; i++) this._rain.push({ x: Math.random() * W, y: Math.random() * H, speed: 8 + Math.random() * 6, len: 10 + Math.random() * 10 });
  }
  _updateRain(delta) {
    const FF = delta / (1000 / 60), SIN = 0.3, COS = 0.954;
    this._rainGfx.clear(); this._rainGfx.lineStyle(1, 0xb4c8ff, 0.32); this._rainGfx.beginPath();
    for (const d of this._rain) {
      d.x += d.speed * SIN * FF; d.y += d.speed * COS * FF;
      if (d.y > H) { d.y = Math.random() * -50; d.x = Math.random() * W; }
      this._rainGfx.moveTo(d.x, d.y); this._rainGfx.lineTo(d.x + d.len * SIN, d.y + d.len * COS);
    }
    this._rainGfx.strokePath();
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _buildHUD() {
    const hg = this.add.graphics().setDepth(20).setScrollFactor(0);
    hg.fillStyle(0x0a0f1a, 0.8); hg.fillRoundedRect(W / 2 - 170, 6, 340, 34, 8);
    hg.lineStyle(1.5, 0xf0a830, 0.6); hg.strokeRoundedRect(W / 2 - 170, 6, 340, 34, 8);
    this.add.text(W / 2, 14, 'STAGE 4', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#f0a830' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
    this.add.text(W / 2, 28, 'Drive to the Hospital', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fde8c0', stroke: '#1a0e02', strokeThickness: 2 }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    hg.fillStyle(0x080410, 0.9); hg.fillRoundedRect(6, 6, 200, 40, 6);
    hg.lineStyle(1.5, 0xff4466, 0.55); hg.strokeRoundedRect(6, 6, 200, 40, 6);
    this.add.text(16, 12, '🐶 PUPPIES', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ff99aa' }).setDepth(21).setScrollFactor(0);
    this.add.rectangle(146, 30, 116, 12, 0x330011, 1).setOrigin(0.5).setDepth(21).setScrollFactor(0);
    this._healthBar = this.add.rectangle(88, 30, 116, 12, 0xff3355, 1).setOrigin(0, 0.5).setDepth(22).setScrollFactor(0);
    this._healthTxt = this.add.text(190, 24, '100%', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffaabb' }).setOrigin(1, 0).setDepth(23).setScrollFactor(0);

    hg.fillStyle(0x080410, 0.85); hg.fillRoundedRect(W - 116, 6, 110, 40, 6);
    hg.lineStyle(1.5, 0x4488cc, 0.45); hg.strokeRoundedRect(W - 116, 6, 110, 40, 6);
    this._distTxt = this.add.text(W - 61, 16, '9.6 km', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
    this._speedTxt = this.add.text(W - 61, 33, '🚗 0.0', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88ccff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    const L = 80, BW = W - 160, TY = H - 12;
    this.add.rectangle(W / 2, TY, BW + 6, 12, 0x120904, 1).setScrollFactor(0).setDepth(30);
    this.add.rectangle(L + BW / 2, TY, BW, 4, 0x3a2810, 1).setScrollFactor(0).setDepth(31);
    this._progFill = this.add.rectangle(L, TY, 2, 4, 0x44cc44, 1).setScrollFactor(0).setDepth(32).setOrigin(0, 0.5);
    this._progRunner = this.add.text(L, TY - 6, '🚗', { fontSize: '12px' }).setScrollFactor(0).setDepth(34).setOrigin(0.5, 1);
    this.add.text(L + BW, TY - 6, '🏥', { fontSize: '12px' }).setScrollFactor(0).setDepth(34).setOrigin(0.5, 1);
    this._progL = L; this._progW = BW;
    [...CFG.BREAKERS.map(d => [d, '🛑']), ...CFG.SIGNALS.map(d => [d, '🚦']),
     ...CFG.BLOCKS.map(d => [d, '🚧']), ...CFG.QTES.map(d => [d, '⚠️']), [CFG.CLIMB, '⛰️']].forEach(([d, e]) => {
      this.add.text(L + (d / CFG.TOTAL) * BW, TY - 15, e, { fontSize: '8px' }).setOrigin(0.5).setScrollFactor(0).setDepth(33);
    });

    const pb = this.add.text(W / 2, 52, '⏸', { fontSize: '18px' }).setOrigin(0.5).setDepth(35).setScrollFactor(0).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this._togglePause());
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this._togglePause());
  }

  // ── Mini-activity checklist (matches the reference image) ───────────────────
  _buildObjectives() {
    const items = ['Mind the speed breakers', 'Stop at the red lights', 'Clear the road blocks', 'Quick-time swerve', 'Climb the hill', 'Reach the hospital'];
    this._obj = items.map(t => ({ t, done: false }));
    const px = 6, py = 50, pw = 168, ph = 20 + items.length * 15;
    const g = this.add.graphics().setDepth(20).setScrollFactor(0);
    g.fillStyle(0x0a0f1a, 0.7); g.fillRoundedRect(px, py, pw, ph, 6);
    g.lineStyle(1, 0x3a5070, 0.6); g.strokeRoundedRect(px, py, pw, ph, 6);
    this.add.text(px + 8, py + 5, '🎯 TASKS', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7fb0e0' }).setDepth(21).setScrollFactor(0);
    this._objTxt = items.map((t, i) => this.add.text(px + 10, py + 21 + i * 15, '○ ' + t, {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#cdd8e6', stroke: '#000', strokeThickness: 2
    }).setDepth(21).setScrollFactor(0));
  }
  _completeObj(i) {
    if (!this._obj[i] || this._obj[i].done) return;
    this._obj[i].done = true;
    this._objTxt[i].setText('✓ ' + this._obj[i].t).setColor('#7dffa0');
    this.tweens.add({ targets: this._objTxt[i], scale: { from: 1.2, to: 1 }, duration: 250 });
  }

  _buildControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._done) return;
    const FF = delta / (1000 / 60);
    this._updateRain(delta);
    if (this._paused) return;

    if (!this._blocking) {
      const ts = window._touchState || {};
      const gas   = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
      const brake = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
      if (gas)        this._speed = Math.min(CFG.MAX, this._speed + CFG.ACCEL * FF);
      else if (brake) this._speed = Math.max(0, this._speed - CFG.BRAKE * FF);
      else            this._speed = Math.max(0, this._speed - CFG.FRICTION * FF);
      this._distance += this._speed * FF;
      if (this._sky) this._sky.tilePositionX += this._speed * FF * 0.18;
      if (this._fog) this._fog.tilePositionX += this._speed * FF * 0.25;
    }

    this._drawDashes(); this._drawJoints();
    this._positionObjects(FF);
    this._checkBreakers();
    this._checkSignals();
    this._checkBlocks();
    this._checkQTEs();
    this._checkClimb();

    // car bob + spinning wheels
    const bob = Math.sin(time * 0.02) * (this._speed > 0.4 ? 1.4 : 0.4);
    this._carC.y = this._carGroundY + bob;
    const spin = this._speed * 0.10 * FF;
    if (this._wheels) this._wheels.forEach(w => { w.rotation += spin; });
    this._beam.clear(); this._beam.fillStyle(0xfff3c0, 0.10);
    const bx = CAR_X + 78, by = this._carC.y - 48;
    this._beam.fillTriangle(bx, by, bx + 130, by - 18, bx + 130, by + 26);

    if (this._distance >= CFG.HOSPITAL) { this._reachHospital(); return; }
    this._updateHUD();
  }

  _sX(wx) { return CAR_X + (wx - this._distance); }

  _positionObjects(FF) {
    for (const b of this._breakers) { b.gfx.x = this._sX(b.dist); b.warn.x = this._sX(b.dist); }
    for (const sig of this._signals) { const x = this._sX(sig.dist); sig.g.x = x; sig.red.x = x; sig.yel.x = x; sig.grn.x = x; sig.zebra.x = this._sX(sig.dist - 30); }
    for (const b of this._blocks) { b.img.x = this._sX(b.dist); b.sign.x = b.img.x; }
    for (const q of this._qtes) { q.img.x = this._sX(q.dist); q.sign.x = q.img.x; }
    this._climbSign.x = this._sX(this._climb.dist);
    this._hosp.x = this._sX(CFG.HOSPITAL + 80); this._hospTxt.x = this._hosp.x; this._finishG.x = this._sX(CFG.HOSPITAL);
  }

  // ── Road blocks: stop + mash to clear ───────────────────────────────────────
  _checkBlocks() {
    for (const b of this._blocks) {
      if (!b.triggered && !b.solved && this._distance >= b.dist - 240) {
        b.triggered = true; this._speed = 0; this._blocking = true;
        this.time.delayedCall(400, () => this._runBlock(b));
      }
    }
  }
  _runBlock(b) {
    if (this._done) return;
    const td = this._overlay('🚧 Road Block!', 'Tap CLEAR rapidly to push the barrier aside!');
    let val = 0, fin = false;
    const { fill, draw } = this._meter(td);
    const push = () => { if (fin) return; val = Math.min(100, val + 9); draw(val); this.cameras.main.shake(40, 0.003);
      if (val >= 100) { fin = true; b.solved = true; this._completeObj(2);
        this.tweens.add({ targets: [b.img, b.sign], y: '-=80', alpha: 0, duration: 500 });
        td.forEach(o => { try { o.destroy(); } catch (_) {} });
        this._blocking = false; this.cameras.main.flash(250, 120, 220, 140); this._toast('✅ Road cleared!'); } };
    const btn = this._overlayButton(td, W / 2, H / 2 + 70, '💪  CLEAR', push);
    const sp = this.keys.SPACE, h = () => push(); sp.on('down', h); td.push({ destroy: () => sp.off('down', h) });
  }

  // ── Quick-Time Event: tap before the timer runs out ─────────────────────────
  _checkQTEs() {
    for (const q of this._qtes) {
      if (!q.triggered && !q.done && this._distance >= q.dist - 220) {
        q.triggered = true; this._speed = 0; this._blocking = true;
        this.time.delayedCall(350, () => this._runQTE(q));
      }
    }
  }
  _runQTE(q) {
    if (this._done) return;
    const td = this._overlay('⚠️ Quick-Time Event!', 'TAP SWERVE before the bar runs out!');
    const barX = W / 2, barY = H / 2 + 6, barW = 280;
    const fr = this.add.graphics().setDepth(63).setScrollFactor(0); td.push(fr);
    fr.lineStyle(2, 0xffffff, 0.8); fr.strokeRoundedRect(barX - barW / 2, barY, barW, 22, 6);
    const bar = this.add.graphics().setDepth(64).setScrollFactor(0); td.push(bar);
    let tLeft = 1.5; const total = 1.5; let resolved = false;
    const tick = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      tLeft -= 0.03; const f = Phaser.Math.Clamp(tLeft / total, 0, 1);
      bar.clear(); bar.fillStyle(f > 0.4 ? 0x44dd66 : 0xff5555, 1); bar.fillRoundedRect(barX - barW / 2 + 2, barY + 2, (barW - 4) * f, 18, 5);
      if (tLeft <= 0 && !resolved) done(false);
    }});
    const done = (ok) => {
      if (resolved) return; resolved = true; tick.remove();
      q.done = true; this._completeObj(3);
      this.tweens.add({ targets: [q.img, q.sign], y: '-=46', x: '+=60', alpha: 0, duration: 420 });
      if (ok) { this.tweens.add({ targets: this._carC, x: CAR_X + 70, duration: 180, yoyo: true }); this._floatTxt('🌀 Swerved!', '#88ffaa', 16); }
      else    { this._hitObstacle('💥 Too slow!'); }
      td.forEach(o => { try { o.destroy(); } catch (_) {} });
      this.time.delayedCall(300, () => { this._blocking = false; });
    };
    const btn = this._overlayButton(td, W / 2, H / 2 + 70, '🌀  SWERVE!', () => done(true));
    const sp = this.keys.SPACE, h = () => done(true); sp.on('down', h); td.push({ destroy: () => sp.off('down', h) });
  }

  // ── Steep climb: hold gas ───────────────────────────────────────────────────
  _checkClimb() {
    const c = this._climb;
    if (!c.triggered && !c.solved && this._distance >= c.dist - 200) {
      c.triggered = true; this._speed = 0; this._blocking = true;
      this.time.delayedCall(400, () => this._runClimb());
    }
  }
  _runClimb() {
    if (this._done) return;
    const td = this._overlay('⛰️ Steep Climb!', 'HOLD GAS to power the jeep up the hill!');
    this.tweens.add({ targets: this._carC, angle: -8, duration: 400 });
    let val = 0, fin = false, holding = false;
    const { draw } = this._meter(td);
    const loop = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      if (fin) return; val += (holding ? 1.0 : -0.7); val = Phaser.Math.Clamp(val, 0, 100); draw(val);
      if (val >= 100) { fin = true; this._climb.solved = true; this._completeObj(4); loop.remove();
        this.tweens.add({ targets: this._carC, angle: 0, duration: 400 });
        td.forEach(o => { try { o.destroy(); } catch (_) {} });
        this._blocking = false; this.cameras.main.flash(250, 120, 220, 140); this._toast('⛰️ Over the top!'); } } });
    td.push({ destroy: () => loop.remove() });
    const btn = this._overlayButton(td, W / 2, H / 2 + 70, '⚡  HOLD GAS', () => {});
    btn.on('pointerdown', () => holding = true); btn.on('pointerup', () => holding = false); btn.on('pointerout', () => holding = false);
    const sp = this.keys.SPACE, dk = this.keys.D, dn = () => holding = true, up = () => holding = false;
    sp.on('down', dn); sp.on('up', up); dk.on('down', dn); dk.on('up', up);
    td.push({ destroy: () => { sp.off('down', dn); sp.off('up', up); dk.off('down', dn); dk.off('up', up); } });
  }

  _meter(td) {
    const barX = W / 2, barY = H / 2 + 6, barW = 280;
    const fr = this.add.graphics().setDepth(63).setScrollFactor(0); td.push(fr);
    fr.fillStyle(0x101820, 1); fr.fillRoundedRect(barX - barW / 2, barY, barW, 22, 6); fr.lineStyle(2, 0x5a6a82, 1); fr.strokeRoundedRect(barX - barW / 2, barY, barW, 22, 6);
    const fill = this.add.graphics().setDepth(64).setScrollFactor(0); td.push(fill);
    const draw = (val) => { fill.clear(); fill.fillStyle(val > 80 ? 0x7dff88 : 0x44dd66, 1); fill.fillRoundedRect(barX - barW / 2 + 2, barY + 2, (barW - 4) * val / 100, 18, 5); };
    draw(0);
    return { fill, draw };
  }

  // ── Damage shared by traffic + QTE fail ─────────────────────────────────────
  _hitObstacle(msg) {
    if (this._invuln) return;
    this._invuln = true; this.time.delayedCall(900, () => this._invuln = false);
    this._health = Math.max(0, this._health - CFG.DMG); this._updateHealthBar();
    this.cameras.main.shake(240, 0.013); this.cameras.main.flash(220, 140, 0, 0);
    this.tweens.add({ targets: this._carC, y: this._carGroundY - 12, duration: 150, yoyo: true });
    this._floatTxt(`${msg}  -${CFG.DMG}%`, '#ff3355');
    if (this._health <= 0) this._gameOver('The puppies got too shaken up!\nDrive more carefully.');
  }

  _reachHospital() {
    if (this._done) return;
    this._done = true; this._speed = 0;
    this._completeObj(5);
    this.registry.set('lives', this.registry.get('lives') ?? 3);
    this.registry.set('l7_checkpoint', 'L7_Stage5');
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setScrollFactor(0);
    this.tweens.add({ targets: ov, alpha: 0.4, duration: 700 });
    this.time.delayedCall(700, () => {
      this.add.text(W / 2, H / 2 - 40, '🏥', { fontSize: '52px' }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.add.text(W / 2, H / 2 + 14, 'Hospital Reached!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.add.text(W / 2, H / 2 + 48, `Puppies' safety: ${Math.round(this._health)}% ❤️`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5e0b0' }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.time.delayedCall(2000, () => {
        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.time.delayedCall(740, () => {
          this._wakeLoop();
          this.scene.start('L7_Stage5');
        });
      });
    });
  }

  _wakeLoop() {
    try {
      const l = this.game.loop;
      if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
    } catch (_) {}
  }

  _gameOver(msg) {
    if (this._done) return;
    this._done = true; this._speed = 0;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(60).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - 50, '💔', { fontSize: '50px' }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    this.add.text(W / 2, H / 2 + 6, msg, { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ff6677', align: 'center', stroke: '#000', strokeThickness: 3, lineSpacing: 6 }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    this.add.text(W / 2, H / 2 + 64, '↺ Tap to try again', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a' }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    this.input.once('pointerdown', () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(420, () => this.scene.restart()); });
  }

  _updateHealthBar() {
    const pct = Math.max(0, this._health) / 100;
    this._healthBar.setDisplaySize(116 * pct, 12);
    this._healthBar.setFillStyle(pct > 0.5 ? 0xff3355 : pct > 0.25 ? 0xff8800 : 0xff2200);
    this._healthTxt.setText(`${Math.round(Math.max(0, this._health))}%`);
    this.tweens.add({ targets: this._healthBar, alpha: 0.2, duration: 90, yoyo: true, repeat: 2, onComplete: () => this._healthBar.setAlpha(1) });
  }
  _updateHUD() {
    const pct = Math.min(this._distance / CFG.TOTAL, 1);
    this._progFill.width = Math.max(2, pct * this._progW);
    this._progRunner.x = this._progL + pct * this._progW;
    this._distTxt.setText(`${((CFG.TOTAL - this._distance) / 1000).toFixed(1)} km`);
    this._speedTxt.setText(`🚗 ${this._speed.toFixed(1)}`);
  }
  _floatTxt(t, color, size = 20) {
    const o = this.add.text(W / 2, H / 2 - 50, t, { fontSize: `${size}px`, fontFamily: 'Georgia, serif', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: o, y: o.y - 34, alpha: 0, duration: 1200, onComplete: () => o.destroy() });
  }
  _toast(msg, ms = 2200) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 40, msg, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 12, y: 6 }, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 400, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }
  _overlay(title, sub) {
    this._blocking = true;
    const td = [];
    td.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(60).setScrollFactor(0).setInteractive());
    const g = this.add.graphics().setDepth(61).setScrollFactor(0);
    g.fillStyle(0x10141e, 0.98); g.fillRoundedRect(W / 2 - 220, H / 2 - 110, 440, 220, 14); g.lineStyle(2.5, 0xf0a830, 0.9); g.strokeRoundedRect(W / 2 - 220, H / 2 - 110, 440, 220, 14);
    td.push(g);
    td.push(this.add.text(W / 2, H / 2 - 78, title, { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f0c860', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(62).setScrollFactor(0));
    td.push(this.add.text(W / 2, H / 2 - 48, sub, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#b8c4d4', align: 'center' }).setOrigin(0.5).setDepth(62).setScrollFactor(0));
    return td;
  }
  _overlayButton(td, cx, cy, label, cb, w = 200, h = 42) {
    const g = this.add.graphics().setDepth(63).setScrollFactor(0);
    g.fillStyle(0x1c2436, 0.96); g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 9); g.lineStyle(2, 0x7dff88, 1); g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 9);
    td.push(g);
    td.push(this.add.text(cx, cy, label, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#7dff88' }).setOrigin(0.5).setDepth(64).setScrollFactor(0));
    const hit = this.add.rectangle(cx, cy, w, h, 0, 0).setDepth(65).setScrollFactor(0).setInteractive({ useHandCursor: true });
    td.push(hit); hit.on('pointerdown', () => cb());
    return hit;
  }
  _togglePause() {
    if (this._done) return;
    if (this._paused) { this._pauseObjs?.forEach(o => o.destroy()); this._pauseObjs = null; this._paused = false; return; }
    this._paused = true;
    const o = [];
    o.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(70).setScrollFactor(0).setInteractive());
    o.push(this.add.text(W / 2, H / 2 - 40, '⏸ Paused', { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setDepth(71).setScrollFactor(0));
    const resume = this.add.text(W / 2, H / 2 + 8, '▶ Resume', { fontSize: '15px', color: '#fff', backgroundColor: '#2a8a4a', padding: { x: 16, y: 8 } }).setOrigin(0.5).setDepth(71).setScrollFactor(0).setInteractive({ useHandCursor: true });
    const menu = this.add.text(W / 2, H / 2 + 50, '🏠 Menu', { fontSize: '13px', color: '#fff', backgroundColor: '#884422', padding: { x: 14, y: 7 } }).setOrigin(0.5).setDepth(71).setScrollFactor(0).setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => this._togglePause());
    menu.on('pointerdown', () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(420, () => this.scene.start('Menu')); });
    o.push(resume, menu);
    this._pauseObjs = o;
  }
}

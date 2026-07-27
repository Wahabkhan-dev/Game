import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';
import { buildStandardHeader, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { playVideoSequence, showStoryCard } from '../../../utils/VideoOverlay.js';
import { launchRandomMiniGame } from '../../../utils/MiniGamePicker.js';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 4 — DRIVE TO HOSPITAL  (rainy city highway)
// Level-3 side-view driving STYLE, with Level 7's own hurdles & mini-activities:
//   Avoid Traffic · Road Block · Quick-Time Event · Steep Climb · Final Drive
// Uses the same car sprite + position as Level 3 (l3_car @ CAR_X).
// ════════════════════════════════════════════════════════════════════════════
// Match Level 3's driving-scene geometry exactly so the road band + background
// are the same size/position (was ROAD_TOP=312 / ROAD_H=100 / +60 — a taller,
// higher road than Level 3). Every hurdle, sign, the car and the finish line
// all derive from these three, so they move together with the change.
const ROAD_TOP = Math.round(H * 0.82);  // ≈ 369 — road band top (same as Level 3's ROAD_TOP_Y)
const ROAD_H   = H - ROAD_TOP;          // ≈ 81  — road band fills to screen bottom, like Level 3
const DRIVE_Y  = ROAD_TOP + 52;         // wheel-contact surface (matches Level 3's +52 offset)
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
  // The speedometer dial reads 0–80 in tens, same conversion Level 3's car
  // journey uses — internal physics stay on the 0–MAX scale.
  DISPLAY_MAX_SPEED: 80,
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

// Level-3 animated car frame keys + playback rate (matches Level 3's car journey)
const CAR_FRAMES = Array.from({ length: 9 }, (_, i) => `l7s4_car_${i + 1}`);
const CAR_FPS = 14;

export class L7_Stage4Scene extends L7BaseScene {
  constructor() { super('L7_Stage4'); }

  preload() {
    if (!this.textures.exists('l7_jeep_fixed')) this.load.image('l7_jeep_fixed', 'assets/images/Level7/Stage2/l7_jeep_fixed.png');
    if (!this.textures.exists('l3_car')) this.load.image('l3_car', 'assets/images/Level 3/l3_car.png');
    // Level-3-matched driving art (copied into Level 7/Stage4): city background,
    // road-bottom deck, and the 9-frame animated car — so Stage 4 looks/drives
    // exactly like Level 3's car journey.
    const S4 = 'assets/images/Level 7/Stage4/';
    if (!this.textures.exists('l7s4_bg'))   this.load.image('l7s4_bg',   `${S4}city-bg.png`);
    if (!this.textures.exists('l7s4_road')) this.load.image('l7s4_road', `${S4}road-bottom.png`);
    for (let i = 1; i <= 9; i++) {
      const key = `l7s4_car_${i}`;
      if (!this.textures.exists(key)) this.load.image(key, `${S4}car/frame_${String(i).padStart(3, '0')}.png`);
    }
    // Load transition videos (l7_v6 plays at end)
    if (!this.cache.video.exists('l7_v6')) this.load.video('l7_v6', 'assets/video/Level 7/Part 06.mp4');
  }

  create() {
    generateL7Assets(this);
    this.cameras.main.setBackgroundColor('#0c1322');
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this._lives    = this.registry.get('lives') ?? 3;
    this._hp       = 3;
    this._distance = 0;
    this._speed    = 0;
    this._done     = false;
    this._paused   = false;
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

    this.time.delayedCall(300, () => this._toast('🚗 ▶/D = accelerate · ◀/A = brake.  Slow for 🛑 breakers & 🚦 red lights!', 4000));
  }

  // ── BACKGROUND — Level 3's city art, anchored so its baked-in street level
  // lands exactly at ROAD_TOP (same technique as Level 3's car journey). ───────
  _buildBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0c1322, 1).setDepth(-20);
    // Prefer Level 3's actual city background so Stage 4 looks identical to the
    // Level 3 car journey; fall back to the Stage-4 copy, then the sky tile.
    const cityKey = this.textures.exists('l3_bg_main') ? 'l3_bg_main'
                  : this.textures.exists('l7s4_bg')    ? 'l7s4_bg' : null;
    if (cityKey) {
      const src   = this.textures.get(cityKey).getSourceImage();
      const srcH  = src.naturalHeight || src.height || ROAD_TOP;
      const dispH = ROAD_TOP;
      this._bgCity = this.add.tileSprite(W / 2, dispH / 2, W, dispH, cityKey).setDepth(-15);
      this._bgCity.tileScaleX = this._bgCity.tileScaleY = dispH / srcH;
    } else {
      this._sky = this.add.tileSprite(W / 2, H / 2 - 30, W, H, 'l7_s4_sky').setDepth(-15);
    }
    this._fog = this.add.tileSprite(W / 2, ROAD_TOP - 50, W, 110, 'l7_fog').setDepth(-6).setAlpha(0.4);
    const fl = this.add.rectangle(W / 2, H / 2, W, H, 0xbcd0f0, 0).setDepth(-4);
    this.time.addEvent({ delay: 7000, loop: true, callback: () => { if (!this._done) this.tweens.add({ targets: fl, alpha: 0.18, duration: 110, yoyo: true }); } });
  }

  // ── ROAD DECK — Level 3's road-bottom art, tiled + scrolled horizontally.
  // Fills from ROAD_TOP down to the screen bottom, just like Level 3. Motion
  // comes from scrolling the tile in update(), so no procedural lane dashes. ──
  _buildRoad() {
    const RS = ROAD_TOP, roadH = H - RS;
    // Prefer Level 3's actual road-bottom art so the bottom matches Level 3
    // exactly; fall back to the Stage-4 copy, then a plain asphalt fill.
    const roadKey = this.textures.exists('l3_road_bottom') ? 'l3_road_bottom'
                  : this.textures.exists('l7s4_road')       ? 'l7s4_road' : null;
    if (roadKey) {
      const src  = this.textures.get(roadKey).getSourceImage();
      const srcH = src.naturalHeight || src.height || 81;
      this._roadTile = this.add.tileSprite(W / 2, RS + roadH / 2, W, roadH, roadKey)
        .setDepth(1).setScrollFactor(0);
      this._roadTile.tileScaleX = this._roadTile.tileScaleY = roadH / srcH;
    } else {
      const roadG = this.add.graphics().setDepth(1).setScrollFactor(0);
      roadG.fillStyle(0x28293a, 1); roadG.fillRect(0, RS, W, roadH);
      roadG.fillStyle(0x32344a, 1); roadG.fillRect(0, RS + 8, W, roadH - 8);
    }
  }

  // ── PLAYER CAR — Level 3's 9-frame animated car (same sprite/spirit). Kept
  // inside a container so the existing bob / shake / beam code still targets
  // this._carC exactly as before. Frames advance while moving (see _updateCarAnim). ──
  _buildCar() {
    const hasFrames = this.textures.exists(CAR_FRAMES[0]);
    const bh = 82;                                // body display height (matches L3 CAR_H)
    const carY = DRIVE_Y + 17;                    // sit wheels on the road
    this._carGroundY = carY;

    let bw = bh * 2.5;
    if (hasFrames) {
      const src = this.textures.get(CAR_FRAMES[0]).getSourceImage();
      bw = bh * (src.width / src.height);         // preserve the frame's real aspect
    }
    this._carShadow = this.add.ellipse(CAR_X, DRIVE_Y + 2, bw * 0.72, 12, 0x000000, 0.3).setDepth(4);

    const firstTex = hasFrames ? CAR_FRAMES[0] : CAR_TEX(this);
    const body = this.add.image(0, 0, firstTex).setOrigin(0.5, 1).setDisplaySize(bw, bh);
    this._carBody = body;
    this._wheels  = null;                          // no separate wheels — frames animate the whole car
    this._carAnimated   = hasFrames;
    this._carFrameIdx   = 0;
    this._carFrameTimer = 0;
    this._carC = this.add.container(CAR_X, carY, [body]).setDepth(9);
    this._beam = this.add.graphics().setDepth(8);
  }

  // Advance the car frame sequence while moving; hold frame 0 when stopped —
  // same RUN_FPS pacing as Level 3's car journey.
  _updateCarAnim(delta) {
    if (!this._carAnimated) return;
    if (this._speed > 0.05) {
      this._carFrameTimer += delta;
      const msPerFrame = 1000 / CAR_FPS;
      while (this._carFrameTimer >= msPerFrame) {
        this._carFrameTimer -= msPerFrame;
        this._carFrameIdx = (this._carFrameIdx + 1) % CAR_FRAMES.length;
      }
      this._carBody.setTexture(CAR_FRAMES[this._carFrameIdx]);
    } else {
      this._carFrameTimer = 0;
      this._carFrameIdx = 0;
      this._carBody.setTexture(CAR_FRAMES[0]);
    }
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
      // Crossing the stop line while still red is an instant total fail — same
      // severity/logic as Level 3's car journey (no bounce-back, no partial
      // damage; running a red light ends the drive right there).
      if (sig.state === 'red' && !sig.passed && this._distance >= sig.dist - 28) {
        sig.passed = true;
        this._runRedLight();
        return;
      }
      if (sig.state === 'green' && !sig.passed && this._distance >= sig.dist) sig.passed = true;
    }
  }

  // ── RED LIGHT — instant total fail (same severity/flow as Level 3) ─────────
  _runRedLight() {
    if (this._done) return;
    this.cameras.main.flash(600, 255, 0, 0);
    this.cameras.main.shake(400, 0.018);
    const border = this.add.graphics().setDepth(55).setScrollFactor(0);
    border.lineStyle(10, 0xff0000, 0.92); border.strokeRect(5, 5, W - 10, H - 10);
    this.tweens.add({ targets: border, alpha: 0.14, duration: 150, yoyo: true, repeat: 8, onComplete: () => border.destroy() });
    this._lives = 0; this._hp = 0;
    this._hdr?.setLives(0); this._hdr?.setHP(0);
    this.registry.set('lives', 0);
    this._gameOver("🚦 You crossed the red signal!\nThe puppies didn't make it...");
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

  // ── FINAL DRIVE: finish line — no hospital signage, just a checkered line
  // painted across the road (matches Level 3's own finish marker style). ─────
  _buildHospital() {
    const endG = this.add.graphics().setDepth(3);
    for (let ci = 0; ci < 2; ci++) for (let bi = 0; bi < Math.ceil(ROAD_H / 10); bi++) {
      endG.fillStyle((ci + bi) % 2 === 0 ? 0x111118 : 0xffffff, 1);
      endG.fillRect(-12 + ci * 12, ROAD_TOP + bi * 10, 12, 10);
    }
    this._finishG = endG;
    this._finishTxt = this.add.text(0, ROAD_TOP - 58, '🏁 FINISH', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(10);
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

  // ── HUD — unified Level-2 header (health · banner · timer · coin · menu) ──────
  _buildHUD() {
    this._points = this.registry.get('points') ?? 0;
    this._hdr = buildStandardHeader(this, {
      chapterLabel: 'LEVEL 7', title: 'Drive to the Hospital',
      timer: 90, coinValue: this._points,
      lives: this._lives, hp: this._hp,
      onMenu: () => this._togglePause(), depth: 48,
    });
    this._hearts    = this._hdr.hearts;
    this._hpBars    = this._hdr.hpBars;
    this._pointsTxt = this._hdr.coinTxt;
    this._timerTxt  = this._hdr.timerTxt;
    this._hdr.setLives(this._lives);
    this._hdr.setHP(this._hp);

    this._timerFull = 90; this._timeLeft = 90;
    this._timerEvt = this.time.addEvent({ delay: 1000, loop: true, callback: () => this._tickHudTimer() });

    // Trip readout (distance remaining) — the checkpoint-module slot, just
    // below the banner. Speed now lives in its own analog gauge
    // (_buildSpeedGauge), same position/logic as Level 3's car journey.
    const ry = this._hdr.bottom + 8, rw = 300, rx = W / 2 - rw / 2, rh = 30;
    const rg = this.add.graphics().setScrollFactor(0).setDepth(48);
    rg.fillStyle(0x0a0f1a, 0.75); rg.fillRoundedRect(rx, ry, rw, rh, 8);
    rg.lineStyle(1, THEME.GOLD_DK, 0.6); rg.strokeRoundedRect(rx, ry, rw, rh, 8);
    this._distTxt = this.add.text(rx + rw / 2, ry + rh / 2, '9.6 km', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.goldTxt, stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(49);

    this._buildSpeedGauge();

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

    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this._togglePause());
  }

  // ── Speedometer — analog radial gauge, same geometry/position/logic as
  // Level 3's car journey: 0–80 dial, needle sweeps left (0) over the top to
  // right (80). Fixed in the bottom-right corner, clear of the progress bar.
  _buildSpeedGauge() {
    const cx = 745, cy = 378, R = 38;
    this._spdCX = cx; this._spdCY = cy; this._spdR = R;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(48);
    bg.fillStyle(0x0a0f1a, 0.8);
    bg.fillCircle(cx, cy, R + 9);
    bg.lineStyle(2, THEME.GOLD_DK, 0.85);
    bg.strokeCircle(cx, cy, R + 9);

    this.add.text(cx, cy - R - 17, 'SPEED', {
      fontSize: '8px', fontFamily: 'Georgia, serif', color: '#c9956b',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(49);

    // Ticks + labels every 10, from 0 (left) sweeping over the top to 80 (right).
    const tickG = this.add.graphics().setScrollFactor(0).setDepth(49);
    tickG.lineStyle(2, 0xf5c87a, 0.9);
    for (let s = 0; s <= CFG.DISPLAY_MAX_SPEED; s += 10) {
      const theta = Math.PI - (s / CFG.DISPLAY_MAX_SPEED) * Math.PI;
      const x0 = cx + (R - 7) * Math.cos(theta), y0 = cy - (R - 7) * Math.sin(theta);
      const x1 = cx + R * Math.cos(theta),       y1 = cy - R * Math.sin(theta);
      tickG.lineBetween(x0, y0, x1, y1);
      const lx = cx + (R + 12) * Math.cos(theta), ly = cy - (R + 12) * Math.sin(theta);
      this.add.text(lx, ly, `${s}`, {
        fontSize: '7px', fontFamily: 'Georgia, serif', color: '#c9956b',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(49);
    }

    this._spdNeedle = this.add.graphics().setScrollFactor(0).setDepth(50);
    this._spdReadout = this.add.text(cx, cy + 15, '0', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#88ccff',
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this._updateSpeedGauge();
  }

  // Called every frame from _updateHUD — sweeps the needle to the current
  // speed converted onto the 0–80 dial, and updates the numeric readout.
  _updateSpeedGauge() {
    if (!this._spdNeedle) return;
    const display = (this._speed / CFG.MAX) * CFG.DISPLAY_MAX_SPEED;
    const t = Phaser.Math.Clamp(display / CFG.DISPLAY_MAX_SPEED, 0, 1);
    const theta = Math.PI - t * Math.PI;
    const cx = this._spdCX, cy = this._spdCY, R = this._spdR;

    this._spdNeedle.clear();
    this._spdNeedle.lineStyle(3, 0xff4444, 1);
    this._spdNeedle.lineBetween(cx, cy, cx + (R - 6) * Math.cos(theta), cy - (R - 6) * Math.sin(theta));
    this._spdNeedle.fillStyle(0xf5c87a, 1);
    this._spdNeedle.fillCircle(cx, cy, 4);

    this._spdReadout.setText(`${Math.round(display)}`);
  }

  // Countdown tick — at 0, lose a life and refill (matches every other runner)
  _tickHudTimer() {
    if (this._done || this._paused) return;
    this._timeLeft = Math.max(0, this._timeLeft - 1);
    if (this._timerTxt) {
      this._timerTxt.setText(`${this._timeLeft}s`);
      this._timerTxt.setColor(this._timeLeft <= 10 ? '#ff5a3a' : THEME.goldTxt);
    }
    if (this._timeLeft <= 0) {
      this._timeLeft = this._timerFull;
      if (this._timerTxt) { this._timerTxt.setText(`${this._timerFull}s`); this._timerTxt.setColor(THEME.goldTxt); }
      // Timer running out costs a FULL life outright, same as Level 3's car
      // journey (not just partial HP).
      this._loseLifeFull();
    }
  }

  // ── Mini-activity checklist state (no longer shown as a panel) ─────────────
  _buildObjectives() {
    const items = ['Mind the speed breakers', 'Stop at the red lights', 'Clear the road blocks', 'Quick-time swerve', 'Climb the hill', 'Reach the hospital'];
    this._obj = items.map(t => ({ t, done: false }));
  }
  _completeObj(i) {
    if (!this._obj[i] || this._obj[i].done || !this._objTxt) return;
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
      const scroll = this._speed * FF;
      // City bg drifts slowly for depth; the road deck scrolls at full speed
      // (converted through its own tileScale, same as Level 3's car journey).
      if (this._bgCity)  this._bgCity.tilePositionX  += scroll * 0.12 / (this._bgCity.tileScaleX || 1);
      if (this._roadTile) this._roadTile.tilePositionX += scroll / (this._roadTile.tileScaleX || 1);
      if (this._sky) this._sky.tilePositionX += scroll * 0.18;
      if (this._fog) this._fog.tilePositionX += scroll * 0.25;
    }

    this._updateCarAnim(delta);
    this._positionObjects(FF);
    this._checkBreakers();
    this._checkSignals();
    this._checkBlocks();
    this._checkQTEs();
    this._checkClimb();

    // car bob (the frame animation handles the wheels now)
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
    this._finishG.x = this._sX(CFG.HOSPITAL); this._finishTxt.x = this._finishG.x;
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
    // Same as the Quick-Time Event below — a random folder mini-game from the
    // Level-7 pool, not a custom hand-rolled meter. Driving is already frozen
    // (_speed=0, _blocking=true); once it's solved, clear the barrier and resume.
    launchRandomMiniGame(this, 7, () => {
      b.solved = true; this._completeObj(2);
      this.tweens.add({ targets: [b.img, b.sign], y: '-=80', alpha: 0, duration: 500 });
      this._blocking = false; this.cameras.main.flash(250, 120, 220, 140); this._toast('✅ Road cleared!');
    });
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
    // The old tap-to-swerve quick-time event is replaced by a folder mini-game
    // (a random educational iframe game from the Level-7 pool). Driving is
    // already frozen here (_speed=0, _blocking=true); once the mini-game is
    // solved, clear the branch and resume the drive.
    launchRandomMiniGame(this, 7, () => {
      q.done = true; this._completeObj(3);
      this.tweens.add({ targets: [q.img, q.sign], y: '-=46', x: '+=60', alpha: 0, duration: 420 });
      this.tweens.add({ targets: this._carC, x: CAR_X + 70, duration: 180, yoyo: true });
      this._floatTxt('🌀 Cleared the road!', '#88ffaa', 16);
      this.time.delayedCall(300, () => { this._blocking = false; });
    });
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
    // Same folder-mini-game system as the Road Block / Quick-Time Event above.
    this.tweens.add({ targets: this._carC, angle: -8, duration: 400 });
    launchRandomMiniGame(this, 7, () => {
      this._climb.solved = true; this._completeObj(4);
      this.tweens.add({ targets: this._carC, angle: 0, duration: 400 });
      this._blocking = false; this.cameras.main.flash(250, 120, 220, 140); this._toast('⛰️ Over the top!');
    });
  }

  // ── Damage shared by speed breakers + QTE fail — same health model as
  // Level 3's car journey: 3 lives × 3 HP. A hit costs 1 HP pip; only losing
  // all 3 HP costs a full life (and refills HP to 3, unless lives hit 0).
  _hitObstacle(msg) {
    if (this._invuln) return;
    this._invuln = true; this.time.delayedCall(900, () => this._invuln = false);
    this.cameras.main.shake(240, 0.013); this.cameras.main.flash(220, 140, 0, 0);
    this.tweens.add({ targets: this._carC, y: this._carGroundY - 12, duration: 150, yoyo: true });
    this._floatTxt(`${msg}  -1 💛`, '#ff3355');
    this._loseHP(1);
  }

  _loseHP(n = 1) {
    this._hp = Math.max(0, this._hp - n);
    this._hdr?.setHP(this._hp);
    if (this._hp <= 0) this._loseLifeFull();
  }

  _loseLifeFull() {
    this._lives = Math.max(0, this._lives - 1);
    this._hdr?.setLives(this._lives);
    this.registry.set('lives', this._lives);
    if (this._lives <= 0) {
      this._hp = 0; this._hdr?.setHP(0);
      this._gameOver('The puppies got too shaken up!\nDrive more carefully.');
      return;
    }
    this._hp = 3;
    this._hdr?.setHP(3);
  }

  _reachHospital() {
    if (this._done) return;
    this._done = true; this._speed = 0;
    this._timerEvt?.remove();
    this._completeObj(5);
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', 'L7_Stage5');
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setScrollFactor(0);
    this.tweens.add({ targets: ov, alpha: 0.4, duration: 700 });
    this.time.delayedCall(700, () => {
      this.add.text(W / 2, H / 2 - 40, '🏥', { fontSize: '52px' }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.add.text(W / 2, H / 2 + 14, 'Hospital Reached!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.add.text(W / 2, H / 2 + 48, `Puppies' safety: ${this._lives}/3 ❤️`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5e0b0' }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
      this.time.delayedCall(1500, () => {
        // V6 plays after reaching the hospital (end of Stage 4), then on to Stage 5.
        this.playStoryVideos(['l7_v6'], () => {
          this.cameras.main.fadeOut(120, 0, 0, 0);
          this.time.delayedCall(80, () => {
            this._forceSceneStart('L7_Stage5');
          });
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

  // Same retry-polling safety net as L7BaseScene._forceSceneStart — a single
  // _wakeLoop() call isn't enough since scene.start() only gets PROCESSED on
  // the next loop tick, and if that tick never comes (RAF stalled from a
  // webview focus loss) the game silently stays on this scene forever.
  //
  // Kept in sync with L7BaseScene.js's version (this scene overrides it
  // locally rather than inheriting it) — see that file for the full
  // reasoning: check via rAF first so a HEALTHY loop never touches
  // game.step() (the old unconditional setInterval here raced a manual step
  // against the browser's own already-ticking RAF loop, double-stepping the
  // game for a beat — a visible "jerk"), and run the "has it been a second
  // yet" fallback on setTimeout rather than inside the rAF callback, so it
  // still fires and recovers even if rAF itself has genuinely stopped
  // ticking (gating it behind rAF re-scheduling would mean a real stall
  // never gets noticed, freezing the game on a black screen forever).
  _forceSceneStart(nextScene, nextData = {}) {
    this._wakeLoop();
    this.scene.start(nextScene, nextData);

    const isRunning = () => {
      const sceneObj = this.game.scene.getScene(nextScene);
      const status = sceneObj ? sceneObj.sys.settings.status : -1;
      return status === 5 || status === 8 || status === 9 || this.game.scene.isActive(nextScene);
    };

    let done = false, rafId = null, iv = null, timeoutId = null;
    const stopAll = () => {
      done = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (iv != null) clearInterval(iv);
      if (timeoutId != null) clearTimeout(timeoutId);
    };

    const rafCheck = () => {
      if (done) return;
      if (isRunning()) { stopAll(); return; }
      rafId = requestAnimationFrame(rafCheck);
    };
    rafId = requestAnimationFrame(rafCheck);

    timeoutId = setTimeout(() => {
      if (done || isRunning()) { stopAll(); return; }
      let tries = 0;
      iv = setInterval(() => {
        if (isRunning()) { stopAll(); return; }
        this._wakeLoop();
        try {
          const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
          this.game.step(t, 16);
        } catch (_) {}
        if (++tries >= 300) stopAll();
      }, 50);
    }, 1000);

    // NOTE: deliberately NOT tied to this.events.once('shutdown', stopAll) —
    // this.scene.start(nextScene) queues a STOP of THIS scene as part of the
    // same operation, so shutdown fires almost immediately regardless of
    // whether nextScene ever finishes booting, which would kill the watchdog
    // right when it's needed. See L7BaseScene.js's _forceSceneStart for the
    // full writeup of this bug.
  }

  _gameOver(msg) {
    if (this._done) return;
    this._done = true; this._speed = 0;
    this._timerEvt?.remove();
    this.registry.set('lives', 3);
    this.registry.set('l7_checkpoint', 'L7_Stage1');
    // Story beat FIRST (same order as Level 3's car journey), THEN the V8
    // "exceptional" cinematic, then the try-again screen. Lives are shared
    // across all 5 stages, so running out sends the player back to Stage 1.
    showStoryCard(this, msg, () => {
      playVideoSequence(this, ['l7_v8'], () => {
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(60).setScrollFactor(0);
        this.add.text(W / 2, H / 2 - 20, '💔', { fontSize: '50px' }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
        this.add.text(W / 2, H / 2 + 40, '↺ Tap to try again', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a' }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
        this.input.once('pointerdown', () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(420, () => this._forceSceneStart('L7_Stage1')); });
      });
    });
  }

  _updateHUD() {
    const pct = Math.min(this._distance / CFG.TOTAL, 1);
    this._progFill.width = Math.max(2, pct * this._progW);
    this._progRunner.x = this._progL + pct * this._progW;
    this._distTxt.setText(`${((CFG.TOTAL - this._distance) / 1000).toFixed(1)} km`);
    this._updateSpeedGauge();
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
  // Finalized wood/gold Game-Menu modal (approved via Theme Design)
  _togglePause() {
    if (this._done) return;
    if (this._paused) {
      this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._pauseObjs = null; this._paused = false;
      return;
    }
    this._paused = true;
    this._pauseObjs = openGameMenuModal(this, {
      onResume:  () => this._togglePause(),
      onRestart: () => { this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} }); this._paused = false; this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); },
      onExit:    () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(210, () => this.scene.start('Menu')); },
    });
  }
}

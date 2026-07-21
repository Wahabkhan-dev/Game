import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL3Assets } from './L3Assets.js';
import { buildStandardHeader, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { playVideoOverlay, showStoryCard } from '../../../utils/VideoOverlay.js';

// 0.72 + 0.10 push-down so the road (and everything anchored to it — car,
// obstacles, bump/hole/zebra hazards) lines up with the lowered background art.
const ROAD_TOP_Y = Math.round(H * 0.82);   // ≈ 369 — yellow border / road band top
// Car sits: carY = ROAD_TOP_Y + 4 + 65 = ROAD_TOP_Y + 69
// Visible wheel bottom = carY - 17 (PNG transparent pad) = ROAD_TOP_Y + 52
const DRIVE_Y    = ROAD_TOP_Y + 52;        // ≈ 376 — surface where car wheels contact

const _CAR_H = 82;
const _CAR_W = 152;
const CAR_Y  = ROAD_TOP_Y;

// ─────────────────────────────────────────────────────────────────────────────
// Phase config — FIX 3: all world-X positions halved; speed halved; total 16 200
const CFG = {
  TOTAL_DIST:   16200,   // 4.5 u/fr × 60 fps × 60 s = 16 200 u
  CAR_X:        200,
  ROAD_TOP_Y,
  CAR_H:        _CAR_H,
  CAR_W:        _CAR_W,

  MAX_SPEED:    6,
  ACCEL:        0.25,
  FRICTION:     0.10,
  BRAKE_DECEL:  0.35,

  SLOW_THRESHOLD: 1.5,   // speed > 1.5 u/fr = hit bump too fast
  HEALTH_PENALTY: 32,
  BUMP_ZONE:      40,
  BUMP_W:         80,
  BUMP_H:         18,

  // FIX 3: world X positions (originals × 0.49)
  BREAKERS: [
    { dist: 1470,  warnDist: 1320  },
    { dist: 3430,  warnDist: 3280  },
    { dist: 8330,  warnDist: 8180  },
    { dist: 10290, warnDist: 10140 },
    { dist: 13720, warnDist: 13580 },
  ],

  HOLES: [
    { dist: 4410,  warnDist: 4260  },
    { dist: 11760, warnDist: 11610 },
  ],
  HOLE_HALF:     100,
  HOLE_STOP_GAP: 300,

  SIGNAL_DIST:    6370,
  STOP_LINE_DIST: 6340,
  RED_DUR:         5000,
  GREEN_DUR:       7000,

  HOSPITAL_SPRITE: 15870,
  HOSPITAL_DIST:   16200,
};

export class L3_CarJourneyScene extends Phaser.Scene {
  constructor() { super('L3_Drive'); }

  preload() {
    this.load.audio('bump_fast',      'assets/audio/bump_fast.mp3');
    this.load.audio('bump_slow',      'assets/audio/bump_slow.mp3');
    this.load.audio('signal_beep',    'assets/audio/signal_beep.mp3');
    this.load.audio('gameover_sting', 'assets/audio/game_over.mp3');
  }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#060a10');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const startZone = this.registry.get('l3_startZone') || 1;
    this.registry.remove('l3_startZone');
    if (startZone >= 2) {
      this.registry.set('l3_health', this.registry.get('l3_health') || 100);
      this.registry.set('l3_coins',  this.registry.get('l3_coins')  || 0);
      this.cameras.main.fadeOut(0);
      this.time.delayedCall(50, () => this.scene.start('L3_MG1'));
      return;
    }

    this._lives         = 3;
    this._hp            = 3;
    this._health        = 100;
    this._coins         = this.registry.get('l3_coins') || 0;
    this._distance      = 0;
    this._speed         = 0;
    this._done          = false;
    this._paused        = false;
    this._leftHeld      = false;
    this._rightHeld     = false;
    this._signalState   = 'red';
    this._signalChecked = false;
    this._signalForced  = false;
    this._holeBlocking  = false;
    this._rainDrops     = [];

    this._buildBackground();
    this._buildRoad();           // FIX 2 — layered asphalt road
    this._buildCar();            // FIX 1 — grounded to ROAD_TOP_Y
    this._buildSpeedBreakers();
    this._buildHoles();
    this._buildTrafficSignal();
    this._buildHospitalMarker();
    this._buildRain();           // FIX 4 — full-canvas Graphics rain
    this._buildHUD();
    this._buildProgressBar();

    this._cursors = this.input.keyboard.createCursorKeys();
    this.time.delayedCall(CFG.RED_DUR, () => this._switchSignal());

    this.time.delayedCall(600, () => {
      const m = this.add.text(W / 2, H / 2 - 60,
        '🚗 Drive to the hospital!\nBrake ⬅ before ⚠️ bumps and 🚦 red lights.', {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a',
          stroke: '#000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0).setAlpha(0);
      this.tweens.add({ targets: m, alpha: 1, duration: 400 });
      this.tweens.add({ targets: m, alpha: 0, duration: 500, delay: 3200, onComplete: () => m.destroy() });
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._done || this._paused) return;
    const FF = delta / (1000 / 60);   // frame factor — 1.0 at 60 fps

    // ── Movement (only when not blocked by hole puzzle) ───────────────────────
    if (!this._holeBlocking) {
      const gas   = this._cursors.right.isDown || window._touchState?.right || this._rightHeld;
      const brake = this._cursors.left.isDown  || window._touchState?.left  || this._leftHeld;

      if (gas)        this._speed = Math.min(CFG.MAX_SPEED, this._speed + CFG.ACCEL * FF);
      else if (brake) this._speed = Math.max(0,             this._speed - CFG.BRAKE_DECEL * FF);
      else            this._speed = Math.max(0,             this._speed - CFG.FRICTION * FF);

      const scroll = this._speed * FF;
      this._distance += scroll;

      if (this._bgCity)  this._bgCity.tilePositionX  += scroll * 0.12;
      if (this._fog)     this._fog.tilePositionX     += scroll * 0.14;
      if (this._roadTile) this._roadTile.tilePositionX += scroll / (this._roadTile.tileScaleX || 1);
    }

    // ── FIX 4: rain every frame regardless of hole state ─────────────────────
    this._updateRain(delta);

    // ── Reposition world objects ──────────────────────────────────────────────
    const sX = (wx) => CFG.CAR_X + (wx - this._distance);

    for (const b of this._bumps) {
      b.gfx.x  = sX(b.dist);
      b.warn.x = sX(b.warnDist);
      if (b.warnLbl) b.warnLbl.x = b.warn.x;
    }
    for (const h of this._holes) {
      h.gfx.x       = sX(h.dist);
      h.bridgeGfx.x = sX(h.dist);
      h.warn.x      = sX(h.warnDist);
      if (h.warnLbl) h.warnLbl.x = h.warn.x;
    }
    for (const obj of this._signalGroup) obj.x = sX(CFG.SIGNAL_DIST);
    this._stopLineGfx.x  = sX(CFG.STOP_LINE_DIST);   // _zebraGfx alias
    this._stopRoadTxt.x  = sX(CFG.STOP_LINE_DIST);
    if (this._zebraGfx) this._zebraGfx.x = sX(CFG.STOP_LINE_DIST);
    this._hospGfx.x      = sX(CFG.HOSPITAL_SPRITE);
    this._hospTxt.x      = sX(CFG.HOSPITAL_SPRITE);
    if (this._roadEndGfx) this._roadEndGfx.x = sX(CFG.HOSPITAL_DIST);
    if (this._roadEndTxt) this._roadEndTxt.x  = sX(CFG.HOSPITAL_DIST);

    // ── Bump detection ────────────────────────────────────────────────────────
    for (const b of this._bumps) {
      if (!b.triggered && this._distance >= b.dist - CFG.BUMP_ZONE) {
        b.triggered = true;
        if (this._speed > CFG.SLOW_THRESHOLD) this._hitBumpFast(b);
        else                                   this._hitBumpSlow(b);
      }
    }

    // ── Hole detection ────────────────────────────────────────────────────────
    for (const h of this._holes) {
      if (!h.triggered && !h.solved && this._distance >= h.dist - CFG.HOLE_STOP_GAP) {
        h.triggered = true;
        this._speed        = 0;
        this._holeBlocking = true;
        this.time.delayedCall(400, () => {
          if (this._done) return;
          if (h.puzzle === 'bolts') this._showBoltPuzzle(h);
          else                       this._showBridgePuzzle(h);
        });
      }
    }

    // ── Signal RED as the player approaches, then GREEN after 6 s so they can go ─
    if (!this._signalForced && this._distance >= CFG.STOP_LINE_DIST - 650) {
      this._signalForced = true;
      this._signalState = 'red';
      this._updateSignalVisual();
      this.time.delayedCall(6000, () => {
        if (this._done) return;
        this._signalState = 'green';
        this._updateSignalVisual();
      });
    }

    // ── Traffic signal crossing ───────────────────────────────────────────────
    if (!this._signalChecked && this._distance >= CFG.STOP_LINE_DIST) {
      this._signalChecked = true;
      if (this._signalState === 'red') this._runRedLight();
    }

    if (this._distance >= CFG.HOSPITAL_DIST && !this._holeBlocking) {
      this._reachHospital(); return;
    }

    this._updateHUD();
  }

  // ── BACKGROUND ───────────────────────────────────────────────────────────────
  _buildBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x060a10, 1).setDepth(-10);

    const cityKey = this.textures.exists('l3_bg_main') ? 'l3_bg_main'
                  : this.textures.exists('l3_bg_city') ? 'l3_bg_city'
                  : this.textures.exists('jungle_bg')  ? 'jungle_bg' : null;
    if (cityKey) {
      // Scale + anchor the image so its OWN bottom edge (street level, baked
      // into the art) lands exactly at the top of the game's road (ROAD_TOP_Y,
      // which already includes the 10% push-down), filling upward from there —
      // not the full canvas height. Filling the full height (tried previously)
      // made the image's own street-level imagery spill out BELOW the actual
      // road, reading as a second, impossible street floating under the first.
      const src   = this.textures.get(cityKey).getSourceImage();
      const srcH  = src.naturalHeight || src.height || ROAD_TOP_Y;
      const dispH = ROAD_TOP_Y;
      const scale = dispH / srcH;
      this._bgCity = this.add.tileSprite(W / 2, dispH / 2, W, dispH, cityKey).setDepth(-8);
      this._bgCity.tileScaleX = this._bgCity.tileScaleY = scale;
      if (cityKey === 'jungle_bg') this._bgCity.setTint(0x0c1428).setAlpha(0.28);
    }
    if (this.textures.exists('fog')) {
      this._fog = this.add.tileSprite(W / 2, ROAD_TOP_Y - 55, W, 100, 'fog')
        .setDepth(-5).setAlpha(0.35);
    }

    // Lightning ambience
    const fl = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(-4);
    this.time.addEvent({ delay: 6000, loop: true, callback: () => {
      if (this._done) return;
      this.tweens.add({ targets: fl, alpha: 0.05, duration: 50, yoyo: true, repeat: 1 });
      this.cameras.main.flash(80, 30, 30, 50);
    }});
  }

  // ── Road deck — real art (Level 03 bottom.png), tiled + scrolled horizontally.
  // Starts exactly where _buildBackground's image ends (ROAD_TOP_Y) so the two
  // touch with no gap, and runs all the way down to the bottom of the screen.
  // Extending the same road art (which already has a curb edge baked in) reads
  // as "the road continues toward the viewer," instead of a flat filler colour
  // or the background's own street level impossibly re-appearing under it.
  // Car / obstacles / hazards are all anchored to this same ROAD_TOP_Y (see
  // DRIVE_Y, CAR_Y, CFG.ROAD_TOP_Y), so they move together with the road —
  // nothing floats above or below it.
  _buildRoad() {
    const RS    = ROAD_TOP_Y;
    const roadH = H - RS;            // road art fills all the way to the bottom

    if (this.textures.exists('l3_road_bottom')) {
      const src   = this.textures.get('l3_road_bottom').getSourceImage();
      const srcH  = src.naturalHeight || src.height || 81;
      this._roadTile = this.add.tileSprite(W / 2, RS + roadH / 2, W, roadH, 'l3_road_bottom')
        .setDepth(1).setScrollFactor(0);
      this._roadTile.tileScaleX = this._roadTile.tileScaleY = roadH / srcH;
    } else {
      // Fallback asphalt if the art fails to load
      const roadG = this.add.graphics().setDepth(1).setScrollFactor(0);
      roadG.fillStyle(0x28293a, 1);
      roadG.fillRect(0, RS, W, roadH);
      roadG.fillStyle(0x32344a, 1);
      roadG.fillRect(0, RS + 8, W, roadH - 8);
    }
  }

  _buildCar() {
    // Yellow border is drawn at center-y = ROAD_TOP_Y + 2, height 4 px
    // Road surface = bottom of yellow border = ROAD_TOP_Y + 4
    const ROAD_SURFACE_Y = ROAD_TOP_Y + 4;
    // Car PNG has 17 px of transparent space below the tire bottoms (measured: lowest opaque row
    // is at 277/351 of image height → 17 px in 82 px display).
    // carY = ROAD_SURFACE_Y + 17 + 5 puts tires 5 px into the road (naturally grounded).
    const carY = ROAD_SURFACE_Y + 65;
    console.log("ROAD_SURFACE_Y =", ROAD_SURFACE_Y, "carY =", carY);

    this._carGroundY = carY;
    this._carShadow  = this.add.ellipse(CFG.CAR_X, carY - 14, 110, 10, 0x000000, 0.28)
      .setDepth(4);
    this._car = this.add.image(CFG.CAR_X, carY, 'l3_car')
      .setOrigin(0.5, 1).setDisplaySize(CFG.CAR_W, CFG.CAR_H).setDepth(9);
  }

  // ── SPEED BREAKERS (dome shape) ───────────────────────────────────────────────
  _buildSpeedBreakers() {
    const RS = DRIVE_Y;   // draw at wheel-contact surface
    const BW = CFG.BUMP_W, BH = CFG.BUMP_H;
    const STRIPES = 6, STEPS = 8;

    this._bumps = CFG.BREAKERS.map(({ dist, warnDist }) => {
      // ── Vertical speed breaker — yellow/black striped bar, full road height ─
      const gfx = this.add.graphics().setDepth(7);
      const VW      = 22;                   // bar width
      const bandTop = RS - 52;              // = ROAD_TOP_Y (road band top)
      const bandBot = RS + 28;              // = ROAD_TOP_Y + 80 (road band bottom)
      const BAND    = 9;                    // stripe height

      // Soft shadow behind bar
      gfx.fillStyle(0x000000, 0.30);
      gfx.fillRect(-VW / 2 - 3, bandTop, VW + 6, bandBot - bandTop);

      // Alternating yellow / dark stripes filling road height
      for (let by = bandTop; by < bandBot; by += BAND) {
        const bh  = Math.min(BAND, bandBot - by);
        const row = Math.floor((by - bandTop) / BAND);
        gfx.fillStyle(row % 2 === 0 ? 0xffcc00 : 0x1a1a22, 1);
        gfx.fillRect(-VW / 2, by, VW, bh);
      }
      // Left-edge gloss
      gfx.fillStyle(0xffffff, 0.22);
      gfx.fillRect(-VW / 2, bandTop, 3, bandBot - bandTop);
      // Right-edge shadow
      gfx.fillStyle(0x000000, 0.25);
      gfx.fillRect(VW / 2 - 3, bandTop, 3, bandBot - bandTop);

      // ── Warning sign — sits at road TOP EDGE, no pole inside the lane ───────
      const warn = this.add.graphics().setDepth(7);
      // RS - 52 = ROAD_TOP_Y (yellow border top)

      // Small bracket that clips onto the yellow border
      warn.fillStyle(0x55566a, 1);
      warn.fillRect(-5, RS - 54, 10, 5);

      // Pole is ENTIRELY above the yellow border (in background only)
      warn.fillStyle(0xccccdd, 1);
      warn.fillRect(-2, RS - 94, 4, 42);   // top: RS-94=282, bottom: RS-52=324

      // Triangle — above the yellow border
      warn.fillStyle(0xffee00, 1);
      warn.fillTriangle(0, RS - 98, -20, RS - 70, 20, RS - 70);
      warn.lineStyle(1.5, 0x1a1a22, 1);
      warn.strokeTriangle(0, RS - 98, -20, RS - 70, 20, RS - 70);

      // Exclamation mark
      warn.fillStyle(0x1a1a22, 1);
      warn.fillRect(-2, RS - 93, 4, 14);
      warn.fillCircle(0, RS - 74, 2.5);

      const warnLbl = this.add.text(0, RS - 102, 'SLOW', {
        fontSize: '8px', fontFamily: 'Arial', color: '#ffee00',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5, 1).setDepth(8);

      gfx.x  = CFG.CAR_X + dist;
      warn.x = CFG.CAR_X + warnDist;
      warnLbl.x = CFG.CAR_X + warnDist;
      return { dist, warnDist, gfx, warn, warnLbl, triggered: false };
    });
  }

  // ── HOLES ─────────────────────────────────────────────────────────────────────
  _buildHoles() {
    const RS = DRIVE_Y;   // draw at wheel-contact surface
    const HW = CFG.HOLE_HALF;

    this._holes = CFG.HOLES.map(({ dist, warnDist }, holeIdx) => {
      // ── Hole / road gap — visible in road band ───────────────────────────────
      const rTop = RS - 52;   // ROAD_TOP_Y
      const rH   = 80;
      const gfx  = this.add.graphics().setDepth(8);

      // Dark pit covering full road band
      gfx.fillStyle(0x010308, 1);
      gfx.fillRect(-HW, rTop, HW * 2, rH);
      gfx.fillStyle(0x030610, 0.85);
      gfx.fillRect(-HW + 14, rTop + 10, HW * 2 - 28, 38);
      gfx.fillStyle(0x000002, 1);
      gfx.fillRect(-HW + 24, rTop + 46, HW * 2 - 48, 24);

      // Broken road edges (jagged)
      gfx.fillStyle(0x2c2e3c, 1);
      gfx.fillTriangle(-HW, rTop,      -HW - 12, rTop + 16, -HW + 10, rTop + 16);
      gfx.fillTriangle(-HW, rTop + 28, -HW -  9, rTop + 42, -HW +  8, rTop + 42);
      gfx.fillTriangle( HW, rTop,       HW + 12, rTop + 16,  HW - 10, rTop + 16);
      gfx.fillTriangle( HW, rTop + 28,  HW +  9, rTop + 42,  HW -  8, rTop + 42);

      // Orange/black hazard bars on each edge
      for (let yi = 0; yi < 4; yi++) {
        gfx.fillStyle(yi % 2 === 0 ? 0xff6600 : 0x111111, 0.95);
        gfx.fillRect(-HW - 8, rTop + yi * 14, 8, 12);
        gfx.fillRect( HW,     rTop + 6 + yi * 14, 8, 12);
      }
      gfx.x = CFG.CAR_X + dist;
      // Hole is VISIBLE — player can see the gap approaching

      // ── Bridge — horizontal planks covering road gap (shown after puzzle) ───
      const roadTop = RS - 52;   // = ROAD_TOP_Y
      const roadH   = 80;
      const bridgeGfx = this.add.graphics().setDepth(8).setVisible(false);
      // Road-surface layer (top)
      bridgeGfx.fillStyle(0x32344a, 1);
      bridgeGfx.fillRect(-HW, roadTop, HW * 2, roadH);
      // Wooden plank planks visible through the surface (horizontal beams)
      const plankH = 11;
      for (let pi = 0; pi < 6; pi++) {
        const py = roadTop + 4 + pi * (plankH + 3);
        bridgeGfx.fillStyle(pi % 2 === 0 ? 0x7a4818 : 0x5a3410, 1);
        bridgeGfx.fillRect(-HW + 4, py, HW * 2 - 8, plankH);
        bridgeGfx.fillStyle(0x3a2008, 0.4);
        bridgeGfx.fillRect(-HW + 4, py + plankH - 2, HW * 2 - 8, 2);
      }
      // Top deck surface tint
      bridgeGfx.fillStyle(0x28293a, 0.6);
      bridgeGfx.fillRect(-HW, roadTop, HW * 2, 5);
      // Left/right edge posts
      bridgeGfx.fillStyle(0x4a2808, 1);
      bridgeGfx.fillRect(-HW,      roadTop, 8, roadH);
      bridgeGfx.fillRect(HW - 8,   roadTop, 8, roadH);
      // Yellow top border restored over bridge
      bridgeGfx.fillStyle(0xf0c040, 1);
      bridgeGfx.fillRect(-HW, roadTop, HW * 2, 4);
      bridgeGfx.x = CFG.CAR_X + dist;

      // ── Warning sign — same placement as SLOW sign (above yellow border) ────
      const warn = this.add.graphics().setDepth(7);
      // Bracket clips onto yellow border
      warn.fillStyle(0x55566a, 1);
      warn.fillRect(-5, RS - 54, 10, 5);
      // Pole above yellow border only
      warn.fillStyle(0xccccdd, 1);
      warn.fillRect(-2, RS - 96, 4, 44);
      // Red danger circle
      warn.fillStyle(0xdd1111, 1);
      warn.fillCircle(0, RS - 110, 20);
      warn.lineStyle(2, 0xffffff, 0.8);
      warn.strokeCircle(0, RS - 110, 20);
      // White "!" inside circle
      warn.fillStyle(0xffffff, 1);
      warn.fillRect(-3, RS - 122, 6, 14);
      warn.fillCircle(0, RS - 103, 3);
      warn.x = CFG.CAR_X + warnDist;

      const warnLbl = this.add.text(0, RS - 134, '⚠️ ROAD GAP', {
        fontSize: '8px', fontFamily: 'Arial', color: '#ff8888',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5, 1).setDepth(8);
      warnLbl.x = CFG.CAR_X + warnDist;

      // First gap = plank-ordering puzzle; second gap = bolt-tightening timing game
      const puzzle = holeIdx === 0 ? 'planks' : 'bolts';
      return { dist, warnDist, gfx, bridgeGfx, warn, warnLbl, triggered: false, solved: false, puzzle };
    });
  }

  // ── BRIDGE PUZZLE ─────────────────────────────────────────────────────────────
  _showBridgePuzzle(hole) {
    this.cameras.main.shake(180, 0.01);
    const panel = [];

    panel.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
      .setDepth(60).setScrollFactor(0));

    const pg = this.add.graphics().setDepth(61).setScrollFactor(0);
    pg.fillStyle(0x2a1608, 0.97); pg.fillRoundedRect(W/2 - 230, H/2 - 145, 460, 290, 14);
    pg.lineStyle(3, 0xa0602a, 0.9); pg.strokeRoundedRect(W/2 - 230, H/2 - 145, 460, 290, 14);
    pg.fillStyle(0x5a3010, 0.6);   pg.fillRect(W/2 - 230, H/2 - 125, 460, 8);
    panel.push(pg);

    panel.push(this.add.text(W/2, H/2 - 120, '🌉 Build the Bridge!', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0));
    panel.push(this.add.text(W/2, H/2 - 92, 'Tap the planks in order  1 → 2 → 3 → 4', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0));

    const order = Phaser.Utils.Array.Shuffle([1, 2, 3, 4]);
    const PW = 72, PH = 46, startX = W / 2 - 135;
    let nextExpected = 1;

    const dots = [];
    for (let di = 0; di < 4; di++) {
      const dx = W / 2 - 52 + di * 36;
      const dot = this.add.circle(dx, H / 2 + 90, 13, 0x1a3040, 1)
        .setStrokeStyle(2, 0x44ff88, 0.7).setDepth(62).setScrollFactor(0);
      const dlbl = this.add.text(dx, H / 2 + 90, `${di + 1}`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88aacc'
      }).setOrigin(0.5).setDepth(63).setScrollFactor(0);
      dots.push({ dot, lbl: dlbl });
      panel.push(dot, dlbl);
    }

    const plankObjs = [];
    order.forEach((num, i) => {
      const px = startX + i * 95;
      const py = H / 2 - 30;

      const bg = this.add.graphics().setDepth(63).setScrollFactor(0);
      const drawPlank = (done) => {
        bg.clear();
        bg.fillStyle(done ? 0x228833 : 0x8b4513, 1);
        bg.fillRoundedRect(px - PW/2, py - PH/2, PW, PH, 5);
        if (!done) {
          bg.fillStyle(0x7a3c10, 0.6);
          bg.fillRect(px - PW/2 + 4, py - PH/2 + 8,  PW - 8, 4);
          bg.fillRect(px - PW/2 + 4, py - PH/2 + 20, PW - 8, 4);
          bg.fillRect(px - PW/2 + 4, py - PH/2 + 32, PW - 8, 4);
        }
        bg.lineStyle(2.5, done ? 0x44ff88 : 0xa06030, 0.9);
        bg.strokeRoundedRect(px - PW/2, py - PH/2, PW, PH, 5);
      };
      drawPlank(false);

      const numTxt = this.add.text(px, py, `${num}`, {
        fontSize: '24px', fontFamily: 'Georgia, serif',
        color: '#f5e0b0', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(64).setScrollFactor(0);

      const hit = this.add.rectangle(px, py, PW, PH, 0x000000, 0)
        .setDepth(65).setScrollFactor(0).setInteractive({ useHandCursor: true });

      panel.push(bg, numTxt, hit);
      const obj = { num, bg, numTxt, hit, done: false, drawPlank };
      plankObjs.push(obj);

      hit.on('pointerover', () => { if (!obj.done) numTxt.setScale(1.12); });
      hit.on('pointerout',  () => { numTxt.setScale(1); });
      hit.on('pointerdown', () => {
        if (obj.done || this._done) return;
        if (num === nextExpected) {
          obj.done = true;
          nextExpected++;
          drawPlank(true);
          numTxt.setColor('#ffffff');
          this.cameras.main.flash(100, 20, 140, 40);
          dots[num - 1].dot.setFillStyle(0x44ff44, 1);
          dots[num - 1].lbl.setColor('#ffffff');

          if (nextExpected > 4) {
            const ok = this.add.text(W / 2, H / 2 + 48, '✅ Bridge Built!', {
              fontSize: '22px', fontFamily: 'Georgia, serif', color: '#88ffaa',
              stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(66).setScrollFactor(0);
            panel.push(ok);
            this.cameras.main.flash(500, 30, 180, 60);
            this.time.delayedCall(900, () => this._completeBridge(hole, panel));
          }
        } else {
          this.cameras.main.shake(160, 0.009);
          numTxt.setScale(1.22);
          this.tweens.add({ targets: numTxt, scaleX: 1, scaleY: 1, duration: 200 });
          const err = this.add.text(W / 2, H / 2 + 48, `❌ Tap plank ${nextExpected} first!`, {
            fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ff4466',
            stroke: '#000', strokeThickness: 2
          }).setOrigin(0.5).setDepth(66).setScrollFactor(0);
          panel.push(err);
          this.tweens.add({ targets: err, alpha: 0, duration: 1100, onComplete: () => {
            err.destroy();
            const idx = panel.indexOf(err); if (idx > -1) panel.splice(idx, 1);
          }});
        }
      });
    });
  }

  _completeBridge(hole, panel) {
    panel.forEach(o => { if (o && o.active) o.destroy(); });
    hole.solved      = true;
    hole.gfx.setVisible(false);
    hole.bridgeGfx.setVisible(true);
    this._holeBlocking = false;
    this._speed        = 0;

    const msg = this.add.text(W / 2, H / 2 - 30, '🌉 Bridge ready! Press ⚡ Gas to continue', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ffcc',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 400 });
    this.tweens.add({ targets: msg, alpha: 0, duration: 400, delay: 2500, onComplete: () => msg.destroy() });
  }

  // ── BOLT PUZZLE (second road gap) — timing game: tighten 4 bolts ───────────────
  _showBoltPuzzle(hole) {
    this.cameras.main.shake(180, 0.01);
    const panel = [];

    // ── Panel chrome (matches the bridge puzzle) ──────────────────────────────
    panel.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
      .setDepth(60).setScrollFactor(0));

    const pg = this.add.graphics().setDepth(61).setScrollFactor(0);
    pg.fillStyle(0x2a1608, 0.97); pg.fillRoundedRect(W/2 - 230, H/2 - 145, 460, 290, 14);
    pg.lineStyle(3, 0xa0602a, 0.9); pg.strokeRoundedRect(W/2 - 230, H/2 - 145, 460, 290, 14);
    pg.fillStyle(0x5a3010, 0.6);   pg.fillRect(W/2 - 230, H/2 - 125, 460, 8);
    panel.push(pg);

    panel.push(this.add.text(W/2, H/2 - 120, '🔧 Tighten the Bolts!', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0));
    panel.push(this.add.text(W/2, H/2 - 92, 'Tap when the wrench hits the GREEN zone!', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setDepth(62).setScrollFactor(0));

    // ── Bolt progress icons ───────────────────────────────────────────────────
    const TOTAL = 4;
    let tightened = 0;
    const boltDots = [];
    for (let i = 0; i < TOTAL; i++) {
      const dx = W / 2 - 54 + i * 36;
      const dy = H / 2 + 100;
      const dot = this.add.circle(dx, dy, 14, 0x3a2c1a, 1)
        .setStrokeStyle(2.5, 0x88684a, 0.9).setDepth(62).setScrollFactor(0);
      const lbl = this.add.text(dx, dy, '🔩', { fontSize: '14px' })
        .setOrigin(0.5).setDepth(63).setScrollFactor(0);
      boltDots.push({ dot, lbl });
      panel.push(dot, lbl);
    }

    // ── Torque meter ──────────────────────────────────────────────────────────
    const trackY = H / 2 - 20;
    const trackL = W / 2 - 180, trackR = W / 2 + 180, trackW = trackR - trackL;
    const trackH = 30;

    const trackG  = this.add.graphics().setDepth(62).setScrollFactor(0);
    const markerG = this.add.graphics().setDepth(64).setScrollFactor(0);
    panel.push(trackG, markerG);

    let greenHalf   = 48;
    let greenCenter = W / 2;
    let markerX     = trackL + 4;
    let markerDir   = 1;
    let markerSpeed = 3.0;
    let locked      = false;

    const randomizeZone = () => {
      greenCenter = Phaser.Math.Between(trackL + greenHalf + 10, trackR - greenHalf - 10);
    };
    randomizeZone();

    const drawTrack = () => {
      trackG.clear();
      trackG.fillStyle(0x14100a, 1);
      trackG.fillRoundedRect(trackL, trackY - trackH/2, trackW, trackH, 6);
      trackG.lineStyle(2, 0x6a4a24, 0.8);
      trackG.strokeRoundedRect(trackL, trackY - trackH/2, trackW, trackH, 6);
      // green target zone
      trackG.fillStyle(0x1e6a20, 0.85);
      trackG.fillRect(greenCenter - greenHalf, trackY - trackH/2 + 3, greenHalf * 2, trackH - 6);
      trackG.lineStyle(1.5, 0x66ff88, 0.85);
      trackG.strokeRect(greenCenter - greenHalf, trackY - trackH/2 + 3, greenHalf * 2, trackH - 6);
      // bright centre sweet-spot line
      trackG.fillStyle(0x9bffb0, 0.9);
      trackG.fillRect(greenCenter - 2, trackY - trackH/2 + 3, 4, trackH - 6);
    };
    drawTrack();

    const drawMarker = () => {
      markerG.clear();
      // wrench-head tab on top
      markerG.fillStyle(0xffcc33, 1);
      markerG.fillTriangle(markerX - 8, trackY - trackH/2 - 6, markerX + 8, trackY - trackH/2 - 6, markerX, trackY - trackH/2 + 2);
      // vertical needle
      markerG.fillStyle(0xffcc33, 1);
      markerG.fillRect(markerX - 3, trackY - trackH/2 - 2, 6, trackH + 4);
      markerG.fillStyle(0xffffff, 0.65);
      markerG.fillRect(markerX - 1, trackY - trackH/2 - 2, 2, trackH + 4);
    };
    drawMarker();

    const msg = this.add.text(W/2, H/2 + 22, 'Tap to tighten bolt 1 of 4', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#e8d0a8', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(66).setScrollFactor(0);
    panel.push(msg);

    const flashMsg = (t, color, keep = false) => {
      this.tweens.killTweensOf(msg);
      msg.setText(t).setColor(color).setAlpha(1);
      if (!keep) this.tweens.add({ targets: msg, alpha: 0.55, delay: 1000, duration: 400 });
    };

    // ── Marker ticker ─────────────────────────────────────────────────────────
    const meterTimer = this.time.addEvent({
      delay: 16, loop: true, callback: () => {
        if (locked || this._done) return;
        markerX += markerDir * markerSpeed;
        if (markerX >= trackR - 4) { markerX = trackR - 4; markerDir = -1; }
        if (markerX <= trackL + 4) { markerX = trackL + 4; markerDir =  1; }
        drawMarker();
      }
    });

    let spaceKey = null;
    const finish = () => {
      locked = true;
      meterTimer.remove();
      if (spaceKey) { spaceKey.removeAllListeners(); this.input.keyboard.removeKey(spaceKey); }
      this.time.delayedCall(900, () => this._completeBridge(hole, panel));
    };

    const onTap = () => {
      if (locked || this._done) return;
      const off = Math.abs(markerX - greenCenter);
      if (off <= greenHalf) {
        // ✅ Hit
        const slot = boltDots[tightened];
        slot.dot.setFillStyle(0x1e7a2a, 1).setStrokeStyle(2.5, 0x55ff77, 1);
        slot.lbl.setText('✅');
        tightened++;
        this.cameras.main.flash(110, 20, 140, 40);
        // sparkles at the marker
        for (let s = 0; s < 6; s++) {
          const sp = this.add.circle(markerX + (Math.random() - 0.5) * 30, trackY,
            2 + Math.random() * 3, [0xffee44, 0xaaff44, 0x44ddff][s % 3])
            .setDepth(67).setScrollFactor(0);
          panel.push(sp);
          this.tweens.add({ targets: sp, y: sp.y - 22, alpha: 0, duration: 460,
            onComplete: () => { try { sp.destroy(); } catch (_) {} } });
        }

        if (tightened >= TOTAL) {
          flashMsg('✅ Bridge Secured!', '#88ffaa', true);
          this.cameras.main.flash(500, 30, 180, 60);
          finish();
        } else {
          flashMsg(off < greenHalf * 0.4 ? '🎯 Perfect!' : '👍 Tight!', '#88ffaa');
          // next bolt is a little harder
          greenHalf   = Math.max(30, greenHalf - 5);
          markerSpeed = Math.min(6.0, markerSpeed + 0.55);
          randomizeZone();
          drawTrack();
          this.time.delayedCall(650, () => {
            if (!locked && !this._done) msg.setText(`Tap to tighten bolt ${tightened + 1} of 4`).setColor('#e8d0a8').setAlpha(1);
          });
        }
      } else {
        // ❌ Miss
        this.cameras.main.shake(140, 0.008);
        flashMsg('❌ Missed! Try again', '#ff6677');
      }
    };

    // ── Input: SPACE, click on meter, and a visible TAP button ────────────────
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', onTap);

    const meterHit = this.add.rectangle(W/2, trackY, trackW + 40, 80, 0x000000, 0)
      .setDepth(65).setScrollFactor(0).setInteractive({ useHandCursor: true });
    panel.push(meterHit);
    meterHit.on('pointerdown', onTap);

    const btnG = this.add.graphics().setDepth(63).setScrollFactor(0);
    const drawBtn = (h) => {
      btnG.clear();
      btnG.fillStyle(h ? 0x3a7a18 : 0x2a5a10, 0.95);
      btnG.fillRoundedRect(W/2 - 64, H/2 + 46, 128, 30, 8);
      btnG.lineStyle(2, h ? 0x88ff44 : 0x4a9a20, 1);
      btnG.strokeRoundedRect(W/2 - 64, H/2 + 46, 128, 30, 8);
    };
    drawBtn(false);
    const btnTxt = this.add.text(W/2, H/2 + 61, '🔧  TIGHTEN', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#88ff66'
    }).setOrigin(0.5).setDepth(64).setScrollFactor(0);
    const btnHit = this.add.rectangle(W/2, H/2 + 61, 128, 30, 0x000000, 0)
      .setDepth(65).setScrollFactor(0).setInteractive({ useHandCursor: true });
    panel.push(btnG, btnTxt, btnHit);
    btnHit.on('pointerover', () => { drawBtn(true);  btnTxt.setColor('#ffffff'); });
    btnHit.on('pointerout',  () => { drawBtn(false); btnTxt.setColor('#88ff66'); });
    btnHit.on('pointerdown', onTap);
  }

  // ── TRAFFIC SIGNAL ────────────────────────────────────────────────────────────
  _buildTrafficSignal() {
    const RS  = DRIVE_Y;   // draw at wheel-contact surface
    const sx0 = CFG.CAR_X + CFG.SIGNAL_DIST;
    this._signalGroup = [];

    const roadTop = RS - 52;   // = ROAD_TOP_Y
    const roadH   = 80;

    const pole = this.add.graphics().setDepth(8);
    // Visible pole: from box bottom (RS-82) down to yellow border (RS-52) = 30 px gap
    pole.fillStyle(0x707080, 1);
    pole.fillRect(-3, RS - 172, 6, 120);   // full pole: box top (RS-172) → yellow border (RS-52)
    // Bracket at yellow border
    pole.fillStyle(0x55566a, 1);
    pole.fillRect(-8, RS - 55, 16, 6);

    // Signal box raised so 30 px of pole is visible below it
    // Box: RS-172 to RS-86  (height 86, bottom 34px above yellow border)
    pole.fillStyle(0x111118, 1);
    pole.fillRoundedRect(-24, RS - 172, 48, 90, 8);
    pole.lineStyle(2.5, 0x444456, 1);
    pole.strokeRoundedRect(-24, RS - 172, 48, 90, 8);
    // Three light slots
    pole.fillStyle(0x060610, 1);
    pole.fillRoundedRect(-18, RS - 168, 36, 25, 4);
    pole.fillRoundedRect(-18, RS - 138, 36, 25, 4);
    pole.fillRoundedRect(-18, RS - 108, 36, 25, 4);

    pole.x = sx0;
    this._signalGroup.push(pole);

    // Lights centred in each slot
    const mkC = (yOff, col, a) => {
      const c = this.add.circle(sx0, RS + yOff, 12, col, a).setDepth(9);
      this._signalGroup.push(c); return c;
    };
    this._lightRed    = mkC(-156, 0xff2200, 1.0);
    this._lightYellow = mkC(-126, 0xffaa00, 0.2);
    this._lightGreen  = mkC( -96, 0x004400, 0.25);

    this._signalGlow = this.add.graphics().setDepth(8);
    this._signalGroup.push(this._signalGlow);

    // ── Zebra crossing at STOP_LINE_DIST ──────────────────────────────────────
    const zebraGfx = this.add.graphics().setDepth(4);
    const ZW = 10, ZN = 8;
    for (let zi = 0; zi < ZN; zi++) {
      zebraGfx.fillStyle(zi % 2 === 0 ? 0xffffff : 0x111122,
                         zi % 2 === 0 ? 0.70 : 0.45);
      zebraGfx.fillRect(-(ZN / 2) * ZW + zi * ZW, roadTop, ZW, roadH);
    }
    zebraGfx.x = CFG.CAR_X + CFG.STOP_LINE_DIST;
    this._zebraGfx = zebraGfx;

    // STOP text above zebra crossing at yellow border
    this._stopRoadTxt = this.add.text(CFG.CAR_X + CFG.STOP_LINE_DIST, roadTop - 4, 'STOP', {
      fontSize: '9px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#000', strokeThickness: 2, alpha: 0.85
    }).setOrigin(0.5, 1).setDepth(7);

    // Reuse stopLineGfx slot (no separate line needed with zebra crossing)
    this._stopLineGfx = zebraGfx;

    this._updateSignalVisual();
  }

  _switchSignal() {
    if (this._done || this._signalForced) return;   // stop toggling once forced red for the approach
    this._signalState = this._signalState === 'red' ? 'green' : 'red';
    this._updateSignalVisual();
    this.time.delayedCall(
      this._signalState === 'red' ? CFG.RED_DUR : CFG.GREEN_DUR,
      () => this._switchSignal()
    );
  }

  _updateSignalVisual() {
    if (!this._lightRed) return;
    const RS  = DRIVE_Y;
    const red = this._signalState === 'red';
    this._lightRed.setFillStyle(   red  ? 0xff2200 : 0x440000, red  ? 1.0 : 0.18);
    this._lightGreen.setFillStyle(!red  ? 0x00cc44 : 0x004400, !red ? 1.0 : 0.18);
    this._lightYellow.setFillStyle(0xffaa00, 0.2);
    this._signalGlow.clear();
    if (red) {
      this._signalGlow.fillStyle(0xff2200, 0.22);
      this._signalGlow.fillCircle(0, RS - 156, 20);
    } else {
      this._signalGlow.fillStyle(0x00cc44, 0.22);
      this._signalGlow.fillCircle(0, RS - 96, 20);
      this._playSound('signal_beep');
    }
    this.tweens.add({ targets: this._signalGlow, alpha: 0.5, duration: 340, yoyo: true, repeat: 2 });
  }

  // ── HOSPITAL MARKER ───────────────────────────────────────────────────────────
  _buildHospitalMarker() {
    const RS      = DRIVE_Y;
    const roadTop = RS - 52;   // ROAD_TOP_Y
    const roadH   = 80;
    const hx      = CFG.CAR_X + CFG.HOSPITAL_SPRITE;

    // ── Hospital sign — pole above yellow border only (same as warning signs) ─
    const g = this.add.graphics().setDepth(8);
    // Visible pole: box bottom (RS-56) to yellow border (RS-52) — 84 px above
    g.fillStyle(0xddddee, 1);
    g.fillRect(-3, RS - 140, 6, 88);     // top=RS-140, bottom=RS-52 (yellow border)
    // Bracket at yellow border
    g.fillStyle(0x55566a, 1);
    g.fillRect(-8, RS - 55, 16, 6);
    // Green sign box entirely above yellow border
    g.fillStyle(0x0a5c1a, 1);
    g.fillRoundedRect(-42, RS - 142, 84, 84, 8);
    g.lineStyle(3, 0x44dd44, 1);
    g.strokeRoundedRect(-42, RS - 142, 84, 84, 8);
    // White cross
    g.fillStyle(0xffffff, 1);
    g.fillRect(-10, RS - 132, 20, 64);   // vertical
    g.fillRect(-32, RS - 108, 64, 20);   // horizontal
    g.x = hx;
    this._hospGfx = g;

    this._hospTxt = this.add.text(hx, RS - 148, '🏥 HOSPITAL', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#88ffaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 1).setDepth(9);

    // ── FINISH LINE painted on the road (driving ends here → hospital starts) ──
    // Depth 3 = on the road surface, BEHIND the car (depth 9) so the car is never
    // hidden — it simply drives onto the line.
    const endG = this.add.graphics().setDepth(3);
    const CW = 12, COLS = 2, ROWS = Math.ceil(roadH / 10);
    for (let ci = 0; ci < COLS; ci++) {
      for (let bi = 0; bi < ROWS; bi++) {
        endG.fillStyle((ci + bi) % 2 === 0 ? 0x111118 : 0xffffff, 1);
        endG.fillRect(-CW + ci * CW, roadTop + bi * 10, CW, 10);
      }
    }
    endG.x = CFG.CAR_X + CFG.HOSPITAL_DIST;
    this._roadEndGfx = endG;
    // Floating FINISH banner above the road (clear of the car)
    this._roadEndTxt = this.add.text(
      CFG.CAR_X + CFG.HOSPITAL_DIST, roadTop - 58, '🏁 FINISH',
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#000', strokeThickness: 3 }
    ).setOrigin(0.5, 1).setDepth(10);
  }

  // ── FIX 4: RAIN (full-canvas Graphics lines from top) ─────────────────────────
  _buildRain() {
    // Graphics object drawn in front of background, behind UI
    this._rainGfx = this.add.graphics().setDepth(14).setScrollFactor(0);

    // FIX 4: 200 particles, all starting spread across full canvas
    for (let i = 0; i < 200; i++) {
      this._rainDrops.push({
        x:      Math.random() * W,
        y:      Math.random() * H,       // distributed initially so screen fills immediately
        speed:  8 + Math.random() * 6,   // 8–14 px per frame
        len:    10 + Math.random() * 10, // 10–20 px
        alpha:  0.22 + Math.random() * 0.18,
      });
    }
  }

  _updateRain(delta) {
    const FF   = delta / (1000 / 60);
    const SIN  = Math.sin(0.30);   // ≈ 0.296 — 17° rightward tilt
    const COS  = Math.cos(0.30);   // ≈ 0.955

    this._rainGfx.clear();
    // Single batched path per alpha group would be ideal; we use two groups
    this._rainGfx.lineStyle(1, 0xb4c8ff, 0.35);
    this._rainGfx.beginPath();
    for (const d of this._rainDrops) {
      d.x += d.speed * SIN * FF;
      d.y += d.speed * COS * FF;
      // FIX 4: reset ABOVE canvas top — never to a ground-level Y
      if (d.y > H) {
        d.y = Math.random() * -50;    // spawn above screen
        d.x = Math.random() * W;
      }
      this._rainGfx.moveTo(d.x, d.y);
      this._rainGfx.lineTo(d.x + d.len * SIN, d.y + d.len * COS);
    }
    this._rainGfx.strokePath();
  }

  // ── HUD — unified Level-2 header (health · banner · timer · coin · menu) ──────
  _buildHUD() {
    this._hdr = buildStandardHeader(this, {
      chapterLabel: 'CHAPTER 3', title: 'Drive to the Hospital',
      timer: 90, coinValue: this._coins,
      lives: this._lives, hp: this._hp,
      onMenu: () => this._togglePause(), depth: 48,
    });
    this._hearts   = this._hdr.hearts;
    this._hpBars   = this._hdr.hpBars;
    this._coinTxt  = this._hdr.coinTxt;
    this._timerTxt = this._hdr.timerTxt;
    this._hdr.setLives(this._lives);
    this._hdr.setHP(this._hp);

    this._timerFull = 90; this._timeLeft = 90;
    this._timerEvt = this.time.addEvent({ delay: 1000, loop: true, callback: () => this._tickHudTimer() });

    // Trip readout (distance + speed) — the checkpoint-module slot, just below the banner
    const ry = this._hdr.bottom + 8, rw = 300, rx = W / 2 - rw / 2, rh = 30;
    const rg = this.add.graphics().setScrollFactor(0).setDepth(48);
    rg.fillStyle(0x0a0f1a, 0.75); rg.fillRoundedRect(rx, ry, rw, rh, 8);
    rg.lineStyle(1, THEME.GOLD_DK, 0.6); rg.strokeRoundedRect(rx, ry, rw, rh, 8);
    this.add.text(rx + 16, ry + rh / 2, '🏥', { fontSize: '13px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(49);
    this._distTxt = this.add.text(rx + 40, ry + rh / 2, '16.2 km', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.goldTxt, stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(49);
    this.add.text(rx + rw - 66, ry + rh / 2, '🚗', { fontSize: '13px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(49);
    this._speedTxt = this.add.text(rx + rw - 16, ry + rh / 2, '0.0', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(49);

    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this._togglePause());
  }

  // Countdown tick — at 0, lose a full life and refill (matches every other runner)
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
      this._loseLifeFull();
    }
  }

  // ── HEALTH MODEL — 3 lives × 3 HP pips (same model as every other level).
  // `_health` is kept in sync as a 0-100 percentage for backward compatibility
  // with the hospital mini-games (L3_MG1-6), which read `l3_health` as a %.
  _healthPct() {
    return Math.max(0, Math.round(((this._lives - 1) * 3 + this._hp) / 9 * 100));
  }

  _loseHP(n = 1) {
    this._hp = Math.max(0, this._hp - n);
    this._hdr?.setHP(this._hp);
    this._health = this._healthPct();
    if (this._hp <= 0) this._loseLifeFull();
  }

  _loseLifeFull() {
    this._lives = Math.max(0, this._lives - 1);
    this._hdr?.setLives(this._lives);
    if (this._lives <= 0) {
      this._hp = 0; this._hdr?.setHP(0);
      this._health = 0;
      this._gameOver("Gamma didn't make it...\nDrive slower next time!");
      return;
    }
    this._hp = 3;
    this._hdr?.setHP(3);
    this._health = this._healthPct();
  }

  // Finalized wood/gold Game-Menu modal (approved via Theme Design)
  _togglePause() {
    if (this._done) return;
    if (this._paused) {
      this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._pauseObjs = null; this._paused = false; this.tweens.resumeAll();
      return;
    }
    this._paused = true; this.tweens.pauseAll();
    this._pauseObjs = openGameMenuModal(this, {
      onResume:  () => this._togglePause(),
      onRestart: () => { this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} }); this._paused = false; this.tweens.resumeAll(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); },
      onExit:    () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => this.scene.start('Menu')); },
    });
  }

  // ── PROGRESS BAR ──────────────────────────────────────────────────────────────
  _buildProgressBar() {
    const L = 90, BW = W - 180, TY = H - 10;
    this.add.rectangle(W / 2, TY, BW + 4, 12, 0x120904, 1).setScrollFactor(0).setDepth(30);
    this.add.rectangle(L + BW / 2, TY, BW, 4, 0x3a2810, 1).setScrollFactor(0).setDepth(31);
    this._zpFill = this.add.rectangle(L, TY, 2, 4, 0x44cc44, 1)
      .setScrollFactor(0).setDepth(32).setOrigin(0, 0.5);

    const sg = this.add.graphics().setScrollFactor(0).setDepth(33);
    sg.fillStyle(0x44cc44, 1); sg.fillRect(L - 1, TY - 16, 2, 14);
    this.add.text(L, TY - 24, 'START', { fontSize: '7px', fontFamily: 'Georgia, serif', color: '#e8d0a8' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(34);

    CFG.BREAKERS.forEach(({ dist }) => {
      const bx = L + (dist / CFG.TOTAL_DIST) * BW;
      const bm = this.add.graphics().setScrollFactor(0).setDepth(33);
      bm.fillStyle(0xff8800, 1); bm.fillTriangle(bx - 4, TY - 4, bx + 4, TY - 4, bx, TY - 14);
    });
    CFG.HOLES.forEach(({ dist }) => {
      const bx = L + (dist / CFG.TOTAL_DIST) * BW;
      const hm = this.add.graphics().setScrollFactor(0).setDepth(33);
      hm.fillStyle(0xff3300, 1); hm.fillRect(bx - 2, TY - 18, 4, 14);
      this.add.text(bx, TY - 26, '🕳', { fontSize: '8px' }).setOrigin(0.5).setScrollFactor(0).setDepth(34);
    });

    const sigBx = L + (CFG.SIGNAL_DIST / CFG.TOTAL_DIST) * BW;
    const sm = this.add.graphics().setScrollFactor(0).setDepth(33);
    sm.fillStyle(0xffcc00, 1); sm.fillRect(sigBx - 1, TY - 18, 2, 14);
    this.add.text(sigBx, TY - 26, '🚦', { fontSize: '8px' }).setOrigin(0.5).setScrollFactor(0).setDepth(34);

    const hBx = L + BW;
    const hm2 = this.add.graphics().setScrollFactor(0).setDepth(33);
    hm2.fillStyle(0xff88ff, 1); hm2.fillRect(hBx - 1, TY - 18, 2, 14);
    this.add.text(hBx, TY - 26, '🏥', { fontSize: '8px' }).setOrigin(0.5).setScrollFactor(0).setDepth(34);

    this._zpRunner = this.add.text(L, TY - 7, '🚗', { fontSize: '11px' })
      .setScrollFactor(0).setDepth(34).setOrigin(0.5, 1);
    this._zpLeft = L; this._zpWidth = BW;
  }

  _updateHUD() {
    if (!this._zpFill) return;
    const pct = Math.min(this._distance / CFG.TOTAL_DIST, 1);
    this._zpFill.width = Math.max(2, pct * this._zpWidth);
    this._zpRunner.x   = this._zpLeft + pct * this._zpWidth;
    if (this._distTxt)  this._distTxt.setText(`${((CFG.TOTAL_DIST - this._distance) / 1000).toFixed(1)} km`);
    if (this._speedTxt) this._speedTxt.setText(this._speed.toFixed(1));
  }

  // ── BUMP EVENTS ───────────────────────────────────────────────────────────────
  _hitBumpFast(bump) {
    this._loseHP(1);
    this._playSound('bump_fast');
    this.cameras.main.shake(260, 0.014);
    this.cameras.main.flash(300, 140, 0, 0);
    this.tweens.add({ targets: this._car, y: this._carGroundY - 10, duration: 160, ease: 'Sine.easeIn', yoyo: true });

    const dmg = this.add.text(W / 2, H / 2 - 50, `-1 ❤`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ff3355', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: dmg, y: dmg.y - 36, alpha: 0, duration: 1500, onComplete: () => dmg.destroy() });
  }

  _hitBumpSlow(bump) {
    this._playSound('bump_slow');
    this.tweens.add({ targets: this._car, y: this._carGroundY - 5, duration: 180, ease: 'Sine.easeIn', yoyo: true });
    const ok = this.add.text(W / 2, H / 2 - 50, '✅ Good braking!', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(45).setScrollFactor(0);
    this.tweens.add({ targets: ok, y: ok.y - 26, alpha: 0, duration: 800, onComplete: () => ok.destroy() });
  }

  // ── RED LIGHT — instant total fail (same severity as before) ─────────────────
  _runRedLight() {
    if (this._done) return;
    this.cameras.main.flash(600, 255, 0, 0);
    this.cameras.main.shake(400, 0.018);
    const border = this.add.graphics().setDepth(55).setScrollFactor(0);
    border.lineStyle(10, 0xff0000, 0.92); border.strokeRect(5, 5, W - 10, H - 10);
    this.tweens.add({ targets: border, alpha: 0.14, duration: 150, yoyo: true, repeat: 8, onComplete: () => border.destroy() });
    this._lives = 0; this._hp = 0;
    this._hdr?.setLives(0); this._hdr?.setHP(0);
    this._health = 0;
    this._gameOver('🚦 You ran a red light!\n"Gamma didn\'t survive…"', true);
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────────
  // The "exception" case — reached by running a red light, losing all HP/lives,
  // or the timer expiring (all funnel through here). Plays the exception
  // cinematic, then restarts the drive.
  _gameOver(message, skipFlash = false) {
    if (this._done) return;
    this._done  = true;
    this._speed = 0;
    this._timerEvt?.remove();
    this._playSound('gameover_sting');
    if (!skipFlash) this.cameras.main.flash(400, 140, 0, 0);

    // Story beat first, then the exception cinematic, then restart the drive.
    showStoryCard(this, '💔  Gamma didn\'t survive.\nShe couldn\'t reach the hospital in time…', () => {
      playVideoOverlay(this, 'l3_exception_video', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('L3_Drive'));
      });
    });
  }

  // ── PHASE COMPLETE ────────────────────────────────────────────────────────────
  // Reached the hospital — save the run state the hospital mini-games read, then
  // play the "reaching hospital" cinematic and move on to the treatment (L3_MG1).
  _reachHospital() {
    if (this._done) return;
    this._done  = true;
    this._speed = 0;
    this._timerEvt?.remove();
    this.registry.set('l3_health',      this._health);
    this.registry.set('l3_coins',       this._coins);
    this.registry.set('l3_safe_driver', this._health === 100);

    playVideoOverlay(this, 'l3_reaching_video', () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(850, () => this.scene.start('L3_MG1'));
    });
  }

  // ── UTILITY ───────────────────────────────────────────────────────────────────
  _playSound(key) {
    try { if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.6 }); }
    catch (e) {}
  }
}

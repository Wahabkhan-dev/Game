import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generatePremiumHudTextures, buildStandardHeader, buildCheckpointBoard, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { preloadGlendaSkin, applyGlendaSkin } from './L6_GlendaSkin.js';
import { launchRandomMiniGame, resetGameHistory } from '../../../utils/MiniGamePicker.js';
import { showTryAgainModal } from '../../../utils/EndModals.js';
import { playVideoOverlay } from '../../../utils/VideoOverlay.js';

// ── Level 6 · Part 1 — Puppy Garden Runner ────────────────────────────────
// Player runs through a garden collecting 7 puppy name tokens.
// 4 mini-activities trigger after collecting Bella, Milo, Daisy, Luna.
// After all 7 names: transition to L6_NamingCeremony.

const WORLD_W   = 13000;
const GROUND_Y  = 408;
// Same H (450) is shared game-wide, so this is the EXACT same seam line/percentage
// Level 2 uses (see L2_Scenery.js's GROUND_TOP) — background ends here, ground art
// starts here, no gap and no overlap between the two images.
const GROUND_TOP = 404;
const RUN_SPEED = 200; // matches Level 2's BaseLevelScene.updateMovement() speed
const JUMP_V    = -430; // matches Level 2's BaseLevelScene.updateMovement() jump velocity
// Obstacles sit flush on the stone path section of the surface image.
// OBS_BASE_DROP shifts obstacle bases below GROUND_Y to match visual character feet.
const OBS_BASE_DROP = 28;   // nudged down a bit further so obstacles read as properly grounded

const TOKENS = [
  { name: 'Tahoe',    x: 900,   mini: null },
  { name: 'Mammoth',  x: 2300,  mini: 1    },
  { name: 'Little Bear', x: 3900, mini: null },
  { name: 'Everest',  x: 5400,  mini: 2    },
  { name: 'Whistler', x: 7200,  mini: 3    },
  { name: 'Aspen',    x: 9100,  mini: 4    },
  { name: 'Big Bear', x: 11000, mini: null },
];

// Every obstacle is cleared by JUMPING. Types:
//  • default        — terracotta pot / wooden crate (jump over)
//  • flat: true     — puddle on the ground (jump over)
//  • rolling: true  — rolling ball that moves toward the player (jump over)
//  • theme: '…'     — themed garden hurdle: fallen log (branch), bunting
//                     (banner), wooden sign (sign), flower hedge (flower).
const OBSTACLES = [
  { x: 700,   w: 44, h: 52 },
  { x: 1300,  w: 60, h: 50, theme: 'branch' },
  { x: 1700,  w: 46, h: 54 },
  { x: 2100,  w: 88, h: 18, flat: true },
  { x: 2900,  w: 60, h: 52, theme: 'banner' },
  { x: 3300,  w: 44, h: 52 },
  { x: 4500,  w: 46, h: 54 },
  { x: 4900,  w: 58, h: 54, theme: 'sign' },
  { x: 5300,  w: 88, h: 18, flat: true },
  { x: 6000,  w: 44, h: 44, rolling: true },
  { x: 6600,  w: 46, h: 54 },
  { x: 7000,  w: 60, h: 50, theme: 'flower' },
  { x: 7400,  w: 88, h: 18, flat: true },
  { x: 8300,  w: 44, h: 52 },
  { x: 8800,  w: 60, h: 50, theme: 'branch' },
  { x: 9200,  w: 44, h: 44, rolling: true },
  { x: 9900,  w: 46, h: 54 },
  { x: 10400, w: 60, h: 52, theme: 'banner' },
  { x: 10800, w: 88, h: 18, flat: true },
  { x: 11500, w: 44, h: 52 },
  { x: 12000, w: 58, h: 54, theme: 'sign' },
  { x: 12500, w: 46, h: 54 },
  { x: 12800, w: 88, h: 18, flat: true },
];

export class Level6Scene extends Phaser.Scene {
  constructor() { super('Level6'); }

  preload() {
    preloadGlendaSkin(this);
    ['gleeda_idle', 'gleeda_run1', 'gleeda_jump'].forEach(k => {
      if (!this.textures.exists(k))
        this.load.image(k, `assets/images/Level%204/${k}.png`);
    });
    if (!this.textures.exists('l6_bg'))
      this.load.image('l6_bg', 'assets/images/level 6/level-06-bg.jpg');
    if (!this.textures.exists('l6_surface'))
      this.load.image('l6_surface', 'assets/images/level 6/level-06-bottom.jpg');
    // Obstacle artwork (pit.png no longer used — pits are now drawn procedurally,
    // Level-2 style, in _buildGround()).
    const obsKeys = ['pot', 'crate', 'ball', 'branch', 'banner', 'sign', 'flower_hedge'];
    obsKeys.forEach(k => {
      if (!this.textures.exists(`l6_${k}`))
        this.load.image(`l6_${k}`, `assets/images/level%206/${k}.png`);
    });
  }

  create(data) {
    // Fresh playthrough (including a restart after game over) — clear which
    // mini-games have already been shown so this level's trigger points
    // can't repeat one.
    resetGameHistory(6);

    this._collected  = [];
    this._lives      = 3;
    this._hp         = 3;
    this._damageCD   = false;
    this._done       = false;
    this._paused     = false;
    this._miniActive = false;
    this._returning  = false;
    this._score      = 0;
    this._rollers       = [];
    this._pits          = [];         // pit graphics for flash effect
    this._fallingIntoPit = false;
    this._stunUntil   = 0;
    this._lastCP     = { x: 80, score: 0 };
    this._checkpoints = [
      { x: 2300,  reached: false },
      { x: 5400,  reached: false },
      { x: 7200,  reached: false },
      { x: 9100,  reached: false },
      { x: 11000, reached: false },
    ];

    // Physics world extends 600px below the visible camera bounds — same
    // technique BaseLevelScene uses — so a pup that falls into a pit actually
    // drops out of view before _checkPits() finishes the fall, instead of
    // being stopped dead by an invisible floor at the bottom of the screen.
    this.physics.world.setBounds(0, 0, WORLD_W, H + 600);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this._buildSky();
    this._buildGround();
    this._buildProps();
    this._buildCheckpoints();
    this._buildTokens();
    this._buildObstacles();
    this._buildPlayer();
    this._buildHUD();
    this._buildProgressBar();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys('A,D,W,S,SPACE');
    this._sliding = false;

    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    const slideBtn = document.getElementById('btn-slide');
    if (slideBtn) slideBtn.style.display = '';   // show SLIDE button for this level
    this.events.once('shutdown', () => {
      const f = document.getElementById('game-footer');
      if (f) f.style.display = 'none';
      const sb = document.getElementById('btn-slide');
      if (sb) sb.style.display = 'none';
      if (window._touchState) window._touchState.slide = false;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this._fallingIntoPit = false;
      this._hearts = null;
      this._hpPips = null;
    });

    this.time.delayedCall(700, () => this._toast('🐾 Collect 7 puppy names to start the ceremony!'));

    if (!this._introVideoPlayed) {
      this._introVideoPlayed = true;
      playVideoOverlay(this, 'l6_intro_video', () => {});
    }
  }

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  _buildSky() {
    // ── Background image as parallax tileSprite ──────────────────────────
    // Sits behind everything. Scrolls at 25% of camera speed for depth.
    // Ends EXACTLY at GROUND_TOP — same seam technique as Level 2 — so the
    // ground art picks up right where the background stops, no gap/overlap.
    const bgDisplayH = GROUND_TOP;

    if (this.textures.exists('l6_bg')) {
      // Get source texture size so we can scale the tile to exactly fill bgDisplayH
      const src = this.textures.get('l6_bg').getSourceImage();
      const srcW = src.naturalWidth  || src.width  || 1400;
      const srcH = src.naturalHeight || src.height || 700;
      const tileScaleY = bgDisplayH / srcH;   // scale so one tile = full screen height
      const tileScaleX = tileScaleY;           // uniform scale (keep aspect)

      this._bgTile = this.add.tileSprite(0, 0, W, bgDisplayH, 'l6_bg')
        .setOrigin(0, 0)
        .setScrollFactor(0)    // locked to camera viewport
        .setDepth(-30);

      // Scale the tiled texture to fill the display height perfectly
      this._bgTile.setTileScale(tileScaleX, tileScaleY);
    } else {
      // Fallback gradient if image hasn't loaded
      const sg = this.add.graphics().setDepth(-30).setScrollFactor(0);
      sg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE8F8FF, 0xE8F8FF, 1);
      sg.fillRect(0, 0, W, bgDisplayH);
    }

    // Butterflies disabled to reduce tween overhead
    // [[400,300],[1100,260],[2000,290],[3600,270],[5000,310],
    //  [7000,280],[9200,265],[11500,295]].forEach(([bx, by]) => {
    //   const bt = this.add.text(bx, by, '🦋', { fontSize: '14px' }).setDepth(2);
    //   ...tweens...
    // });
  }

  _buildGround() {
    // ── Pit gaps — used for physics floor segmentation, the visual ground
    // segmentation below, the pit graphics, and the fall-through check. ──────
    const pits = OBSTACLES.filter(o => o.flat).map(o => ({
      x: o.x, hw: o.w / 2 + 36   // wide enough for the 60px player body to fall cleanly
    }));
    this._pitZones = pits;   // used in _checkPits()
    const sorted = [...pits].sort((a, b) => a.x - b.x);

    // ── Invisible physics floor — segmented with gaps at every pit ──────────
    this._floorSegs = [];
    const segments = [];   // solid-ground spans, reused for the visual ground below
    let cursor = 0;
    sorted.forEach(pit => {
      const segEnd = pit.x - pit.hw;
      if (segEnd > cursor) {
        segments.push({ start: cursor, end: segEnd });
        const w = segEnd - cursor, cx = cursor + w / 2;
        const r = this.add.rectangle(cx, GROUND_Y + 20, w, 40, 0x000000, 0).setDepth(-9);
        this.physics.add.existing(r, true);
        this._floorSegs.push(r);
      }
      cursor = pit.x + pit.hw;
    });
    const lastW = WORLD_W - cursor;
    if (lastW > 0) {
      segments.push({ start: cursor, end: WORLD_W });
      const r = this.add.rectangle(cursor + lastW / 2, GROUND_Y + 20, lastW, 40, 0x000000, 0).setDepth(-9);
      this.physics.add.existing(r, true);
      this._floorSegs.push(r);
    }
    this._ground = this._floorSegs;

    // ── Ground surface art — WORLD-SPACE tileSprites, one per solid segment
    // (same technique Level 2 uses for its ground: scrolls naturally with the
    // camera at 1:1, no manual tilePositionX bookkeeping, and actually stops
    // at each pit gap instead of a continuous strip with an image pasted over
    // the hole). ─────────────────────────────────────────────────────────────
    const surfaceY = GROUND_TOP;      // starts exactly where the background ends (no seam)
    const surfaceH = H - surfaceY;    // fills remainder of screen, same % as Level 2

    this._surfTiles = [];
    const hasSurf = this.textures.exists('l6_surface');
    let srcH = 380, tileScale = 1;
    if (hasSurf) {
      const src = this.textures.get('l6_surface').getSourceImage();
      srcH = src.naturalHeight || src.height || srcH;
      tileScale = surfaceH / srcH;
    }
    segments.forEach(seg => {
      const w = seg.end - seg.start;
      if (w <= 0) return;
      if (hasSurf) {
        const ts = this.add.tileSprite(seg.start + w / 2, surfaceY + surfaceH / 2, w, surfaceH, 'l6_surface')
          .setDepth(-8);
        ts.tileScaleX = ts.tileScaleY = tileScale;
        this._surfTiles.push(ts);
      } else {
        // Fallback: plain green strip if image not loaded
        const fg = this.add.graphics().setDepth(-8);
        fg.fillStyle(0x70B030, 1);
        fg.fillRect(seg.start, surfaceY, w, surfaceH);
      }
    });

    // ── Pit visuals — Level 2's procedural "broken ground" style (dark void +
    // jagged edges + bouncing jump-hint arrow), replacing the old pit.png image. ──
    sorted.forEach(pit => this._buildPitVisual(pit.x - pit.hw, pit.hw * 2));
  }

  // Level-2-style broken-ground pit (matches Level2Scene.js's Zone-1 potholes),
  // adapted to Level 6's ground line. gx = gap's LEFT edge, gw = gap's full width.
  _buildPitVisual(gx, gw) {
    const top = GROUND_TOP;   // where the ground surface actually sits
    const gr = this.add.graphics().setDepth(4);

    // Dark void fills the entire gap column
    gr.fillStyle(0x050302, 1);
    gr.fillRect(gx, top, gw, H - top + 20);
    // Faint dirt floor for depth illusion
    gr.fillStyle(0x2a1608, 0.55);
    gr.fillRect(gx + 4, H - 10, gw - 8, 14);

    // Left broken edge chunks
    gr.fillStyle(0x3d3d4a, 1);
    gr.fillTriangle(gx, top,      gx + 11, top,      gx,      top + 11);
    gr.fillTriangle(gx, top + 15, gx + 7,  top + 13, gx,      top + 24);
    gr.fillStyle(0x2a2a38, 1);
    gr.fillTriangle(gx, top + 9,  gx + 8,  top + 9,  gx + 3,  top + 19);
    // Right broken edge chunks
    gr.fillStyle(0x3d3d4a, 1);
    gr.fillTriangle(gx + gw, top,      gx + gw - 11, top,      gx + gw, top + 11);
    gr.fillTriangle(gx + gw, top + 15, gx + gw - 7,  top + 13, gx + gw, top + 24);
    gr.fillStyle(0x2a2a38, 1);
    gr.fillTriangle(gx + gw, top + 9,  gx + gw - 8,  top + 9,  gx + gw - 3, top + 19);

    // Crack lines radiating from the edges
    gr.lineStyle(1.5, 0x18182a, 1);
    gr.lineBetween(gx - 18, top + 2,  gx,     top + 8);
    gr.lineBetween(gx - 11, top - 3,  gx,     top + 3);
    gr.lineBetween(gx - 22, top + 9,  gx - 4, top + 7);
    gr.lineBetween(gx + gw + 16, top + 2,  gx + gw,     top + 8);
    gr.lineBetween(gx + gw +  9, top - 3,  gx + gw,     top + 3);
    gr.lineBetween(gx + gw + 20, top + 9,  gx + gw + 4, top + 7);

    // Bouncing JUMP hint above the hole
    const cx = gx + gw / 2;
    const arrow = this.add.text(cx, top - 32, '⬆', {
      fontSize: '18px', color: '#ffee44',
      stroke: '#1a1008', strokeThickness: 3
    }).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: arrow, y: top - 44, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this._pits.push({ gfx: gr, arrow, x: cx });
  }

  _buildProps() {
    // Props disabled to reduce rendering overhead.
    // Background image already includes decorative elements.
  }

  _buildTokens() {
    const TY = GROUND_Y - 58;
    this._tokenObjs = TOKENS.map(t => {
      // Static badge (no glow animation to reduce tweens)
      const badge = this.add.graphics().setDepth(9);
      badge.fillStyle(0xFFD700, 1);  badge.fillCircle(t.x, TY, 22);
      badge.lineStyle(3, 0xFF8800, 1); badge.strokeCircle(t.x, TY, 22);
      badge.fillStyle(0xFFF8E1, 1);  badge.fillCircle(t.x, TY, 13);

      const label = this.add.text(t.x, TY, t.name.substring(0, 3).toUpperCase(),
        { fontSize: '7px', fontFamily: 'Arial Black', color: '#6B3A00', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(10);

      const spark = this.add.text(t.x, TY - 36, '✨', { fontSize: '13px' }).setOrigin(0.5).setDepth(10);
      // Single gentle bob tween instead of multiple
      this.tweens.add({
        targets: [badge, label, spark],
        y: `-=8`, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      return { ...t, badge, label, spark, taken: false };
    });
  }

  _buildObstacles() {
    this._obsObjs = OBSTACLES.map((o, idx) => {
      if (o.rolling) return this._buildRollingObstacle(o);
      if (o.flat)    return null;   // pit — visuals already built once in _buildGround()
      if (o.theme)   return this._buildHurdle(o);
      return this._buildJumpObstacle(o, idx);
    }).filter(Boolean);   // remove nulls from pit entries
  }

  // ── Jump-over: terracotta pot (floral) or wooden crate, alternating ──
  _buildJumpObstacle(o, idx) {
    const obsY = GROUND_Y + OBS_BASE_DROP;
    // Ground shadow
    const shadow = this.add.graphics({ x: o.x, y: obsY }).setDepth(6);
    shadow.fillStyle(0x000000, 0.22); shadow.fillEllipse(0, 0, o.w + 16, 10);
    // Obstacle sprite — fixed size, static (animations disabled)
    const key = idx % 2 === 0 ? 'l6_pot' : 'l6_crate';
    const img = this.add.image(o.x, obsY - o.h / 2, key).setOrigin(0.5, 0.5).setDepth(7);
    img.setDisplaySize(o.w, o.h);
    return { ...o, img, clearY: GROUND_Y - o.h - 12 };
  }

  // ── Moving hazard: striped rolling ball with separate flat shadow ──
  _buildRollingObstacle(o) {
    const obsY = GROUND_Y + OBS_BASE_DROP - 20;
    // Shadow — fixed size
    const sh = this.add.graphics({ x: o.x, y: GROUND_Y + OBS_BASE_DROP }).setDepth(6);
    sh.fillStyle(0x000000, 0.22); sh.fillEllipse(0, 0, 34, 9);
    // Ball sprite — fixed size, rotation visible in movement
    const img = this.add.image(o.x, obsY, 'l6_ball').setOrigin(0.5, 0.5).setDepth(7);
    img.setDisplaySize(o.w, o.h);
    this._rollers.push({ img, shadow: sh, baseX: o.x });
    return { ...o, img };
  }

  // ── Themed garden hurdle — sits on the ground; cleared by JUMPING over ──
  _buildHurdle(o) {
    const baseY = GROUND_Y + OBS_BASE_DROP;
    const themeMap = { branch: 'l6_branch', banner: 'l6_banner', sign: 'l6_sign', flower: 'l6_flower_hedge' };
    const key = themeMap[o.theme] || 'l6_branch';
    // Ground shadow
    const shadow = this.add.graphics({ x: o.x, y: baseY }).setDepth(6);
    shadow.fillStyle(0x000000, 0.22); shadow.fillEllipse(0, 0, o.w + 16, 10);
    // Hurdle sprite — fixed size, static (animations disabled)
    const img = this.add.image(o.x, baseY - o.h / 2, key).setOrigin(0.5, 0.5).setDepth(7);
    img.setDisplaySize(o.w, o.h);
    return { ...o, img, clearY: GROUND_Y - o.h - 12 };
  }

  _buildCheckpoints() {
    this._cpFlagObjs = this._checkpoints.map(cp => {
      const g = this.add.graphics().setDepth(5);
      const px = cp.x, py = GROUND_Y;
      // Pole
      g.fillStyle(0x8B5E3C, 1);
      g.fillRect(px - 3, py - 90, 6, 90);
      // Flag body (garden-theme: green with paw print)
      g.fillStyle(0x4CAF50, 1);
      g.fillTriangle(px + 3, py - 88, px + 46, py - 74, px + 3, py - 58);
      g.fillStyle(0xFFD700, 1);
      g.fillCircle(px + 22, py - 73, 7);
      g.fillStyle(0x8B4513, 1);
      g.fillCircle(px + 22, py - 73, 4);
      // Ground base
      g.fillStyle(0x6B8E3A, 1);
      g.fillEllipse(px, py, 22, 8);
      g.setAlpha(0.7);
      this._cpFlagAnim(g, px);
      return g;
    });
  }

  _cpFlagAnim(g, px) {
    this.tweens.add({ targets: g, x: 1, duration: 800, yoyo: true, repeat: -1,
      onUpdate: () => g.setAlpha(0.65 + Math.sin(this.time.now * 0.003) * 0.15) });
  }

  _checkCheckpoints() {
    if (this._done) return;
    const px = this.player.x;
    this._checkpoints.forEach((cp, i) => {
      if (cp.reached || px < cp.x) return;
      cp.reached = true;
      this._lastCP = { x: cp.x - 60, score: this._score };
      // Flash the flag gold
      if (this._cpFlagObjs && this._cpFlagObjs[i]) {
        const fg = this._cpFlagObjs[i];
        this.tweens.add({ targets: fg, alpha: 1, duration: 200, yoyo: true, repeat: 2,
          onComplete: () => fg.setAlpha(1) });
      }
      this.cameras.main.flash(180, 100, 255, 100);
      this._toast('✅ Checkpoint reached!');
    });
  }

  _buildPlayer() {
    const tk = this.textures.exists('gleeda_idle') ? 'gleeda_idle' : '__DEFAULT';
    this.player = this.physics.add.sprite(80, GROUND_Y - 42, tk).setDepth(10).setScale(0.18);
    this.player.body.setSize(60, 50, true);
    this.player.setCollideWorldBounds(true);
    this._floorSegs.forEach(seg => this.physics.add.collider(this.player, seg));

    // Same Glenda real-art skin used by L6_EquipmentRunScene (and Levels 4/5/7/8/9) —
    // overwrites the placeholder gleeda_idle/run1/jump look with the real run cycle.
    applyGlendaSkin(this);
    // GlendaSkin resizes the sprite to a bigger scale than the 0.18 placeholder —
    // capture it so the slide/duck squash below scales relative to Glenda's real
    // size instead of the old hardcoded 0.18 (which was making her render small).
    this._normalScale = this.player.scaleX;
    this._slideScaleX = this._normalScale * (0.20 / 0.18);
    this._slideScaleY = this._normalScale * (0.11 / 0.18);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, -60);
  }

  _buildHUD() {
    // ── Unified Level-2 header (health · banner · coin · menu) ──
    generatePremiumHudTextures(this);
    this._hdr = buildStandardHeader(this, {
      chapterLabel: 'LEVEL 6', title: '🐾 Collect 7 Puppy Names!',
      timer: null, coinValue: this._score,
      lives: this._lives, hp: this._hp,
      onMenu: () => this._togglePause(), depth: 48,
    });
    this._hearts   = this._hdr.hearts;
    this._hpBars   = this._hdr.hpBars;
    this._scoreTxt = this._hdr.coinTxt;
    this._progTxt  = this._hdr.titleTxt;
    this._hdr.setLives(this._lives);
    this._hdr.setHP(this._hp);

    // Puppy-name collection board — same checkpoint-banner design as L4/5/6 runners.
    // No icon given, so each slot shows the name itself (in letters) instead of an image.
    const { itemHud } = buildCheckpointBoard(this, null, '🐾 Collect All 7 Puppy Names', TOKENS.map(t => ({
      key: t.name, label: t.name,
    })), 48, this._hdr.bottom + 6);
    this._nameHud = itemHud;
  }

  // Rounded panel with faux drop-shadow + warm gradient fill + gold border.
  _panel(g, x, y, w, h, r) {
    g.fillStyle(0x000000, 0.32);                       // shadow
    g.fillRoundedRect(x + 2, y + 3, w, h, r);
    g.fillGradientStyle(0x4a2c14, 0x4a2c14, 0x2a1709, 0x2a1709, 0.94); // warm gradient
    g.fillRoundedRect(x, y, w, h, r);
    g.lineStyle(2, 0xFFD700, 0.9);                     // gold border
    g.strokeRoundedRect(x, y, w, h, r);
    g.lineStyle(1, 0xFFF3C0, 0.25);                    // inner highlight
    g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, r - 2);
  }

  // Shared glossy heart image state — full = bright, lost = dim (same as all levels)
  _setHeart(h, full) {
    if (full) { h.clearTint(); h.setAlpha(1); }
    else      { h.setTint(0x444444); h.setAlpha(0.25); }
  }

  // Glossy heart icon for the lives display. (legacy vector version, unused)
  _drawHeart(g, cx, cy, s, full) {
    g.clear();
    const col = full ? 0xFF3D5E : 0x4a3030;
    const hi  = full ? 0xFF8FA6 : 0x5a4040;
    g.fillStyle(col, 1);
    g.fillCircle(cx - s * 0.42, cy - s * 0.28, s * 0.52);
    g.fillCircle(cx + s * 0.42, cy - s * 0.28, s * 0.52);
    g.fillTriangle(cx - s * 0.92, cy - s * 0.04, cx + s * 0.92, cy - s * 0.04, cx, cy + s * 0.95);
    g.fillStyle(hi, 0.85);                              // glossy highlight
    g.fillCircle(cx - s * 0.42, cy - s * 0.42, s * 0.22);
  }


  _drawPip(g, i, active) {
    g.clear();
    g.fillStyle(0x000000, 0.3); g.fillCircle(22 + i * 22, 45, 4.5);
    g.fillStyle(active ? 0x6BE06B : 0x3a3a3a, 1); g.fillCircle(22 + i * 22, 44, 4);
    if (active) { g.fillStyle(0xCFFFCF, 0.6); g.fillCircle(20.5 + i * 22, 42.5, 1.5); }
  }

  // ── Bottom zone-progress bar (running part only) ─────────────────────────
  // Mirrors the Level 1/2 progress UI: a track from start → 🏁 with checkpoint
  // flag markers, a green fill, and a paw runner showing how far along you are.
  _buildProgressBar() {
    const LEFT = 88, RIGHT = W - 88, BAR_W = RIGHT - LEFT;
    const TY = H - 12;
    this._pbLeft  = LEFT;
    this._pbWidth = BAR_W;

    // Track shell (dark rounded panel) + inner groove
    const shell = this.add.graphics().setScrollFactor(0).setDepth(46);
    shell.fillStyle(0x000000, 0.32); shell.fillRoundedRect(LEFT - 10, TY - 7, BAR_W + 20, 12, 6);
    shell.fillStyle(0x2a1709, 0.92); shell.fillRoundedRect(LEFT - 8, TY - 6, BAR_W + 16, 10, 5);
    shell.lineStyle(1.5, 0xFFD700, 0.7); shell.strokeRoundedRect(LEFT - 8, TY - 6, BAR_W + 16, 10, 5);

    // Green fill (grows with progress)
    this._pbFill = this.add.rectangle(LEFT, TY - 1, 2, 5, 0x6BE06B, 1)
      .setScrollFactor(0).setDepth(47).setOrigin(0, 0.5);

    // Checkpoint flag markers along the bar
    this._pbMarkers = this._checkpoints.map(cp => {
      const bx = LEFT + (cp.x / WORLD_W) * BAR_W;
      const g = this.add.graphics().setScrollFactor(0).setDepth(48);
      this._drawPbFlag(g, bx, TY, false);
      return { g, bx, cp };
    });

    // Finish flag at the end
    const fx = LEFT + BAR_W;
    const fin = this.add.graphics().setScrollFactor(0).setDepth(48);
    fin.fillStyle(0x8B5E3C, 1); fin.fillRect(fx - 1, TY - 22, 2, 18);
    fin.fillStyle(0xFFFFFF, 1); fin.fillRect(fx + 1, TY - 22, 9, 6);
    fin.fillStyle(0x222222, 1);
    fin.fillRect(fx + 1, TY - 22, 3, 3); fin.fillRect(fx + 7, TY - 22, 3, 3);
    fin.fillRect(fx + 4, TY - 19, 3, 3);

    // Paw runner that travels along the bar
    this._pbRunner = this.add.text(LEFT, TY - 8, '🐾', { fontSize: '13px' })
      .setScrollFactor(0).setDepth(49).setOrigin(0.5, 1);
  }

  // Small checkpoint flag on the progress track (green=pending, gold=reached).
  _drawPbFlag(g, bx, ty, reached) {
    g.clear();
    g.fillStyle(0x8B5E3C, 1); g.fillRect(bx - 1, ty - 20, 2, 16);
    g.fillStyle(reached ? 0xFFC926 : 0x4CAF50, 1);
    g.fillTriangle(bx + 1, ty - 20, bx + 13, ty - 16, bx + 1, ty - 11);
    if (reached) { g.fillStyle(0xFFF3C0, 0.9); g.fillCircle(bx + 5, ty - 16, 1.6); }
  }

  _updateProgressBar() {
    if (!this._pbFill) return;
    const pct = Phaser.Math.Clamp(this.player.x / WORLD_W, 0, 1);
    this._pbFill.width   = Math.max(2, pct * this._pbWidth);
    this._pbRunner.x     = this._pbLeft + pct * this._pbWidth;
    // Light up markers the player has passed
    this._pbMarkers.forEach(m => {
      if (m.cp.reached && !m._lit) {
        m._lit = true;
        this._drawPbFlag(m.g, m.bx, H - 12, true);
      }
    });
  }

  // ── MAIN LOOP ────────────────────────────────────────────────────────────
  update() {
    if (this._done || this._paused || this._miniActive || this._miniGameOpen) return;
    const ts = window._touchState || {};
    const p  = this.player;
    const onGround = p.body.blocked.down || p.body.touching.down;
    // While sinking into a pit, freeze input so the pup just drops straight
    // down under gravity (no sideways drift, no re-jump) until the fall is
    // fully shown off-screen — see _checkPits()/_fallIntoPit().
    const stunned = this.time.now < (this._stunUntil || 0) || this._fallingIntoPit;
    const left  = !stunned && (this.cursors.left.isDown  || this.keys.A.isDown || ts.left);
    const right = !stunned && (this.cursors.right.isDown || this.keys.D.isDown || ts.right);
    // Plain jump — same trigger style as Level 2's BaseLevelScene.updateMovement():
    // edge-triggered (JustDown) and only while grounded. No coyote-time, input
    // buffering, or variable jump-height — matches Level 2's feel exactly.
    const jumpPressed = !stunned && (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      (ts.jump && onGround)
    );
    const slide = !stunned && (this.cursors.down.isDown  || this.keys.S.isDown || ts.slide);

    this._checkJumpHint(p, onGround);

    // SLIDE / DUCK — only while on the ground; squashes the pup low to pass
    // under overhead obstacles (branches, banners, signs, arches).
    this._sliding = !!slide && onGround;
    if (this._sliding) {
      p.setScale(this._slideScaleX, this._slideScaleY);   // squashed low pose
    } else {
      p.setScale(this._normalScale, this._normalScale);
    }

    let vx = 0;
    if (left)  { vx = -RUN_SPEED; p.setFlipX(true);  }
    if (right) { vx =  RUN_SPEED; p.setFlipX(false); }
    p.setVelocityX(vx);

    if (jumpPressed && onGround && !this._sliding) {
      p.setVelocityY(JUMP_V);
    }
    if (ts.jump) ts.jump = false;

    if (this._sliding) p.play('gleeda_idle_anim', true);
    else if (!onGround) p.play('gleeda_jump_anim', true);
    else if (vx !== 0)  p.play('gleeda_walk', true);
    else                p.play('gleeda_idle_anim', true);

    // Scroll background (parallax 25%). Ground segments are world-space
    // tileSprites now (Level 2's technique) — they scroll with the camera
    // automatically, no manual tilePositionX bookkeeping needed.
    const camX = this.cameras.main.scrollX;
    if (this._bgTile) this._bgTile.tilePositionX = camX * 0.25;

    this._checkTokens();
    this._checkObstacles(onGround);
    this._checkRollers();
    this._checkPits();
    this._checkCheckpoints();
    this._updateProgressBar();
    this._checkEnd();
  }

  _checkTokens() {
    const p = this.player;
    const TY = GROUND_Y - 58;
    this._tokenObjs.forEach(t => {
      if (t.taken) return;
      if (Math.abs(p.x - t.x) < 46 && Math.abs(p.y - TY) < 90) {
        t.taken = true;
        this._collected.push(t.name);
        this._score += 200;
        this._scoreTxt.setText(`${this._score}`);

        const parts = [t.badge, t.label, t.spark].filter(Boolean);
        parts.forEach(o => this.tweens.killTweensOf(o));

        // Fly to HUD
        this.tweens.add({
          targets: parts,
          x: W / 2, y: 44, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 480,
          onComplete: () => parts.forEach(o => { try { o.destroy(); } catch (_) {} })
        });

        // Light up HUD slot on the checkpoint board
        const slot = this._nameHud?.[t.name];
        if (slot) {
          slot.icon.setAlpha(1);
          slot.chk.setText('✓').setColor('#66ff88').setFontSize(13);
          this.tweens.add({ targets: slot.icon, scaleX: 1.4, scaleY: 1.4, duration: 160, yoyo: true });
        }

        this._sparkle(t.x, TY);
        this._toast(`✨ "${t.name}" found! (${this._collected.length}/7)`);
        this._updateBanner();

        if (t.mini) this.time.delayedCall(700, () => this._showMini(t.mini));
        if (this._collected.length >= 7) this.time.delayedCall(900, () => this._allFound());
      }
    });
  }

  _updateBanner() {
    const n = this._collected.length;
    if (n >= 7) {
      this._progTxt.setText('🎉 All 7 Names! Run to the gate! →');
      this._progTxt.setColor('#FFD700');
    } else {
      this._progTxt.setText(`🐾 Names: ${n} / 7 — Keep going!`);
    }
  }

  // Show a one-time "JUMP!" cue as the pup nears each themed hurdle.
  _checkJumpHint(p, onGround) {
    if (this._done) return;
    for (const o of this._obsObjs) {
      if (!o.theme || o._hinted) continue;
      if (p.x > o.x - 130 && p.x < o.x - 40) {
        o._hinted = true;
        const hint = this.add.text(o.x, GROUND_Y - o.h - 30, '⬆️ JUMP!',
          { fontSize: '13px', fontFamily: 'Arial Black', color: '#FFE9A8', stroke: '#3A1800', strokeThickness: 3 })
          .setOrigin(0.5).setDepth(40);
        this.tweens.add({ targets: hint, y: hint.y - 8, alpha: 0, duration: 1100, delay: 400,
          onComplete: () => hint.destroy() });
      }
    }
  }

  _checkObstacles(onGround) {
    if (this._done) return;
    const p = this.player;
    for (const o of this._obsObjs) {
      if (o.rolling) continue;
      const hw = o.w / 2;
      // Reward a clean jump-over with a small flourish.
      if (!o._passed && Math.abs(p.x - o.x) < hw && p.body.bottom <= o.clearY + 4) {
        o._passed = true;
        if (o.theme) this._passFlourish(o);
      }
      // Hit only if horizontally overlapping AND not high enough to clear it.
      if (!this._damageCD && Math.abs(p.x - o.x) < hw + 16 && p.body.bottom > o.clearY + 4) {
        const dir = p.x <= o.x ? -1 : 1;
        p.setPosition(o.x + dir * (hw + 32), p.y);
        p.setVelocityX(dir * 160); p.setVelocityY(-180);
        if (o.flat) this._splash(p.x, GROUND_Y - 6); else this._dustPuff(p.x, p.y + 16);
        this._takeHit();
        break;
      }
    }
  }

  _checkRollers() {
    if (this._done) return;
    const p = this.player;
    this._rollers.forEach(r => {
      // Move the ball left across the screen
      r.img.x -= 2.5;
      // Rotate continuously (mod 360 to keep angle from growing unbounded)
      r.img.angle = (r.img.angle - 9) % 360;
      if (r.shadow) r.shadow.x = r.img.x;
      // Reset off-screen
      if (r.img.x < this.cameras.main.scrollX - 80) {
        r.img.x = r.baseX;
        r.img.angle = 0;
        if (r.shadow) r.shadow.x = r.baseX;
      }
      // Collision check
      if (!this._damageCD && Math.abs(p.x - r.img.x) < 28 && Math.abs(p.y - r.img.y) < 36) {
        const dir = p.x <= r.img.x ? -1 : 1;
        p.setVelocityX(dir * 220); p.setVelocityY(-200);
        this._stunUntil = this.time.now + 200;
        this._dustPuff(p.x, p.y + 16);
        this._takeHit();
      }
    });
  }

  _checkEnd() {
    if (!this._returning) return;
    if (this.player.x > WORLD_W - 150) {
      this._done = true;
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(750, () =>
        this.scene.start('L6_NamingCeremony', { names: this._collected, stars: this._score }));
    }
  }

  _allFound() {
    this._returning = true;
    this.cameras.main.flash(400, 255, 220, 50);

    // Celebration overlay
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(55);
    const banner = this.add.text(W / 2, H / 2 - 40, '🎉 You Got Every Puppy Name! 🎉',
      { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#FFD700', stroke: '#3A1800', strokeThickness: 4 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(56).setScale(0);
    this.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    const sub = this.add.text(W / 2, H / 2 + 20, 'Run to the gate for the Naming Ceremony! →',
      { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#FFF8E1' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(56);

    // Confetti
    for (let i = 0; i < 36; i++) {
      const cc = this.add.rectangle(
        Phaser.Math.Between(30, W - 30), Phaser.Math.Between(30, H - 30),
        10, 6, Phaser.Math.RND.pick([0xFF6B9D, 0xFFD700, 0x4CAF50, 0x4FC3F7]), 1)
        .setScrollFactor(0).setDepth(57);
      this.tweens.add({ targets: cc, y: cc.y + 200, alpha: 0, angle: 360,
        duration: 1400, delay: i * 38, onComplete: () => cc.destroy() });
    }

    this.time.delayedCall(2600, () => { ov.destroy(); banner.destroy(); sub.destroy(); });

    // Arrow guide
    const arrow = this.add.text(W - 48, H / 2, '➡️', { fontSize: '28px' }).setScrollFactor(0).setDepth(52);
    this.tweens.add({ targets: arrow, x: W - 28, alpha: 0.3, duration: 450, yoyo: true, repeat: -1 });

    // Ceremony gate
    const gate = this.add.graphics().setDepth(6);
    gate.fillStyle(0xFFD700, 1);
    gate.fillRect(WORLD_W - 96, GROUND_Y - 170, 10, 170);
    gate.fillRect(WORLD_W - 18, GROUND_Y - 170, 10, 170);
    gate.fillRect(WORLD_W - 96, GROUND_Y - 176, 88, 12);
    this.add.text(WORLD_W - 54, GROUND_Y - 196, '🎊 NAMING CEREMONY',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#FFD700', stroke: '#3A1800', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(9);
  }

  // ── MINI ACTIVITIES ───────────────────────────────────────────────────────
  _showMini(num) {
    this._miniActive = true;
    // Random mini-game from Level 6's slice of the 40 games — no intro/ending
    // screen, matches Level 1's flow (launchRandomMiniGame pauses physics itself).
    launchRandomMiniGame(this, 6, () => {
      this._miniActive = false;
      this._score += 300;
      this._scoreTxt.setText(`${this._score}`);
      this._toast('⭐ Activity complete! Keep going!');
    });
  }

  // ── Pit fall detection ────────────────────────────────────────────────────
  // Two-phase, matching Level 2/BaseLevelScene's fall-death technique: once
  // the pup steps over open ground with nothing beneath it, let gravity carry
  // it all the way down out of view (input frozen via `stunned` in update())
  // so the fall is shown COMPLETELY, THEN apply the full life loss and
  // respawn at the last checkpoint — instead of an instant flash+teleport
  // the moment it touches the pit edge.
  _checkPits() {
    if (this._done || this._paused || this._miniActive) return;
    const p = this.player;

    if (this._fallingIntoPit) {
      if (p.y > H + 80) this._fallIntoPit();   // fully off-screen — finish the fall
      return;
    }

    const onGround = p.body.blocked.down || p.body.touching.down;
    if (!onGround && p.body.bottom > GROUND_Y + 6) {
      const inPit = this._pitZones && this._pitZones.some(z => Math.abs(p.body.x - z.x) < z.hw);
      if (inPit) {
        this._fallingIntoPit = true;   // freezes input in update(); drops straight down
        p.setVelocityX(0);
      }
    }
  }

  _fallIntoPit() {
    this._fallingIntoPit = false;

    if (this._damageCD) { this._respawnAtCheckpoint(); return; }
    this._damageCD = true;

    // Flash the screen dark to signal the pit fall (safe — no world-space rectangle)
    this.cameras.main.flash(320, 0, 0, 0, true);

    // Direct, complete life loss (not partial HP damage) — matches the
    // instant hazard-death behaviour used everywhere else in the game.
    this._lives--;
    this._hdr?.setLives(this._lives);
    this._hp = 3;
    this._hdr?.setHP(this._hp);
    this._toast('💧 Fell in a pit!');
    this.cameras.main.shake(200, 0.012);

    if (this._lives <= 0) {
      this.time.delayedCall(400, () => {
        showTryAgainModal(this, () => {
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.time.delayedCall(550, () => this.scene.restart());
        });
      });
      return;
    }
    this._respawnAtCheckpoint();
  }

  _respawnAtCheckpoint() {
    this._fallingIntoPit = false;
    this._score = this._lastCP.score;
    this._scoreTxt.setText(`${this._score}`);
    const p = this.player;
    // body.reset() (not setPosition + setVelocity) — teleporting a dynamic
    // Arcade body needs the body's own position/velocity forced directly,
    // otherwise a high fall speed built up over a long pit-drop can carry it
    // straight through the new spot for another frame or two before the
    // sprite/body re-sync, which looked like the checkpoint reset "missing".
    p.body.reset(this._lastCP.x, GROUND_Y - 42);
    this.cameras.main.centerOnX(this._lastCP.x);
    this._toast('💫 Back to checkpoint!');
    this.time.delayedCall(1400, () => { this._damageCD = false; });
  }

  // ── DAMAGE / HEALTH ───────────────────────────────────────────────────────
  _takeHit() {
    if (this._damageCD) return;
    this._damageCD = true;
    this._hp--;
    this._hdr?.setHP(this._hp);
    this.cameras.main.shake(160, 0.01);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 90, yoyo: true, repeat: 4,
      onComplete: () => this.player && this.player.setAlpha(1) });

    if (this._hp <= 0) {
      this._hp = 3;
      this._lives--;
      this._hdr?.setLives(this._lives);
      this._hdr?.setHP(this._hp);
      if (this._lives <= 0) {
        this.time.delayedCall(400, () => {
          showTryAgainModal(this, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(550, () => this.scene.restart());
          });
        });
        return;
      }
      // Respawn at last checkpoint — preserve collected tokens, restore score
      this._respawnAtCheckpoint();
      return;
    }
    this.time.delayedCall(850, () => { this._damageCD = false; });
  }

  // ── UTILS ──────────────────────────────────────────────────────────────
  // Finalized wood/gold Game-Menu modal (approved via Theme Design)
  _togglePause() {
    if (this._paused) {
      this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._pauseObjs = null; this._paused = false; this.physics.resume();
      return;
    }
    this._paused = true; this.physics.pause();
    this._pauseObjs = openGameMenuModal(this, {
      onResume:  () => this._togglePause(),
      onRestart: () => { this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} }); this._paused = false; this.physics.resume(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); },
      onExit:    () => { this.physics.resume(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => this.scene.start('Menu')); },
    });
  }

  _toast(msg) {
    const t = this.add.text(W / 2, H - 72, msg,
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#00000099', padding: { x: 10, y: 5 } })
      .setOrigin(0.5).setScrollFactor(0).setDepth(55).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 230, hold: 2000, yoyo: true, onComplete: () => t.destroy() });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, d = 20 + Math.random() * 22;
      const s = this.add.text(x + Math.cos(a) * d, y + Math.sin(a) * d, '✨', { fontSize: '13px' }).setDepth(30);
      this.tweens.add({ targets: s, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 580, delay: i * 35, onComplete: () => s.destroy() });
    }
  }

  // Brown dust burst (solid obstacle impact).
  _dustPuff(x, y) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const d = this.add.circle(x, y, 3 + Math.random() * 3, 0xC9A66B, 0.8).setDepth(20);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * (18 + Math.random() * 14),
        y: y + Math.sin(a) * (10 + Math.random() * 10) - 6, alpha: 0, scale: 0.3,
        duration: 420, onComplete: () => d.destroy() });
    }
  }

  // Blue droplet splash (puddle impact).
  _splash(x, y) {
    for (let i = 0; i < 8; i++) {
      const dx = (i - 3.5) * 5;
      const d = this.add.circle(x, y, 2.5 + Math.random() * 2, 0x6FB7E8, 0.9).setDepth(20);
      this.tweens.add({ targets: d, x: x + dx * 2, y: y - (16 + Math.random() * 14), alpha: 0,
        duration: 480, ease: 'Sine.easeOut', onComplete: () => d.destroy() });
    }
  }

  // Themed flourish when the pup cleanly jumps over a hurdle.
  _passFlourish(o) {
    const half = o.w / 2, y = GROUND_Y - o.h - 4;
    const byTheme = { branch: ['🍃', '🌿'], banner: ['🎉', '✨'], sign: ['✨'], flower: ['🌸', '🌼'] };
    const chars = byTheme[o.theme] || ['✨'];
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(o.x + Phaser.Math.Between(-half, half), y,
        Phaser.Math.RND.pick(chars), { fontSize: '12px' }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: t, y: y - 18 - Math.random() * 14,
        x: t.x + Phaser.Math.Between(-12, 12), alpha: 0, duration: 620,
        onComplete: () => t.destroy() });
    }
  }
}

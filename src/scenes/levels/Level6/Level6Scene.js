import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';

// ── Level 6 · Part 1 — Puppy Garden Runner ────────────────────────────────
// Player runs through a garden collecting 7 puppy name tokens.
// 4 mini-activities trigger after collecting Bella, Milo, Daisy, Luna.
// After all 7 names: transition to L6_NamingCeremony.

const WORLD_W   = 13000;
const GROUND_Y  = 408;
const RUN_SPEED = 230;
const JUMP_V    = -440;
// Obstacles sit flush on the stone path section of the surface image.
// OBS_BASE_DROP shifts obstacle bases below GROUND_Y to match visual character feet.
const OBS_BASE_DROP = 18;

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
    ['gleeda_idle', 'gleeda_run1', 'gleeda_jump'].forEach(k => {
      if (!this.textures.exists(k))
        this.load.image(k, `assets/images/Level%204/${k}.png`);
    });
    if (!this.textures.exists('l6_bg'))
      this.load.image('l6_bg', 'assets/images/level%206/background.png');
    if (!this.textures.exists('l6_surface'))
      this.load.image('l6_surface', 'assets/images/level%206/surface.png');
    // Obstacle artwork
    const obsKeys = ['pot', 'crate', 'puddle', 'ball', 'branch', 'banner', 'sign', 'flower_hedge'];
    obsKeys.forEach(k => {
      if (!this.textures.exists(`l6_${k}`))
        this.load.image(`l6_${k}`, `assets/images/level%206/${k}.png`);
    });
  }

  create(data) {
    this._collected  = [];
    this._lives      = 3;
    this._hp         = 3;
    this._damageCD   = false;
    this._done       = false;
    this._paused     = false;
    this._miniActive = false;
    this._returning  = false;
    this._score      = 0;
    this._rollers    = [];
    this._lastGroundT = -1e9;   // advanced-jump timers
    this._jumpBufferT = -1e9;
    this._jumpPrev    = false;
    this._isJumping   = false;
    this._stunUntil   = 0;
    this._lastCP     = { x: 80, score: 0 };
    this._checkpoints = [
      { x: 2300,  reached: false },
      { x: 5400,  reached: false },
      { x: 7200,  reached: false },
      { x: 9100,  reached: false },
      { x: 11000, reached: false },
    ];

    this.physics.world.setBounds(0, 0, WORLD_W, H);
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
    });

    this.time.delayedCall(700, () => this._toast('🐾 Collect 7 puppy names to start the ceremony!'));
  }

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  _buildSky() {
    // ── Background image as parallax tileSprite ──────────────────────────
    // Sits behind everything. Scrolls at 25% of camera speed for depth.
    // Height covers sky down to where the surface image begins to overlap.
    const bgDisplayH = GROUND_Y + 5; // extends slightly past physics ground

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
    // ── Invisible physics floor (player collides with this) ───────────────
    const floor = this.add.rectangle(WORLD_W / 2, GROUND_Y + 20, WORLD_W, 40, 0x000000, 0)
      .setDepth(-9);
    this.physics.add.existing(floor, true);
    this._ground = floor;

    // ── Surface image as screen-locked tileSprite ─────────────────────────
    // Surface positioned so stone path aligns with character's standing level
    // and obstacles sit on the same level as the character's feet.
    const surfaceY  = GROUND_Y - 65;             // surface top (grass) sits higher up
    const surfaceH  = H - surfaceY;              // fills remainder of screen

    if (this.textures.exists('l6_surface')) {
      const src   = this.textures.get('l6_surface').getSourceImage();
      const srcW  = src.naturalWidth  || src.width  || 800;
      const srcH  = src.naturalHeight || src.height || 380;
      const tileScaleY = surfaceH / srcH;         // scale tile to fill display height
      const tileScaleX = tileScaleY;              // uniform scale

      this._surfTile = this.add.tileSprite(0, surfaceY, W, surfaceH, 'l6_surface')
        .setOrigin(0, 0)
        .setScrollFactor(0)   // locked to camera viewport
        .setDepth(-8);

      this._surfTile.setTileScale(tileScaleX, tileScaleY);
    } else {
      // Fallback: plain green strip if image not loaded
      const fg = this.add.graphics().setDepth(-8).setScrollFactor(0);
      fg.fillStyle(0x70B030, 1);
      fg.fillRect(0, surfaceY, W, surfaceH);
    }
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
      if (o.flat)    return this._buildPuddle(o);
      if (o.theme)   return this._buildHurdle(o);
      return this._buildJumpObstacle(o, idx);
    });
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

  // ── Ground hazard: reflective puddle with looping ripple ──
  _buildPuddle(o) {
    const obsY = GROUND_Y + OBS_BASE_DROP;
    const img = this.add.image(o.x, obsY, 'l6_puddle').setOrigin(0.5, 0.5).setDepth(6);
    img.setDisplaySize(o.w + 20, o.w * 0.4);
    // Static (animations disabled to reduce lag)
    return { ...o, img, clearY: GROUND_Y - o.h - 10 };
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
    this.physics.add.collider(this.player, this._ground);

    if (!this.anims.exists('l6_walk')) {
      const rk = this.textures.exists('gleeda_run1') ? 'gleeda_run1' : tk;
      const jk = this.textures.exists('gleeda_jump') ? 'gleeda_jump' : tk;
      this.anims.create({ key: 'l6_walk', frames: [{ key: rk }], frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'l6_idle', frames: [{ key: tk  }], frameRate: 1, repeat: -1 });
      this.anims.create({ key: 'l6_jump', frames: [{ key: jk  }], frameRate: 1, repeat: -1 });
    }
    this.player.play('l6_idle');
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, -60);
  }

  _buildHUD() {
    // ── Top-left health panel (rounded, gradient, gold border, drop shadow) ──
    const hpG = this.add.graphics().setScrollFactor(0).setDepth(48);
    this._panel(hpG, 6, 6, 118, 48, 10);
    this.add.text(15, 11, 'LIVES', { fontSize: '7px', fontFamily: 'Arial Black', color: '#F5C77E' })
      .setScrollFactor(0).setDepth(50);

    // Lives = drawn hearts (filled red w/ highlight, or dim when lost)
    this._hearts = Array.from({ length: 3 }, (_, i) => {
      const g = this.add.graphics().setScrollFactor(0).setDepth(50);
      this._drawHeart(g, 22 + i * 22, 26, 7, true);
      return g;
    });
    // HP = pips under the hearts
    this._hpPips = Array.from({ length: 3 }, (_, i) => {
      const p = this.add.graphics().setScrollFactor(0).setDepth(50);
      this._drawPip(p, i, true);
      return p;
    });

    // ── Top-center progress banner ──
    const bw = 400, bx = W / 2 - bw / 2;
    const bgG = this.add.graphics().setScrollFactor(0).setDepth(48);
    this._panel(bgG, bx, 6, bw, 56, 12);

    this._progTxt = this.add.text(W / 2, 18, '🐾 Collect 7 Puppy Names!',
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#FFE9A8', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // Name chips (7) — rounded pills, tan when empty, gold when collected
    this._slots = TOKENS.map((t, i) => {
      const sx = bx + 22 + i * 50, sy = 44;
      const slotG = this.add.graphics().setScrollFactor(0).setDepth(49);
      const lbl = this.add.text(sx, sy, t.name.substring(0, 3),
        { fontSize: '7px', fontFamily: 'Arial Black', color: '#7A6042' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(50);
      const slot = { t, slotG, lbl, sx, sy };
      this._drawChip(slot, false);
      return slot;
    });

    // ── Top-right score badge + circular pause button ──
    const scG = this.add.graphics().setScrollFactor(0).setDepth(48);
    this._panel(scG, W - 116, 6, 72, 26, 13);
    this._scoreTxt = this.add.text(W - 80, 19, 'SCORE 0',
      { fontSize: '10px', fontFamily: 'Arial Black', color: '#FFE9A8' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // Circular pause button (beveled)
    const pbX = W - 22, pbY = 19;
    const pbG = this.add.graphics().setScrollFactor(0).setDepth(48);
    pbG.fillStyle(0x000000, 0.3); pbG.fillCircle(pbX + 1, pbY + 2, 13);          // shadow
    pbG.fillStyle(0x3a2410, 1);   pbG.fillCircle(pbX, pbY, 13);                  // base
    pbG.lineStyle(2, 0xFFD700, 0.9); pbG.strokeCircle(pbX, pbY, 13);            // gold ring
    pbG.fillStyle(0xFFE9A8, 1);
    pbG.fillRoundedRect(pbX - 5, pbY - 5, 3.5, 10, 1);
    pbG.fillRoundedRect(pbX + 1.5, pbY - 5, 3.5, 10, 1);                         // pause bars
    this.add.circle(pbX, pbY, 14, 0xffffff, 0).setScrollFactor(0).setDepth(51)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._togglePause());
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

  // Glossy heart icon for the lives display.
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

  // Name-progress pill chip.
  _drawChip(slot, collected) {
    const { slotG, sx, sy, lbl } = slot;
    slotG.clear();
    if (collected) {
      slotG.fillStyle(0xFFC926, 1);
      slotG.fillRoundedRect(sx - 19, sy - 10, 40, 19, 9);
      slotG.lineStyle(1.5, 0xFFF3C0, 0.9); slotG.strokeRoundedRect(sx - 19, sy - 10, 40, 19, 9);
      lbl.setColor('#5A3000');
    } else {
      slotG.fillStyle(0x6a533a, 0.7);
      slotG.fillRoundedRect(sx - 19, sy - 10, 40, 19, 9);
      slotG.lineStyle(1, 0xC8A878, 0.4); slotG.strokeRoundedRect(sx - 19, sy - 10, 40, 19, 9);
      lbl.setColor('#C8B090');
    }
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
    if (this._done || this._paused || this._miniActive) return;
    const ts = window._touchState || {};
    const p  = this.player;
    const onGround = p.body.blocked.down || p.body.touching.down;
    const stunned = this.time.now < (this._stunUntil || 0);
    const left  = !stunned && (this.cursors.left.isDown  || this.keys.A.isDown || ts.left);
    const right = !stunned && (this.cursors.right.isDown || this.keys.D.isDown || ts.right);
    const jump  = !stunned && (this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump);
    const slide = !stunned && (this.cursors.down.isDown  || this.keys.S.isDown || ts.slide);

    this._checkJumpHint(p, onGround);

    // SLIDE / DUCK — only while on the ground; squashes the pup low to pass
    // under overhead obstacles (branches, banners, signs, arches).
    this._sliding = !!slide && onGround;
    if (this._sliding) {
      p.setScale(0.20, 0.11);   // squashed low pose
    } else {
      p.setScale(0.18, 0.18);
    }

    let vx = 0;
    if (left)  { vx = -RUN_SPEED; p.setFlipX(true);  }
    if (right) { vx =  RUN_SPEED; p.setFlipX(false); }
    if (this._sliding && vx === 0) vx = RUN_SPEED * (p.flipX ? -1 : 1) * 0.5; // gentle glide
    p.setVelocityX(vx);

    // ── Advanced jump: coyote-time + input buffering + variable height ──
    // Coyote-time: you can still jump for a few ms after walking off an edge.
    // Buffer: a jump pressed just before landing still fires on touchdown.
    // Variable height: release early for a small hop, hold for a full jump.
    const now = this.time.now;
    if (onGround) this._lastGroundT = now;
    if (jump && !this._jumpPrev) this._jumpBufferT = now;   // rising-edge press
    this._jumpPrev = jump;

    const coyoteOK   = (now - this._lastGroundT) <= 110;
    const bufferedOK = (now - this._jumpBufferT) <= 130;
    if (bufferedOK && coyoteOK && !this._sliding && p.body.velocity.y > -20) {
      p.setVelocityY(JUMP_V);
      this._jumpBufferT = -1e9;   // consume buffer
      this._lastGroundT = -1e9;   // consume coyote window
      this._isJumping   = true;
    }
    if (this._isJumping && !jump && p.body.velocity.y < 0) {
      p.setVelocityY(p.body.velocity.y * 0.45);   // cut the rise → short hop
      this._isJumping = false;
    }
    if (p.body.velocity.y >= 0) this._isJumping = false;

    if (this._sliding) p.play('l6_idle', true);
    else if (!onGround) p.play('l6_jump', true);
    else if (vx !== 0)  p.play('l6_walk', true);
    else                p.play('l6_idle', true);

    // Scroll background (parallax 25%) and surface (1:1 with camera)
    const camX = this.cameras.main.scrollX;
    if (this._bgTile)   this._bgTile.tilePositionX   = camX * 0.25;
    if (this._surfTile) this._surfTile.tilePositionX  = camX;

    this._checkTokens();
    this._checkObstacles(onGround);
    this._checkRollers();
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
        this._scoreTxt.setText(`SCORE ${this._score}`);

        const parts = [t.badge, t.label, t.spark].filter(Boolean);
        parts.forEach(o => this.tweens.killTweensOf(o));

        // Fly to HUD
        this.tweens.add({
          targets: parts,
          x: W / 2, y: 44, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 480,
          onComplete: () => parts.forEach(o => { try { o.destroy(); } catch (_) {} })
        });

        // Light up HUD chip
        const slot = this._slots.find(s => s.t.name === t.name);
        if (slot) {
          this._drawChip(slot, true);
          this.tweens.add({ targets: slot.lbl, scaleX: 1.4, scaleY: 1.4, duration: 160, yoyo: true });
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
    this.physics.pause();
    const configs = {
      1: { title: 'Match The Toy! 🧸',          fn: '_buildMini1' },
      2: { title: 'Find The Bone! 🦴',           fn: '_buildMini2' },
      3: { title: 'Cozy Puppy Care! 🧣',         fn: '_buildMini3' },
      4: { title: 'Puppy Paw Match! 🐾',         fn: '_buildMini4' },
    };
    const cfg = configs[num];
    const PW = 470, PH = 310, px = W / 2 - PW / 2, py = H / 2 - PH / 2;
    const objs = [];

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setScrollFactor(0).setDepth(80).setInteractive();
    objs.push(bg);
    const panelG = this.add.graphics().setScrollFactor(0).setDepth(81);
    panelG.fillStyle(0xFFF8E1, 1); panelG.fillRoundedRect(px, py, PW, PH, 16);
    panelG.lineStyle(4, 0xFFD700, 1); panelG.strokeRoundedRect(px, py, PW, PH, 16);
    objs.push(panelG);

    objs.push(this.add.text(W / 2, py + 34, cfg.title,
      { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#8B4513', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(82));

    let timeLeft = 18;
    const timerTxt = this.add.text(W / 2, py + 60, `⏱ ${timeLeft}s`,
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#D84315' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(82);
    objs.push(timerTxt);

    const done = () => {
      timer.remove(false);
      objs.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._miniActive = false;
      this.physics.resume();
      this._score += 300;
      this._scoreTxt.setText(`SCORE ${this._score}`);
      this._toast('⭐ Activity complete! Keep going!');
    };
    const timer = this.time.addEvent({ delay: 1000, repeat: 17, callback: () => {
      timeLeft--; timerTxt.setText(`⏱ ${timeLeft}s`);
      if (timeLeft <= 0) done();
    }});
    this['_miniComplete'] = done;

    this[cfg.fn](px, py, PW, PH, objs);
  }

  _buildMini1(px, py, PW, PH, objs) {
    // Match toy to puppy (3 pairs)
    const puppies = ['🐶', '🐕', '🐩'];
    const toys    = ['🎾', '🦴', '🧶'];
    let matched = 0;
    puppies.forEach((p, i) =>
      objs.push(this.add.text(px + 80 + i * 140, py + 175, p, { fontSize: '36px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(82)));
    toys.forEach((toy, i) => {
      const tx = px + 80 + i * 140, ty = py + 240;
      const t = this.add.text(tx, ty, toy, { fontSize: '28px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(83).setInteractive({ useHandCursor: true });
      objs.push(t);
      t.on('pointerdown', () => {
        if (t.alpha < 0.5) return;
        t.setAlpha(0.3);
        const ck = this.add.text(tx, ty - 28, '✅', { fontSize: '18px' }).setOrigin(0.5).setScrollFactor(0).setDepth(84);
        objs.push(ck);
        this.tweens.add({ targets: t, scaleX: 1.4, scaleY: 1.4, duration: 180, yoyo: true });
        if (++matched >= 3) this.time.delayedCall(500, () => this._miniComplete && this._miniComplete());
      });
    });
    objs.push(this.add.text(W / 2, py + PH - 22, 'Tap each toy to give it to a puppy!',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#6D4C41' }).setOrigin(0.5).setScrollFactor(0).setDepth(82));
  }

  _buildMini2(px, py, PW, PH, objs) {
    // Tap hidden bones
    let found = 0;
    const grd = this.add.graphics().setScrollFactor(0).setDepth(82);
    grd.fillStyle(0x8BC34A, 0.45); grd.fillRect(px + 10, py + 120, PW - 20, PH - 130);
    objs.push(grd);
    [[px + 80, py + 200], [px + 240, py + 240], [px + 390, py + 205]].forEach(([bx, by]) => {
      const h = this.add.text(bx, by, '🌿', { fontSize: '24px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(83).setInteractive({ useHandCursor: true });
      objs.push(h);
      h.on('pointerdown', () => {
        if (h.alpha < 0.5) return;
        h.setAlpha(0); objs.push(h);
        const b = this.add.text(bx, by, '🦴', { fontSize: '22px' }).setOrigin(0.5).setScrollFactor(0).setDepth(84);
        this.tweens.add({ targets: b, y: by - 28, alpha: 0, duration: 650, onComplete: () => b.destroy() });
        this.cameras.main.flash(70, 255, 220, 50);
        if (++found >= 3) this.time.delayedCall(400, () => this._miniComplete && this._miniComplete());
      });
    });
    objs.push(this.add.text(W / 2, py + PH - 22, 'Tap the grass clumps to find hidden bones!',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#4E342E' }).setOrigin(0.5).setScrollFactor(0).setDepth(82));
  }

  _buildMini3(px, py, PW, PH, objs) {
    // Drag blanket to puppy
    objs.push(this.add.text(px + PW / 2, py + 195, '🐶', { fontSize: '54px' }).setOrigin(0.5).setScrollFactor(0).setDepth(82));
    const blanket = this.add.text(px + 72, py + 228, '🧣', { fontSize: '38px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(83)
      .setInteractive({ draggable: true, useHandCursor: true });
    objs.push(blanket);
    this.input.setDraggable(blanket);
    blanket.on('drag', (_, dx, dy) => { blanket.x = dx; blanket.y = dy; });
    blanket.on('dragend', () => {
      const dist = Phaser.Math.Distance.Between(blanket.x, blanket.y, px + PW / 2, py + 195);
      if (dist < 75) {
        blanket.disableInteractive();
        this.tweens.add({ targets: blanket, x: px + PW / 2, y: py + 195, duration: 280 });
        const msg = this.add.text(W / 2, py + 140, '💛 So Cozy!',
          { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#FFD700' })
          .setOrigin(0.5).setScrollFactor(0).setDepth(84);
        objs.push(msg);
        this.time.delayedCall(700, () => this._miniComplete && this._miniComplete());
      } else {
        this.tweens.add({ targets: blanket, x: px + 72, y: py + 228, duration: 280, ease: 'Back.easeOut' });
      }
    });
    objs.push(this.add.text(W / 2, py + PH - 22, 'Drag the blanket onto the puppy to warm it!',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#4E342E' }).setOrigin(0.5).setScrollFactor(0).setDepth(82));
  }

  _buildMini4(px, py, PW, PH, objs) {
    // Tap matching paw pairs
    const colors = [0xFF6B9D, 0x4FC3F7, 0xFFD700, 0x81C784];
    const positions = [
      [px + 72, py + 175], [px + 188, py + 238], [px + 302, py + 175], [px + 408, py + 238],
      [px + 118, py + 238], [px + 248, py + 175], [px + 356, py + 238], [px + 454, py + 175],
    ];
    let selected = null, matched = 0;
    colors.forEach((col, ci) => {
      [0, 1].forEach(copy => {
        const pos = positions[ci * 2 + copy];
        const pg = this.add.graphics().setScrollFactor(0).setDepth(83);
        const drawPaw = (alpha) => {
          pg.clear();
          pg.fillStyle(col, alpha);
          pg.fillEllipse(pos[0], pos[1] + 4, 26, 18);
          [[-9, -7], [0, -11], [9, -7], [-5, -3]].forEach(([dx, dy]) => pg.fillCircle(pos[0] + dx, pos[1] + dy, 4.5));
        };
        drawPaw(0.8);
        const hit = this.add.rectangle(pos[0], pos[1], 44, 44, 0, 0).setScrollFactor(0).setDepth(84).setInteractive({ useHandCursor: true });
        objs.push(pg); objs.push(hit);
        hit.setData('col', ci); hit.setData('pg', pg); hit.setData('drawPaw', drawPaw);
        hit.on('pointerdown', () => {
          if (hit.getData('matched')) return;
          if (!selected) {
            selected = hit;
            drawPaw(0.8);
            pg.lineStyle(3, 0xFFFFFF, 1); pg.strokeEllipse(pos[0], pos[1] + 4, 30, 22);
          } else if (selected === hit) {
            selected = null; drawPaw(0.8);
          } else if (selected.getData('col') === ci) {
            [selected, hit].forEach(h => { h.setData('matched', true); h.getData('drawPaw')(0.8); h.getData('pg').lineStyle(3, 0x44FF44, 1); });
            selected = null;
            if (++matched >= 4) this.time.delayedCall(450, () => this._miniComplete && this._miniComplete());
          } else {
            this.tweens.add({ targets: [selected.getData('pg'), pg], alpha: 0.2, duration: 180, yoyo: true });
            selected = null;
          }
        });
      });
    });
    objs.push(this.add.text(W / 2, py + PH - 22, 'Tap two matching paw prints to pair them!',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#4E342E' }).setOrigin(0.5).setScrollFactor(0).setDepth(82));
  }

  // ── DAMAGE / HEALTH ───────────────────────────────────────────────────────
  _takeHit() {
    if (this._damageCD) return;
    this._damageCD = true;
    this._hp--;
    this._hpPips.forEach((p, i) => this._drawPip(p, i, i < this._hp));
    this.cameras.main.shake(160, 0.01);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 90, yoyo: true, repeat: 4,
      onComplete: () => this.player.setAlpha(1) });

    if (this._hp <= 0) {
      this._hp = 3;
      this._lives--;
      this._hearts.forEach((h, i) => this._drawHeart(h, 22 + i * 22, 26, 7, i < this._lives));
      this._hpPips.forEach((p, i) => this._drawPip(p, i, true));
      if (this._lives <= 0) {
        this._toast('💔 Game Over! Restarting…');
        this.time.delayedCall(1100, () => {
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.time.delayedCall(550, () => this.scene.restart());
        });
        return;
      }
      // Respawn at last checkpoint — preserve collected tokens, restore score
      this._score = this._lastCP.score;
      this._scoreTxt.setText(`SCORE ${this._score}`);
      const p = this.player;
      p.setPosition(this._lastCP.x, GROUND_Y - 42);
      p.setVelocity(0, 0);
      this.cameras.main.centerOnX(this._lastCP.x);
      this._toast('💫 Back to checkpoint!');
      // Extended invulnerability after respawn (1 400 ms)
      this.time.delayedCall(1400, () => { this._damageCD = false; });
      return;
    }
    this.time.delayedCall(850, () => { this._damageCD = false; });
  }

  // ── UTILS ──────────────────────────────────────────────────────────────
  _togglePause() {
    this._paused = !this._paused;
    if (this._paused) this.physics.pause(); else this.physics.resume();
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

import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { BaseLevelScene } from '../BaseLevelScene.js';
import { preloadGlendaSkin, applyGlendaSkin } from './L2_GlendaSkin.js';
import { buildL2Background, updateL2Parallax, buildL2Ground, buildL1TransitionVisuals, transitionToL1Visuals } from './L2_Scenery.js';
import { PremiumHUD } from '../../../hud/premium/PremiumHUD.js';
import { makePanel } from '../../../hud/premium/PremiumTheme.js';
import { launchRandomMiniGame, resetGameHistory } from '../../../utils/MiniGamePicker.js';
import { preloadPorcupineSkin, createPorcupineSprite } from '../PorcupineSkin.js';

// Chapter 2 — 3 zones (Road → Jungle → Dark Jungle) + cage unlock + trust mini-games
// Each zone is ~6000 units wide → ~45 s real play time at speed 200 with obstacles.
export class Level2Scene extends BaseLevelScene {
  constructor() { super('Level2'); }

  // Load the Glenda run/idle/jump frames (visual-only swap; see L2_GlendaSkin.js).
  preload() {
    preloadGlendaSkin(this);
    preloadPorcupineSkin(this);
  }

  // ── Real-art scenery (level-2-bg.jpg + Level -02-bottom.jpg) ────────────────
  // Override the shared BaseLevelScene visuals for Level 2 only. Physics/gameplay
  // is untouched (buildL2Ground re-creates the same invisible collision tiles).
  _buildBackground(worldW) { buildL2Background(this); }
  _updateBgParallax()      { updateL2Parallax(this); }
  _buildGround(config)     { buildL2Ground(this, config); }

  // Wraps _playVideoOverlay so the touch-control footer (left/right/jump/bark)
  // is never shown over ANY Level 2 cinematic — hidden for the video's whole
  // duration, restored once it ends (matches the same hide/show _launchCheckpoint
  // already does around mini-games).
  _playL2Video(key, onDone) {
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';
    this._playVideoOverlay(key, () => {
      if (footer) footer.style.display = 'flex';
      if (onDone) onDone();
    });
  }

  _handleGameOver() {
    this._playL2Video('l2_gameover_video', () => {
      this.registry.set('lives', 3);
      this.registry.set('shadowHP', 3);
      // Guaranteed reset — the death tween's own cleanup may not have run
      // yet (or may get cut short) by the time the level restarts.
      this.shadow.clearTint();
      this.shadow.setAlpha(1);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () => this.scene.restart());
    });
  }

  _handleTimeUp() {
    if (this._miniGameOpen && this._miniGameClose) this._miniGameClose();
    this._timerFired = true;
    this._isDying = true;
    this._showMessage('⏱ Time\'s up! Returning to the zone start... 💀');
    this.cameras.main.shake(300, 0.012);
    this.time.delayedCall(800, () => {
      this._timerFired = false;
      const sx = this.shadow?.x ?? this._checkpointX ?? 80;
      let zoneTimer = 75;
      if (sx > 12000) {
        this._checkpointX = 12020;
        this._checkpointY = 360;
        zoneTimer = 95;   // Zone 3 keeps its +20s allowance on respawn too
      } else if (sx > 6000) {
        this._checkpointX = 6020;
        this._checkpointY = 360;
      } else {
        this._checkpointX = 80;
        this._checkpointY = 370;
      }
      this._resetTimer(zoneTimer);
      this._loseLife(0.012);
    });
  }

  _loseLife(shake = 0.012) {
    super._loseLife(shake);
    // Respawn checkpoint (just set above/by the caller) decides the zone —
    // Zone 3 keeps its +20s allowance instead of always resetting to 75.
    this._resetTimer(this._checkpointX > 12000 ? 95 : 75);
  }

  create() {
    // Fresh playthrough (including a restart after game over) — clear which
    // mini-games have already been shown so this level's trigger points
    // (Dodge the Hazards on Key 2, plus any others) can't repeat one.
    resetGameHistory(2);

    const config = {
      worldWidth: 18500,
      startX: 80, startY: 370,
      timer: 75,
      character: 'gleeda',
      chapterName: 'Chapter 2 — Rescue Gemma!',
      objective: 'Collect 2 keys to unlock Gemma\'s cage!\nRoad → Jungle → Dark Jungle 🔑',
      platforms: [
        // Zone 2: stepping stones centred in each medium gap
        { x: 6677,  y: 390, w: 50, h: 14 },
        { x: 7677,  y: 390, w: 50, h: 14 },
        { x: 8677,  y: 390, w: 50, h: 14 },
        { x: 9677,  y: 390, w: 50, h: 14 },
        { x: 10677, y: 390, w: 50, h: 14 },
        { x: 11677, y: 390, w: 50, h: 14 },
        // Zone 3: collapsing log platforms centred in each gap
        { x: 12865, y: 358, key: 'log', w: 90, h: 18 },
        { x: 13965, y: 358, key: 'log', w: 90, h: 18 },
        { x: 15065, y: 358, key: 'log', w: 90, h: 18 },
        { x: 16165, y: 358, key: 'log', w: 90, h: 18 },
        { x: 17265, y: 358, key: 'log', w: 90, h: 18 },
      ],
      rocks: [],
      gaps: [
        // Zone 1 — road potholes (100 px wide — wider than player body so player falls through)
        { x: 500,   w: 100 }, { x: 1400,  w: 100 }, { x: 2300,  w: 100 },
        { x: 3200,  w: 100 }, { x: 4100,  w: 100 }, { x: 5000,  w: 100 },
        // Zone 2 — medium jungle gaps
        { x: 6600,  w: 155 }, { x: 7600,  w: 155 }, { x: 8600,  w: 155 },
        { x: 9600,  w: 155 }, { x: 10600, w: 155 }, { x: 11600, w: 155 },
        // Zone 3 — manageable dark-jungle gaps
        { x: 12800, w: 130 }, { x: 13900, w: 130 }, { x: 15000, w: 130 },
        { x: 16100, w: 130 }, { x: 17200, w: 130 },
      ]
    };

    this.initLevel(config);
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';
    buildL1TransitionVisuals(this);
    this._bgTransitionTriggered = false;
    this._introVideoPlayed = false;
    this._cageVideoPlayed = false;
    this._resetTimer(75);
    // Swap the player VISUAL to Glenda's run/idle/jump art (gameplay/physics untouched).
    applyGlendaSkin(this);

    if (!this._introVideoPlayed) {
      this._introVideoPlayed = true;
      this._playL2Video('l2_intro_video', () => {});
    }
    // The premium HUD (header + checkpoint footer) is built by _buildHUD() during
    // initLevel above; nothing else to init here.

    // Kill any checkpoint overlay left over from a previous attempt, and clean up on exit
    this._stopCheckpointOverlays();
    this.events.once('shutdown', () => this._stopCheckpointOverlays());

    // ── Zone 1 potholes — drawn over the real ground art so gaps look like real holes ──
    [
      { x: 500,  w: 100 }, { x: 1400, w: 100 }, { x: 2300, w: 100 },
      { x: 3200, w: 100 }, { x: 4100, w: 100 }, { x: 5000, w: 100 },
    ].forEach(g => {
      const gr  = this.add.graphics().setDepth(8);
      const top = H - 46; // top of curb strip

      // Dark void fills the entire gap column
      gr.fillStyle(0x050302, 1);
      gr.fillRect(g.x, top, g.w, 50);

      // Faint dirt floor for depth illusion
      gr.fillStyle(0x2a1608, 0.55);
      gr.fillRect(g.x + 4, H - 10, g.w - 8, 14);

      // Left broken asphalt chunks (curb color then asphalt color)
      gr.fillStyle(0x3d3d4a, 1);
      gr.fillTriangle(g.x, top,      g.x + 11, top,       g.x,      top + 11);
      gr.fillTriangle(g.x, top + 15, g.x + 7,  top + 13,  g.x,      top + 24);
      gr.fillStyle(0x2a2a38, 1);
      gr.fillTriangle(g.x, top + 9,  g.x + 8,  top + 9,   g.x + 3,  top + 19);

      // Right broken asphalt chunks
      gr.fillStyle(0x3d3d4a, 1);
      gr.fillTriangle(g.x + g.w, top,      g.x + g.w - 11, top,      g.x + g.w, top + 11);
      gr.fillTriangle(g.x + g.w, top + 15, g.x + g.w - 7,  top + 13, g.x + g.w, top + 24);
      gr.fillStyle(0x2a2a38, 1);
      gr.fillTriangle(g.x + g.w, top + 9,  g.x + g.w - 8,  top + 9,  g.x + g.w - 3, top + 19);

      // Crack lines radiating from left edge
      gr.lineStyle(1.5, 0x18182a, 1);
      gr.lineBetween(g.x - 18, top + 2,  g.x,     top + 8);
      gr.lineBetween(g.x - 11, top - 3,  g.x,     top + 3);
      gr.lineBetween(g.x - 22, top + 9,  g.x - 4, top + 7);

      // Crack lines radiating from right edge
      gr.lineBetween(g.x + g.w + 16, top + 2,  g.x + g.w,     top + 8);
      gr.lineBetween(g.x + g.w +  9, top - 3,  g.x + g.w,     top + 3);
      gr.lineBetween(g.x + g.w + 20, top + 9,  g.x + g.w + 4, top + 7);

      // Bouncing JUMP hint above each hole
      const cx = g.x + g.w / 2;
      const arrow = this.add.text(cx, H - 72, '⬆', {
        fontSize: '18px', color: '#ffee44',
        stroke: '#1a1008', strokeThickness: 3
      }).setOrigin(0.5).setDepth(9);
      this.tweens.add({ targets: arrow, y: H - 84, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const jumpTxt = this.add.text(cx, H - 96, 'JUMP!', {
        fontSize: '10px', fontFamily: 'Georgia, serif',
        color: '#ffe080', stroke: '#1a0802', strokeThickness: 2
      }).setOrigin(0.5).setDepth(9);
      this.tweens.add({ targets: jumpTxt, alpha: 0.3, duration: 480, yoyo: true, repeat: -1 });
    });

    // ── Street lamps (Zone 1) — placed mid-segment, never near holes ─────
    // Gaps (start→end): 500→600, 1400→1500, 2300→2400, 3200→3300, 4100→4200, 5000→5100
    // Lamps are visual only — placed in the safe mid-sections between gaps
    [250, 850, 1600, 2550, 3450, 4450, 5600].forEach(lx => {
      this.add.image(lx, 424, 'street_lamp').setOrigin(0.5, 1).setDisplaySize(55, 190).setDepth(7);
    });

    // ── Traffic signals (Zone 1) — visual only, kept in safe sections ─────
    [650, 1750, 2700, 3650, 4550].forEach(tx => {
      this.add.image(tx, 424, 'traffic_signal').setOrigin(0.5, 1).setDisplaySize(38, 125).setDepth(7);
    });

    // ── Zone 1 road hazards — all positions are 150 px+ from any hole ─────
    // Safe windows between gaps (with 150 px buffer each side):
    //   0–350 | 750–1250 | 1650–2150 | 2550–3050 | 3450–3950 | 4350–4850 | 5250–end
    this._roadHazards = [];

    // Cones — spaced one per safe window
    [200, 950, 1750, 2650, 3650, 4550, 5350].forEach(cx => {
      this.add.image(cx, 424, 'cone').setOrigin(0.5, 1).setDisplaySize(22, 34).setDepth(8);
      this._roadHazards.push({ x: cx - 11, w: 22, y: 390 });
    });

    // Barriers — one per alternate safe window
    [1050, 2750, 3800, 4700].forEach(bx => {
      this.add.image(bx, 424, 'road_barrier').setOrigin(0.5, 1).setDisplaySize(62, 44).setDepth(8);
      this._roadHazards.push({ x: bx - 31, w: 62, y: 380 });
    });

    // Barrels — offset from cones inside same safe windows
    [300, 1150, 2000, 2900, 3500, 4450, 5450].forEach(rx => {
      this.add.image(rx, 424, 'barrel').setOrigin(0.5, 1).setDisplaySize(30, 40).setDepth(8);
      this._roadHazards.push({ x: rx - 15, w: 30, y: 384 });
    });

    // ── Zone 1 crosswalk warnings before each pothole ─────────────────────
    [500, 1400, 2300, 3200, 4100, 5000].forEach(hx => {
      for (let i = 0; i < 5; i++) {
        this.add.rectangle(hx - 70 + i * 13, H - 27, 7, 26,
          i % 2 === 0 ? 0xeecc00 : 0x111111,
          i % 2 === 0 ? 0.75 : 0.45
        ).setDepth(7);
      }
    });

    // ── Zone 1 Section A: Falling construction debris (x=1500–3100) ───────
    // Warning signs at construction zone entrance
    const cSign = this.add.graphics().setDepth(9);
    cSign.fillStyle(0xffaa00, 0.92); cSign.fillRect(1460, H - 82, 100, 42);
    cSign.lineStyle(3, 0xcc6600, 1); cSign.strokeRect(1460, H - 82, 100, 42);
    this.add.text(1510, H - 71, '⚠️ DANGER', {
      fontSize: '10px', fontFamily: 'Georgia, serif',
      color: '#1a0800', stroke: '#ffee00', strokeThickness: 1
    }).setOrigin(0.5).setDepth(10);
    this.add.text(1510, H - 57, 'FALLING DEBRIS', {
      fontSize: '8px', fontFamily: 'Georgia, serif',
      color: '#1a0800'
    }).setOrigin(0.5).setDepth(10);

    // Orange hazard tape across ground in debris zone
    for (let tx = 1520; tx < 3100; tx += 120) {
      this.add.rectangle(tx, H - 34, 60, 7, tx % 240 < 120 ? 0xff7700 : 0x111111, 0.6).setDepth(7);
    }

    this._debrisGroup = this.physics.add.group();
    this._debrisMsgShown = false;
    this.physics.add.overlap(this.shadow, this._debrisGroup, (s, d) => {
      if (!d.getData('hit')) {
        d.setData('hit', true);
        this.tweens.add({ targets: d, alpha: 0, duration: 120, onComplete: () => { if (d.active) d.destroy(); } });
        this._onHazardHit();
      }
    });
    this.time.addEvent({
      delay: 1400, loop: true,
      callback: () => {
        if (this._levelDone || !this.shadow) return;
        const sx2 = this.shadow.x;
        if (sx2 < 1500 || sx2 > 3100) return;
        if (!this._debrisMsgShown) {
          this._debrisMsgShown = true;
          this._showMessage('⚠️ Construction zone! Watch for falling debris! 🪨');
          this.cameras.main.shake(140, 0.006);
        }
        const camX = this.cameras.main.scrollX;
        const rx = camX + 80 + Math.random() * (W - 160);
        const d = this._debrisGroup.create(rx, -20, 'rock');
        const dw = 22 + Math.random() * 14, dh = 16 + Math.random() * 10;
        d.setDisplaySize(dw, dh).setDepth(15).setTint(0x887060);
        d.body.setSize(dw * 0.8, dh * 0.8, true);
        d.body.setVelocityY(130 + Math.random() * 90);
        d.body.setVelocityX((Math.random() - 0.5) * 50);
        d.body.setAllowGravity(true);
        d.angle = Math.random() * 360;
        this.time.delayedCall(4000, () => { if (d && d.active) d.destroy(); });
      }
    });

    // ── Zone 1 Section B: Rolling barrel waves (x=3100–5800) ──────────────
    // Barrel run zone sign
    const bSign = this.add.graphics().setDepth(9);
    bSign.fillStyle(0xcc2200, 0.88); bSign.fillRect(3055, H - 80, 100, 38);
    bSign.lineStyle(3, 0xff4400, 1); bSign.strokeRect(3055, H - 80, 100, 38);
    this.add.text(3105, H - 70, '🛢️ BARREL RUN', {
      fontSize: '10px', fontFamily: 'Georgia, serif',
      color: '#ffe080', stroke: '#330000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(10);
    this.add.text(3105, H - 56, 'JUMP OVER!', {
      fontSize: '8px', fontFamily: 'Georgia, serif', color: '#ffcc00'
    }).setOrigin(0.5).setDepth(10);

    this._barrelGroup = this.physics.add.group();
    this._barrelZoneEntered = false;
    this.physics.add.overlap(this.shadow, this._barrelGroup, (s, b) => {
      if (!b.getData('hit')) {
        b.setData('hit', true);
        this.tweens.add({ targets: b, alpha: 0, y: b.y + 18, duration: 180, onComplete: () => { if (b.active) b.destroy(); } });
        this._onHazardHit();
      }
    });

    // ── Checkpoint flags — anchored at y=424 (same ground level as lamps/signals)
    // checkpoint_flag.png: 317×788, no transparent bottom → ratio 317:788 → 56×139
    this.add.image(5900,  424, 'checkpoint_flag').setDisplaySize(56, 139).setOrigin(0.5, 1).setDepth(8);
    this.add.image(11900, 424, 'checkpoint_flag').setDisplaySize(56, 139).setOrigin(0.5, 1).setDepth(8);

    // ── Zone 2: jungle torches ─────────────────────────────────────────────
    [6200, 7100, 8000, 8900, 9800, 10700, 11600].forEach(tx => {
      const t = this.add.text(tx, H - 54, '🔥', { fontSize: '18px' }).setDepth(7);
      this.tweens.add({ targets: t, alpha: 0.6, duration: 280 + Math.random() * 180, yoyo: true, repeat: -1 });
    });

    // ── Zone 3: candles ────────────────────────────────────────────────────
    // 14000 was inside gap 13900-14030 → moved to 14100
    [12200, 13100, 14100, 14900, 15800, 16700, 17600, 18200].forEach(tx => {
      const t = this.add.text(tx, H - 54, '🕯️', { fontSize: '16px' }).setDepth(7);
      this.tweens.add({ targets: t, alpha: 0.35, duration: 380 + Math.random() * 240, yoyo: true, repeat: -1 });
    });

    // ── Zone 3 rain — screen-space, hidden until Zone 3 entered ───────────
    this._rainDrops = [];
    for (let i = 0; i < 28; i++) {
      const rd = this.add.rectangle(
        30 + Math.random() * 740, -10 + Math.random() * H,
        2, 12, 0x5588bb, 0.35
      ).setScrollFactor(0).setDepth(6).setVisible(false);
      this._rainDrops.push({ img: rd, vy: 7 + Math.random() * 5 });
    }

    // ── Moving platforms (Zone 2) ──────────────────────────────────────────
    this._movingPlats = [];
    [
      { x: 6800,  y: 315, range: 70, speed: 0.70 },
      { x: 7800,  y: 295, range: 80, speed: 0.90 },
      { x: 8900,  y: 305, range: 65, speed: 0.75 },
      { x: 9900,  y: 315, range: 70, speed: 0.80 },
      { x: 10900, y: 295, range: 75, speed: 0.85 },
      { x: 11800, y: 305, range: 70, speed: 0.70 },
    ].forEach((mp, i) => {
      // Spawn at the SAME offset the update loop's sine formula expects for
      // this starting t — otherwise the platform snaps there on the first
      // update() tick after Zone 2 activates, and that one-frame jump reads
      // as a sudden burst of speed.
      const t0 = i * 1.4;
      const startX = mp.x + Math.sin(t0) * mp.range;
      const img = this.physics.add.image(startX, mp.y, 'platform')
        .setDisplaySize(88, 16).setImmovable(true).setDepth(8);
      img.body.setAllowGravity(false);
      this.physics.add.collider(this.shadow, img);
      this._movingPlats.push({ img, baseX: mp.x, y: mp.y, range: mp.range, speed: mp.speed, t: t0 });
    });

    // ── Spikes (Zone 3) ────────────────────────────────────────────────────
    this._spikes = [];
    // Safe positions only — 12600 replaces 12900 (was inside gap 12800-12930),
    // 17490 replaces 17300 (was inside gap 17200-17330)
    [12600, 13700, 14600, 15500, 16400, 17490].forEach(sx2 => {
      this.add.image(sx2, H - 44, 'spike').setDisplaySize(52, 24).setDepth(8);
      this._spikes.push({ x: sx2 - 22, w: 52, y: H - 58 });
    });

    // ── Cactus thorn hazards (Zone 2 + Zone 3) — real cactus art, same
    // ground/hit-detection style as Level 1's thorn hazard ─────────────────
    this._thorns = [];
    // Bottom-anchored at the same ground line the old center-origin/32px art
    // touched (H-46+16=420 / H-46+18=422), then doubled — so the visual
    // footprint on the ground stays put, only the cactus grows upward.
    [7200, 10200].forEach(tx => {
      this.add.image(tx, H - 30, 'cactus_thorn').setOrigin(0.5, 1).setDisplaySize(64, 64).setDepth(9);
      this._thorns.push({ x: tx - 14, y: H - 60, w: 28 });
    });
    [12050, 17800].forEach(tx => {
      this.add.image(tx, H - 28, 'cactus_thorn').setOrigin(0.5, 1).setDisplaySize(72, 72).setDepth(9);
      this._thorns.push({ x: tx - 16, y: H - 60, w: 32 });
    });

    // ── Collapsing platforms (Zone 3) ─────────────────────────────────────
    this._collapsing = [
      { x: 12865, y: 358, triggered: false },
      { x: 13965, y: 358, triggered: false },
      { x: 15065, y: 358, triggered: false },
      { x: 16165, y: 358, triggered: false },
      { x: 17265, y: 358, triggered: false },
    ];

    // ── Keys ──────────────────────────────────────────────────────────────
    this._hasKey1 = false;
    this._hasKey2 = false;

    // Key 1 — anchored at y=424 (same ground level as lamps/signals)
    // key1.png: 409×610 → display 72×107, transparent bottom ~6px at display scale
    const K1_X = 5680, K1_Y = 424;
    const k1Glow = this.add.ellipse(K1_X, K1_Y - 8, 84, 18, 0x44ff44, 0.55).setDepth(11);
    this.tweens.add({ targets: k1Glow, scaleX: 1.5, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 });
    this.key1Obj = this.physics.add.staticImage(K1_X, K1_Y, 'key1')
      .setDisplaySize(72, 107).setOrigin(0.5, 1).setDepth(12).refreshBody();

    // Key 2 — same ground level, key2.png has ~10px transparent bottom at display scale
    const K2_X = 11500, K2_Y = 424;
    const k2Glow = this.add.ellipse(K2_X, K2_Y - 8, 84, 18, 0x44ccff, 0.55).setDepth(11);
    this.tweens.add({ targets: k2Glow, scaleX: 1.5, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
    this.key2Obj = this.physics.add.staticImage(K2_X, K2_Y, 'key2')
      .setDisplaySize(72, 107).setOrigin(0.5, 1).setDepth(12).refreshBody();

    // ── Key HUD — premium gold-key slots, centered just below the title ──
    this._buildKeyHud();

    // ── Gemma health bar (Zone 3 only) ────────────────────────────────────
    this._gemmaHP = 100;
    this._gemmaHPBar   = this.add.graphics().setScrollFactor(0).setDepth(40).setVisible(false);
    this._gemmaHPLabel = this.add.text(10, 52, '❤️ Gemma:', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(40).setVisible(false);

    // ── Gemma's cage (Zone 3 end) ──────────────────────────────────────────
    {
      const gx = 17800, gy = 404, cW = 100, cH = 90;
      const cL = gx - cW / 2, cT = gy - cH;
      this.gemmaCageBack = this.add.graphics().setDepth(7);
      this.gemmaCageBack.fillStyle(0x1a1208, 1);
      this.gemmaCageBack.fillRect(cL, cT, cW, cH);
      this.gemmaCageBack.lineStyle(2, 0x3a2e10, 1);
      this.gemmaCageBack.strokeRect(cL, cT, cW, cH);
      this.gemmaCageBack.lineStyle(3, 0x2a2010, 0.9);
      for (let r = 1; r <= 3; r++) {
        const by = cT + (cH / 4) * r;
        this.gemmaCageBack.lineBetween(cL + 4, by, cL + cW - 4, by);
      }
      this.gemmaInCage = this.physics.add.staticImage(gx, gy, 'gemma_idle')
        .setDisplaySize(90, 50).setDepth(8).setOrigin(0.5, 1).refreshBody();
      this.tweens.add({ targets: this.gemmaInCage, y: gy - 5, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const barCount = 6, barGap = cW / (barCount + 1);
      this.gemmaCageFront = this.add.graphics().setDepth(10);
      this.gemmaCageFront.lineStyle(5, 0x4a3a18, 1);
      for (let b = 1; b <= barCount; b++) {
        const bx = cL + barGap * b;
        this.gemmaCageFront.lineBetween(bx, cT + 3, bx, gy - 2);
      }
      this.gemmaCageFront.lineStyle(6, 0x4a3a18, 1);
      this.gemmaCageFront.lineBetween(cL, cT + 3,         cL + cW, cT + 3);
      this.gemmaCageFront.lineBetween(cL, cT + cH * 0.45, cL + cW, cT + cH * 0.45);
      this.gemmaCageFront.lineBetween(cL, gy - 2,          cL + cW, gy - 2);
      this.gemmaCageFront.lineStyle(2, 0xc8a040, 0.35);
      for (let b = 1; b <= barCount; b++) {
        const bx = cL + barGap * b - 1;
        this.gemmaCageFront.lineBetween(bx, cT + 3, bx, gy - 2);
      }
      this.gemmaCage = this.gemmaCageFront;
    }

    // ── Zone 2 porcupine ─────────────────────────────────────────────────
    this._porcZ2 = {
      img: createPorcupineSprite(this, 9000, H - 46, 36, 27).setDepth(9),
      x: 9000, dir: 1, min: 6100, max: 11900, speed: 1.0, hitCD: false
    };

    // ── Zone 3 fast porcupine ─────────────────────────────────────────────
    this._porcZ3 = {
      img: createPorcupineSprite(this, 14500, H - 46, 32, 24).setDepth(9),
      x: 14500, dir: 1, min: 12100, max: 18000, speed: 1.8, hitCD: false
    };

    // ── Stone rain (Zones 2+3) ────────────────────────────────────────────
    this._rockMsgShown = false;
    this._stoneGroup = this.physics.add.group();
    this.physics.add.overlap(this.shadow, this._stoneGroup, (s, rock) => {
      if (!rock.getData('hit')) {
        rock.setData('hit', true);
        this.tweens.add({ targets: rock, alpha: 0, duration: 150, onComplete: () => { if (rock.active) rock.destroy(); } });
        this._onHazardHit();
      }
    });
    this.time.addEvent({
      delay: 1500, loop: true,
      callback: () => {
        if (this._levelDone || !this.shadow || this.shadow.x < 6000) return;
        if (!this._rockMsgShown) {
          this._rockMsgShown = true;
          this._showMessage('⚠️ Watch out! Stones falling! 🪨');
          this.cameras.main.shake(180, 0.007);
        }
        const camX = this.cameras.main.scrollX;
        const b = this._stoneGroup.create(camX + 60 + Math.random() * 680, -20, 'rock');
        b.setDisplaySize(36, 28).setDepth(15);
        b.body.setSize(36, 28, true);
        b.body.setVelocityY(160);
        b.body.setAllowGravity(true);
        this.time.delayedCall(3000, () => { if (b && b.active) b.destroy(); });
      }
    });

    // ── Key overlaps — collect in place, no mini-activity scene ─────────────
    this.physics.add.overlap(this.shadow, this.key1Obj, () => {
      if (this._hasKey1) return;
      this._hasKey1 = true;
      this.key1Obj.destroy();
      this._lightKey(0);
      const sp = this.add.ellipse(K1_X, H - 100, 40, 40, 0xffee44, 0.9).setDepth(20);
      this.tweens.add({ targets: sp, scaleX: 4, scaleY: 4, alpha: 0, duration: 500, onComplete: () => sp.destroy() });
      this.cameras.main.flash(300, 80, 160, 10);
      this._showMessage('🔑 Key 1 found! Keep going — find Key 2! 🗝️');
    });

    this.physics.add.overlap(this.shadow, this.key2Obj, () => {
      if (this._hasKey2) return;
      this._hasKey2 = true;
      this.key2Obj.destroy();
      this._lightKey(1);
      const sp = this.add.ellipse(K2_X, H - 100, 40, 40, 0x44ccff, 0.9).setDepth(20);
      this.tweens.add({ targets: sp, scaleX: 4, scaleY: 4, alpha: 0, duration: 500, onComplete: () => sp.destroy() });
      this.cameras.main.flash(300, 20, 140, 80);
      this._showMessage('🗝️ Key 2 found! Find Gemma\'s cage! 🐾');

      // Checkpoint 2 ("Dodge the Hazards") now fires right on Key 2 pickup,
      // instead of waiting until the player is nearly at Zone 3's entrance.
      if (!this._cp2Done) {
        this._cp2Done = true;
        this._launchCheckpoint('L2_Dodge',
          { emoji: '🐍', title: 'Dodge the Hazards', desc: 'Tap each creature before it bites you!' },
          () => {
            this._saveCheckpoint(K2_X + 20, 360);
            this._showMessage('✅ Path cleared! The dark jungle awaits! 🌑');
          });
      }
    });

    // ── Reach cage overlap ────────────────────────────────────────────────
    this.physics.add.overlap(this.shadow, this.gemmaInCage, () => {
      if (this._levelDone || this._unlocking) return;
      if (this._hasKey1 && this._hasKey2) {
        this._unlocking = true;
        this._movementLocked = true;
        this.shadow.setVelocity(0, 0);
        if (this.shadow.body) this.shadow.body.setVelocity(0, 0);

        const openCage = () => {
          this._levelDone = true;
          this._showMessage('✨ The cage glows… it\'s unlocking! 🔓');
          this._unlockCage();
        };

        if (!this._cageVideoPlayed) {
          this._cageVideoPlayed = true;
          this._playL2Video('l2_cage_video', openCage);
        } else {
          openCage();
        }
      } else if (!this._hintedCage) {
        this._hintedCage = true;
        const missing = !this._hasKey1 ? 'Key 1' : 'Key 2';
        this._showMessage(`You need ${missing} first! 🔑`);
      }
    });

    // ── State flags ────────────────────────────────────────────────────────
    this._zone2Entered    = false;
    this._zone3Entered    = false;
    this._gemmaHPDecaying = false;
    this._movementLocked  = false;
    this._hintedCage      = false;
    this._unlocking       = false;   // guards the cage-reach handler
    this._cp1Done         = false;   // checkpoint-1 game (Road → Jungle)
    this._cp2Done         = false;   // checkpoint-2 game (Dodge the Hazards, now on Key 2 pickup)

    this.time.delayedCall(800, () => this._showMessage('Stage 1 — Road! Find Key 1 at the end! 🔑'));

    // ── Zone skip for menu test buttons ──────────────────────────────────
    const _tp = this.registry.get('l2_testPhase');
    if (_tp === 2) { this.shadow.setPosition(6070, 360); this.shadow.body.reset(6070, 360); }
    else if (_tp === 3) { this.shadow.setPosition(12070, 360); this.shadow.body.reset(12070, 360); }
    if (_tp) this.registry.remove('l2_testPhase');
  }

  // ── Barrel wave spawner (Zone 1, x=3100–5800) ────────────────────────────
  _startBarrelWaves() {
    const waves = [
      { count: 3, speed: 90,  interval: 2400 },
      { count: 4, speed: 160, interval: 1700 },
      { count: 5, speed: 240, interval: 1250 },
    ];
    const runWave = (wi) => {
      if (wi >= waves.length || !this.shadow || this._levelDone) return;
      const wc = waves[wi];
      let spawned = 0;
      const t = this.time.addEvent({
        delay: wc.interval, loop: true,
        callback: () => {
          if (this._levelDone || !this.shadow || this.shadow.x >= 5800) { t.destroy(); return; }
          const b = this.physics.add.image(
            this.cameras.main.scrollX + W + 60, H - 46, 'barrel'
          );
          b.setOrigin(0.5, 1).setDisplaySize(30, 40).setDepth(9);
          b.body.setAllowGravity(false);
          b.body.setVelocityX(-wc.speed);
          b.body.setSize(24, 36, true);
          this._barrelGroup.add(b);
          spawned++;
          if (spawned >= wc.count) {
            t.destroy();
            this.time.delayedCall(2800, () => runWave(wi + 1));
          }
        }
      });
    };
    runWave(0);
  }

  // No leaves in Zone 1 (Road) — jungle leaves only from Zone 2 onward
  _spawnLeaf() {
    if (this.shadow && this.shadow.x < 6000) return;
    super._spawnLeaf();
  }

  // ── Zone progress bar ─────────────────────────────────────────────────────
  // ── Premium shared HUD (same wood/gold look as Level 1) ─────────────────────
  // Overrides BaseLevelScene._buildHUD (called from initLevel) to build the
  // shared PremiumHUD instead of the plain base HUD. It re-creates every field
  // the base gameplay logic reads (_hearts/_hpGraphics/_pointsTxt/timer/etc.),
  // so nothing else in Level 2 changes.
  _buildHUD(config) {
    this._hud = new PremiumHUD(this, {
      chapterLabel: 'CHAPTER 2',
      title: 'RESCUE GEMMA!',
      timer: config.timer,
      worldWidth: config.worldWidth,
      runnerEmoji: '👧',
      zones: [
        { label: 'Z1', color: 0x44cc44 },
        { label: 'Z2', color: 0xf5c840 },
        { label: 'Z3', color: 0xee5522 },
        { label: '🏁', color: 0x8fd0ff },
      ],
    });
    this._hud.build();
  }

  // Route base HP/timer/points logic to the premium header/footer.
  _drawHPPips()       { this._hud?.drawHP(this._shadowHP); }
  _resetTimer(sec)    { this._hud?.resetTimer(sec); }
  _givePoints(n)      { this._hud?.givePoints(n); }
  _spendPoints(n)     { this._hud?.spendPoints(n); }

  // ── Key objective HUD — two gold-key slots in a wood panel, centered on the
  // line just below the title banner. Keys start dim; _lightKey(i) turns one gold.
  _buildKeyHud() {
    const PANEL_W = 78, PANEL_H = 30;
    const px = W / 2 - PANEL_W / 2, py = 54;

    const sh = this.add.graphics().setScrollFactor(0).setDepth(42);
    sh.fillStyle(0x000000, 0.28); sh.fillRoundedRect(px + 2, py + 3, PANEL_W, PANEL_H, 9);
    makePanel(this, px, py, PANEL_W, PANEL_H, 43);

    const cy = py + PANEL_H / 2;
    const slotX = [px + 24, px + PANEL_W - 24];
    this._keySlots = slotX.map((sx) => {
      const slot = this.add.graphics().setScrollFactor(0).setDepth(44);
      slot.fillStyle(0x140c04, 1); slot.fillCircle(sx, cy, 12);
      slot.lineStyle(1.5, 0x8a6018, 1); slot.strokeCircle(sx, cy, 12);
      const glow = this.add.circle(sx, cy, 13, 0xffd24a, 0).setScrollFactor(0).setDepth(44);
      const icon = this.add.image(sx, cy, 'shud_key').setScale(0.34).setScrollFactor(0).setDepth(45)
        .setTint(0x5a4a2a).setAlpha(0.5);
      return { icon, glow, collected: false };
    });
  }

  _lightKey(i) {
    const k = this._keySlots?.[i];
    if (!k || k.collected) return;
    k.collected = true;
    k.icon.clearTint().setTint(0xffe08a).setAlpha(1);
    this.tweens.add({ targets: k.icon, scale: { from: 0.34, to: 0.44 }, duration: 220, yoyo: true, ease: 'Back.easeOut' });
    this.tweens.add({ targets: k.glow, alpha: { from: 0, to: 0.55 }, duration: 400, yoyo: true, repeat: 2,
      onComplete: () => k.glow.setAlpha(0.3) });
  }

  // ── Gemma HP bar ─────────────────────────────────────────────────────────
  _drawGemmaHP() {
    this._gemmaHPBar.clear();
    const bx = 68, by = 48, bw = 88, bh = 7;
    this._gemmaHPBar.fillStyle(0x220000, 1);
    this._gemmaHPBar.fillRoundedRect(bx, by, bw, bh, 3);
    const pct = Math.max(0, this._gemmaHP / 100);
    const col = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xeecc00 : 0xff2200;
    this._gemmaHPBar.fillStyle(col, 1);
    this._gemmaHPBar.fillRoundedRect(bx, by, bw * pct, bh, 3);
  }

  // ── Cage unlock ───────────────────────────────────────────────────────────
  _unlockCage() {
    this.cameras.main.shake(300, 0.012);
    const unlockFx = this.add.text(W / 2, H / 2, '🔑 + 🗝️ = 🔓', { fontSize: '26px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: unlockFx, scale: 1.35, duration: 450, yoyo: true,
      onComplete: () => unlockFx.destroy() });

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: this.gemmaCage, angle: 14, duration: 180, yoyo: true, repeat: 2,
        onComplete: () => {
          this.tweens.add({ targets: [this.gemmaCageBack, this.gemmaCage, this.gemmaInCage], alpha: 0, duration: 600 });
          this.time.delayedCall(900, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(550, () => this.scene.start('L2_Calmer'));
          });
        }
      });
    });
  }

  // ── Launch a checkpoint mini-game as an overlay (platformer freezes) ───────
  // Pauses THIS scene (position, timer, Gemma-HP all freeze), runs the overlay
  // scene on top, and resumes here + runs onWin() once it emits 'cp-done'.
  // Stop any checkpoint overlay that might still be alive (prevents scene stacking)
  _stopCheckpointOverlays() {
    ['L2_Catch', 'L2_Dodge', 'L2_Fireflies'].forEach(k => {
      const s = this.scene.get(k);
      if (s && (this.scene.isActive(k) || this.scene.isPaused(k) || this.scene.isSleeping(k))) {
        s.events.off('cp-done');
        this.scene.stop(k);
      }
    });
  }

  _launchCheckpoint(key, intro, onWin) {
    if (this.shadow?.body) this.shadow.setVelocity(0, 0);
    // Never allow two mini-games at once
    this._stopCheckpointOverlays();
    // Hide the platformer's touch-control footer so everything shows as a clean modal
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';

    // Random mini-game from Level 2's slice of the 40 games — no intro card
    // (matches Level 1's flow: launches straight into the game).
    launchRandomMiniGame(this, 2, () => {
      if (footer) footer.style.display = 'flex';
      // Sync the points HUD with whatever the mini-game just awarded
      this._points = this.registry.get('points') || 0;
      if (this._pointsTxt) this._pointsTxt.setText(`⭐ ${this._points}`);
      onWin();
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update() {
    if (this._pauseMenuOpen) return;
    this._updateBgParallax();

    if (this._roadBgTile && this._roadBgTile.alpha > 0) {
      this._roadBgTile.tilePositionX = this.cameras.main.scrollX * 0.7;
    }

    if (!this._movementLocked) this.updateMovement();
    if (!this.shadow || this._movementLocked) return;

    const sx = this.shadow.x;
    const py = this.shadow.y;

    // ── Premium checkpoint footer follows the player ───────────────────────
    this._hud?.updateFooter(sx);

    // ── Checkpoint 1 (Zone 1) — trigger after collecting Key 1 so the activity
    // feels like part of the first zone, then continue into the jungle.
    if (!this._cp1Done && this._hasKey1 && sx > 5600 && sx < 6200) {
      this._cp1Done = true;
      this._launchCheckpoint('L2_Catch',
        { emoji: '🧺', title: 'Catch the Supplies', desc: 'Catch Gemma\'s supplies — dodge the rocks!' },
        () => {
          this._saveCheckpoint(5680, 360);
          this._showMessage('✅ Supplies recovered! Into the jungle! 🌿');
        });
    }

    // ── Zone 2 entry — triggers exactly at the checkpoint flag (x=5900) ────
    if (!this._zone2Entered && sx >= 5900) {
      this._zone2Entered = true;
      // Stop the character exactly at the flag before the cinematic plays.
      this.shadow.setX(5900);
      if (this.shadow.body) this.shadow.body.setVelocity(0, 0);
      if (!this._bgTransitionTriggered) {
        this._bgTransitionTriggered = true;
        // Swap the bg/ground WHILE the video's own opaque backdrop still fully
        // covers the screen (depth 200+, well above the bg's depth -12), so by
        // the time the video ends OR gets skipped the jungle art is already
        // in place — no crossfade visible after the cinematic closes.
        transitionToL1Visuals(this, 1100);
        if (this._roadBgTile) this.tweens.add({ targets: this._roadBgTile, alpha: 0, duration: 800 });
        this._playL2Video('l2_transition_video', () => {});
      }
      this._saveCheckpoint(6020, 360);
      this._resetTimer(75);
      this._showMessage('🌿 Stage 2 — Jungle! Dodge porcupines & find Key 2! 🗝️');
    }

    // (Checkpoint 2 — Dodge the Hazards — now fires on Key 2 pickup, see key2Obj overlap above)

    // ── Zone 3 entry ──────────────────────────────────────────────────────
    if (!this._zone3Entered && sx > 12000) {
      this._zone3Entered = true;
      this._saveCheckpoint(12020, 360);
      this._resetTimer(95);   // Zone 3 gets +20s over the usual 75s — more hazards to clear
      this._gemmaHPDecaying = true;
      this._gemmaHPBar.setVisible(true);
      this._gemmaHPLabel.setVisible(true);
      this._drawGemmaHP();
      this._rainDrops.forEach(rd => rd.img.setVisible(true));
      this._showMessage('🌑 Stage 3 — Dark Jungle! Gemma\'s cage is ahead! Hurry! 🐾');
    }

    // ── Gemma HP decay (Zone 3) ────────────────────────────────────────────
    if (this._gemmaHPDecaying && !this._levelDone && !this._puzzleActive) {
      this._gemmaHP -= 0.03;
      if (this._gemmaHP <= 0) {
        this._gemmaHP = 0;
        this._drawGemmaHP();
        this._levelDone      = true;
        this._movementLocked = true;
        this._showMessage('💔 Gemma\'s health is gone! Try again!');
        this.cameras.main.shake(400, 0.015);
        this.time.delayedCall(1500, () => this._loseLife(0.015));
        return;
      }
      this._drawGemmaHP();
    }

    // ── Zone 3 rain ───────────────────────────────────────────────────────
    if (this._zone3Entered && this._rainDrops) {
      this._rainDrops.forEach(rd => {
        rd.img.y += rd.vy;
        if (rd.img.y > H + 20) rd.img.y = -12;
      });
    }

    // ── Moving platforms (Zone 2) ──────────────────────────────────────────
    if (this._movingPlats && sx > 6000 && sx < 12100) {
      this._movingPlats.forEach(mp => {
        mp.t += mp.speed * 0.02;
        const newX = mp.baseX + Math.sin(mp.t) * mp.range;
        const dx = newX - mp.img.x;
        mp.img.body.reset(newX, mp.y);
        mp.img.body.setVelocityX(dx * 60);
      });
    }

    // ── Road hazards (Zone 1) ──────────────────────────────────────────────
    if (this._roadHazards && sx < 6000) {
      this._roadHazards.forEach(h => {
        if (sx > h.x && sx < h.x + h.w && py > h.y - 10 && !this._roadHazardCD) {
          this._roadHazardCD = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._roadHazardCD = false; });
        }
      });
    }

    // ── Zone 1 barrel zone entry + rolling barrel update ──────────────────
    if (!this._barrelZoneEntered && sx > 3100 && sx < 6000) {
      this._barrelZoneEntered = true;
      this._startBarrelWaves();
      this._showMessage('🛢️ Barrels incoming! Jump over them! 🦘');
    }
    if (this._barrelGroup && sx < 6000) {
      const camLeft = this.cameras.main.scrollX - 80;
      this._barrelGroup.getChildren().forEach(b => {
        b.angle -= 3.5; // rolling spin visual
        if (b.x < camLeft) b.destroy();
      });
    }

    // ── Spike hazards (Zone 3) ────────────────────────────────────────────
    if (this._spikes && sx > 12000) {
      this._spikes.forEach(s => {
        if (sx > s.x && sx < s.x + s.w && py > s.y - 10 && !this._spikeCD) {
          this._spikeCD = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._spikeCD = false; });
        }
      });
    }

    // ── Cactus thorn hazards (Zone 2 + Zone 3) ────────────────────────────
    if (this._thorns) {
      this._thorns.forEach(t => {
        if (sx > t.x && sx < t.x + t.w && py > t.y - 10 && !this._thornCD) {
          this._thornCD = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._thornCD = false; });
        }
      });
    }

    // ── Zone 2 porcupine patrol ───────────────────────────────────────────
    if (this._porcZ2 && sx > 6000 && sx < 12100) {
      const p = this._porcZ2;
      p.x += p.dir * p.speed;
      if (p.x >= p.max) { p.x = p.max; p.dir = -1; }
      if (p.x <= p.min) { p.x = p.min; p.dir =  1; }
      // Source art (porcupine/01-06.png) faces LEFT natively, so it needs
      // flipping when walking RIGHT (dir>0) to actually face its walk direction.
      p.img.setX(p.x).setFlipX(p.dir > 0);
      if (Math.abs(p.x - sx) < 48 && Math.abs((H - 46) - py) < 50 && !p.hitCD) {
        p.hitCD = true; this._onHazardHit();
        this.time.delayedCall(1200, () => { p.hitCD = false; });
      }
    }

    // ── Zone 3 fast porcupine patrol ─────────────────────────────────────
    if (this._porcZ3 && sx > 12000) {
      const p = this._porcZ3;
      p.x += p.dir * p.speed;
      if (p.x >= p.max) { p.x = p.max; p.dir = -1; }
      if (p.x <= p.min) { p.x = p.min; p.dir =  1; }
      // Source art (porcupine/01-06.png) faces LEFT natively, so it needs
      // flipping when walking RIGHT (dir>0) to actually face its walk direction.
      p.img.setX(p.x).setFlipX(p.dir > 0);
      if (Math.abs(p.x - sx) < 44 && Math.abs((H - 46) - py) < 50 && !p.hitCD) {
        p.hitCD = true; this._onHazardHit();
        this.time.delayedCall(1200, () => { p.hitCD = false; });
      }
    }

    // ── Collapsing platforms (Zone 3) ─────────────────────────────────────
    // Triggers only when player is actually STANDING ON the log:
    //   - within 65 px horizontally (platform half-width)
    //   - py < cp.y (player centre is above platform centre = standing on top)
    // Then shakes for 600 ms before dropping so player can react and jump off.
    if (this._collapsing && sx > 12000) {
      this._collapsing.forEach(cp => {
        if (cp.triggered) return;
        const onPlatform = Math.abs(sx - cp.x) < 65 && py < cp.y + 5 && py > cp.y - 60;
        if (!onPlatform) return;
        cp.triggered = true;

        // Find the visual platform object now so we can shake it
        const toFall = this.platGroup.getChildren().filter(p => Math.abs(p.x - cp.x) < 55);

        // 600 ms shake warning
        toFall.forEach(p => {
          this.tweens.add({ targets: p, x: p.x + 3, duration: 80, yoyo: true, repeat: 3 });
        });
        this.cameras.main.shake(180, 0.006);

        // After 900 ms — drop the log
        this.time.delayedCall(900, () => {
          toFall.forEach(p => {
            if (!p.active) return;
            const { x, y, displayWidth: dw, displayHeight: dh } = p;
            const key = p.texture.key;
            p.destroy();
            const vis = this.add.image(x, y, key).setDisplaySize(dw, dh).setDepth(8);
            this.tweens.add({
              targets: vis, y: y + 200, alpha: 0,
              angle: (Math.random() - 0.5) * 40, duration: 380, ease: 'Power2',
              onComplete: () => vis.destroy()
            });
          });
          this.cameras.main.shake(120, 0.01);
        });
      });
    }
  }

}

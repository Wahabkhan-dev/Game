import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL4Assets, generateL4StreetAssets } from './L4Assets.js';
import { preloadGlendaSkin, applyGlendaSkin } from './L4_GlendaSkin.js';
import { generatePremiumHudTextures, buildLevelBanner, buildCheckpointBoard, buildTimerArt, buildCoinArt, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { launchRandomMiniGame, resetGameHistory } from '../../../utils/MiniGamePicker.js';
import { playVideoOverlay } from '../../../utils/VideoOverlay.js';

// ── Level 4 — Build Gamma's New Home: 3 checkpoints to collect 6 materials ──
// CP1: Wood + Roof (x: 0-4000)  |  CP2: Nails + Paint (x: 4000-8000)  |  CP3: Bedding + Bowl (x: 8000-12000)
const WORLD_W  = 12200;
const GROUND_Y = 408;
const RUN_SPEED = 230;
const JUMP_V    = -440;

// 6 required items split into 3 checkpoints (key, label, texture, world x, checkpoint)
const ITEMS = [
  { key: 'wood',    label: 'Wood Plank',   tex: 'l4_wood',      x: 1200, w: 72, h: 40, cp: 1 },
  { key: 'roof',    label: 'Roof Panel',   tex: 'l4_roof',      x: 3200, w: 73, h: 40, cp: 1 },
  { key: 'nails',   label: 'Nails Box',    tex: 'l4_nails',     x: 5200, w: 47, h: 48, cp: 2 },
  { key: 'paint',   label: 'Paint Bucket', tex: 'l4_paint',     x: 7200, w: 40, h: 54, cp: 2 },
  { key: 'bedding', label: 'Soft Bedding', tex: 'l4_bed',       x: 9200, w: 63, h: 44, cp: 3 },
  { key: 'bowl',    label: 'Food Bowl',    tex: 'l4_food_bowl', x: 11200, w: 62, h: 44, cp: 3 },
];

// obstacles: jump over them (collision when grounded = lose a heart)
// w/h tuned to each real-image aspect ratio (flat = low puddles/potholes)
const OBSTACLES = [
  { tex: 'l4_cone',   x: 900,   w: 46, h: 48 },
  { tex: 'l4_puddle', x: 2050,  w: 84, h: 22, flat: true },
  { tex: 'l4_boxes',  x: 2750,  w: 42, h: 54 },
  { tex: 'l4_bin',    x: 4250,  w: 50, h: 58 },
  { tex: 'l4_cone',   x: 4900,  w: 46, h: 48 },
  { tex: 'l4_pothole',x: 5300,  w: 90, h: 28, flat: true, hole: true },
  { tex: 'l4_bike',   x: 6700,  w: 70, h: 50 },
  { tex: 'l4_boxes',  x: 7300,  w: 42, h: 54 },
  { tex: 'l4_pothole',x: 8200,  w: 90, h: 28, flat: true, hole: true },
  { tex: 'l4_bin',    x: 8800,  w: 50, h: 58 },
  { tex: 'l4_puddle', x: 9400,  w: 84, h: 22, flat: true },
  { tex: 'l4_cone',   x: 10700, w: 46, h: 48 },
  { tex: 'l4_pothole',x: 11050, w: 90, h: 28, flat: true, hole: true },
  { tex: 'l4_boxes',  x: 11300, w: 42, h: 54 },
];

export class Level4Scene extends Phaser.Scene {
  constructor() { super('Level4'); }

  preload() {
    preloadGlendaSkin(this);
  }

  create() {
    // Fresh playthrough (including a restart after game over) — clear which
    // mini-games have already been shown so this level's trigger points
    // can't repeat one.
    resetGameHistory(4);

    generateL4Assets(this);
    generateL4StreetAssets(this);

    this.physics.world.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);

    this._collected = {};
    this._lives = 3;              // 3 lives (hearts) — same model as Level 2
    this._shadowHP = 3;           // 3 HP pips per life (one hazard hit = -1 pip)
    this._damageCD = false;       // brief invulnerability after a hit (stops re-trigger glitch)
    this._falling = false;        // true while dropping into a pothole
    this._done = false;

    // Rolling-ball hazards — a ball rolls toward the player; jump it or get knocked back
    this._balls = [];
    this._ballFirst = true;
    this._ballZones = [1300, 2200, 3000, 3900, 4700, 5600, 6500, 7400, 8400, 9100, 10000, 10800]
      .map(x => ({ x, fired: false }));
    this._returning = false;
    this._currentCP = 1;
    this._paused = false;

    // Checkpoint respawn tracking
    this._lastCheckpoint = null;  // { x, y, cp }
    this._cp1Done = false;
    this._cp2Done = false;
    this._cp3Done = false;

    // Stop any leftover checkpoint overlays from previous attempts
    this._stopCheckpointOverlays();

    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';

    this._buildBackground();
    this._buildRoad();
    this._buildProps();
    this._buildItems();
    this._buildObstacles();
    this._buildPlayer();
    applyGlendaSkin(this);
    this._buildHUD();
    this._buildControls();

    this.events.once('shutdown', () => this._stopCheckpointOverlays());
    this.time.delayedCall(400, () => this._toast("🏠 Checkpoint 1: Collect Wood & Roof!"));
  }

  // ── BACKGROUND — real art (backgorund-l4.jpg), same technique as Level 3 ────
  // Ends exactly where _buildRoad's ground band begins (topY) so the two touch
  // with no gap AND no overlap — filling the full screen height (tried before)
  // let the background stretch behind the ground band for no visible reason.
  _buildBackground() {
    if (this.textures.exists('l4_bg_main')) {
      const topY = GROUND_Y - 16;   // must match _buildRoad's topY
      const img = this.textures.get('l4_bg_main').getSourceImage();
      this._bgMain = this.add.tileSprite(W / 2, topY / 2, W, topY, 'l4_bg_main').setScrollFactor(0).setDepth(-30);
      this._bgMain.tileScaleX = this._bgMain.tileScaleY = topY / img.height;   // fit height, repeat width
      return;
    }
    // Fallback: old procedural two-layer sky + cottages
    this._sky = this.add.tileSprite(W / 2, H / 2, W, H, 'l4_bg_sky').setScrollFactor(0).setDepth(-30);
    const skyImg = this.textures.get('l4_bg_sky').getSourceImage();
    this._sky.tileScaleX = this._sky.tileScaleY = H / skyImg.height;

    const bandH = 240;
    const hImg = this.textures.get('l4_bg_houses').getSourceImage();
    this._houses = this.add.tileSprite(W / 2, (GROUND_Y + 10) - bandH / 2, W, bandH, 'l4_bg_houses')
      .setScrollFactor(0).setDepth(-20);
    this._houses.tileScaleX = this._houses.tileScaleY = bandH / hImg.height;
  }

  // ── GROUND (world space) — real art (Level 04 bottom.png), falls back to the
  // old grass-topped stone paver strip if it isn't loaded ─────────────────────
  _buildRoad() {
    // Band runs from just above the player's feet line down to the SCREEN BOTTOM
    // (no overflow past it). We show exactly ONE full copy of the image height so
    // the whole art (top kerb → wood planks → bottom kerb + flowers) is visible
    // — not zoomed in with the lower half cut off below the screen — and let it
    // LOOP horizontally across the level via the tileSprite.
    const topY = GROUND_Y - 16;
    const bandH = H - topY;                 // exactly down to the screen bottom
    const groundKey = this.textures.exists('l4_ground_bottom') ? 'l4_ground_bottom' : 'l4_ground';
    const gImg = this.textures.get(groundKey).getSourceImage();
    this._groundTile = this.add.tileSprite(WORLD_W / 2, topY + bandH / 2, WORLD_W, bandH, groundKey).setDepth(0);
    // One full image copy == band height → full height shown, no vertical repeat
    // or crop; same scale on X keeps it tiling (looping) cleanly across the world.
    this._groundTile.tileScaleX = this._groundTile.tileScaleY = bandH / gImg.height;

    // physics ground (invisible static body)
    const g = this.add.rectangle(WORLD_W / 2, GROUND_Y + 14, WORLD_W, 28, 0, 0);
    this.physics.add.existing(g, true);
    this._ground = g;
  }

  // ── Society props + section landmarks ───────────────────────────────────────
  _buildProps() {
    const GY = GROUND_Y + 8;   // visual ground line for bottom-anchored props
    const place = (x, key, h, depth = 4, tint = null) => {
      const img = this.textures.get(key).getSourceImage();
      const w = h * (img.width / img.height);
      const s = this.add.image(x, GY, key).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(depth);
      if (tint) s.setTint(tint);
      return s;
    };

    // Bushes scattered along the walk
    [500, 1800, 2600, 4000, 5400, 6800, 8000, 9600, 10600, 11800].forEach(x => place(x, 'l4_bush', 70, 4));

    // Street lamps + benches
    [1400, 4600, 7600, 10400].forEach(x => place(x, 'l4_lamp', 150, 4));
    [2400, 7000, 9900].forEach(x => place(x, 'l4_bench', 78, 4));

    // ── Checkpoint flags — visible markers at the two mid-level checkpoint
    // boundaries (CP1→CP2 at ~4000, CP2→CP3 at ~8000). Same art + size + ground
    // anchoring as Level 2 (checkpoint_flag.png ratio → 56×139, origin bottom).
    this._cpFlags = [4200, 8300].map(fx =>
      this.add.image(fx, GY, 'checkpoint_flag').setDisplaySize(56, 139).setOrigin(0.5, 1).setDepth(5)
    );

    // Society section labels (floating banner — gate image removed)
    const gate = (x, txt) => {
      this.add.text(x, GY - 150, txt, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#5a3d1a', stroke: '#fff8', strokeThickness: 3, backgroundColor: '#ffffffcc', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(6);
    };
    gate(2300, '🛒 GROCERY');
    gate(4700, '🏘️ HOMES');
    gate(7000, '🌳 PARK');
    gate(9300, '🏪 MARKET');
    gate(11600, '🏡 HOME ZONE');
  }

  // ── COLLECTIBLE ITEMS ───────────────────────────────────────────────────────
  _buildItems() {
    this._itemObjs = ITEMS.map(it => {
      const y = GROUND_Y - 36;
      const img = this.add.image(it.x, y, it.tex).setDisplaySize(it.w, it.h).setDepth(8);
      this.tweens.add({ targets: img, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const glow = this.add.circle(it.x, y, 30, 0xfff0a0, 0.18).setDepth(7);
      this.tweens.add({ targets: glow, alpha: 0.4, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
      // floating label
      this.add.text(it.x, y - 34, it.label, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0008', strokeThickness: 3 }).setOrigin(0.5).setDepth(9);
      return { ...it, img, glow, taken: false };
    });
  }

  _buildObstacles() {
    this._obsObjs = OBSTACLES.map(o => {
      // All obstacles sit ON the road surface (GROUND_Y + 6 is where road starts)
      // setOrigin(0.5, 1) means bottom-center, so y-position is the bottom
      const y = GROUND_Y + 20;
      const img = this.add.image(o.x, y, o.tex).setOrigin(0.5, 1).setDisplaySize(o.w, o.h).setDepth(7);
      // clearY = the height the player's feet must rise ABOVE (by jumping) to avoid the hit
      const clearY = y - o.h - 12;
      return { ...o, img, clearY };
    });
  }

  // ── PLAYER ── use Gleeda with Level 2 sprite setup ──────────────────────────
  _buildPlayer() {
    // Gleeda sprite (same as Level 2)
    this.player = this.physics.add.sprite(80, GROUND_Y - 40, 'gleeda_idle').setDepth(10);
    this.player.setScale(0.18);   // → 122×66px, same as Level 2
    this.player.body.setSize(73, 56, true);
    this.player.setCollideWorldBounds(true);
    this._groundCollider = this.physics.add.collider(this.player, this._ground);

    // Animations are now set up by L4_GlendaSkin (after this method is called in create)

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);   // slight lag = premium feel
    this._facing = 1;
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _buildHUD() {
    // ── Health: finalized real-art panel (lifebg.png + heart.png + health-bar.png) ──
    generatePremiumHudTextures(this);

    // level banner — real art at the approved L1/L2 size (never stretched)
    const ban = buildLevelBanner(this, 'CHAPTER 4', "BUILD GAMMA'S HOME", 48);

    // health panel (left), centred on the banner midline
    const HPx = 8, HPh = 42, HPy = ban.midY - HPh / 2, HPw = 140;
    this.add.image(HPx, HPy, 'ui_life_bg').setOrigin(0, 0)
      .setDisplaySize(HPw, HPh).setScrollFactor(0).setDepth(48);

    const colX = [HPx + 39, HPx + 70, HPx + 101];
    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(colX[i], HPy + 13, 'heart').setDisplaySize(22, 20).setScrollFactor(0).setDepth(50);
      if (i >= this._lives) { h.setTint(0x444444); h.setAlpha(0.25); }
      this._hearts.push(h);
    }
    this._hpBars = colX.map(cx => this.add.image(cx, HPy + 30, 'ui_health_bar')
      .setDisplaySize(26, 8).setScrollFactor(0).setDepth(50));
    this._drawHPPips();

    // checkpoint board (title + item collection) — just below the banner
    const { cpTxt, itemHud } = buildCheckpointBoard(this, 1, 'Collect Wood & Roof', ITEMS, 48, ban.bottom + 4);
    this._cpTxt = cpTxt;
    this._itemHud = itemHud;

    // ── right cluster: timer · coin · menu (centred on the banner midline) ──
    const ROW_CY = ban.midY;
    const mSz = 38, mCx = W - 16 - mSz / 2, mCy = ROW_CY;
    const coinW = 60, coinX = (mCx - mSz / 2) - 8 - coinW, coinY = ROW_CY - 20;
    const tmrW = 72, tmrX = coinX - 8 - tmrW, tmrY = ROW_CY - 20;

    // functional countdown timer
    this._timerFull = 120; this._timeLeft = 120;
    this._timerTxt = buildTimerArt(this, tmrX, tmrY, tmrW, 40, `${this._timeLeft}s`, 50);
    this._timerEvt = this.time.addEvent({ delay: 1000, loop: true, callback: () => this._tickTimer() });

    // functional coin/points counter (earned per item collected)
    this._points = this.registry.get('points') || 0;
    this._pointsTxt = buildCoinArt(this, coinX, coinY, coinW, 40, this._points, 50);

    // menu button — finalized real-art medallion (menu-bg.png)
    const menuImg = this.add.image(mCx, mCy, 'ui_menu_bg').setDisplaySize(mSz, mSz).setScrollFactor(0).setDepth(50);
    const menuHit = this.add.circle(mCx, mCy, mSz / 2 + 3, 0, 0).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true });
    menuHit.on('pointerover', () => this.tweens.add({ targets: menuImg, displayWidth: mSz * 1.12, displayHeight: mSz * 1.12, duration: 120 }));
    menuHit.on('pointerout',  () => this.tweens.add({ targets: menuImg, displayWidth: mSz, displayHeight: mSz, duration: 120 }));
    menuHit.on('pointerdown', () => { menuImg.y += 1; });
    menuHit.on('pointerup',   () => { menuImg.y -= 1; this._togglePause(); });
  }

  // Countdown tick — at 0, lose a life and refill the clock (Level-1 behaviour)
  _tickTimer() {
    if (this._done || this._paused) return;
    this._timeLeft = Math.max(0, this._timeLeft - 1);
    if (this._timerTxt) {
      this._timerTxt.setText(`${this._timeLeft}s`);
      this._timerTxt.setColor(this._timeLeft <= 10 ? '#ff5a3a' : THEME.goldTxt);
    }
    if (this._timeLeft <= 0) {
      this._timeLeft = this._timerFull;
      if (this._timerTxt) { this._timerTxt.setText(`${this._timerFull}s`); this._timerTxt.setColor(THEME.goldTxt); }
      this._toast("⏱ Out of time! -1 life");
      this._loseLife();
    }
  }

  // Award coins/points and update the counter
  _addPoints(n) {
    this._points = (this._points || 0) + n;
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`${this._points}`);
  }

  _buildControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._done || this._paused) return;

    // Dropping into a pothole — let gravity pull the player down, then respawn
    if (this._falling) {
      this.player.play('gleeda_jump_anim', true);
      if (this.player.y > H + 60) this._onHoleFell();
      return;
    }

    const ts = window._touchState || {};
    const p = this.player, onGround = p.body.blocked.down || p.body.touching.down;

    let vx = 0;
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    const jump  = this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;


    if (left)  { vx = -RUN_SPEED; this._facing = -1; }
    if (right) { vx =  RUN_SPEED; this._facing =  1; }
    p.setVelocityX(vx);
    p.setFlipX(this._facing < 0);

    if (jump && onGround) { p.setVelocityY(JUMP_V); }

    // animation (same as Level 2)
    if (!onGround) { p.play('gleeda_jump_anim', true); }
    else if (vx !== 0) { p.play('gleeda_walk', true); }
    else { p.play('gleeda_idle_anim', true); }

    // society parallax (tilePosition in texture px)
    const sx2 = this.cameras.main.scrollX;
    if (this._bgMain) this._bgMain.tilePositionX = sx2 * 0.15 / this._bgMain.tileScaleX;
    if (this._sky)    this._sky.tilePositionX    = sx2 * 0.12 / this._sky.tileScaleX;
    if (this._houses) this._houses.tilePositionX = sx2 * 0.45 / this._houses.tileScaleX;

    this._checkItems();
    this._checkFlags();
    this._checkObstacles(onGround);
    this._checkBalls();
    this._checkHome();
  }

  // Crossing a checkpoint flag saves the respawn point there and shows the
  // "✅ CHECKPOINT!" banner — same as Level 2's flag crossings. Fires once per flag.
  _checkFlags() {
    if (!this._cpFlags) return;
    const px = this.player.x;
    this._cpFlags.forEach(flag => {
      if (!flag.getData('reached') && px >= flag.x) {
        flag.setData('reached', true);
        this._saveCheckpoint(flag.x, GROUND_Y - 40, this._currentCP);
        this.tweens.add({ targets: flag, scaleX: flag.scaleX * 1.12, scaleY: flag.scaleY * 1.12, duration: 160, yoyo: true });
      }
    });
  }

  _checkItems() {
    const p = this.player;
    this._itemObjs.forEach(it => {
      if (it.taken) return;
      if (Math.abs(p.x - it.x) < 40 && Math.abs(p.y - it.img.y) < 70) {
        it.taken = true;
        this._collected[it.key] = true;
        this.tweens.killTweensOf(it.img); this.tweens.killTweensOf(it.glow);
        it.glow.destroy();
        this.tweens.add({ targets: it.img, y: it.img.y - 40, alpha: 0, scale: 1.4, duration: 450, onComplete: () => it.img.destroy() });
        this._sparkle(it.x, it.img.y);
        // HUD
        const h = this._itemHud[it.key];
        h.icon.setAlpha(1); h.chk.setText('✓').setColor('#66ff88').setFontSize(13);
        this._addPoints(50);
        this._toast(`✓ ${it.label} Collected!  +50`);
        // Check if all items in this checkpoint are collected
        const cpItems = ITEMS.filter(i => i.cp === it.cp);
        const cpDone = cpItems.every(i => this._collected[i.key]);
        if (cpDone && it.cp < 3) this._checkpointReached(it.cp);
        if (Object.keys(this._collected).length === ITEMS.length) this._allCollected();
      }
    });
  }

  _checkObstacles(onGround) {
    if (this._damageCD || this._done || this._falling) return;
    const p = this.player;
    for (const o of this._obsObjs) {
      if (Math.abs(p.x - o.x) < (o.w / 2 + 14) && p.body.bottom > o.clearY + 4) {
        if (o.hole) { this._fallInHole(o); return; }   // pothole → drop in
        // Knock the player back AWAY from the obstacle so it can't re-collide
        // (this is what stops the repeated shake/flash "hang" glitch)
        const dir = (p.x <= o.x) ? -1 : 1;
        p.setPosition(o.x + dir * (o.w / 2 + 30), p.y);
        p.setVelocityX(dir * 160);
        p.setVelocityY(-180);
        this._takeHit();
        break;
      }
    }
  }

  // ── POTHOLE — the player drops through the ground, loses a life, respawns ──
  _fallInHole(o) {
    if (this._falling || this._damageCD || this._done) return;
    this._falling = true;
    this._damageCD = true;
    if (this._groundCollider) this._groundCollider.active = false;   // open the ground so they fall
    const p = this.player;
    p.setCollideWorldBounds(false);   // so they can drop below the screen
    p.setPosition(o.x, p.y);
    p.setVelocityX(0);
    p.setVelocityY(140);
    this.cameras.main.shake(160, 0.008);
    this._toast('🕳️ Watch the potholes!');
  }

  _onHoleFell() {
    this._falling = false;
    this._loseLife();   // falling in a hole costs a whole life, then respawns at checkpoint
  }

  // ── ROLLING BALL HAZARD — rolls toward the player; jump it or get knocked back ──
  _spawnBall(x) {
    const r = 23;
    const tex = this.textures.exists('l4_ball') ? 'l4_ball' : 'l4_coin';
    const img = this.add.image(x, GROUND_Y - r, tex).setDisplaySize(r * 2, r * 2).setDepth(9);
    this._balls.push({ img, r, speed: 3.4 });
    if (this._ballFirst) { this._ballFirst = false; this._toast('⚽ Rolling ball! Jump over it!'); }
  }

  _checkBalls() {
    if (this._done) return;
    const p = this.player, cam = this.cameras.main;

    // Spawn a ball (ahead of the player, rolling back toward them) when a zone is crossed
    for (const z of this._ballZones) {
      if (!z.fired && p.x > z.x) { z.fired = true; this._spawnBall(p.x + W * 0.55); }
    }

    for (let i = this._balls.length - 1; i >= 0; i--) {
      const b = this._balls[i];
      b.img.x -= b.speed;                 // roll left, toward the player
      b.img.rotation -= b.speed / b.r;    // spin while rolling
      // gone off the left edge → remove
      if (b.img.x < cam.scrollX - 90) { b.img.destroy(); this._balls.splice(i, 1); continue; }
      // hit — only if the player hasn't jumped above the ball
      const ballTop = b.img.y - b.r;
      if (!this._damageCD && Math.abs(p.x - b.img.x) < (b.r + 16) && p.body.bottom > ballTop + 6) {
        const dir = (p.x <= b.img.x) ? -1 : 1;
        p.setPosition(b.img.x + dir * (b.r + 28), p.y);
        p.setVelocityX(dir * 160);
        p.setVelocityY(-180);
        this._takeHit();
        this.tweens.add({ targets: b.img, y: b.img.y - 36, alpha: 0, angle: '+=180', duration: 300, onComplete: () => b.img.destroy() });
        this._balls.splice(i, 1);
      }
    }
  }


  _checkHome() {
    if (!this._returning) return;
    const p = this.player;
    if (p.x > WORLD_W - 120) {
      this._done = true;
      // Reach-home cinematic (opaque overlay, no fade needed beforehand) —
      // then fade to the build/decorate scene once it finishes.
      playVideoOverlay(this, 'l4_after_home', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('L4_Decorate'));
      });
    }
  }

  _allCollected() {
    this._returning = true;
    this._toast('✅ All materials collected! Return home →');
    // Finished doghouse goal + arrow at the end
    const fImg = this.textures.get('l4_house_finished').getSourceImage();
    const fh = 170, fw = fh * (fImg.width / fImg.height);
    this.add.image(WORLD_W - 80, GROUND_Y + 8, 'l4_house_finished').setOrigin(0.5, 1).setDisplaySize(fw, fh).setDepth(6);
    this.add.image(WORLD_W - 80, GROUND_Y - 178, 'l4_homesign').setDisplaySize(96, 46).setDepth(9);
    // arrow above player
    this._arrow = this.add.text(0, 0, '➡️', { fontSize: '26px' }).setScrollFactor(0).setDepth(52);
    this.tweens.add({ targets: this._arrow, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  // ── checkpoint reached ────────────────────────────────────────────────────────
  _stopCheckpointOverlays() {
    ['L4_CP1', 'L4_CP2', 'L4_CP3'].forEach(k => {
      const s = this.scene.get(k);
      if (s && (this.scene.isActive(k) || this.scene.isPaused(k) || this.scene.isSleeping(k))) {
        s.events.off('cp-done');
        this.scene.stop(k);
      }
    });
  }

  _checkpointReached(cp) {
    const cpKey = `_cp${cp}Done`;
    if (this[cpKey]) return;  // Already triggered
    this[cpKey] = true;
    this._currentCP = cp + 1;
    const names = ['', 'Wood & Roof', 'Nails & Paint', 'Bedding & Bowl'];
    const overlayKey = `L4_CP${cp}`;

    // Intro cards themed to the build-a-home story
    const intros = {
      1: { emoji: '🔨', title: 'Build the Frame', desc: 'Drag the wood & roof pieces\ninto the house blueprint!' },
      2: { emoji: '🎨', title: 'Nail & Paint Pattern', desc: 'Watch the build order,\nthen repeat it to fix the wall!' },
      3: { emoji: '🐶', title: 'Welcome Gamma Home', desc: 'Pick the right comfort item\nto settle Gamma into her new bed!' },
    };

    // Save checkpoint position for respawn
    this._saveCheckpoint(this.player.x, GROUND_Y - 40, cp);

    this._launchCheckpoint(overlayKey, intros[cp], () => {
      this._cpTxt.setText(`CHECKPOINT ${cp} CLEAR — Next: ${names[cp + 1] || 'Return Home'}`);
    });
  }

  // ── Play / Skip intro card (same look & flow as Level 2's _showActivityIntro)
  _showCheckpointIntro(intro, onPlay) {
    const W2 = W / 2, H2 = H / 2, PW = 320, PH = 236;
    const px = W2 - PW / 2, py = H2 - PH / 2;
    const td = [];
    const cx = this.cameras.main.scrollX;

    td.push(this.add.rectangle(cx + W2, H2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(72).setInteractive());
    const pg = this.add.graphics().setScrollFactor(0).setDepth(73);
    pg.fillStyle(0x120e08, 0.97); pg.fillRoundedRect(px, py, PW, PH, 16);
    pg.lineStyle(2.5, 0xf5c87a, 0.85); pg.strokeRoundedRect(px, py, PW, PH, 16);
    td.push(pg);
    td.push(this.add.text(W2, py + 38, intro.emoji, { fontSize: '38px' }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 88, intro.title, { fontSize: '19px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 122, intro.desc, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(74));

    const close = () => td.forEach(o => { try { o.destroy(); } catch (_) {} });

    // ▶ Play
    const playG = this.add.graphics().setScrollFactor(0).setDepth(74);
    const drawP = (h) => { playG.clear(); playG.fillStyle(h ? 0x3a8820 : 0x1e5c0e, 0.95); playG.fillRoundedRect(W2 - 118, py + PH - 64, 108, 40, 9); playG.lineStyle(2, h ? 0x88ff44 : 0x44aa22, 1); playG.strokeRoundedRect(W2 - 118, py + PH - 64, 108, 40, 9); };
    drawP(false); td.push(playG);
    const pTxt = this.add.text(W2 - 64, py + PH - 44, '▶  Play', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#88ff66' }).setOrigin(0.5).setScrollFactor(0).setDepth(75);
    td.push(pTxt);
    const pHit = this.add.rectangle(W2 - 64, py + PH - 44, 108, 40, 0, 0).setScrollFactor(0).setDepth(76).setInteractive({ useHandCursor: true });
    td.push(pHit);
    pHit.on('pointerover', () => { drawP(true); pTxt.setColor('#fff'); });
    pHit.on('pointerout',  () => { drawP(false); pTxt.setColor('#88ff66'); });
    pHit.on('pointerup',   () => { close(); onPlay(); });

    // ⏭ Skip (costs 5 ⭐)
    const SKIP = 5;
    const pts = this.registry.get('points') || 0;
    const canAfford = pts >= SKIP;
    const skipG = this.add.graphics().setScrollFactor(0).setDepth(74);
    const drawS = (h) => { skipG.clear(); skipG.fillStyle(canAfford ? (h ? 0x5a1a1a : 0x3a0e0e) : 0x2a2a2a, 0.95); skipG.fillRoundedRect(W2 + 10, py + PH - 64, 108, 40, 9); skipG.lineStyle(2, canAfford ? (h ? 0xff6666 : 0x883333) : 0x555555, 1); skipG.strokeRoundedRect(W2 + 10, py + PH - 64, 108, 40, 9); };
    drawS(false); td.push(skipG);
    const sTxt = this.add.text(W2 + 64, py + PH - 44, canAfford ? `⏭ Skip\n-${SKIP} ⭐` : `Need ${SKIP} ⭐`, { fontSize: '12px', fontFamily: 'Georgia, serif', color: canAfford ? '#ff9999' : '#666', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(75);
    td.push(sTxt);
    if (canAfford) {
      const sHit = this.add.rectangle(W2 + 64, py + PH - 44, 108, 40, 0, 0).setScrollFactor(0).setDepth(76).setInteractive({ useHandCursor: true });
      td.push(sHit);
      sHit.on('pointerover', () => { drawS(true); sTxt.setColor('#fff'); });
      sHit.on('pointerout',  () => { drawS(false); sTxt.setColor('#ff9999'); });
      sHit.on('pointerup',   () => { close(); this.registry.set('points', pts - SKIP); this._toast(`Skipped! -${SKIP} ⭐`); this._resumeFromCheckpoint(); });
    }
  }

  _launchCheckpoint(key, intro, onWin) {
    if (this.player?.body) this.player.setVelocity(0, 0);
    this._stopCheckpointOverlays();
    this._paused = true;
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';
    this._cpOnWin = onWin;

    // Random mini-game from Level 4's slice of the 40 games — no intro card
    // (matches Level 1's flow: launches straight into the game).
    launchRandomMiniGame(this, 4, () => {
      if (footer) footer.style.display = 'flex';
      this._resumeFromCheckpoint();
    });
  }

  // Resume the platformer after a checkpoint card/mini-game closes.
  // applyDamage=true means the player made a wrong choice → lose 1 HP pip.
  _resumeFromCheckpoint(applyDamage = false) {
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this._paused = false;
    this.physics.resume();
    if (applyDamage) {
      this._damageCD = false;
      this._takeHit();   // -1 pip; cascades to life-loss/respawn via the shared model
    } else if (this._cpOnWin) {
      this._cpOnWin();
    }
    this._cpOnWin = null;
  }

  // ── HP pips (3 graphical rectangles, green=3 / yellow=2 / red=1) — Level 2 style
  _drawHPPips() {
    if (!this._hpBars) return;
    const activeCol = this._shadowHP >= 3 ? 0x33dd33 : this._shadowHP === 2 ? 0xeecc00 : 0xff3300;
    this._hpBars.forEach((bar, i) => {
      if (i < this._shadowHP) { bar.setTint(activeCol); bar.setAlpha(1); }
      else { bar.setTint(0x444444); bar.setAlpha(0.25); }
    });
  }

  // ── One hazard hit = lose 1 HP pip (3 hits = 1 life lost) — Level 2 model ──
  _takeHit() {
    if (this._damageCD || this._done) return;
    this._damageCD = true;

    this._shadowHP--;
    this._drawHPPips();

    this.cameras.main.shake(200, 0.01);
    this.player.setTint(0xff4444);
    this.tweens.killTweensOf(this.player);   // never stack blink tweens
    this.tweens.add({
      targets: this.player, alpha: 0.4, duration: 150, yoyo: true, repeat: 3,
      onComplete: () => { this.player.clearTint(); this.player.setAlpha(1); }
    });

    if (this._shadowHP <= 0) {
      this._loseLife();
    } else {
      this._toast(`Ouch! ${this._shadowHP} HP left 🐾`);
      this.time.delayedCall(900, () => { this._damageCD = false; });
    }
  }

  // ── Pips emptied → lose a heart, refill pips, respawn (or game over) ──
  _loseLife() {
    this._lives--;
    this._shadowHP = 3;
    this._drawHPPips();

    const lostHeart = this._hearts[this._lives];
    if (lostHeart) {
      lostHeart.setTint(0x444444);
      this.tweens.add({ targets: lostHeart, alpha: 0.25, duration: 300 });
    }
    this.cameras.main.shake(380, 0.014);

    if (this._lives <= 0) {
      this._gameOver();
    } else {
      this._toast(`💔 Life lost! ${this._lives} left — respawning! 🐾`);
      this.time.delayedCall(700, () => this._respawnAtCheckpoint());
    }
  }

  _saveCheckpoint(x, y, cp) {
    this._lastCheckpoint = { x, y, cp };
    // "✅ CHECKPOINT!" banner — same as Level 2's _saveCheckpoint
    const banner = this.add.text(W / 2, H / 2 - 60, '✅ CHECKPOINT!', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#aaffaa', stroke: '#0a2208', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: banner, y: banner.y - 28, alpha: 0, delay: 400, duration: 700, onComplete: () => banner.destroy() });
  }

  _respawnAtCheckpoint() {
    const cp = this._lastCheckpoint;
    this._falling = false;
    if (this._groundCollider) this._groundCollider.active = true;   // close the ground again
    this.player.setCollideWorldBounds(true);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => {
      // Reset HP pips to full and respawn at checkpoint (or level start)
      this._shadowHP = 3;
      this._drawHPPips();
      const rx = cp ? cp.x : 80;
      this.player.clearTint();
      this.player.setPosition(rx, GROUND_Y - 40);
      this.player.setVelocity(0, 0);
      this.cameras.main.scrollX = Math.max(0, rx - W / 2);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.tweens.killTweensOf(this.player);
      this.tweens.add({
        targets: this.player, alpha: { from: 0.3, to: 1 },
        duration: 130, repeat: 4, yoyo: true,
        onComplete: () => { this.player.setAlpha(1); this._damageCD = false; }
      });
      if (cp) this._toast(`💫 Respawned at Checkpoint ${cp.cp}`);
    });
  }

  _gameOver() {
    this._done = true;
    this.add.rectangle(this.cameras.main.scrollX + W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(60).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - 10, '💔 Oh no! Try again', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.time.delayedCall(1600, () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(450, () => this.scene.restart()); });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2, d = 16 + Math.random() * 26;
      const s = this.add.image(x, y, this.textures.exists('l4_sparkle') ? 'l4_sparkle' : 'l4_coin').setScale(0.6).setDepth(30);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, scale: 1.2, duration: 600, onComplete: () => s.destroy() });
    }
  }

  _toast(msg) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 70, msg, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3, backgroundColor: '#0008', padding: { x: 12, y: 6 }, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(55).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 76, duration: 250 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  // ── PAUSE — finalized wood/gold Game-Menu modal (approved via Theme Design) ──
  _togglePause() {
    if (this._done) return;
    if (this._paused) {
      this._pauseObjs.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._pauseObjs = null; this._paused = false; this.physics.resume();
      return;
    }
    this._paused = true; this.physics.pause();
    this._pauseObjs = openGameMenuModal(this, {
      onResume:  () => this._togglePause(),
      onRestart: () => { this.physics.resume(); this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(450, () => this.scene.restart()); },
      onExit:    () => { this.physics.resume(); this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Menu')); },
    });
  }
}

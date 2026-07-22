import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL5Assets, generateL5StreetAssets } from './L5Assets.js';
import { preloadGlendaSkin, applyGlendaSkin } from './L5_GlendaSkin.js';
import { generatePremiumHudTextures, buildLevelBanner, buildCheckpointBoard, buildTimerArt, buildCoinArt, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { launchRandomMiniGame, resetGameHistory } from '../../../utils/MiniGamePicker.js';
import { playVideoOverlay } from '../../../utils/VideoOverlay.js';

// ── Level 5 opening — identical to Level 4 scene, but ends at Level5 (garage) ──
const WORLD_W  = 12200;
const GROUND_Y = 408;
const RUN_SPEED = 230;
const JUMP_V    = -440;

const ITEMS = [
  { key: 'stethoscope', label: 'Stethoscope',  tex: 'stethoscope', x: 1200,  w: 60, h: 60, cp: 1 },
  { key: 'water_bowl',  label: 'Water Bowl',   tex: 'water_bowl',  x: 3200,  w: 60, h: 50, cp: 1 },
  { key: 'towels',      label: 'Soft Towels',  tex: 'towels',      x: 5200,  w: 60, h: 60, cp: 2 },
  { key: 'blanket',     label: 'Cozy Blanket', tex: 'blanket',     x: 7200,  w: 70, h: 60, cp: 2 },
  { key: 'lamp',        label: 'Warm Lamp',    tex: 'lamp',        x: 9200,  w: 55, h: 65, cp: 3 },
];

const OBSTACLES = [
  { tex: 'l5_cone',    x: 900,   w: 46, h: 48 },
  { tex: 'l5_puddle',  x: 2050,  w: 84, h: 22, flat: true },
  { tex: 'l5_boxes',   x: 2750,  w: 42, h: 54 },
  { tex: 'l5_bin',     x: 4250,  w: 50, h: 58 },
  { tex: 'l5_cone',    x: 4900,  w: 46, h: 48 },
  { tex: 'l5_puddle',  x: 5300,  w: 90, h: 28, flat: true },
  { tex: 'l5_bike',    x: 6700,  w: 70, h: 50 },
  { tex: 'l5_boxes',   x: 7300,  w: 42, h: 54 },
  { tex: 'l5_puddle',  x: 8200,  w: 90, h: 28, flat: true },
  { tex: 'l5_bin',     x: 8800,  w: 50, h: 58 },
  { tex: 'l5_puddle',  x: 9400,  w: 84, h: 22, flat: true },
  { tex: 'l5_cone',    x: 10700, w: 46, h: 48 },
  { tex: 'l5_puddle',  x: 11050, w: 90, h: 28, flat: true },
  { tex: 'l5_boxes',   x: 11300, w: 42, h: 54 },
];

export class L5_EquipmentRunScene extends Phaser.Scene {
  constructor() { super('L5_EquipmentRun'); }

  preload() {
    preloadGlendaSkin(this);
    const IMG_PATH = 'assets/images/Level%205/treatment/';
    const propFiles = {
      stethoscope: 'stethoscope',
      water_bowl:  'water_bowl',
      towels:      'towels_stack',
      blanket:     'blanket',
      lamp:        'heat_lamp',
    };
    Object.entries(propFiles).forEach(([key, file]) => {
      if (!this.textures.exists(key)) this.load.image(key, `${IMG_PATH}${file}.png`);
    });
  }

  create() {
    // Fresh playthrough (including a restart after game over) — clear which
    // mini-games have already been shown so this level's trigger points
    // can't repeat one.
    resetGameHistory(5);

    generateL5Assets(this);
    generateL5StreetAssets(this);

    this.physics.world.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);

    this._collected = {};
    this._lives = 3;
    this._shadowHP = 3;
    this._damageCD = false;
    this._falling = false;
    this._done = false;
    this._balls = [];
    this._ballFirst = true;
    this._ballZones = [1300, 2200, 3000, 3900, 4700, 5600, 6500, 7400, 8400, 9100, 10000, 10800].map(x => ({ x, fired: false }));
    this._returning = false;
    this._currentCP = 1;
    this._paused = false;
    this._lastCheckpoint = null;
    this._cp1Done = false;
    this._cp2Done = false;
    this._cp3Done = false;

    this._buildBackground();
    this._buildRoad();
    this._buildProps();
    this._buildItems();
    this._buildObstacles();
    this._buildPlayer();
    applyGlendaSkin(this);
    this._buildHUD();
    this._buildProgressBar();
    this._buildControls();
    this._buildRain();

    this.events.once('shutdown', () => this._stopCheckpointOverlays());
    this.time.delayedCall(400, () => this._toast('🩺 Collect treatment supplies for Gamma!'));
  }

  // ── BACKGROUND — real art (backgorund-l5.jpeg), same technique as Level 4 ───
  // Ends exactly where _buildRoad's ground band begins (topY) so the two touch
  // with no gap AND no overlap.
  _buildBackground() {
    if (this.textures.exists('l5_bg_main')) {
      const topY = GROUND_Y - 16;   // must match _buildRoad's topY
      const img = this.textures.get('l5_bg_main').getSourceImage();
      this._bgMain = this.add.tileSprite(W / 2, topY / 2, W, topY, 'l5_bg_main').setScrollFactor(0).setDepth(-30);
      this._bgMain.tileScaleX = this._bgMain.tileScaleY = topY / img.height;   // fit height, repeat width
      return;
    }
    // Fallback: old procedural two-layer sky + cottages
    this._sky = this.add.tileSprite(W / 2, H / 2, W, H, 'l5_bg_sky').setScrollFactor(0).setDepth(-30);
    const skyImg = this.textures.get('l5_bg_sky').getSourceImage();
    this._sky.tileScaleX = this._sky.tileScaleY = H / skyImg.height;

    const bandH = 240;
    const hImg = this.textures.get('l5_bg_houses').getSourceImage();
    this._houses = this.add.tileSprite(W / 2, (GROUND_Y + 10) - bandH / 2, W, bandH, 'l5_bg_houses').setScrollFactor(0).setDepth(-20);
    this._houses.tileScaleX = this._houses.tileScaleY = bandH / hImg.height;
  }

  // ── GROUND (world space) — real art (bottom-l5.png), falls back to the old
  // ground strip if it isn't loaded ────────────────────────────────────────────
  _buildRoad() {
    const topY = GROUND_Y - 16;
    const bandH = H - topY;                 // exactly down to the screen bottom
    const groundKey = this.textures.exists('l5_ground_bottom') ? 'l5_ground_bottom' : 'l5_ground';
    const gImg = this.textures.get(groundKey).getSourceImage();
    this._groundTile = this.add.tileSprite(WORLD_W / 2, topY + bandH / 2, WORLD_W, bandH, groundKey).setDepth(0);
    this._groundTile.tileScaleX = this._groundTile.tileScaleY = bandH / gImg.height;
    const g = this.add.rectangle(WORLD_W / 2, GROUND_Y + 14, WORLD_W, 28, 0, 0);
    this.physics.add.existing(g, true);
    this._ground = g;
  }

  _buildProps() {
    const GY = GROUND_Y + 8;
    const place = (x, key, h, depth = 4, tint = null) => {
      const img = this.textures.get(key).getSourceImage();
      const w = h * (img.width / img.height);
      const s = this.add.image(x, GY, key).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(depth);
      if (tint) s.setTint(tint);
      return s;
    };
    [500, 1800, 2600, 4000, 5400, 6800, 8000, 9600, 10600, 11800].forEach(x => place(x, 'l5_bush', 70, 4));
    [1400, 4600, 7600, 10400].forEach(x => place(x, 'l5_lamp', 150, 4));
    [2400, 7000, 9900].forEach(x => place(x, 'l5_bench', 78, 4));
    const gate = (x, txt) => this.add.text(x, GY - 150, txt, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#5a3d1a', stroke: '#fff8', strokeThickness: 3, backgroundColor: '#ffffffcc', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(6);
    gate(2300, '🛒 GROCERY'); gate(4700, '🏘️ HOMES'); gate(7000, '🌳 PARK'); gate(9300, '🏪 MARKET'); gate(11600, '🏡 HOME ZONE');
  }

  _buildItems() {
    this._itemObjs = ITEMS.map(it => {
      const y = GROUND_Y - 36;
      const img = this.add.image(it.x, y, it.tex).setDisplaySize(it.w, it.h).setDepth(8);
      this.tweens.add({ targets: img, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const glow = this.add.circle(it.x, y, 30, 0xfff0a0, 0.18).setDepth(7);
      this.tweens.add({ targets: glow, alpha: 0.4, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
      this.add.text(it.x, y - 34, it.label, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0008', strokeThickness: 3 }).setOrigin(0.5).setDepth(9);
      return { ...it, img, glow, taken: false };
    });
  }

  _buildObstacles() {
    this._obsObjs = OBSTACLES.map(o => {
      const y = GROUND_Y + 20;
      const img = this.add.image(o.x, y, o.tex).setOrigin(0.5, 1).setDisplaySize(o.w, o.h).setDepth(7);
      return { ...o, img, clearY: y - o.h - 12 };
    });
  }

  _buildPlayer() {
    this.player = this.physics.add.sprite(80, GROUND_Y - 40, 'gleeda_idle').setDepth(10);
    this.player.setScale(0.18);
    this.player.body.setSize(73, 56, true);
    this.player.setCollideWorldBounds(true);
    this._groundCollider = this.physics.add.collider(this.player, this._ground);
    // Animations are now set up by L5_GlendaSkin (after this method is called in create)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this._facing = 1;
  }

  _buildHUD() {
    // Finalized real-art health panel (lifebg.png + heart.png + health-bar.png)
    generatePremiumHudTextures(this);

    // level banner — real art at the approved L1/L2 size (never stretched)
    const ban = buildLevelBanner(this, 'CHAPTER 5', 'GATHER THE SUPPLIES', 48);

    // health panel (left), centred on the banner midline
    const HPx = 8, HPh = 42, HPy = ban.midY - HPh / 2, HPw = 140;
    this.add.image(HPx, HPy, 'ui_life_bg').setOrigin(0, 0)
      .setDisplaySize(HPw, HPh).setScrollFactor(0).setDepth(48);
    const colX = [HPx + 39, HPx + 70, HPx + 101];
    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(colX[i], HPy + 13, 'heart').setDisplaySize(22, 20).setScrollFactor(0).setDepth(50);
      this._hearts.push(h);
    }
    this._hpBars = colX.map(cx => this.add.image(cx, HPy + 30, 'ui_health_bar')
      .setDisplaySize(26, 8).setScrollFactor(0).setDepth(50));
    this._drawHPPips();

    // checkpoint board (title + item collection) — just below the banner
    const { cpTxt, itemHud } = buildCheckpointBoard(this, 1, 'Collect Stethoscope & Water Bowl', ITEMS, 48, ban.bottom + 4);
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

  // ── Bottom zone-progress bar (equipment run) ─────────────────────────────
  // Track from start → 🏠 with a flag at each checkpoint, a fill, and a paw
  // runner showing how far along the street the player has travelled.
  _buildProgressBar() {
    const LEFT = 88, RIGHT = W - 88, BAR_W = RIGHT - LEFT;
    const TY = H - 12;
    this._pbLeft  = LEFT;
    this._pbWidth = BAR_W;

    // Checkpoint completion positions along the world (last item of each CP)
    this._pbMarkerDefs = [
      { x: 3200, doneKey: '_cp1Done' },
      { x: 7200, doneKey: '_cp2Done' },
      { x: 9200, doneKey: '_cp3Done' },
    ];

    // Track shell (dark rounded panel) + groove
    const shell = this.add.graphics().setScrollFactor(0).setDepth(46);
    shell.fillStyle(0x000000, 0.34); shell.fillRoundedRect(LEFT - 10, TY - 7, BAR_W + 20, 12, 6);
    shell.fillStyle(0x141c28, 0.92); shell.fillRoundedRect(LEFT - 8, TY - 6, BAR_W + 16, 10, 5);
    shell.lineStyle(1.5, 0x4a6080, 0.8); shell.strokeRoundedRect(LEFT - 8, TY - 6, BAR_W + 16, 10, 5);

    // Blue fill (grows with progress)
    this._pbFill = this.add.rectangle(LEFT, TY - 1, 2, 5, 0x5ab0f5, 1)
      .setScrollFactor(0).setDepth(47).setOrigin(0, 0.5);

    // Checkpoint flag markers
    this._pbMarkers = this._pbMarkerDefs.map(def => {
      const bx = LEFT + (def.x / WORLD_W) * BAR_W;
      const g = this.add.graphics().setScrollFactor(0).setDepth(48);
      this._drawPbFlag(g, bx, TY, false);
      return { g, bx, def, _lit: false };
    });

    // Finish flag at the end
    const fx = LEFT + BAR_W;
    const fin = this.add.graphics().setScrollFactor(0).setDepth(48);
    fin.fillStyle(0x8a7050, 1); fin.fillRect(fx - 1, TY - 22, 2, 18);
    fin.fillStyle(0xFFFFFF, 1); fin.fillRect(fx + 1, TY - 22, 9, 6);
    fin.fillStyle(0x222222, 1);
    fin.fillRect(fx + 1, TY - 22, 3, 3); fin.fillRect(fx + 7, TY - 22, 3, 3);
    fin.fillRect(fx + 4, TY - 19, 3, 3);

    // Paw runner that travels along the bar
    this._pbRunner = this.add.text(LEFT, TY - 8, '🐾', { fontSize: '13px' })
      .setScrollFactor(0).setDepth(49).setOrigin(0.5, 1);
  }

  // Checkpoint flag on the progress track (blue=pending, cyan=cleared).
  _drawPbFlag(g, bx, ty, reached) {
    g.clear();
    g.fillStyle(0x8a7050, 1); g.fillRect(bx - 1, ty - 20, 2, 16);
    g.fillStyle(reached ? 0x66E0A0 : 0x4a6080, 1);
    g.fillTriangle(bx + 1, ty - 20, bx + 13, ty - 16, bx + 1, ty - 11);
    if (reached) { g.fillStyle(0xCFFFE0, 0.9); g.fillCircle(bx + 5, ty - 16, 1.6); }
  }

  _updateProgressBar() {
    if (!this._pbFill) return;
    const pct = Phaser.Math.Clamp(this.player.x / WORLD_W, 0, 1);
    this._pbFill.width = Math.max(2, pct * this._pbWidth);
    this._pbRunner.x   = this._pbLeft + pct * this._pbWidth;
    this._pbMarkers.forEach(m => {
      if (!m._lit && this[m.def.doneKey]) {
        m._lit = true;
        this._drawPbFlag(m.g, m.bx, H - 12, true);
      }
    });
  }

  _buildControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => {
      const f = document.getElementById('game-footer');
      if (f) f.style.display = 'none';
      this.tweens.killAll();
      this.time.removeAllEvents();
    });
  }

  update(time, delta) {
    if (this._done || this._paused) return;
    if (this._falling) {
      this.player.play('gleeda_jump_anim', true);
      if (this.player.y > H + 60) this._onHoleFell();
      return;
    }
    const ts = window._touchState || {};
    const p = this.player, onGround = p.body.blocked.down || p.body.touching.down;
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    const jump  = this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;
    let vx = 0;
    if (left)  { vx = -RUN_SPEED; this._facing = -1; }
    if (right) { vx =  RUN_SPEED; this._facing =  1; }
    p.setVelocityX(vx);
    p.setFlipX(this._facing < 0);
    if (jump && onGround) p.setVelocityY(JUMP_V);
    if (!onGround)      p.play('gleeda_jump_anim', true);
    else if (vx !== 0)  p.play('gleeda_walk', true);
    else                p.play('gleeda_idle_anim', true);
    const sx = this.cameras.main.scrollX;
    if (this._sky)    this._sky.tilePositionX    = sx * 0.12 / this._sky.tileScaleX;
    if (this._houses) this._houses.tilePositionX = sx * 0.45 / this._houses.tileScaleX;
    this._checkItems();
    this._checkObstacles(onGround);
    this._checkBalls();
    this._checkHome();
    this._updateProgressBar();
    this._updateRain();
  }

  _buildRain() {
    this._rainDrops = [];
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-H, H);
      const speed = Phaser.Math.FloatBetween(6, 14);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.45);
      const len   = Phaser.Math.Between(8, 18);
      const drop  = this.add.rectangle(x, y, 1, len, 0xa0c8ff, alpha)
        .setScrollFactor(0).setDepth(60).setOrigin(0.5, 0);
      this._rainDrops.push({ obj: drop, speed });
    }
    // Rain drops only (no dark overlay) — keeps Level 5 the same overall
    // brightness as Level 4 instead of a permanent 22%-dark tint over everything.
  }

  _updateRain() {
    if (!this._rainDrops) return;
    this._rainDrops.forEach(d => {
      d.obj.y += d.speed;
      d.obj.x += d.speed * 0.18;
      if (d.obj.y > H + 20) { d.obj.y = Phaser.Math.Between(-30, -5); d.obj.x = Phaser.Math.Between(0, W); }
      if (d.obj.x > W + 10) d.obj.x = Phaser.Math.Between(-10, 0);
    });
  }

  _checkItems() {
    const p = this.player;
    this._itemObjs.forEach(it => {
      if (it.taken) return;
      if (Math.abs(p.x - it.x) < 40 && Math.abs(p.y - it.img.y) < 70) {
        it.taken = true; this._collected[it.key] = true;
        this.tweens.killTweensOf(it.img); this.tweens.killTweensOf(it.glow); it.glow.destroy();
        this.tweens.add({ targets: it.img, y: it.img.y - 40, alpha: 0, scale: 1.4, duration: 450, onComplete: () => it.img.destroy() });
        this._sparkle(it.x, it.img.y);
        const h = this._itemHud[it.key];
        h.icon.setAlpha(1); h.chk.setText('✓').setColor('#66ff88').setFontSize(13);
        this._addPoints(50);
        this._toast(`✓ ${it.label} Collected!  +50`);
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
        const dir = (p.x <= o.x) ? -1 : 1;
        p.setPosition(o.x + dir * (o.w / 2 + 30), p.y);
        p.setVelocityX(dir * 160); p.setVelocityY(-180);
        this._takeHit(); break;
      }
    }
  }

  _fallInHole(o) {
    if (this._falling || this._damageCD || this._done) return;
    this._falling = true; this._damageCD = true;
    if (this._groundCollider) this._groundCollider.active = false;
    const p = this.player;
    p.setCollideWorldBounds(false);
    p.setPosition(o.x, p.y); p.setVelocityX(0); p.setVelocityY(140);
    this.cameras.main.shake(160, 0.008);
  }
  _onHoleFell() { this._falling = false; this._loseLife(); }

  _spawnBall(x) {
    const r = 23;
    const tex = this.textures.exists('l5_ball') ? 'l5_ball' : 'l5_coin';
    const img = this.add.image(x, GROUND_Y - r, tex).setDisplaySize(r * 2, r * 2).setDepth(9);
    this._balls.push({ img, r, speed: 3.4 });
    if (this._ballFirst) { this._ballFirst = false; this._toast('⚽ Rolling ball! Jump over it!'); }
  }

  _checkBalls() {
    if (this._done) return;
    const p = this.player;
    for (const z of this._ballZones) {
      if (!z.fired && p.x > z.x) { z.fired = true; this._spawnBall(p.x + W * 0.55); }
    }
    for (let i = this._balls.length - 1; i >= 0; i--) {
      const b = this._balls[i];
      b.img.x -= b.speed; b.img.rotation -= b.speed / b.r;
      if (b.img.x < this.cameras.main.scrollX - 90) { b.img.destroy(); this._balls.splice(i, 1); continue; }
      const ballTop = b.img.y - b.r;
      if (!this._damageCD && Math.abs(p.x - b.img.x) < (b.r + 16) && p.body.bottom > ballTop + 6) {
        const dir = (p.x <= b.img.x) ? -1 : 1;
        p.setPosition(b.img.x + dir * (b.r + 28), p.y); p.setVelocityX(dir * 160); p.setVelocityY(-180);
        this._takeHit();
        this.tweens.add({ targets: b.img, y: b.img.y - 36, alpha: 0, angle: '+=180', duration: 300, onComplete: () => b.img.destroy() });
        this._balls.splice(i, 1);
      }
    }
  }

  _checkHome() {
    if (!this._returning) return;
    if (this.player.x > WORLD_W - 120) {
      this._done = true;
      this._toast('🏠 Home! Time to help Gamma!');
      const stars = Object.keys(this._collected).length;
      // Reach-home cinematic (opaque overlay) → then the garage treatment part.
      playVideoOverlay(this, 'l5_reach_home', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('Level5', { stars }));
      });
    }
  }

  _allCollected() {
    this._returning = true;
    this._toast('✅ All items collected! Return home →');
    const fImg = this.textures.get('l5_house_finished').getSourceImage();
    const fh = 170, fw = fh * (fImg.width / fImg.height);
    this.add.image(WORLD_W - 80, GROUND_Y + 8, 'l5_house_finished').setOrigin(0.5, 1).setDisplaySize(fw, fh).setDepth(6);
    this.add.image(WORLD_W - 80, GROUND_Y - 178, 'l5_homesign').setDisplaySize(96, 46).setDepth(9);
    this._arrow = this.add.text(0, 0, '➡️', { fontSize: '26px' }).setScrollFactor(0).setDepth(52);
    this.tweens.add({ targets: this._arrow, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  _stopCheckpointOverlays() {
    ['L5_CP1', 'L5_CP2', 'L5_CP3'].forEach(k => {
      const s = this.scene.get(k);
      if (s && (this.scene.isActive(k) || this.scene.isPaused(k) || this.scene.isSleeping(k))) {
        s.events.off('cp-done'); this.scene.stop(k);
      }
    });
  }

  _checkpointReached(cp) {
    const cpKey = `_cp${cp}Done`;
    if (this[cpKey]) return;
    this[cpKey] = true;
    this._currentCP = cp + 1;
    const names = ['', 'Stethoscope & Water Bowl', 'Towels & Blanket', 'Lamp & Basket'];
    const overlayKey = `L5_CP${cp}`;
    const intros = {
      1: { emoji: '🔨', title: 'Build the Frame', desc: 'Drag the wood & roof pieces\ninto the house blueprint!' },
      2: { emoji: '🎨', title: 'Nail & Paint Pattern', desc: 'Watch the build order,\nthen repeat it to fix the wall!' },
      3: { emoji: '🐶', title: 'Welcome Gamma Home', desc: 'Pick the right comfort item\nto settle Gamma into her new bed!' },
    };
    this._saveCheckpoint(this.player.x, GROUND_Y - 40, cp);
    this._launchCheckpoint(overlayKey, intros[cp], () => {
      this._cpTxt.setText(`CHECKPOINT ${cp} CLEAR — Next: ${names[cp + 1] || 'Return Home'}`);
    });
  }

  _showCheckpointIntro(intro, onPlay) {
    const W2 = W / 2, H2 = H / 2, PW = 320, PH = 236;
    const px = W2 - PW / 2, py = H2 - PH / 2;
    const td = [];
    td.push(this.add.rectangle(W2, H2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(72).setInteractive());
    const pg = this.add.graphics().setScrollFactor(0).setDepth(73);
    pg.fillStyle(0x120e08, 0.97); pg.fillRoundedRect(px, py, PW, PH, 16);
    pg.lineStyle(2.5, 0xf5c87a, 0.85); pg.strokeRoundedRect(px, py, PW, PH, 16);
    td.push(pg);
    td.push(this.add.text(W2, py + 38, intro.emoji, { fontSize: '38px' }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 88, intro.title, { fontSize: '19px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 122, intro.desc, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    const close = () => td.forEach(o => { try { o.destroy(); } catch (_) {} });
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
  }

  _launchCheckpoint(key, intro, onWin) {
    if (this.player?.body) this.player.setVelocity(0, 0);
    this._stopCheckpointOverlays();
    this._paused = true;
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';
    this._cpOnWin = onWin;

    // Random mini-game from Level 5's slice of the 40 games — no intro card.
    launchRandomMiniGame(this, 5, () => {
      if (footer) footer.style.display = 'flex';
      this._resumeFromCheckpoint();
    });
  }

  _resumeFromCheckpoint(applyDamage = false) {
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this._paused = false; this.physics.resume();
    if (applyDamage) { this._damageCD = false; this._takeHit(); }
    else if (this._cpOnWin) { this._cpOnWin(); }
    this._cpOnWin = null;
  }

  _drawHPPips() {
    if (!this._hpBars) return;
    const col = this._shadowHP >= 3 ? 0x33dd33 : this._shadowHP === 2 ? 0xeecc00 : 0xff3300;
    this._hpBars.forEach((bar, i) => {
      if (i < this._shadowHP) { bar.setTint(col); bar.setAlpha(1); }
      else { bar.setTint(0x444444); bar.setAlpha(0.25); }
    });
  }

  _takeHit() {
    if (this._damageCD || this._done) return;
    this._damageCD = true; this._shadowHP--; this._drawHPPips();
    this.cameras.main.shake(200, 0.01);
    this.player.setTint(0xff4444);
    this.tweens.killTweensOf(this.player);
    this.tweens.add({ targets: this.player, alpha: 0.4, duration: 150, yoyo: true, repeat: 3, onComplete: () => { this.player.clearTint(); this.player.setAlpha(1); } });
    if (this._shadowHP <= 0) this._loseLife();
    else { this._toast(`Ouch! ${this._shadowHP} HP left 🐾`); this.time.delayedCall(900, () => { this._damageCD = false; }); }
  }

  _loseLife() {
    this._lives--; this._shadowHP = 3; this._drawHPPips();
    const lostHeart = this._hearts[this._lives];
    if (lostHeart) { lostHeart.setTint(0x444444); this.tweens.add({ targets: lostHeart, alpha: 0.25, duration: 300 }); }
    this.cameras.main.shake(380, 0.014);
    if (this._lives <= 0) {
      this._done = true;
      this.add.rectangle(this.cameras.main.scrollX + W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(60).setScrollFactor(0);
      this.add.text(W / 2, H / 2 - 10, '💔 Oh no! Try again', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
      this.time.delayedCall(1600, () => { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(450, () => this.scene.restart()); });
    } else {
      this._toast(`💔 Life lost! ${this._lives} left — respawning!`);
      this.time.delayedCall(700, () => this._respawnAtCheckpoint());
    }
  }

  _saveCheckpoint(x, y, cp) {
    this._lastCheckpoint = { x, y, cp };
    const banner = this.add.text(W / 2, H / 2 - 60, '✅ CHECKPOINT!', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#aaffaa', stroke: '#0a2208', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: banner, y: banner.y - 28, alpha: 0, delay: 400, duration: 700, onComplete: () => banner.destroy() });
  }

  _respawnAtCheckpoint() {
    const cp = this._lastCheckpoint;
    this._falling = false;
    if (this._groundCollider) this._groundCollider.active = true;
    this.player.setCollideWorldBounds(true);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => {
      this._shadowHP = 3; this._drawHPPips();
      const rx = cp ? cp.x : 80;
      this.player.clearTint(); this.player.setPosition(rx, GROUND_Y - 40); this.player.setVelocity(0, 0);
      this.cameras.main.scrollX = Math.max(0, rx - W / 2);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.tweens.killTweensOf(this.player);
      this.tweens.add({ targets: this.player, alpha: { from: 0.3, to: 1 }, duration: 130, repeat: 4, yoyo: true, onComplete: () => { this.player.setAlpha(1); this._damageCD = false; } });
      if (cp) this._toast(`💫 Respawned at Checkpoint ${cp.cp}`);
    });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2, d = 16 + Math.random() * 26;
      const s = this.add.image(x, y, this.textures.exists('l5_sparkle') ? 'l5_sparkle' : 'l5_coin').setScale(0.6).setDepth(30);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, alpha: 0, scale: 1.2, duration: 600, onComplete: () => s.destroy() });
    }
  }

  _toast(msg) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 70, msg, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3, backgroundColor: '#0008', padding: { x: 12, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(55).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 76, duration: 250 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  // Finalized wood/gold Game-Menu modal (approved via Theme Design)
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

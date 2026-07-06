import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { BaseLevelScene } from '../BaseLevelScene.js';
import { L1HUD } from './hud/L1_HUD.js';

// Chapter 1 — Three zones: Easy → Medium → Boss → Free Gemma
export class Level1Scene extends BaseLevelScene {
  constructor() { super('Level1'); }

  // ── Premium fantasy HUD (Level 1 only) ──────────────────────────────────────
  // Overrides the shared BaseLevelScene._buildHUD so ONLY Level 1 gets the new
  // header/footer. The HUD manager re-creates every field the base logic expects
  // (hearts, HP, points, timer, progress, pause) so nothing else changes.
  _buildHUD(config) {
    this._hud = new L1HUD(this, config);
    this._hud.build();
  }

  // Route the base HP-pip draw to the header's green bars (Level 1 only).
  _drawHPPips() {
    if (this._hud) this._hud.drawHP(this._shadowHP);
  }

  // Boss attack button is now a Phaser wood button in the footer (Level 1 only).
  _setAttackBtn(visible) {
    if (this._hud) this._hud.setAttackVisible(visible);
  }

  // ── Coin display: header CoinPanel shows the count with a gold coin (no star) ─
  _givePoints(n) {
    this._points = (this._points || 0) + n;
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`${this._points}`);
    const pop = this.add.text(W / 2, H / 2 - 80, `+${n} 🪙`, {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#ffd24a', stroke: '#1a0f04', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 1000, onComplete: () => pop.destroy() });
  }

  _spendPoints(n) {
    this._points = Math.max(0, (this._points || 0) - n);
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`${this._points}`);
  }

  // Header timer uses the 🕒 clock glyph (matches the reference).
  _resetTimer(seconds) {
    if (!this._timerTxt) return;
    this._timerLeft  = seconds;
    this._timerFull  = seconds;
    this._timerFired = false;
    this._timerTxt.setText(`🕒 ${seconds}s`);
    this._timerTxt.setColor('#ffe08a');
  }

  create() {
    const config = {
      worldWidth: 17000,
      startX: 80, startY: 370,
      timer: 60,
      chapterName: "Chapter 1 — Shadow's Journey",
      objective: 'Run through the forest!\nCrouch logs, jump water, dodge porcupines — find Gemma! 🐾',
      platforms: [
        // ── ZONE 1: Stones over 110px gaps (easy — all aided) ────────────────
        { x:  755, y: 390, w: 62, h: 14 },   // gap x=700  w=110
        { x: 1955, y: 390, w: 62, h: 14 },   // gap x=1900 w=110
        { x: 3255, y: 358, key: 'log' },      // gap x=3200 w=110 — collapsing log

        // ── ZONE 2: Stones + logs over 130px gaps (medium — all aided) ────────
        { x:  5965, y: 390, w: 58, h: 14 },  // gap x=5900 w=130
        { x:  6565, y: 390, w: 58, h: 14 },  // gap x=6500 w=130
        { x:  7165, y: 358, key: 'log' },     // gap x=7100 w=130 — log trap
        { x:  7865, y: 390, w: 58, h: 14 },  // gap x=7800 w=130
        { x:  8565, y: 390, w: 58, h: 14 },  // gap x=8500 w=130
        { x:  9165, y: 358, key: 'log' },     // gap x=9100 w=130 — log trap
        { x:  9865, y: 390, w: 58, h: 14 },  // gap x=9800 w=130
        { x: 10565, y: 390, w: 58, h: 14 },  // gap x=10500 w=130

        // ── ZONE 3: 8 of 15 gaps aided — rest require raw jump (hard) ─────────
        { x: 11717, y: 390, w: 48, h: 12 },  // gap x=11640 w=155
        // gap x=11990 — no aid
        { x: 12447, y: 390, w: 48, h: 12 },  // gap x=12370 w=155
        { x: 12737, y: 358, key: 'log' },     // gap x=12660 w=155 — log
        { x: 13107, y: 390, w: 48, h: 12 },  // gap x=13030 w=155
        // gap x=13380 — no aid
        { x: 13817, y: 390, w: 48, h: 12 },  // gap x=13740 w=155
        { x: 14107, y: 358, key: 'log' },     // gap x=14030 w=155 — log
        // gap x=14400 — no aid
        { x: 14817, y: 390, w: 48, h: 12 },  // gap x=14740 w=155
        // gap x=15060 — no aid
        { x: 15477, y: 390, w: 48, h: 12 },  // gap x=15400 w=155
        // gap x=15740, x=16070, x=16390 — no aid (boss gauntlet)
      ],
      rocks: [
        // ── ZONE 3 — each hurdle rock is at the midpoint of a solid ground segment ──
        { x: 11892, y: 390, hurdle: true, immovable: true }, // ground 11795–11990
        { x: 12257, y: 390, hurdle: true, immovable: true }, // ground 12145–12370
        { x: 12592, y: 390, hurdle: true, immovable: true }, // ground 12525–12660
        { x: 12922, y: 390, hurdle: true, immovable: true }, // ground 12815–13030
        { x: 13282, y: 390, hurdle: true, immovable: true }, // ground 13185–13380
        { x: 13637, y: 390, hurdle: true, immovable: true }, // ground 13535–13740
        { x: 14292, y: 390, hurdle: true, immovable: true }, // ground 14185–14400
        { x: 14977, y: 390, hurdle: true, immovable: true }, // ground 14895–15060
        // Pushable rocks just before gaps so player can push them in to cross
        { x: 13725, y: 395 }, // just before gap 13740
        { x: 15045, y: 395 }, // just before gap 15060
      ],
      gaps: [
        // ── Zone 1: 110px water gaps — stepping stone on each (70% win) ───────
        { x: 700,  w: 110 },
        { x: 1900, w: 110 },
        { x: 3200, w: 110 },
        // Zone 1→2 bridge gap (lever 1)
        { x: 5400, w: 350 },
        // ── Zone 2: 130px gaps — stone/log on each, moderate (70% win) ────────
        { x: 5900,  w: 130 },
        { x: 6500,  w: 130 },
        { x: 7100,  w: 130 },
        { x: 7800,  w: 130 },
        { x: 8500,  w: 130 },
        { x: 9100,  w: 130 },
        { x: 9800,  w: 130 },
        { x: 10500, w: 130 },
        // Zone 2→3 bridge gap (lever 2)
        { x: 11200, w: 350 },
        // ── Zone 3: 155px gaps — half unaided, requires skill (70% win) ────────
        { x: 11640, w: 155 },
        { x: 11990, w: 155 },
        { x: 12370, w: 155 },
        { x: 12660, w: 155 },
        { x: 13030, w: 155 },
        { x: 13380, w: 155 },
        { x: 13740, w: 155 },
        { x: 14030, w: 155 },
        { x: 14400, w: 155 },
        { x: 14740, w: 155 },
        { x: 15060, w: 155 },
        { x: 15400, w: 155 },
        { x: 15740, w: 155 },
        // gaps 16070 and 16390 removed — clear boss-arena floor leading to cage
      ]
    };

    this.initLevel(config);
    // Level 1 renders its controls as Phaser wood buttons (see hud/), so hide the
    // shared HTML footer. Base shutdown + other levels' initLevel restore it.
    const _htmlFooter = document.getElementById('game-footer');
    if (_htmlFooter) _htmlFooter.style.display = 'none';
    this._initZoneProgressBar();

    this._zone2Entered = false;
    this._zone3Entered = false;

    // ── Rain atmosphere (Zone 1) ───────────────────────────────────────────
    this._rainData = [];
    for (let i = 0; i < 70; i++) {
      const r = this.add.image(Math.random() * 800, Math.random() * 450, 'raindrop')
        .setScrollFactor(0).setAlpha(0.25).setDepth(25);
      this._rainData.push({ img: r, speed: 4 + Math.random() * 2 });
    }
    this._rainActive = true;

    // ── Zone warning signs ─────────────────────────────────────────────────
    this.add.text(5750, 348, '⚠️', { fontSize: '22px' }).setDepth(14);
    this.add.text(11550, 348, '⚠️', { fontSize: '22px' }).setDepth(14);

    // ── LEVER 1: end of Zone 1 ─────────────────────────────────────────────
    this._spawnLever(5350, () => {
      this._puzzleMemoryCards(() => {
        this._buildBridge(5400, 350);
      });
    });

    // ── LEVER 2: end of Zone 2 ─────────────────────────────────────────────
    this._spawnLever(11150, () => {
      this._puzzleMatchColumns(() => {
        this._buildBridge(11200, 350);
      });
    });

    // ── Collapsing logs ────────────────────────────────────────────────────
    this._collapsing = [];
    [
      { x:  3255, y: 358, delay: 2000 },  // Zone 1 — easy (2s)
      { x:  7165, y: 358, delay: 1000 },  // Zone 2 — medium (1s)
      { x:  9165, y: 358, delay: 1000 },  // Zone 2 — medium (1s)
      { x: 12737, y: 358, delay: 1000 },  // Zone 3 — hard (1s)
      { x: 14107, y: 358, delay: 1000 },  // Zone 3 — hard (1s)
    ].forEach(ld => {
      this._collapsing.push({ x: ld.x, y: ld.y, delay: ld.delay, triggered: false });
    });

    // ── Thorn hazards (Zone 1 end + Zone 3) ────────────────────────────────
    this._thorns = [];
    // Zone 1 end section (x=4200–5100): break the blank stretch before the lever
    [4280, 4650, 5050].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '22px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 28, h: 28 });
    });
    // Zone 3 thorns
    [12200, 13700, 15360].forEach(tx => {
      this.add.text(tx, 378, '🌵', { fontSize: '24px' }).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 30, h: 30 });
    });

    // ── Water gap visuals (Zone 1 short gaps) ─────────────────────────────
    [{ x: 700, w: 110 }, { x: 1900, w: 110 }, { x: 3200, w: 110 }].forEach(gap => {
      const cx = gap.x + gap.w / 2;
      this.add.rectangle(cx, H - 18, gap.w + 4, 36, 0x1a4fa0, 1).setDepth(3);
      this.add.rectangle(cx, H - 26, gap.w, 10, 0x4a90dd, 0.6).setDepth(4);
      const ripple = this.add.rectangle(cx, H - 30, gap.w - 8, 3, 0x7abfff, 0.7).setDepth(4);
      this.tweens.add({ targets: ripple, alpha: { from: 0.25, to: 0.9 }, scaleX: { from: 0.85, to: 1 }, duration: 720, yoyo: true, repeat: -1 });
      this.add.text(cx, H - 56, '💧', { fontSize: '13px' }).setOrigin(0.5).setDepth(5);
    });

    // ── Dark swamp water for Zone 3 gaps ──────────────────────────────────
    [
      { x: 11640 }, { x: 11990 }, { x: 12370 }, { x: 12660 }, { x: 13030 },
      { x: 13380 }, { x: 13740 }, { x: 14030 }, { x: 14400 }, { x: 14740 },
      { x: 15060 }, { x: 15400 }, { x: 15740 },
    ].forEach(gap => {
      const cx = gap.x + 77;
      // Deep murky water base
      this.add.rectangle(cx, H - 18, 159, 36, 0x050e05, 1).setDepth(3);
      // Dark green surface
      this.add.rectangle(cx, H - 29, 155, 8, 0x0d1f0d, 1).setDepth(4);
      // Slow ripple — very subtle dark shimmer
      const ripple = this.add.rectangle(cx, H - 32, 130, 2, 0x1a3a1a, 0.6).setDepth(4);
      this.tweens.add({ targets: ripple, alpha: { from: 0.15, to: 0.55 }, scaleX: { from: 0.75, to: 1 }, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1 });
    });

    // ── Fallen log ground obstacles — Shadow must jump over ────────────────
    [{ x: 1650 }, { x: 2800 }, { x: 4450 }, { x: 4870 }, { x: 6850 }, { x: 9650 }].forEach(fl => {
      this.add.image(fl.x, H - 47, 'fallen_log').setDisplaySize(180, 50).setDepth(8);
      const blocker = this.physics.add.staticImage(fl.x, H - 42, '__DEFAULT').setAlpha(0);
      blocker.setDisplaySize(160, 48).refreshBody();
      this.physics.add.collider(this.shadow, blocker);
    });

    // ── Fountain obstacles — jump over the stone base ──────────────────────
    [{ x: 500 }, { x: 3500 }].forEach(fo => {
      const fx = fo.x;
      this.add.image(fx, H - 48, 'fountain').setDisplaySize(44, 60).setDepth(9);
      const fbase = this.physics.add.staticImage(fx, H - 43, '__DEFAULT').setAlpha(0);
      fbase.setDisplaySize(36, 50).refreshBody();
      this.physics.add.collider(this.shadow, fbase);
      for (let i = 0; i < 3; i++) {
        const drop = this.add.ellipse(fx + (i - 1) * 9, H - 74, 7, 11, 0x4ab4ff, 0.88).setDepth(10);
        this.tweens.add({ targets: drop, y: H - 110, alpha: 0, duration: 580 + i * 130, delay: i * 210, repeat: -1 });
      }
    });

    // ── Boulder gauntlet (Zone 1) ─────────────────────────────────────────
    this._boulderGroup = this.physics.add.group();
    this.physics.add.overlap(this.shadow, this._boulderGroup, (s, boulder) => {
      if (!boulder.getData('hit')) {
        boulder.setData('hit', true);
        this.tweens.add({ targets: boulder, alpha: 0, duration: 180, onComplete: () => boulder.destroy() });
        this._onHazardHit();
      }
    });
    this._gauntletStarted = false;

    // ── Porcupines: Zone 1 visible from start, Zone 2 hidden until entry ──────
    this._porcupines = [];
    [
      { x:  1300, y: 398, min:  1050, max:  1550, dir:  1, zone: 1 },
      { x:  2400, y: 398, min:  2100, max:  2700, dir: -1, zone: 1 },
      { x:  6250, y: 398, min:  6050, max:  6460, dir:  1, zone: 2 },
      { x:  7500, y: 398, min:  7250, max:  7760, dir: -1, zone: 2 },
      { x:  9300, y: 398, min:  9210, max:  9550, dir:  1, zone: 2 },
      { x: 10200, y: 398, min:  9980, max: 10460, dir: -1, zone: 2 },
    ].forEach(d => {
      const img = this.add.image(d.x, d.y, 'porcupine')
        .setDisplaySize(68, 44).setDepth(9).setVisible(d.zone === 1);
      this._porcupines.push({ img, x: d.x, y: d.y, dir: d.dir, min: d.min, max: d.max, zone: d.zone, hitCD: false });
    });

    // ── Zone 3 boss snake ──────────────────────────────────────────────────
    this.snake = this.physics.add.sprite(16200, 385, 'snake')
      .setDisplaySize(110, 36).setDepth(9);
    this.snake.body.setSize(90, 30, true);
    this.snake.body.setAllowGravity(false);
    this._snakeHP            = 3;
    this._bossPhase          = 'idle';   // idle → approach → stunned → attacking → defeated
    this._attackCount        = 0;
    this._snakeLungeCooldown = false;
    this._snakePaceDir       = -1;       // approach phase: paces left↔right, -1=left 1=right
    this._lightningModalObjs = null;
    this._attackKey          = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // (y positions clear the new premium header banner/timer + footer bar)
    this._snakeHPText = this.add.text(W / 2, H - 48, '🐍 Boss HP: ❤️❤️❤️', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#ee4422', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(46).setVisible(false);

    this._attackTxt = this.add.text(W - 20, 96, '⚔️ Hits: 0 / 3', {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(46).setVisible(false);

    // ── Gemma cage (Zone 3 far end — x=16700, solid ground past last gap 16390+155=16545)
    {
      const gx = 16700, gy = 406, cW = 100, cH = 70;
      const cL = gx - cW / 2, cT = gy - cH;
      // Back wall + back bars (depth 7, behind Gemma)
      const cageBack = this.add.graphics().setDepth(7);
      cageBack.fillStyle(0x1a1208, 1);
      cageBack.fillRect(cL, cT, cW, cH);
      cageBack.lineStyle(2, 0x3a2e10, 1);
      cageBack.strokeRect(cL, cT, cW, cH);
      cageBack.lineStyle(3, 0x2a2010, 0.9);
      for (let r = 1; r <= 3; r++) {
        const by = cT + (cH / 4) * r;
        cageBack.lineBetween(cL + 4, by, cL + cW - 4, by);
      }
      this.gemmaGoal = this.add.image(gx, gy, 'gemma_idle')
        .setDisplaySize(90, 50).setDepth(9).setOrigin(0.5, 1);
      this.tweens.add({ targets: this.gemmaGoal, y: gy - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this._drawCage(gx, gy); // draws front bars at depth 11 over Gemma
    }

    // ── Bark handler ───────────────────────────────────────────────────────
    this.onBark = () => {
      // Boss phase: bark in approach phase defends Gemma → snake turns to Shadow
      if (this._bossPhase === 'approach') {
        this._bossPhase = 'stunned';
        this._dismissLightningModal();
        this.cameras.main.shake(350, 0.014);
        this.snake.setTint(0xaaaaff);
        this._showMessage('⚡ Bark worked! The snake turned around!');

        this.time.delayedCall(950, () => {
          if (this._bossPhase !== 'stunned') return;
          this._bossPhase = 'attacking';
          this.snake.clearTint();
          this._snakeHPText.setVisible(true);
          this._attackTxt.setVisible(true);
          this._setAttackBtn(true);
          this._showLightningModal('⚡ Press [F] / ⚔️ to ATTACK!\nHit the snake 3 times to save Gemma!', true);
        });
      }
    };

    this.physics.add.collider(this.snake, this.groundGroup);

    this.time.delayedCall(1200, () =>
      this._showMessage('Dodge porcupines, jump fountains & logs! Reach the lever! 🐾')
    );

    // ── Test-phase zone skip (set from menu test buttons) ─────────────────
    const _tp = this.registry.get('l1_testPhase');
    if (_tp === 2) {
      // Jump to Zone 2 checkpoint
      this.shadow.setPosition(5800, 365);
      this.shadow.body.reset(5800, 365);
    } else if (_tp === 3) {
      // Jump to Zone 3 / boss area
      this.shadow.setPosition(11600, 365);
      this.shadow.body.reset(11600, 365);
    }
    if (_tp) this.registry.remove('l1_testPhase');
  }

  // ── Zone progress bar ────────────────────────────────────────────────────
  // Delegated to the premium footer HUD, which draws the carved-wood checkpoint
  // bar and publishes the same _zpFill / _zpRunner / _zpLeft / _zpWidth /
  // _zpWorldW fields this scene's update() loop drives (unchanged).
  _initZoneProgressBar() {
    if (this._progressBar) this._progressBar.setAlpha(0);
    const WORLD_W = this.lvlConfig.worldWidth || 17000;
    if (this._hud) this._hud.buildProgressBar(WORLD_W);
  }

  // ── Bridge ────────────────────────────────────────────────────────────────
  _buildBridge(startX, width) {
    for (let tx = startX; tx < startX + width; tx += 32) {
      const tile = this.groundGroup.create(tx + 16, H - 16, 'ground');
      tile.setDisplaySize(32, 32).setAlpha(0).refreshBody();
    }
    this.groundGroup.refresh();

    const plankW = 28;
    const count  = Math.ceil(width / plankW);
    for (let i = 0; i < count; i++) {
      const px = startX + i * plankW + plankW / 2;
      const plank = this.add.rectangle(px, H - 37, plankW - 2, 18, 0x8a5020, 1).setDepth(7);
      plank.y = H - 200;
      this.tweens.add({ targets: plank, y: H - 37, duration: 300, delay: i * 38, ease: 'Bounce.easeOut' });
      const grain = this.add.rectangle(px, H - 40, plankW - 2, 3, 0x5a3010, 0.65).setDepth(8);
      grain.y = H - 200;
      this.tweens.add({ targets: grain, y: H - 40, duration: 300, delay: i * 38, ease: 'Bounce.easeOut' });
    }

    this.cameras.main.shake(300, 0.012);
    this.time.delayedCall(count * 38 + 200, () =>
      this._showMessage('🌉 Bridge built! Cross now! 🐾')
    );
  }

  // ── Lever ──────────────────────────────────────────────────────────────────
  _spawnLever(x, onPull) {
    const GRASS_Y = H - 46;
    const PED_H   = 12;
    const pedTop  = GRASS_Y - PED_H;

    const ped = this.add.graphics().setDepth(6);
    ped.fillStyle(0x5a3212, 1);
    ped.fillRect(x - 14, pedTop, 28, PED_H);
    ped.lineStyle(1, 0x8a5c2a, 1);
    ped.strokeRect(x - 14, pedTop, 28, PED_H);

    const baseY = pedTop;
    const leverG = this.add.graphics().setDepth(12);
    leverG.x = x;
    leverG.y = baseY;
    const drawLever = (pulled) => {
      leverG.clear();
      leverG.fillStyle(pulled ? 0x5a8820 : 0x7a4a15, 1);
      leverG.fillRect(-3, -36, 6, 36);
      leverG.fillStyle(pulled ? 0x88cc30 : 0xd4a030, 1);
      leverG.fillCircle(0, -36, 7);
    };
    drawLever(false);
    leverG.angle = 0;

    const label = this.add.text(x, baseY - 56, '⚙ LEVER', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(12);

    const hint = this.add.text(x, baseY - 68, '▼ Walk here!', {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#aaeebb'
    }).setOrigin(0.5).setDepth(12).setAlpha(0);

    const glow = this.add.circle(x, baseY - 20, 18, 0xf5c87a, 0.12).setDepth(11);
    this.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.3, scaleY: 1.3, duration: 750, yoyo: true, repeat: -1 });

    const zone = this.physics.add.image(x, H - 58, '__DEFAULT')
      .setAlpha(0).setDisplaySize(70, 70);
    zone.body.setAllowGravity(false);

    let pulled = false;
    this.physics.add.overlap(this.shadow, zone, () => {
      if (pulled) return;
      pulled = true;
      zone.destroy();
      hint.destroy();
      this.tweens.killTweensOf(glow);

      // Stop Shadow immediately so they can't walk into the gap during the animation
      if (this.shadow && this.shadow.body) this.shadow.setVelocity(0, 0);

      this.tweens.add({
        targets: leverG, angle: 70, duration: 480, ease: 'Back.easeIn',
        onComplete: () => {
          drawLever(true);
          leverG.angle = 70;
          label.setText('⚙ PULLED!').setColor('#aaffaa');
          glow.setFillStyle(0x44ff88, 0.22);
          this.tweens.add({ targets: glow, alpha: 0.08, duration: 600, yoyo: true, repeat: -1 });
          this.cameras.main.shake(280, 0.01);
          this._showMessage('⚙ Lever pulled! Solve the puzzle to continue!');
          this.time.delayedCall(500, () => onPull());
        }
      });
    });

    let hintEvt;
    hintEvt = this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (pulled || !this.shadow) { hintEvt.remove(); return; }
        const d = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, x, baseY - 24);
        hint.setAlpha(d < 190 ? Math.min(1, (190 - d) / 70) : 0);
      }
    });
  }

  // ── Boss snake (Zone 3) ──────────────────────────────────────────────────
  _updateBossHP() {
    const h = ['❤️', '❤️', '❤️'].map((v, i) => i < this._snakeHP ? v : '🖤').join('');
    this._snakeHPText.setText(`🐍 Boss HP: ${h}`);
  }

  _defeatSnake() {
    this._bossPhase = 'defeated';
    this._snakeHPText.setText('🐍 Snake defeated! Gemma is safe!');
    this.tweens.add({ targets: this.snake, x: this.snake.x + 500, alpha: 0, duration: 1300, ease: 'Power2' });
    this.cameras.main.shake(450, 0.016);
    for (let i = 0; i < 18; i++) {
      const sp = this.add.image(
        this.snake.x + (Math.random() - 0.5) * 120,
        this.snake.y + (Math.random() - 0.5) * 50, 'sparkle'
      ).setDepth(60);
      this.tweens.add({ targets: sp, x: sp.x + (Math.random() - 0.5) * 160, y: sp.y - 70, alpha: 0, scale: 2, duration: 950, onComplete: () => sp.destroy() });
    }
    this.time.delayedCall(1400, () => this._unlockCage());
  }

  _unlockCage() {
    if (this._levelDone) return;
    this._levelDone = true;
    this._showMessage('🐾 Snake defeated! Gemma is safe! Gleeda will free the cage! 💛');

    // Cage stays — Gleeda opens it in Level 2
    this.cameras.main.shake(350, 0.015);
    for (let i = 0; i < 14; i++) {
      this.time.delayedCall(i * 60, () => {
        const sp = this.add.image(16700 + (Math.random() - 0.5) * 110, 360 + (Math.random() - 0.5) * 60, 'sparkle').setDepth(62);
        this.tweens.add({ targets: sp, y: sp.y - 50, alpha: 0, scale: 2, duration: 700, onComplete: () => sp.destroy() });
      });
    }

    this.gemmaGoal.setTexture('gemma_happy');
    this.tweens.killTweensOf(this.gemmaGoal);
    this.tweens.add({ targets: this.gemmaGoal, y: '-=12', duration: 260, yoyo: true, repeat: 4 });

    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 180, () => {
        const hrt = this.add.image(16700 + (Math.random() - 0.5) * 60, 320, 'heart').setDepth(60);
        this.tweens.add({ targets: hrt, y: hrt.y - 65, alpha: 0, duration: 950, onComplete: () => hrt.destroy() });
      });
    }

    this._destroyGemmaLifeBar();

    // Auto-transition to feed round — no button needed
    this.time.delayedCall(2200, () => {
      this._showMessage("GEMMA IS FREE! 🐾💛 Now let's find her some food!", 2000);
      this.cameras.main.fadeOut(2500, 0, 0, 0);
      this.time.delayedCall(2600, () => this.scene.start('L1_Food'));
    });
  }

  // ── Gemma life bar — shown in Zone 3 to show urgency ──────────────────────
  _createGemmaLifeBar() {
    // y shifted below the new premium header banner + hanging timer box
    const CX = W / 2, BY = 106, BW = 170, BH = 10;

    // Outer panel
    const panel = this.add.graphics().setScrollFactor(0).setDepth(34);
    panel.fillStyle(0x1a0904, 0.78);
    panel.fillRoundedRect(CX - BW / 2 - 4, 92, BW + 8, 24, 5);
    this._gemmaBarPanel = panel;

    // Label
    this._gemmaBarLabel = this.add.text(CX, 97, '💛 GEMMA\'S LIFE', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#ffdd44', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(36);

    // Track background
    this._gemmaBarBG = this.add.graphics().setScrollFactor(0).setDepth(35);
    this._gemmaBarBG.fillStyle(0x110603, 1);
    this._gemmaBarBG.fillRoundedRect(CX - BW / 2, BY - BH / 2, BW, BH, 3);
    this._gemmaBarBG.lineStyle(1, 0x5a3010, 0.9);
    this._gemmaBarBG.strokeRoundedRect(CX - BW / 2, BY - BH / 2, BW, BH, 3);

    // Fill bar
    this._gemmaBarFill = this.add.graphics().setScrollFactor(0).setDepth(36);
    this._gemmaBarCX   = CX;
    this._gemmaBarBW   = BW;
    this._gemmaBarBY   = BY;
    this._gemmaBarBH   = BH;
    this._updateGemmaLifeBar();

    // Pulse the label
    this.tweens.add({
      targets: this._gemmaBarLabel, alpha: { from: 1, to: 0.55 },
      duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _updateGemmaLifeBar() {
    if (!this._gemmaBarFill || !this._timerFull) return;
    const ratio = Math.max(0, this._timerLeft / this._timerFull);
    const fillW = ratio * this._gemmaBarBW;
    const CX = this._gemmaBarCX, BY = this._gemmaBarBY, BH = this._gemmaBarBH;
    const col = ratio > 0.5 ? 0x33dd44 : ratio > 0.25 ? 0xeecc00 : 0xff3300;
    this._gemmaBarFill.clear();
    if (fillW > 2) {
      this._gemmaBarFill.fillStyle(col, 1);
      this._gemmaBarFill.fillRoundedRect(CX - this._gemmaBarBW / 2, BY - BH / 2, fillW, BH, 3);
    }
  }

  _destroyGemmaLifeBar() {
    if (!this._gemmaBarLabel) return;
    const label = this._gemmaBarLabel;
    this.tweens.killTweensOf(label);
    label.setText('💛 GEMMA SAVED! 🐾').setColor('#ffff44');
    [this._gemmaBarPanel, this._gemmaBarBG, this._gemmaBarFill].forEach(o => {
      if (o) { try { o.destroy(); } catch (_) {} }
    });
    this.tweens.add({
      targets: label, y: label.y - 12, alpha: 0, duration: 900,
      onComplete: () => { try { label.destroy(); } catch (_) {} }
    });
    this._gemmaBarLabel = null;
    this._gemmaBarFill  = null;
    this._gemmaBarPanel = null;
    this._gemmaBarBG    = null;
  }

  _drawCage(cx, groundY) {
    const cageW = 100, cageH = 90;
    const cageL = cx - cageW / 2, cageT = groundY - cageH;
    const g = this.add.graphics().setDepth(11);
    const barCount = 6, barGap = cageW / (barCount + 1);
    g.lineStyle(5, 0x4a3a18, 1);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b;
      g.lineBetween(bx, cageT + 3, bx, groundY - 2);
    }
    g.lineStyle(6, 0x4a3a18, 1);
    g.lineBetween(cageL, cageT + 3,            cageL + cageW, cageT + 3);
    g.lineBetween(cageL, cageT + cageH * 0.45, cageL + cageW, cageT + cageH * 0.45);
    g.lineBetween(cageL, groundY - 2,           cageL + cageW, groundY - 2);
    g.lineStyle(2, 0xc8a040, 0.35);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b - 1;
      g.lineBetween(bx, cageT + 3, bx, groundY - 2);
    }
    this._cageGraphics = g;
  }

  _startGauntlet() {
    this._showMessage('⚠️ Watch out! Boulders falling! 🪨');
    this.cameras.main.shake(200, 0.008);
    this._gauntletTimer = this.time.addEvent({
      delay: 2400, loop: true,
      callback: () => {
        if (this._levelDone || !this.shadow || this.shadow.x > 5300) {
          this._gauntletTimer.remove();
          return;
        }
        const spawnX = Phaser.Math.Clamp(this.shadow.x + (Math.random() - 0.45) * 220, 1000, 5200);
        const b = this._boulderGroup.create(spawnX, -20, 'rock');
        b.setDisplaySize(42, 32).setDepth(15);
        b.body.setSize(42, 32, true);
        b.body.setVelocityY(55);
        b.body.setAllowGravity(true);
        this.time.delayedCall(4500, () => { if (b && b.active) b.destroy(); });
      }
    });
  }

  // ── Lightning modal (boss encounter prompts) ─────────────────────────────
  _showLightningModal(text, persist = false) {
    this._dismissLightningModal();
    const multiline = text.includes('\n');
    const PH = multiline ? 74 : 52;
    const bg = this.add.rectangle(W / 2, 175, 610, PH, 0x080400, 0.97)
      .setScrollFactor(0).setDepth(60);
    bg.setStrokeStyle(3, 0xffdd00, 1);

    const txt = this.add.text(W / 2, 175, text, {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#ffee44', stroke: '#080400', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);

    const lBolt = this.add.text(W / 2 - 296, 175, '⚡', { fontSize: '18px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(61);
    const rBolt = this.add.text(W / 2 + 296, 175, '⚡', { fontSize: '18px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(61);

    this.tweens.add({ targets: bg,            strokeAlpha: { from: 1, to: 0.3 }, duration: 380, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: [lBolt, rBolt], alpha: { from: 1, to: 0.25 },     duration: 300, yoyo: true, repeat: -1 });

    this._lightningModalObjs = [bg, txt, lBolt, rBolt];
    if (!persist) this.time.delayedCall(3500, () => this._dismissLightningModal());
  }

  _dismissLightningModal() {
    if (!this._lightningModalObjs) return;
    this._lightningModalObjs.forEach(o => { try { if (o?.active) o.destroy(); } catch (_) {} });
    this._lightningModalObjs = null;
  }

  // ── Attack action (F key or ⚔️ button) ──────────────────────────────────
  _doSnakeAttack() {
    if (this._bossPhase !== 'attacking' || this._snakeHP <= 0 || this._levelDone) return;

    const dist = Phaser.Math.Distance.Between(
      this.shadow.x, this.shadow.y, this.snake.x, this.snake.y
    );
    if (dist > 320) {
      this._showMessage('Get closer to attack! 🐾');
      return;
    }

    this._snakeHP--;
    this._attackCount++;
    this._attackTxt.setText(`⚔️ Hits: ${this._attackCount} / 3`);
    this._updateBossHP();

    this.snake.setTint(0xff3333);
    this.tweens.add({ targets: this.snake, x: this.snake.x + 100, duration: 340, yoyo: true, ease: 'Power2' });
    this.time.delayedCall(580, () => this.snake.clearTint());
    this.cameras.main.shake(300, 0.013);

    const sp = this.add.image(this.snake.x, this.snake.y - 28, 'sparkle').setDepth(25).setScale(1.8);
    this.tweens.add({ targets: sp, scale: 3, alpha: 0, duration: 520, onComplete: () => sp.destroy() });

    const hitTxt = this.add.text(this.snake.x, this.snake.y - 55, `💥 HIT ${this._attackCount}/3!`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff6622', stroke: '#0a0200', strokeThickness: 3
    }).setDepth(26);
    this.tweens.add({ targets: hitTxt, y: hitTxt.y - 40, alpha: 0, duration: 800, onComplete: () => hitTxt.destroy() });

    if (this._snakeHP <= 0) {
      this._dismissLightningModal();
      this._setAttackBtn(false);
      this._defeatSnake();
    }
  }

  update() {
    if (this._pauseMenuOpen) return;
    this._updateBgParallax();
    this.updateMovement();
    if (!this.shadow) return;

    const sx = this.shadow.x;

    // ── Zone progress bar ──────────────────────────────────────────────────
    if (this._zpFill) {
      const pct = Math.min(sx / this._zpWorldW, 1);
      this._zpFill.width = Math.max(2, pct * this._zpWidth);
      this._zpRunner.x = this._zpLeft + pct * this._zpWidth;
      const fillColor = sx < 5750 ? 0x44cc44 : sx < 11550 ? 0xf5c840 : 0xee5522;
      this._zpFill.setFillStyle(fillColor);
    }

    // ── Rain fade (Zone 1 only) ────────────────────────────────────────────
    if (this._rainData) {
      if (this._rainActive) {
        for (const r of this._rainData) {
          r.img.y += r.speed;
          if (r.img.y > 460) { r.img.y = -10; r.img.x = Math.random() * 800; }
        }
        if (sx > 5000) {
          this._rainActive = false;
          this._rainData.forEach(r => this.tweens.add({ targets: r.img, alpha: 0, duration: 1400 }));
        }
      }
    }

    // ── Rock pushing ───────────────────────────────────────────────────────
    if (this._rocks) {
      Object.values(this._rocks).forEach(rock => {
        if (!rock.getData('hurdle') && !rock.getData('pushed')) {
          if (Phaser.Math.Distance.Between(sx, this.shadow.y, rock.x, rock.y) < 42)
            this._pushRock(rock);
        }
      });
    }

    // ── Boulder gauntlet (Zone 1) ──────────────────────────────────────────
    if (!this._gauntletStarted && sx > 900) {
      this._gauntletStarted = true;
      this._startGauntlet();
    }

    // ── Zone 2 entry ───────────────────────────────────────────────────────
    if (!this._zone2Entered && sx > 5750) {
      this._zone2Entered = true;
      this._saveCheckpoint(5770, 360);
      this._resetTimer(50);
      this._porcupines.filter(p => p.zone === 2).forEach(p => p.img.setVisible(true));
      this.time.delayedCall(600, () => this._showMessage('⚠️ Zone 2! Porcupines and falling stones ahead! 🦔🪨'));
      this._zone2BoulderTimer = this.time.addEvent({
        delay: 3000, loop: true,
        callback: () => {
          if (this._levelDone || !this.shadow || this.shadow.x > 11200) {
            this._zone2BoulderTimer.remove(); return;
          }
          // Spread rocks across full visible screen — behind AND ahead of player
          const camX2 = this.cameras.main.scrollX;
          const spawnX = Phaser.Math.Clamp(camX2 + 30 + Math.random() * 740, 5800, 11100);
          const b = this._boulderGroup.create(spawnX, -20, 'rock');
          b.setDisplaySize(42, 32).setDepth(15);
          b.body.setSize(42, 32, true);
          b.body.setVelocityY(22);
          b.body.setAllowGravity(true);
          this.time.delayedCall(4000, () => { if (b && b.active) b.destroy(); });
        }
      });
    }

    // ── Zone 3 entry ───────────────────────────────────────────────────────
    if (!this._zone3Entered && sx > 11550) {
      this._zone3Entered = true;
      this._saveCheckpoint(11570, 360);
      this._resetTimer(50);
      this._porcupines.forEach(p => p.img.setVisible(false));
      this._createGemmaLifeBar();
      this.time.delayedCall(300, () => this._showMessage('⚠️ Zone 3! Stones raining — save Gemma! 🐾🪨'));
      this._zone3BoulderTimer = this.time.addEvent({
        delay: 2200, loop: true,
        callback: () => {
          if (this._levelDone || !this.shadow) {
            this._zone3BoulderTimer.remove(); return;
          }
          const camX = this.cameras.main.scrollX;
          const spawnX = camX + 60 + Math.random() * 680;
          const b = this._boulderGroup.create(spawnX, -20, 'rock');
          b.setDisplaySize(42, 32).setDepth(15);
          b.body.setSize(42, 32, true);
          b.body.setVelocityY(65);
          b.body.setAllowGravity(true);
          this.time.delayedCall(4000, () => { if (b && b.active) b.destroy(); });
        }
      });
    }

    // ── Thorn hazard ──────────────────────────────────────────────────────
    if (this._thorns) {
      this._thorns.forEach(t => {
        if (sx > t.x && sx < t.x + t.w && this.shadow.y > t.y - 10 && !this._thornCooldown) {
          this._thornCooldown = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { this._thornCooldown = false; });
        }
      });
    }

    // ── Porcupine patrol AI ───────────────────────────────────────────────
    if (this._porcupines) {
      const py = this.shadow.y;
      this._porcupines.forEach(p => {
        if (!p.img.visible) return;
        p.x += p.dir * 0.7;
        if (p.x >= p.max) { p.x = p.max; p.dir = -1; }
        if (p.x <= p.min) { p.x = p.min; p.dir =  1; }
        p.img.setX(p.x).setFlipX(p.dir > 0);
        const hDist = Math.abs(p.x - sx);
        const vDist = Math.abs(p.y - py);
        if (hDist < 55 && vDist < 38 && !p.hitCD) {
          p.hitCD = true;
          this._onHazardHit();
          this.time.delayedCall(1200, () => { p.hitCD = false; });
        }
      });
    }

    // ── Boss encounter phases ──────────────────────────────────────────────
    if (this._zone3Entered && !this._levelDone) {
      this._updateGemmaLifeBar();

      // Trigger approach when Shadow gets close to snake area
      if (this._bossPhase === 'idle' && sx > 15700) {
        this._bossPhase = 'approach';
        this.cameras.main.shake(400, 0.014);
        this._showLightningModal(
          '⚡ The snake is attacking Gemma!\nPress [B] 🐕 to BARK and stop it!', true
        );
        // Stop rock rain — focus is now on the boss fight
        if (this._zone3BoulderTimer) { this._zone3BoulderTimer.remove(); this._zone3BoulderTimer = null; }
        // Destroy any existing falling rocks immediately
        if (this._boulderGroup) this._boulderGroup.clear(true, true);
      }

      // Snake paces back-and-forth menacingly — does NOT reach cage until time expires
      if (this._bossPhase === 'approach') {
        this.snake.x += this._snakePaceDir * 1.2;
        this.snake.setFlipX(this._snakePaceDir < 0);
        if (this.snake.x > 16530) { this.snake.x = 16530; this._snakePaceDir = -1; }
        if (this.snake.x < 16100) { this.snake.x = 16100; this._snakePaceDir =  1; }
        // Block Shadow from walking through the snake (body half ~45px + buffer)
        if (sx >= this.snake.x - 58) {
          this.shadow.x = this.snake.x - 60;
          this.shadow.body.setVelocityX(Math.min(0, this.shadow.body.velocity.x));
        }
      }

      // Snake chases Shadow in attack phase; player hits F / ⚔️ to damage
      if (this._bossPhase === 'attacking') {
        const bd = Math.abs(this.snake.x - sx);
        if (bd > 45) {
          const dir = sx > this.snake.x ? 1 : -1;
          this.snake.x += dir * 1.0;
          this.snake.setFlipX(dir < 0);
        }
        if (bd < 60 && !this._snakeLungeCooldown) {
          this._snakeLungeCooldown = true;
          this._onHazardHit();
          this.time.delayedCall(1500, () => { this._snakeLungeCooldown = false; });
        }
        // F key attack
        if (Phaser.Input.Keyboard.JustDown(this._attackKey)) this._doSnakeAttack();
      }
    }

    // ── Collapsing logs ────────────────────────────────────────────────────
    if (this._collapsing) {
      this._collapsing.forEach(cp => {
        if (cp.triggered) return;
        // Trigger only when player is ON the log (close horizontally AND at platform height)
        if (Math.abs(sx - cp.x) < 55 && this.shadow.y < cp.y + 20) {
          cp.triggered = true;
          this._showMessage('⚠️ The log is cracking!');
          const toShake = this.platGroup.getChildren().filter(p => Math.abs(p.x - cp.x) < 55);
          toShake.forEach(p => this.tweens.add({ targets: p, x: p.x + 3, duration: 80, yoyo: true, repeat: 6 }));
          this.time.delayedCall(cp.delay, () => {
            const toFall = this.platGroup.getChildren().filter(p => Math.abs(p.x - cp.x) < 55);
            toFall.forEach(p => {
              const { x, y, displayWidth: dw, displayHeight: dh } = p;
              const key = p.texture.key;
              p.destroy();
              const vis = this.add.image(x, y, key).setDisplaySize(dw, dh).setDepth(8);
              this.tweens.add({ targets: vis, y: y + 200, alpha: 0, angle: (Math.random() - 0.5) * 25, duration: 700, ease: 'Power2', onComplete: () => vis.destroy() });
            });
            this.cameras.main.shake(200, 0.01);
          });
        }
      });
    }
  }
}

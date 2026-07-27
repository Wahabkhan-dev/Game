import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { BaseLevelScene } from '../BaseLevelScene.js';
import { L1HUD } from './hud/L1_HUD.js';
import { preloadDogSkin, applyDogSkin } from './L1_DogSkin.js';
import { buildL1Background, updateL1Parallax, buildL1Ground } from './L1_Scenery.js';
import { pickRandomGame, resetGameHistory } from '../../../utils/MiniGamePicker.js';
import { showStoryCard, addLoopingVideo } from '../../../utils/VideoOverlay.js';
import { showTryAgainModal } from '../../../utils/EndModals.js';
import { preloadPorcupineSkin, createPorcupineSprite } from '../PorcupineSkin.js';
import { preloadSnakeSkin, ensureSnakeAnim, SNAKE_ANIM_KEY, SNAKE_FIRST_KEY } from '../SnakeSkin.js';

// Chapter 1 — Three zones: Easy → Medium → Boss → Free Gemma
export class Level1Scene extends BaseLevelScene {
  constructor() { super('Level1'); }

  // ── Real-art scenery (jungle background + forest-floor surface) ─────────────
  // Override the shared BaseLevelScene visuals for Level 1 only. Physics/gameplay
  // is untouched (buildL1Ground re-creates the same invisible collision tiles).
  _buildBackground(worldW) { buildL1Background(this, worldW); }
  _updateBgParallax()      { updateL1Parallax(this); }
  _buildGround(config)     { buildL1Ground(this, config); }

  // Load the NEW-RUN black-dog frames (visual-only swap; see L1_DogSkin.js).
  preload() {
    preloadDogSkin(this);
    preloadPorcupineSkin(this);
    preloadSnakeSkin(this);
  }

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

  // ── Game over (all lives lost) — Level 1 only: show a story beat, then play
  // the exceptional.mp4 cinematic, then restart the level.
  _handleGameOver() {
    showStoryCard(this, '🐍  Gemma was bitten by a snake…', () => {
      showStoryCard(this, '💔  You couldn\'t save Gemma in time…', () => {
        this._playVideoOverlay('l1_gameover_video', () => {
          this.registry.set('lives', 3);
          this.registry.set('shadowHP', 3);
          // Guaranteed reset — the death tween's own cleanup may not have run
          // yet (or may get cut short) by the time the level restarts.
          this.shadow.clearTint();
          this.shadow.setAlpha(1);
          showTryAgainModal(this, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(210, () => this.scene.restart());
          });
        });
      });
    });
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

  // Header timer sits on the pocket-watch art (ui_time_bg) — no emoji needed.
  _resetTimer(seconds) {
    if (!this._timerTxt) return;
    this._timerLeft  = seconds;
    this._timerFull  = seconds;
    this._timerFired = false;
    this._timerTxt.setText(`${seconds}s`);
    this._timerTxt.setColor('#ffe08a');
  }

  // ── Respawn (life lost, lives remain) ───────────────────────────────────────
  // Whenever the player respawns at the last checkpoint they crossed:
  //   • restart THAT zone's timer from full (each zone set _timerFull on entry), and
  //   • if they died mid-boss-fight, silently re-arm the encounter so no stale
  //     prompt / attack UI lingers and no intro prompt reappears (those show once).
  //   • undo any lever+bridge that was solved but never "locked in" — i.e. the
  //     player pulled the lever and built the bridge, then died to something
  //     else before actually reaching the checkpoint just past it. Respawning
  //     puts them back BEFORE that lever, so it must look/behave unsolved
  //     again instead of leaving a already-open lever + already-built bridge
  //     sitting there for free.
  _respawnAtCheckpoint() {
    this._resetBossEncounterIfActive();
    if (this._timerFull != null) this._resetTimer(this._timerFull);
    if (!this._zone2Entered && this._bridge1Objs) {
      this._teardownBridge(this._bridge1Objs);
      this._bridge1Objs = null;
      this._resetLever1?.();
    }
    if (!this._zone3Entered && this._bridge2Objs) {
      this._teardownBridge(this._bridge2Objs);
      this._bridge2Objs = null;
      this._resetLever2?.();
    }
    super._respawnAtCheckpoint();
  }

  _resetBossEncounterIfActive() {
    if (this._bossPhase === 'idle' || this._bossPhase === 'defeated') return;
    this._dismissLightningModal();
    this._setAttackBtn(false);
    if (this._snakeHPText) this._snakeHPText.setVisible(false);
    if (this._attackTxt)   this._attackTxt.setVisible(false);
    this._bossPhase   = 'idle';      // re-arms approach when the player walks back
    this._snakeHP     = 3;
    this._attackCount = 0;
    this._updateBossHP();
    if (this.snake) { this.snake.clearTint(); this.snake.x = 16200; }
    this._snakePaceDir = -1;
  }

  create() {
    // Fresh playthrough (including a restart after game over) — clear which
    // mini-games have already been shown so none of Level 1's four trigger
    // points (2 levers here + 2 in the food bonus round) can repeat one.
    resetGameHistory(1);

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
    // Swap the player VISUAL to the NEW-RUN black dog (gameplay/physics untouched).
    applyDogSkin(this);
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

    // Bridge tile/plank objects, kept so a death-before-checkpoint respawn can
    // tear them back down (see _respawnAtCheckpoint below).
    this._bridge1Objs = null;
    this._bridge2Objs = null;

    // ── LEVER 1: end of Zone 1 ─────────────────────────────────────────────
    this._resetLever1 = this._spawnLever(5350, async (resetLever) => {
      const game1 = await pickRandomGame(1);
      if (game1) this._launchMiniGame(game1, () => {
        this._bridge1Objs = this._buildBridge(5400, 350);
      }, resetLever);   // fail (time up / exit) → re-arm the lever for another try
      else this._freezeForMini = false;   // no game → don't leave the player frozen
    });

    // ── LEVER 2: end of Zone 2 ─────────────────────────────────────────────
    this._resetLever2 = this._spawnLever(11150, async (resetLever) => {
      const game2 = await pickRandomGame(1);
      if (game2) this._launchMiniGame(game2, () => {
        this._bridge2Objs = this._buildBridge(11200, 350);
      }, resetLever);   // fail (time up / exit) → re-arm the lever for another try
      else this._freezeForMini = false;   // no game → don't leave the player frozen
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
    // Visual only: real cactus art, bottom-anchored at the true ground line
    // (≈423, same reference used for the porcupine fix) instead of the old
    // 🌵 emoji text (which rendered ~378, well above the ground — the
    // "floating cactus" look). Hit-detection below is UNCHANGED — it still
    // reads t.x/t.y/t.w from this same array, exactly as before.
    const THORN_GROUND_Y = 423;
    this._thorns = [];
    // Zone 1 end section (x=4200–5100): break the blank stretch before the lever
    // Display size reduced ~15% then a further ~7% (60 → 51 → 47) per art-pass request.
    [4280, 4650, 5050].forEach(tx => {
      this.add.image(tx, THORN_GROUND_Y, 'cactus_thorn').setOrigin(0.5, 1).setDisplaySize(47, 47).setDepth(9);
      this._thorns.push({ x: tx - 12, y: 370, w: 28, h: 28 });
    });
    // Zone 3 no longer has the cactus-thorn hazard (removed per request) —
    // the swamp-water gaps + rock rain + boss snake already carry Zone 3.

    // ── Gap visuals (Zone 1 short gaps) — plain dark pit, no water ────────
    [{ x: 700, w: 110 }, { x: 1900, w: 110 }, { x: 3200, w: 110 }].forEach(gap => {
      const cx = gap.x + gap.w / 2;
      this.add.rectangle(cx, H - 18, gap.w + 4, 36, 0x0a0806, 1).setDepth(3);
      this.add.rectangle(cx, H - 26, gap.w, 10, 0x1a1410, 0.6).setDepth(4);
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
    // VIS_Y_OFFSET is a display-only correction: Shadow's actual visual feet
    // sit at getBounds().bottom ≈ 423, but p.y (398) is the original hazard
    // hit-detection line — don't touch that (unchanged gameplay). Only the
    // SPRITE draws lower, at p.y + VIS_Y_OFFSET, so it looks grounded instead
    // of floating ~25px above the path.
    const VIS_Y_OFFSET = 25;
    this._porcVisYOffset = VIS_Y_OFFSET;
    this._porcupines = [];
    [
      { x:  1300, y: 398, min:  1050, max:  1550, dir:  1, zone: 1 },
      { x:  2400, y: 398, min:  2100, max:  2700, dir: -1, zone: 1 },
      { x:  6250, y: 398, min:  6050, max:  6460, dir:  1, zone: 2 },
      { x:  7500, y: 398, min:  7250, max:  7760, dir: -1, zone: 2 },
      { x:  9300, y: 398, min:  9210, max:  9550, dir:  1, zone: 2 },
      { x: 10200, y: 398, min:  9980, max: 10460, dir: -1, zone: 2 },
    ].forEach(d => {
      const img = createPorcupineSprite(this, d.x, d.y + VIS_Y_OFFSET, 45, 34)
        .setOrigin(0.5, 1)
        .setDepth(9)
        .setVisible(d.zone === 1);
      this._porcupines.push({ img, x: d.x, y: d.y, dir: d.dir, min: d.min, max: d.max, zone: d.zone, hitCD: false });
    });

    // ── Zone 3 boss snake — same physics body/HP/attack logic as before, now
    // with the looping 24-frame slither animation instead of a static image.
    ensureSnakeAnim(this);
    // Size + ground-anchoring MATCH the Snake Anim Simulator (270×126, origin
    // bottom-centre) so the boss snake is shown at the real image proportions,
    // not the old squashed 110×36. y = the TRUE ground line (423, same as the
    // thorns/porcupines) so the snake rests on the floor at the character's feet
    // level instead of floating in mid-air.
    this._snakeGroundY = 423;
    this.snake = this.physics.add.sprite(16200, this._snakeGroundY, SNAKE_FIRST_KEY)
      .setOrigin(0.5, 1).setDisplaySize(270, 126).setDepth(9);
    this.snake.play(SNAKE_ANIM_KEY);
    this.snake.body.setSize(200, 60, true);
    this.snake.body.setAllowGravity(false);
    this._snakeHP            = 3;
    this._bossPhase          = 'idle';   // idle → approach → stunned → attacking → defeated
    this._attackCount        = 0;
    this._snakeLungeCooldown = false;
    this._snakePaceDir       = -1;       // approach phase: paces left↔right, -1=left 1=right
    // The boss "how to play" prompts (bark, then attack) appear ONLY the first
    // time the encounter happens. After a death/respawn the fight resumes with no
    // prompt reappearing — these flags gate that.
    this._barkPromptShown    = false;
    this._attackPromptShown  = false;
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
    // Looping video (dog + cage baked in, continuously animated) replaces the
    // old procedural back-wall/bars + static gemma_idle sprite combo.
    {
      const gx = 16700, gy = 423;   // true ground line — same as the thorns/snake
      // Sized to match Shadow/Gleeda's own on-screen size (122×66) + 10%.
      this.gemmaGoal = addLoopingVideo(this, gx, gy, 'gemma_cage_loop', {
        originY: 1, depth: 9, width: 134, height: 73,
      });
      this.tweens.add({ targets: this.gemmaGoal, y: gy - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
          if (!this._attackPromptShown) {
            this._showLightningModal('⚡ Press [F] / ⚔️ to ATTACK!\nHit the snake 3 times to save Gemma!', true);
            this._attackPromptShown = true;
          }
        });
      }
    };

    this.physics.add.collider(this.snake, this.groundGroup);

    this.time.delayedCall(1200, () =>
      this._showMessage('Dodge porcupines, jump logs! Reach the lever! 🐾')
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
  // Returns every object it created (ground tiles + plank/grain visuals) so a
  // death before the next checkpoint can tear it back down — see
  // _teardownBridge / _respawnAtCheckpoint below.
  _buildBridge(startX, width) {
    const objs = [];
    for (let tx = startX; tx < startX + width; tx += 32) {
      const tile = this.groundGroup.create(tx + 16, H - 16, 'ground');
      tile.setDisplaySize(32, 32).setAlpha(0).refreshBody();
      objs.push(tile);
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
      objs.push(plank, grain);
    }

    this.cameras.main.shake(300, 0.012);
    this.time.delayedCall(count * 38 + 200, () =>
      this._showMessage('🌉 Bridge built! Cross now! 🐾')
    );
    return objs;
  }

  // Tears a built bridge back down — used when the player dies and respawns
  // at a checkpoint BEFORE the zone this bridge unlocks, so that "provisional"
  // progress (lever pulled, bridge built) that was never actually locked in
  // by reaching the next checkpoint doesn't survive the respawn.
  _teardownBridge(objs) {
    if (!objs) return;
    objs.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch (_) {} });
    if (this.groundGroup?.refresh) this.groundGroup.refresh();
  }

  // ── Lever ──────────────────────────────────────────────────────────────────
  _spawnLever(x, onPull) {
    const GRASS_Y = H - 46;
    // Real-art lever (base box + pole + ball, closed/open baked in as two
    // separate images). Height reduced ~22% (78 → 61) per art-pass request.
    const LEVER_H = 61;
    const closedSrc = this.textures.get('lever_closed').getSourceImage();
    const openSrc   = this.textures.get('lever_open').getSourceImage();
    const closedW = LEVER_H * (closedSrc.width / closedSrc.height);
    const openW   = LEVER_H * (openSrc.width / openSrc.height);

    const leverImg = this.add.image(x, GRASS_Y, 'lever_closed')
      .setOrigin(0.5, 1).setDisplaySize(closedW, LEVER_H).setDepth(12);

    const baseY = GRASS_Y - LEVER_H;

    const label = this.add.text(x, baseY - 10, '⚙ LEVER', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(12);

    const hint = this.add.text(x, baseY - 22, '▼ Walk here!', {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#aaeebb'
    }).setOrigin(0.5).setDepth(12).setAlpha(0);

    const glow = this.add.circle(x, GRASS_Y - LEVER_H / 2, 18, 0xf5c87a, 0.12).setDepth(11);
    const startGlowIdle = () => {
      this.tweens.killTweensOf(glow);
      glow.setFillStyle(0xf5c87a, 0.12).setAlpha(0.12).setScale(1);
      this.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.3, scaleY: 1.3, duration: 750, yoyo: true, repeat: -1 });
    };
    startGlowIdle();

    let pulled = false;
    let zone;
    let needsRearm = false;

    // Re-arms the lever so the mini-activity fires again on the next approach.
    // Called when the bridge-building mini-game is failed (time runs out) and
    // the player respawns at the zone start — the lever must be "closed"
    // again, not permanently spent, or the zone can never be crossed.
    // The physics trigger itself is NOT recreated here: the player is still
    // standing exactly on top of it when this fires (frozen through the
    // mini-game), so an immediate overlap would instantly re-fire it before
    // they even respawn. Instead the hint-loop below arms it only once the
    // player has actually walked clear of the spot.
    const resetLever = () => {
      try {
        pulled = false;
        leverImg.setTexture('lever_closed').setDisplaySize(closedW, LEVER_H);
        label.setText('⚙ LEVER').setColor('#f5c87a');
        startGlowIdle();
        if (zone && zone.active) zone.destroy();
        zone = null;
        needsRearm = true;
      } catch (_) {}
    };

    const armZone = () => {
      zone = this.physics.add.image(x, H - 58, '__DEFAULT')
        .setAlpha(0).setDisplaySize(70, 70);
      zone.body.setAllowGravity(false);
      this.physics.add.overlap(this.shadow, zone, () => {
        if (pulled) return;
        pulled = true;
        zone.destroy();
        this.tweens.killTweensOf(glow);

        // Stop Shadow immediately AND keep them stuck here through the lever
        // animation + the async game pick, so they never drift past the trigger.
        if (this.shadow && this.shadow.body) this.shadow.setVelocity(0, 0);
        this._freezeForMini = true;

        // Quick squash-punch (the "open" art already shows the handle pulled
        // over sideways, so no rotation tween is needed on top of it).
        this.tweens.add({
          targets: leverImg, scaleY: leverImg.scaleY * 0.85, duration: 110, yoyo: true, ease: 'Sine.easeIn',
          onComplete: () => {
            leverImg.setTexture('lever_open').setDisplaySize(openW, LEVER_H);
            label.setText('⚙ PULLED!').setColor('#aaffaa');
            glow.setFillStyle(0x44ff88, 0.22);
            this.tweens.add({ targets: glow, alpha: 0.08, duration: 600, yoyo: true, repeat: -1 });
            this.cameras.main.shake(280, 0.01);
            this._showMessage('⚙ Lever pulled! Solve the puzzle to continue!');
            this.time.delayedCall(500, () => onPull(resetLever));
          }
        });
      });
    };
    armZone();

    let hintEvt;
    hintEvt = this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        if (!this.shadow) { hintEvt.remove(); return; }
        if (pulled) { hint.setAlpha(0); return; }
        const d = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, x, baseY - 24);
        if (needsRearm) {
          // Wait for the player to clear the trigger radius before re-arming,
          // so the re-armed zone doesn't instantly overlap them again.
          if (d > 120) { needsRearm = false; armZone(); }
          hint.setAlpha(0);
          return;
        }
        hint.setAlpha(d < 190 ? Math.min(1, (190 - d) / 70) : 0);
      }
    });

    // Exposed so a death-before-checkpoint respawn can force this lever back
    // to closed even after it's already been successfully pulled — see
    // _respawnAtCheckpoint.
    return resetLever;
  }

  // ── Boss snake (Zone 3) ──────────────────────────────────────────────────
  _updateBossHP() {
    const h = ['❤️', '❤️', '❤️'].map((v, i) => i < this._snakeHP ? v : '🖤').join('');
    this._snakeHPText.setText(`🐍 Boss HP: ${h}`);
  }

  _defeatSnake() {
    this._bossPhase = 'defeated';
    // Gemma is saved — the fight (and its clock) is over. _levelDone pauses
    // the countdown timer (and Gemma's HP decay, and hazards) for the rest of
    // the victory sequence, WITHOUT freezing player movement the way
    // _puzzleActive would — the player needs to be able to walk over to
    // Gemma next, not stand frozen where the snake fell.
    this._levelDone = true;
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
    // Text shows right here, immediately after the defeat effects — NOT after
    // any later respawn/reappear animation. The video only plays once the
    // player actually walks up near Gemma (see _checkGemmaApproach in update()).
    this.time.delayedCall(1400, () => {
      this._showMessage('🐍 The snake is gone! Go to Gemma! 🐾');
      this._awaitingGemmaApproach = true;
    });
  }

  // Checked every frame from update() once the snake is defeated — plays the
  // conclusion video (then unlocks the cage) as soon as the player gets near
  // Gemma, instead of firing automatically on a fixed timer regardless of
  // where the player is standing.
  _checkGemmaApproach() {
    if (!this._awaitingGemmaApproach || !this.gemmaGoal || !this.shadow) return;
    const d = Phaser.Math.Distance.Between(this.shadow.x, this.shadow.y, this.gemmaGoal.x, this.gemmaGoal.y);
    if (d > 150) return;
    this._awaitingGemmaApproach = false;
    this._playVideoOverlay('l1_conclusion_video', () => this._unlockCage());
  }

  _unlockCage() {
    if (this._cageUnlocked) return;
    this._cageUnlocked = true;
    this._showMessage('🐾 Snake defeated! Gemma is safe! Gleeda will free the cage! 💛');

    // Cage stays — Gleeda opens it in Level 2
    this.cameras.main.shake(350, 0.015);
    for (let i = 0; i < 14; i++) {
      this.time.delayedCall(i * 60, () => {
        const sp = this.add.image(16700 + (Math.random() - 0.5) * 110, 360 + (Math.random() - 0.5) * 60, 'sparkle').setDepth(62);
        this.tweens.add({ targets: sp, y: sp.y - 50, alpha: 0, scale: 2, duration: 700, onComplete: () => sp.destroy() });
      });
    }

    // Video game objects can't texture-swap like an image — cue the "happy"
    // moment with a warm tint + bounce instead, video keeps looping underneath.
    this.gemmaGoal.setTint(0xfff2c0);
    this.tweens.killTweensOf(this.gemmaGoal);
    this.tweens.add({ targets: this.gemmaGoal, y: '-=12', duration: 260, yoyo: true, repeat: 4 });

    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 180, () => {
        const hrt = this.add.image(16700 + (Math.random() - 0.5) * 60, 320, 'heart').setDepth(60);
        this.tweens.add({ targets: hrt, y: hrt.y - 65, alpha: 0, duration: 950, onComplete: () => hrt.destroy() });
      });
    }

    this._destroyGemmaLifeBar();

    // Auto-transition to feed round — no button needed. Was a scripted ~4.8s
    // pause (2200ms wait + 2500ms fade + 2600ms more) after the video already
    // finished — trimmed to the same snappy 500/550ms fade every other
    // level-to-level transition in the game uses, so nothing sits waiting.
    this.time.delayedCall(300, () => {
      this._showMessage("GEMMA IS FREE! 🐾💛 Now let's find her some food!", 1200);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(210, () => this.scene.start('L1_Food'));
    });
  }

  // ── Gemma life bar — shown in Zone 3 to show urgency ──────────────────────
  _createGemmaLifeBar() {
    // y shifted below the new premium header banner + hanging timer box.
    // Panel is tall enough to stack the label ABOVE the bar with a clear gap
    // (the label used to sit at the same height as the bar track, so the
    // green/yellow/red fill was drawn right over the "GEMMA'S LIFE" text).
    const CX = W / 2, BY = 120, BW = 170, BH = 10;
    const PANEL_Y = 92, PANEL_H = 36;

    // Outer panel
    const panel = this.add.graphics().setScrollFactor(0).setDepth(34);
    panel.fillStyle(0x1a0904, 0.78);
    panel.fillRoundedRect(CX - BW / 2 - 4, PANEL_Y, BW + 8, PANEL_H, 5);
    this._gemmaBarPanel = panel;

    // Label — sits clear of the bar track below it
    this._gemmaBarLabel = this.add.text(CX, PANEL_Y + 4, '💛 GEMMA\'S LIFE', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#ffdd44', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(37);

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
    // While a mini-game overlay is open, freeze EVERYTHING in the level —
    // hurdles/hazards must not be able to cost a life while the player is
    // stuck inside the puzzle with no way to dodge.
    if (this._pauseMenuOpen || this._miniGameOpen) return;
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
        const bob = Math.sin((p.x * 0.03) + (p.dir > 0 ? 0.2 : 0.8)) * 2.4;
        p.img.setY(p.y + (this._porcVisYOffset || 0) + bob);
        // Hit-detection stays on the ORIGINAL p.y (398) — gameplay unchanged.
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
        // Prompt only the FIRST time — on a retry the player already knows.
        if (!this._barkPromptShown) {
          this._showLightningModal(
            '⚡ The snake is attacking Gemma!\nPress [B] 🐕 to BARK and stop it!', true
          );
          this._barkPromptShown = true;
        }
        // Stop rock rain — focus is now on the boss fight
        if (this._zone3BoulderTimer) { this._zone3BoulderTimer.remove(); this._zone3BoulderTimer = null; }
        // Destroy any existing falling rocks immediately
        if (this._boulderGroup) this._boulderGroup.clear(true, true);
      }

      // Snake paces back-and-forth menacingly — does NOT reach cage until time expires
      if (this._bossPhase === 'approach') {
        this.snake.x += this._snakePaceDir * 1.2;
        // Face the direction of travel — SAME convention as the Snake Simulator
        // (flipX when moving right); the old `< 0` made it face the wrong way.
        this.snake.setFlipX(this._snakePaceDir > 0);
        if (this.snake.x > 16530) { this.snake.x = 16530; this._snakePaceDir = -1; }
        if (this.snake.x < 16100) { this.snake.x = 16100; this._snakePaceDir =  1; }
        // Block Shadow from walking through the snake (visual half-width ~135px now)
        if (sx >= this.snake.x - 130) {
          this.shadow.x = this.snake.x - 132;
          this.shadow.body.setVelocityX(Math.min(0, this.shadow.body.velocity.x));
        }
      }

      // Snake chases Shadow in attack phase; player hits F / ⚔️ to damage
      if (this._bossPhase === 'attacking') {
        const bd = Math.abs(this.snake.x - sx);
        if (bd > 45) {
          const dir = sx > this.snake.x ? 1 : -1;
          this.snake.x += dir * 1.0;
          this.snake.setFlipX(dir > 0);
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

    // Runs even after _levelDone (the snake fight's own block above stops
    // once _levelDone is set) — walking near Gemma post-victory is what
    // actually triggers the conclusion video, not a fixed timer.
    this._checkGemmaApproach();

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

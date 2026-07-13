import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';

export class BaseLevelScene extends Phaser.Scene {

  initLevel(config) {
    this.lvlConfig     = config;
    this._isDying      = false;
    this._levelDone    = false;
    this._damageCD     = false;
    this._puzzleActive = false;
    this._checkpointX  = config.startX || 80;
    this._checkpointY  = config.startY || 390;
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Extend world bottom so Shadow can fall off gaps before being detected
    this.physics.world.setBounds(0, 0, config.worldWidth || 2000, H + 600);
    this.cameras.main.setBounds(0, 0, config.worldWidth || 2000, H);

    this._buildBackground(config.worldWidth || 2000);

    this.groundGroup = this.physics.add.staticGroup();
    this._buildGround(config);

    this.platGroup = this.physics.add.staticGroup();
    if (config.platforms) {
      config.platforms.forEach(p => {
        const pl = this.platGroup.create(p.x, p.y, p.key || 'platform');
        if (p.key === 'log') {
          // log.png is 1118×223 — use config w, derive height from real ratio
          const lw = p.w || 90;
          const lh = p.h || Math.round(lw * 223 / 1118);
          pl.setDisplaySize(lw, lh).refreshBody();
        } else {
          // platform.png is 1003×249 — ratio ~4:1, matches config defaults closely
          pl.setDisplaySize(p.w || 80, p.h || 20).refreshBody();
        }
      });
    }

    this.rockGroup = this.physics.add.group({ allowGravity: false });
    this._rocks = {};
    if (config.rocks) {
      config.rocks.forEach((r, i) => {
        const rock = this.rockGroup.create(r.x, r.y, 'rock');
        // rock.png is 569×438 — display at 60×46 (ratio 1.30:1 matches image)
        rock.setDisplaySize(60, 46);
        rock.body.setSize(60, 46, true);
        rock.setCollideWorldBounds(true);
        rock.setImmovable(r.immovable !== false);
        rock.setData('id', i);
        rock.setData('hurdle', r.hurdle === true);
        if (!r.immovable) rock.body.setAllowGravity(false);
        this._rocks[i] = rock;
      });
    }

    const char    = config.character || 'shadow';
    const idleKey = char === 'gleeda' ? 'gleeda_idle' : 'shadow_idle';
    this.shadow   = this.physics.add.sprite(config.startX || 80, config.startY || 390, idleKey);

    // Both characters: setScale(0.18) → 122×66px world size; body = 73×56px
    this.shadow.setScale(0.18);
    const tw = this.shadow.texture.source[0].width;
    const th = this.shadow.texture.source[0].height;
    this.shadow.body.setSize(tw * 0.60, th * 0.85, true);

    this.shadow.setCollideWorldBounds(true);
    this.shadow.setDepth(10);
    this._onGround = false;

    this._walkAnim = char === 'gleeda' ? 'gleeda_walk'      : 'shadow_walk';
    this._idleAnim = char === 'gleeda' ? 'gleeda_idle_anim' : 'shadow_idle_anim';
    this._jumpAnim = char === 'gleeda' ? 'gleeda_jump_anim' : 'shadow_jump_anim';

    if (char === 'gleeda') {
      if (!this.anims.exists('gleeda_walk')) {
        this.anims.create({ key: 'gleeda_walk',      frames: [{ key: 'gleeda_run1' }], frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'gleeda_idle_anim', frames: [{ key: 'gleeda_idle' }], frameRate: 1, repeat: -1 });
        this.anims.create({ key: 'gleeda_jump_anim', frames: [{ key: 'gleeda_jump' }], frameRate: 1, repeat: -1 });
      }
    } else {
      if (!this.anims.exists('shadow_walk')) {
        this.anims.create({ key: 'shadow_walk',      frames: [{ key: 'shadow_run1' }, { key: 'shadow_run2' }], frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'shadow_idle_anim', frames: [{ key: 'shadow_idle' }],                         frameRate: 1, repeat: -1 });
        this.anims.create({ key: 'shadow_jump_anim', frames: [{ key: 'shadow_jump' }],                         frameRate: 1, repeat: -1 });
      }
    }

    this.cameras.main.startFollow(this.shadow, true, 0.08, 0.08);

    this.physics.add.collider(this.shadow, this.groundGroup);
    this.physics.add.collider(this.shadow, this.platGroup);
    this.physics.add.collider(this.shadow, this.rockGroup);
    this.physics.add.collider(this.rockGroup, this.groundGroup);
    this.physics.add.collider(this.rockGroup, this.platGroup);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      bark:  Phaser.Input.Keyboard.KeyCodes.B
    });

    this._buildTouchControls();
    this._buildHUD(config);

    this.time.addEvent({ delay: 600, callback: this._spawnLeaf, callbackScope: this, loop: true });

    // Register this scene so the HTML bark button can reach _doBark()
    window._currentLevel = this;

    // Show the footer controls only during gameplay
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => {
      if (window._currentLevel === this) window._currentLevel = null;
      const f = document.getElementById('game-footer');
      if (f) f.style.display = 'none';
      // Always hide attack button when leaving any level
      const atk = document.getElementById('btn-attack');
      if (atk) atk.style.display = 'none';
    });

    // atmospheric mist overlay (fixed to camera)
    this._fogLayer = this.add.tileSprite(400, 400, 800, 80, 'fog')
      .setScrollFactor(0).setAlpha(0.55).setDepth(18);

    this.time.delayedCall(500, () => this._showObjective(config.objective));
  }

  _buildBackground(worldW) {
    // ── solid fallback so nothing is ever black/grid if image is missing ──
    this.add.rectangle(400, 225, 800, 450, 0x0a1a0a).setScrollFactor(0).setDepth(-15);

    // ── 3-layer parallax (only if jungle_bg image loaded successfully) ────
    const hasJungle = this.textures.exists('jungle_bg');

    if (hasJungle) {
      // Far layer — very slow, darkened for atmospheric depth
      this._bgFar = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.5).setTint(0x0d1a0d).setDepth(-12);

      // Mid layer — medium speed, slightly darkened
      this._bgMid = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.68).setTint(0x1a2e1a).setDepth(-9);

      // Near layer — fastest, full colour
      this._bgNear = this.add.tileSprite(400, 225, 800, 450, 'jungle_bg')
        .setScrollFactor(0).setAlpha(0.85).setDepth(-6);

    } else {
      // ── procedural jungle fallback (used until real image is added) ────
      // dark gradient sky
      const grad = this.add.graphics().setScrollFactor(0).setDepth(-12);
      for (let y = 0; y < 450; y++) {
        const t = y / 450;
        const r = Math.floor(8  + t * 4);
        const g = Math.floor(18 + t * 14);
        const b = Math.floor(8  + t * 4);
        grad.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
        grad.fillRect(0, y, 800, 1);
      }
      // silhouette tree columns at several depths
      const treePalette = [0x061006, 0x0a180a, 0x0e200e, 0x122812];
      for (let layer = 0; layer < 4; layer++) {
        const sf = 0.1 + layer * 0.15;
        const col = treePalette[layer];
        const count = Math.ceil(worldW / 60) + 2;
        for (let i = 0; i < count; i++) {
          const bx = i * 60 + (layer * 17) % 60;
          const bh = 180 + ((i * 37 + layer * 23) % 120);
          const bw = 22 + ((i * 13 + layer * 7) % 20);
          const img = this.add.graphics();
          img.fillStyle(col, 1);
          img.fillRect(bx, 450 - bh, bw, bh);   // trunk column
          img.fillEllipse(bx + bw / 2, 450 - bh, bw * 2.8, bh * 0.55); // canopy blob
          img.setScrollFactor(sf).setDepth(-12 + layer);
        }
      }
    }

    // Top dark gradient so sky area doesn't bleed into action zone
    const topFade = this.add.rectangle(400, 30, 800, 80, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(-5);

    // Atmospheric light rays (subtle vertical slices brightening the mid-scene)
    for (let i = 0; i < 5; i++) {
      const ray = this.add.rectangle(
        120 + i * 140, 160, 18, 340,
        0x88cc44, 0.028 + Math.random() * 0.018
      ).setScrollFactor(0).setDepth(-5);
      this.tweens.add({
        targets: ray,
        alpha: { from: 0.02, to: 0.06 },
        x: `+=${6 + i * 2}`,
        duration: 3000 + i * 700,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // Call every update() — drives the parallax scroll
  _updateBgParallax() {
    const sx = this.cameras.main.scrollX;
    if (this._bgFar)  this._bgFar.tilePositionX  = sx * 0.08;
    if (this._bgMid)  this._bgMid.tilePositionX  = sx * 0.28;
    if (this._bgNear) this._bgNear.tilePositionX = sx * 0.52;
  }

  _buildGround(config) {
    const worldW = config.worldWidth || 2000;
    const gaps   = config.gaps || [];

    // Invisible physics tiles for collision (32×32 grid, top at H-32=418)
    let x = 0;
    while (x < worldW) {
      const inGap = gaps.some(g => x + 16 > g.x && x < g.x + g.w);
      if (!inGap) {
        const tile = this.groundGroup.create(x + 16, H - 16, 'ground');
        tile.setDisplaySize(32, 32).setAlpha(0).refreshBody();
      }
      x += 32;
    }

    // Visual TileSprite per ground section — grass surface aligns with physics top (y=418)
    // ground.png is 500×500; tileScale 0.14 → each tile renders 70×70px.
    // Grass occupies top 20% of image = 14px. TileSprite center at H-11=439, top at 404.
    // Grass surface = 404 + 14 = 418 = physics surface. ✓
    this._groundSections(worldW, gaps).forEach(sec => {
      this.add.tileSprite(sec.start + sec.width / 2, H - 11, sec.width, 70, 'ground')
        .setTileScale(0.14, 0.14)
        .setDepth(5);
    });
  }

  _groundSections(worldW, gaps) {
    const sections = [];
    let start = 0;
    const sorted = [...gaps].sort((a, b) => a.x - b.x);
    for (const gap of sorted) {
      if (gap.x > start) sections.push({ start, width: gap.x - start });
      start = gap.x + gap.w;
    }
    if (start < worldW) sections.push({ start, width: worldW - start });
    return sections;
  }

  _buildHUD(config) {
    this._hudChapter = this.add.text(W / 2, 22, config.chapterName || '', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30);

    // Load lives from registry so they persist across levels; reset to 3 only on fresh game
    const savedLives = this.registry.get('lives');
    this._lives = (savedLives !== null && savedLives !== undefined) ? savedLives : 3;
    // Dark panel behind lives + HP pips
    const hudPanelG = this.add.graphics().setScrollFactor(0).setDepth(28);
    hudPanelG.fillStyle(0x1a0904, 0.72);
    hudPanelG.fillRoundedRect(4, 4, 94, 50, 7);
    hudPanelG.lineStyle(1, 0x5a3010, 0.6);
    hudPanelG.strokeRoundedRect(4, 4, 94, 50, 7);

    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(19 + i * 27, 19, 'heart').setScale(0.8).setScrollFactor(0).setDepth(30);
      if (i >= this._lives) { h.setTint(0x444444); h.setAlpha(0.25); }
      this._hearts.push(h);
    }

    // HP pips: 3 coloured graphical rectangles (green=3, yellow=2, red=1)
    const savedHP = this.registry.get('shadowHP');
    this._shadowHP = (savedHP !== null && savedHP !== undefined) ? savedHP : 3;
    this._hpGraphics = this.add.graphics().setScrollFactor(0).setDepth(30);
    this._drawHPPips();

    this.add.rectangle(W / 2, H - 12, 200, 8, 0x2a1a0a, 0.8).setScrollFactor(0).setDepth(30);
    this._progressBar = this.add.rectangle(W / 2 - 100, H - 12, 0, 8, 0xf5c87a, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
    this._progressMax = config.worldWidth || 2000;

    // Points display
    const savedPoints = this.registry.get('points') || 0;
    this._points = savedPoints;
    this._pointsTxt = this.add.text(14, 49, `⭐ ${this._points}`, {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(30);

    if (config.timer) {
      this._timerFull  = config.timer;
      this._timerLeft  = config.timer;
      this._timerFired = false;
      this._timerTxt = this.add.text(W / 2, 44, `⏱ ${config.timer}s`, {
        fontSize: '14px', fontFamily: 'Georgia, serif',
        color: '#f5c87a', stroke: '#1a0802', strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
      this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          // Pause the clock during puzzles / pause menu so mini-games are fair
          if (this._levelDone || this._isDying || this._puzzleActive || this._pauseMenuOpen) return;
          this._timerLeft = Math.max(0, this._timerLeft - 1);
          this._timerTxt.setText(`⏱ ${this._timerLeft}s`);
          this._timerTxt.setColor(this._timerLeft <= 10 ? '#ff3300' : '#f5c87a');
          if (this._timerLeft <= 0 && !this._timerFired) {
            // Ran out mid-mini-game → close it (no reward, no bridge) first
            if (this._miniGameOpen && this._miniGameClose) this._miniGameClose();
            this._timerFired = true;
            this._isDying = true;
            this._showMessage("⏱ Time's up! -1 Life! 💀");
            this.cameras.main.shake(300, 0.012);
            this.time.delayedCall(800, () => {
              this._timerFired = false;
              this._timerLeft  = this._timerFull;
              if (this._timerTxt) {
                this._timerTxt.setText(`⏱ ${this._timerFull}s`);
                this._timerTxt.setColor('#f5c87a');
              }
              this._loseLife(0.012);
            });
          }
        }
      });
    }

    // ── Menu button (top-right) ───────────────────────────────────────────
    this._pauseMenuOpen = false;
    const menuBtnG = this.add.graphics().setScrollFactor(0).setDepth(36);
    const drawMenuBtn = (hover) => {
      menuBtnG.clear();
      menuBtnG.fillStyle(hover ? 0x5a3010 : 0x2a1408, 0.88);
      menuBtnG.fillRoundedRect(W - 46, 8, 38, 28, 6);
      menuBtnG.lineStyle(1.5, hover ? 0xf5c87a : 0x8a6030, 1);
      menuBtnG.strokeRoundedRect(W - 46, 8, 38, 28, 6);
    };
    drawMenuBtn(false);
    this.add.text(W - 27, 22, '☰', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(37);
    const menuHit = this.add.rectangle(W - 27, 22, 38, 28, 0, 0)
      .setScrollFactor(0).setDepth(38).setInteractive({ useHandCursor: true });
    menuHit.on('pointerover', () => drawMenuBtn(true));
    menuHit.on('pointerout',  () => drawMenuBtn(false));
    menuHit.on('pointerup',   () => this._openPauseMenu());

    // Esc key toggles the pause menu open/closed
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => {
      if (this._pauseMenuOpen && this._pauseResumeFn) {
        this._pauseResumeFn(); // close menu
      } else if (!this._pauseMenuOpen) {
        this._openPauseMenu(); // open menu
      }
    });
  }

  _openPauseMenu() {
    if (this._pauseMenuOpen) return;
    this._pauseMenuOpen = true;

    this.physics.pause();
    this.tweens.pauseAll();
    this.time.paused = true;

    const W2 = W / 2, H2 = H / 2;
    const PW = 270, PH = 268;
    const px = W2 - PW / 2, py = H2 - PH / 2;
    const toDestroy = [];

    const backdrop = this.add.rectangle(W2, H2, W, H, 0x000000, 0.72)
      .setScrollFactor(0).setDepth(95).setInteractive();
    toDestroy.push(backdrop);

    const panelG = this.add.graphics().setScrollFactor(0).setDepth(96);
    panelG.fillStyle(0x100c06, 0.97);
    panelG.fillRoundedRect(px, py, PW, PH, 14);
    panelG.lineStyle(2.5, 0xf5c87a, 0.9);
    panelG.strokeRoundedRect(px, py, PW, PH, 14);
    toDestroy.push(panelG);

    toDestroy.push(this.add.text(W2, py + 26, '☰  Game Menu', {
      fontSize: '17px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(97));

    const divG = this.add.graphics().setScrollFactor(0).setDepth(97);
    divG.lineStyle(1, 0xf5c87a, 0.35);
    divG.lineBetween(px + 18, py + 44, px + PW - 18, py + 44);
    toDestroy.push(divG);

    const resume = () => {
      toDestroy.forEach(o => { try { if (o && o.active) o.destroy(); } catch (_) {} });
      this._pauseMenuOpen = false;
      this._pauseResumeFn = null;
      this.physics.resume();
      this.tweens.resumeAll();
      this.time.paused = false;
    };
    this._pauseResumeFn = resume;

    const BTNS = [
      { label: '▶   Resume',   color: '#a8e878',
        action: () => resume() },
      { label: '↺   Restart',  color: '#f5c87a',
        action: () => { resume(); this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(450, () => this.scene.restart()); } },
      { label: '⚙   Settings', color: '#c8a8f8',
        action: () => this._openSettings(toDestroy, px, py, PW, PH, resume) },
      { label: '✕   Exit',     color: '#f87070',
        action: () => { resume(); this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(550, () => this.scene.start('Menu')); } },
    ];

    BTNS.forEach((btn, i) => {
      const by = py + 56 + i * 50;
      const BW = PW - 36, BH = 38;
      const bx = px + 18;

      const btnG = this.add.graphics().setScrollFactor(0).setDepth(97);
      const draw = (hover) => {
        btnG.clear();
        btnG.fillStyle(hover ? 0x3a2010 : 0x221408, 0.95);
        btnG.fillRoundedRect(bx, by, BW, BH, 8);
        btnG.lineStyle(1.5, hover ? 0xf5c87a : 0x6a4820, hover ? 1 : 0.7);
        btnG.strokeRoundedRect(bx, by, BW, BH, 8);
      };
      draw(false);
      toDestroy.push(btnG);

      const txt = this.add.text(bx + BW / 2, by + BH / 2, btn.label, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: btn.color
      }).setOrigin(0.5).setScrollFactor(0).setDepth(98);
      toDestroy.push(txt);

      const hit = this.add.rectangle(bx + BW / 2, by + BH / 2, BW, BH, 0, 0)
        .setScrollFactor(0).setDepth(99).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => { draw(true);  txt.setColor('#ffffff'); });
      hit.on('pointerout',  () => { draw(false); txt.setColor(btn.color); });
      hit.on('pointerup',   () => btn.action());
    });
  }

  _openSettings(parentDestroy, px, py, PW, PH, onClose) {
    const W2 = W / 2, H2 = H / 2;
    const SPW = PW - 20, SPH = 160;
    const spx = W2 - SPW / 2, spy = H2 - SPH / 2;
    const toDestroy = [];

    const overlay = this.add.rectangle(W2, H2, W, H, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(100).setInteractive();
    toDestroy.push(overlay);

    const sg = this.add.graphics().setScrollFactor(0).setDepth(101);
    sg.fillStyle(0x150f08, 0.98);
    sg.fillRoundedRect(spx, spy, SPW, SPH, 12);
    sg.lineStyle(2, 0xc8a870, 0.85);
    sg.strokeRoundedRect(spx, spy, SPW, SPH, 12);
    toDestroy.push(sg);

    toDestroy.push(this.add.text(W2, spy + 22, '⚙  Settings', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#c8a8f8', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    const closeSettings = () => {
      toDestroy.forEach(o => { try { if (o && o.active) o.destroy(); } catch (_) {} });
    };

    // Sound FX toggle
    let sfxOn = this.registry.get('sfxOn') !== false;
    const sfxG = this.add.graphics().setScrollFactor(0).setDepth(102);
    const sfxTxt = this.add.text(W2, spy + 68, '', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(sfxG, sfxTxt);
    const drawSfx = () => {
      sfxG.clear();
      sfxG.fillStyle(sfxOn ? 0x44aa44 : 0x662222, 0.9);
      sfxG.fillRoundedRect(W2 + 30, spy + 58, 50, 22, 11);
      sfxTxt.setText(`🔊 Sound FX:  ${sfxOn ? 'ON ' : 'OFF'}`);
    };
    drawSfx();
    const sfxHit = this.add.rectangle(W2 + 55, spy + 69, 50, 22, 0, 0)
      .setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(sfxHit);
    sfxHit.on('pointerup', () => { sfxOn = !sfxOn; this.registry.set('sfxOn', sfxOn); drawSfx(); });

    // Music toggle
    let musicOn = this.registry.get('musicOn') !== false;
    const musicG = this.add.graphics().setScrollFactor(0).setDepth(102);
    const musicTxt = this.add.text(W2, spy + 100, '', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(musicG, musicTxt);
    const drawMusic = () => {
      musicG.clear();
      musicG.fillStyle(musicOn ? 0x44aa44 : 0x662222, 0.9);
      musicG.fillRoundedRect(W2 + 30, spy + 90, 50, 22, 11);
      musicTxt.setText(`🎵 Music:        ${musicOn ? 'ON ' : 'OFF'}`);
    };
    drawMusic();
    const musicHit = this.add.rectangle(W2 + 55, spy + 101, 50, 22, 0, 0)
      .setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(musicHit);
    musicHit.on('pointerup', () => { musicOn = !musicOn; this.registry.set('musicOn', musicOn); drawMusic(); });

    // Back button
    const backG = this.add.graphics().setScrollFactor(0).setDepth(102);
    const drawBack = (h) => {
      backG.clear();
      backG.fillStyle(h ? 0x3a2010 : 0x221408, 0.95);
      backG.fillRoundedRect(W2 - 50, spy + SPH - 38, 100, 28, 7);
      backG.lineStyle(1.5, h ? 0xf5c87a : 0x6a4820, 1);
      backG.strokeRoundedRect(W2 - 50, spy + SPH - 38, 100, 28, 7);
    };
    drawBack(false);
    toDestroy.push(backG);
    const backTxt = this.add.text(W2, spy + SPH - 24, '← Back', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(backTxt);
    const backHit = this.add.rectangle(W2, spy + SPH - 24, 100, 28, 0, 0)
      .setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(backHit);
    backHit.on('pointerover', () => { drawBack(true);  backTxt.setColor('#ffffff'); });
    backHit.on('pointerout',  () => { drawBack(false); backTxt.setColor('#f5c87a'); });
    backHit.on('pointerup',   () => closeSettings());
  }

  _showObjective(text) {
    const bg = this.add.rectangle(W / 2, H / 2, 500, 100, 0x1a0d06, 0.9)
      .setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0xf5c87a, 0.7);
    const title = this.add.text(W / 2, H / 2 - 18, '🐾 Mission', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c9956b'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    const txt = this.add.text(W / 2, H / 2 + 10, text, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5e0b0',
      stroke: '#0a0502', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.tweens.add({
      targets: [bg, title, txt], alpha: 0, delay: 2800, duration: 600,
      onComplete: () => { bg.destroy(); title.destroy(); txt.destroy(); }
    });
  }

  _saveCheckpoint(x, y) {
    this._checkpointX = x;
    this._checkpointY = y || this.lvlConfig.startY || 390;
    const banner = this.add.text(W / 2, H / 2 - 60, '✅ CHECKPOINT!', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#aaffaa', stroke: '#0a2208', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: banner, y: banner.y - 28, alpha: 0, delay: 400, duration: 700, onComplete: () => banner.destroy() });
  }

  _buildTouchControls() {
    // Touch controls live in the HTML footer (#game-footer) — see index.html.
    // We just point this._touchState at the shared global so updateMovement() works unchanged.
    this._touchState = window._touchState || { left: false, right: false, jump: false };
    this.input.addPointer(3);
  }

  _spawnLeaf() {
    const leaf = this.add.image(this.cameras.main.scrollX + Math.random() * 820, -10, 'leaf');
    leaf.setAlpha(0.5 + Math.random() * 0.3).setDepth(15);
    this.tweens.add({
      targets: leaf,
      y: H + 20, x: `+=${(Math.random() - 0.5) * 120}`,
      rotation: `+=${Math.PI * (Math.random() > 0.5 ? 3 : -3)}`,
      alpha: 0,
      duration: 3500 + Math.random() * 2500,
      onComplete: () => leaf.destroy()
    });
  }

  _doBark() {
    const bx   = this.shadow.x + (this.shadow.flipX ? -60 : 60);
    const bark = this.add.text(bx, this.shadow.y - 40, 'WOOF!', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#2a1008', strokeThickness: 3
    }).setDepth(20);
    this.tweens.add({ targets: bark, y: bark.y - 30, alpha: 0, duration: 800, onComplete: () => bark.destroy() });

    for (let i = 0; i < 3; i++) {
      const circle = this.add.circle(bx, this.shadow.y - 20, 10 + i * 12, 0xf5c87a, 0.3 - i * 0.08).setDepth(19);
      this.tweens.add({ targets: circle, scaleX: 2, scaleY: 2, alpha: 0, duration: 500 + i * 100, onComplete: () => circle.destroy() });
    }
    if (this.onBark) this.onBark();
  }

  updateMovement() {
    if (this._isDying || this._puzzleActive || this._pauseMenuOpen || this._miniGameOpen) return;

    // Fell into a gap — trigger death
    if (this.shadow.y > H + 80) { this._onFallDeath(); return; }

    const s    = this.shadow;
    const body = s.body;
    const onG  = body.blocked.down;
    this._onGround = onG;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || (this._touchState && this._touchState.left);
    const right = this.cursors.right.isDown || this.wasd.right.isDown || (this._touchState && this._touchState.right);
    const jump  = Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
                  Phaser.Input.Keyboard.JustDown(this.wasd.up)        ||
                  Phaser.Input.Keyboard.JustDown(this.wasd.space)     ||
                  (this._touchState && this._touchState.jump && onG);
    const bark  = Phaser.Input.Keyboard.JustDown(this.wasd.bark);

    const speed = 200;

    if (left) {
      s.setVelocityX(-speed);
      s.setFlipX(true);
      if (onG) s.play(this._walkAnim, true);
      this._spawnDust(s.x + 10, s.y + 20);
    } else if (right) {
      s.setVelocityX(speed);
      s.setFlipX(false);
      if (onG) s.play(this._walkAnim, true);
      this._spawnDust(s.x - 10, s.y + 20);
    } else {
      s.setVelocityX(0);
      if (onG) s.play(this._idleAnim, true);
    }

    if (jump && onG) {
      s.setVelocityY(-430);
      s.play(this._jumpAnim, true);
      this._spawnDust(s.x, s.y + 20, true);
    }
    if (!onG) s.play(this._jumpAnim, true);

    if (bark) this._doBark();

    if (this._touchState && this._touchState.jump) this._touchState.jump = false;

    if (this._progressBar && this._progressMax) {
      const pct = Math.min(s.x / this._progressMax, 1);
      this._progressBar.width = 200 * pct;
    }
  }

  _spawnDust(x, y, big = false) {
    if (Math.random() > 0.3) return;
    const d = this.add.image(x, y, 'dust').setDepth(8);
    this.tweens.add({
      targets: d,
      y: y - (big ? 20 : 10),
      x: `+=${(Math.random() - 0.5) * 20}`,
      alpha: 0, scale: big ? 2 : 1,
      duration: 400 + Math.random() * 200,
      onComplete: () => d.destroy()
    });
  }

  _pushRock(rock) {
    if (rock.getData('hurdle')) return;
    const dx    = rock.x - this.shadow.x;
    const pushX = dx > 0 ? 80 : -80;
    if (!rock.getData('pushed')) {
      rock.setData('pushed', true);
      rock.setImmovable(false);
      rock.body.setAllowGravity(true);
      this.tweens.add({ targets: rock, x: rock.x + pushX, duration: 600, ease: 'Power2' });
      const arrow = this.add.text(rock.x + pushX / 2, rock.y - 30, dx > 0 ? '→ PUSH! →' : '← PUSH! ←', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5c87a'
      }).setDepth(25);
      this.tweens.add({ targets: arrow, y: arrow.y - 20, alpha: 0, duration: 700, onComplete: () => arrow.destroy() });
    }
  }

  // ── Shared respawn logic (teleport Shadow to last checkpoint) ───────────
  _respawnAtCheckpoint() {
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => {
        this.shadow.clearTint();
        this.shadow.setAlpha(1);
        this.shadow.setPosition(this._checkpointX, this._checkpointY);
        this.shadow.setVelocity(0, 0);
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.tweens.add({
          targets: this.shadow, alpha: { from: 0.3, to: 1 },
          duration: 130, repeat: 4, yoyo: true,
          onComplete: () => {
            this.shadow.setAlpha(1);
            this._isDying = false;
            this._damageCD = false;
          }
        });
      });
    });
  }

  // ── Shared "lost a life" handler — decrements heart and respawns or restarts
  _loseLife(shake = 0.012) {
    this._lives--;
    this.registry.set('lives', this._lives);
    this._shadowHP = 3;
    this._updateHPDots();

    const lostHeart = this._hearts[this._lives];
    if (lostHeart) {
      lostHeart.setTint(0x444444);
      this.tweens.add({ targets: lostHeart, alpha: 0.25, duration: 300 });
    }
    this.cameras.main.shake(380, shake);

    if (this._lives <= 0) {
      this._showMessage('💔 No lives left! Starting over...');
      this.time.delayedCall(1800, () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.registry.set('lives', 3);
        this.registry.set('shadowHP', 3);
        this.time.delayedCall(550, () => this.scene.restart());
      });
    } else {
      this._showMessage(`💔 Life lost! ${this._lives} ${this._lives === 1 ? 'life' : 'lives'} left — respawning! 🐾`);
      this._respawnAtCheckpoint();
    }
  }

  _onFallDeath() {
    if (this._isDying || this._levelDone) return;
    this._isDying = true;
    this._damageCD = true;

    this.cameras.main.shake(400, 0.018);
    this.shadow.setTint(0xff3300);
    this.tweens.add({ targets: this.shadow, alpha: 0, duration: 400 });

    this._loseLife(0.018);
  }

  // 3-hit sub-health: every 3 hits from hazard = 1 life lost + checkpoint respawn
  _onHazardHit() {
    if (this._isDying || this._damageCD || this._levelDone) return;
    this._damageCD = true;

    this._shadowHP--;
    this._updateHPDots();

    this.cameras.main.shake(220, 0.01);
    this.shadow.setTint(0xff4444);
    this.tweens.add({
      targets: this.shadow, alpha: 0.4, duration: 160, yoyo: true, repeat: 3,
      onComplete: () => { this.shadow.clearTint(); this.shadow.setAlpha(1); }
    });

    if (this._shadowHP <= 0) {
      // All 3 hits used — lose a life, respawn at checkpoint
      this._isDying = true;
      this._loseLife(0.012);
    } else {
      this._showMessage(`Ouch! ${this._shadowHP} HP left! 🐾`);
      this.time.delayedCall(2500, () => { this._damageCD = false; });
    }
  }

  _updateHPDots() {
    this._drawHPPips();
  }

  _drawHPPips() {
    if (!this._hpGraphics) return;
    this._hpGraphics.clear();
    const PW = 17, PH = 7, GAP = 3, X0 = 10, Y = 35;
    const activeCol = this._shadowHP >= 3 ? 0x33dd33 : this._shadowHP === 2 ? 0xeecc00 : 0xff3300;
    for (let i = 0; i < 3; i++) {
      const px = X0 + i * (PW + GAP);
      this._hpGraphics.fillStyle(0x110603, 1);
      this._hpGraphics.fillRoundedRect(px, Y - 3, PW, PH, 2);
      this._hpGraphics.lineStyle(1, 0x4a2808, 1);
      this._hpGraphics.strokeRoundedRect(px, Y - 3, PW, PH, 2);
      if (i < this._shadowHP) {
        this._hpGraphics.fillStyle(activeCol, 1);
        this._hpGraphics.fillRoundedRect(px + 1, Y - 2, PW - 2, PH - 2, 1);
      }
    }
  }

  _showMessage(text, duration = 2000) {
    // Always replace any existing message so they never stack/overlap
    if (this._msgTween) { this._msgTween.stop(); this._msgTween = null; }
    if (this._msgBg)    { this._msgBg.destroy();  this._msgBg  = null; }
    if (this._msgTxt)   { this._msgTxt.destroy(); this._msgTxt = null; }

    this._msgBg = this.add.rectangle(W / 2, 80, 500, 50, 0x1a0d06, 0.88)
      .setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0xf5c87a, 0.6);
    this._msgTxt = this.add.text(W / 2, 80, text, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#e8d0a8', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this._msgTween = this.tweens.add({
      targets: [this._msgBg, this._msgTxt], alpha: 0, delay: duration, duration: 500,
      onComplete: () => {
        if (this._msgBg)  { this._msgBg.destroy();  this._msgBg  = null; }
        if (this._msgTxt) { this._msgTxt.destroy(); this._msgTxt = null; }
        this._msgTween = null;
      }
    });
  }

  _completeLevel(nextScene, message = 'Level Complete!') {
    this.registry.set('lives', this._lives);
    this.registry.set('shadowHP', 3);
    this.physics.pause();
    this.cameras.main.shake(300, 0.01);

    for (let i = 0; i < 12; i++) {
      const sp = this.add.image(
        this.shadow.x + (Math.random() - 0.5) * 80,
        this.shadow.y + (Math.random() - 0.5) * 80,
        'sparkle'
      ).setDepth(60);
      this.tweens.add({
        targets: sp,
        x: sp.x + (Math.random() - 0.5) * 100,
        y: sp.y - 50 - Math.random() * 50,
        alpha: 0, scale: 1.5, duration: 800,
        onComplete: () => sp.destroy()
      });
    }

    const bg = this.add.rectangle(W / 2, H / 2, 500, 140, 0x1a0d06, 0.95)
      .setScrollFactor(0).setDepth(70).setStrokeStyle(2, 0xf5c87a, 0.8);
    this.add.text(W / 2, H / 2 - 28, '🐾 ' + message, {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(71);

    const cont = this.add.text(W / 2, H / 2 + 28, '[ Continue the Journey ]', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(71).setInteractive({ useHandCursor: true });
    cont.on('pointerup', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start(nextScene));
    });
    this.tweens.add({ targets: cont, alpha: { from: 0.4, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
  }

  // ── Points system ─────────────────────────────────────────────────────────
  _givePoints(n) {
    this._points = (this._points || 0) + n;
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`⭐ ${this._points}`);
    const pop = this.add.text(W / 2, H / 2 - 80, `+${n} ⭐`, {
      fontSize: '28px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 1000, onComplete: () => pop.destroy() });
  }

  _spendPoints(n) {
    this._points = Math.max(0, (this._points || 0) - n);
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`⭐ ${this._points}`);
  }

  _canAfford(n) { return (this._points || 0) >= n; }

  _resetTimer(seconds) {
    if (!this._timerTxt) return;
    this._timerLeft  = seconds;
    this._timerFull  = seconds;
    this._timerFired = false;
    this._timerTxt.setText(`⏱ ${seconds}s`);
    this._timerTxt.setColor('#f5c87a');
  }

  // ── Embedded HTML mini-game launcher ────────────────────────────────────
  // Overlays a standalone game from /mini-games/<folder>/ as an iframe on top
  // of the canvas. Pauses the clock + movement (same as a puzzle). The game
  // posts { type:'minigame-complete', stars } back when finished (see
  // public/mini-games/shared/shared.js), which awards ⭐ and runs onComplete().
  _launchMiniGame(folder, onComplete) {
    if (this._miniGameOpen) return;
    this._miniGameOpen = true;
    // Freeze the dog + hazards so the paused world is fair, but DON'T set
    // _puzzleActive — that would pause the level clock. The countdown keeps
    // running so the player must beat the mini-game before time runs out.
    this.physics.pause();

    const host = document.getElementById('game-wrapper') || document.body;

    const overlay = document.createElement('div');
    overlay.id = 'mini-game-overlay';
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:60;background:rgba(2,4,2,0.9);' +
      'display:flex;align-items:center;justify-content:center;';

    const frame = document.createElement('iframe');
    // cache-buster so theme/CSS edits to the game always load fresh
    frame.src   = `/mini-games/${folder}/index.html?t=${Date.now()}`;
    frame.title = folder;
    frame.style.cssText = 'width:100%;height:100%;border:0;background:transparent;';
    overlay.appendChild(frame);

    // The canvas timer is hidden behind this overlay, so mirror the countdown
    // on top so the player can see the clock ticking while they play. Only for
    // levels that actually run a timer (_timerTxt exists).
    let timerInt = null;
    if (this._timerTxt) {
      const timerBadge = document.createElement('div');
      timerBadge.style.cssText =
        'position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:62;' +
        'font:bold 20px Georgia,serif;background:rgba(18,12,6,.92);' +
        'border:1.5px solid rgba(245,200,122,.6);border-radius:999px;padding:6px 18px;' +
        'pointer-events:none;text-shadow:0 2px 4px rgba(0,0,0,.6);';
      overlay.appendChild(timerBadge);
      const tick = () => {
        const left = (this._timerLeft != null) ? this._timerLeft : 0;
        timerBadge.textContent = `⏱ ${left}s`;
        timerBadge.style.color = left <= 10 ? '#ff5544' : '#f5c87a';
      };
      tick();
      timerInt = setInterval(tick, 250);
    }

    host.appendChild(overlay);

    let done = false;
    const finish = (success, stars) => {
      if (done) return; done = true;
      if (timerInt) clearInterval(timerInt);
      window.removeEventListener('message', onMsg);
      try { overlay.remove(); } catch (_) {}
      this._miniGameOpen  = false;
      this._miniGameClose = null;
      this.physics.resume();
      if (success) {
        if (typeof stars === 'number' && stars > 0) this._givePoints(stars);
        if (onComplete) onComplete(stars);
      }
    };

    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'minigame-complete') finish(true, d.stars || 1);
      else if (d.type === 'minigame-exit') finish(false);
    };
    window.addEventListener('message', onMsg);

    // Let the level's time-out (or a scene shutdown) abort the game cleanly —
    // aborting does NOT run onComplete, so the bridge is only built on a win.
    this._miniGameClose = () => finish(false);
    this.events.once('shutdown', () => { if (!done) finish(false); });
  }

  // ── Activity intro card: Play / Skip shown before every puzzle ───────────
  _showActivityIntro(emoji, title, desc, skipCost, onPlay, onSkip) {
    this._puzzleActive = true;
    this.physics.pause();
    const W2 = W / 2, H2 = H / 2;
    const PW = 320, PH = 236;
    const px = W2 - PW / 2, py = H2 - PH / 2;
    const td = [];

    const bd = this.add.rectangle(W2, H2, W, H, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(72).setInteractive();
    td.push(bd);

    const pg = this.add.graphics().setScrollFactor(0).setDepth(73);
    pg.fillStyle(0x120e08, 0.97);
    pg.fillRoundedRect(px, py, PW, PH, 16);
    pg.lineStyle(2.5, 0xf5c87a, 0.85);
    pg.strokeRoundedRect(px, py, PW, PH, 16);
    td.push(pg);

    td.push(this.add.text(W2, py + 38, emoji, { fontSize: '38px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 88, title, {
      fontSize: '19px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(74));
    td.push(this.add.text(W2, py + 116, desc, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(74));

    const close = (resume) => {
      td.forEach(o => { try { o.destroy(); } catch (_) {} });
      if (resume) {
        this._puzzleActive = false;
        this.physics.resume();
      }
    };

    // ▶ Play
    const playG = this.add.graphics().setScrollFactor(0).setDepth(74);
    const drawP = (h) => {
      playG.clear();
      playG.fillStyle(h ? 0x3a8820 : 0x1e5c0e, 0.95);
      playG.fillRoundedRect(W2 - 118, py + PH - 64, 108, 40, 9);
      playG.lineStyle(2, h ? 0x88ff44 : 0x44aa22, 1);
      playG.strokeRoundedRect(W2 - 118, py + PH - 64, 108, 40, 9);
    };
    drawP(false);
    td.push(playG);
    const pTxt = this.add.text(W2 - 64, py + PH - 44, '▶  Play', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#88ff66'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(75);
    td.push(pTxt);
    const pH = this.add.rectangle(W2 - 64, py + PH - 44, 108, 40, 0, 0)
      .setScrollFactor(0).setDepth(76).setInteractive({ useHandCursor: true });
    td.push(pH);
    pH.on('pointerover', () => { drawP(true);  pTxt.setColor('#ffffff'); });
    pH.on('pointerout',  () => { drawP(false); pTxt.setColor('#88ff66'); });
    pH.on('pointerup',   () => { close(true); onPlay(); });

    // ⏭ Skip
    const canAfford = this._canAfford(skipCost);
    const skipG = this.add.graphics().setScrollFactor(0).setDepth(74);
    const drawS = (h) => {
      skipG.clear();
      skipG.fillStyle(canAfford ? (h ? 0x5a1a1a : 0x3a0e0e) : 0x2a2a2a, 0.95);
      skipG.fillRoundedRect(W2 + 10, py + PH - 64, 108, 40, 9);
      skipG.lineStyle(2, canAfford ? (h ? 0xff6666 : 0x883333) : 0x555555, 1);
      skipG.strokeRoundedRect(W2 + 10, py + PH - 64, 108, 40, 9);
    };
    drawS(false);
    td.push(skipG);
    const sTxt = this.add.text(W2 + 64, py + PH - 44,
      canAfford ? `⏭ Skip\n-${skipCost} ⭐` : `Need ${skipCost} ⭐`, {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: canAfford ? '#ff9999' : '#666666', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(75);
    td.push(sTxt);
    if (canAfford) {
      const sH = this.add.rectangle(W2 + 64, py + PH - 44, 108, 40, 0, 0)
        .setScrollFactor(0).setDepth(76).setInteractive({ useHandCursor: true });
      td.push(sH);
      sH.on('pointerover', () => { drawS(true);  sTxt.setColor('#ffffff'); });
      sH.on('pointerout',  () => { drawS(false); sTxt.setColor('#ff9999'); });
      sH.on('pointerup',   () => {
        close(true);
        this._spendPoints(skipCost);
        this._showMessage(`Skipped! -${skipCost} ⭐`);
        onSkip();
      });
    }
  }

  // ── Puzzle popup framework ────────────────────────────────────────────────
  // Returns { toDestroy, close, addSkip }
  _openPuzzlePopup(title, sub) {
    this._puzzleActive = true;
    this.physics.pause();
    const toDestroy = [];

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
      .setScrollFactor(0).setDepth(75).setInteractive();
    toDestroy.push(backdrop);

    const panelG = this.add.graphics().setScrollFactor(0).setDepth(76);
    panelG.fillStyle(0x100c06, 0.97);
    panelG.fillRoundedRect(100, 60, 600, 330, 18);
    panelG.lineStyle(3, 0xf5c87a, 0.9);
    panelG.strokeRoundedRect(100, 60, 600, 330, 18);
    toDestroy.push(panelG);

    toDestroy.push(this.add.text(W / 2, 98, title, {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(77));

    if (sub) {
      toDestroy.push(this.add.text(W / 2, 126, sub, {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(77));
    }

    const close = () => {
      toDestroy.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch (_) {} });
      this._puzzleActive = false;
      this.physics.resume();
    };

    const addSkip = (costPts, onSkip) => {
      const canAfford = this._canAfford(costPts);
      const skipG = this.add.graphics().setScrollFactor(0).setDepth(78);
      const drawSkip = (hover) => {
        skipG.clear();
        skipG.fillStyle(canAfford ? (hover ? 0x5a3010 : 0x3a1a08) : 0x2a2a2a, 0.95);
        skipG.fillRoundedRect(W / 2 - 80, 346, 160, 34, 8);
        skipG.lineStyle(1.5, canAfford ? 0xd4a040 : 0x666666, 0.8);
        skipG.strokeRoundedRect(W / 2 - 80, 346, 160, 34, 8);
      };
      drawSkip(false);
      toDestroy.push(skipG);

      const skipLabel = canAfford ? `Skip (-${costPts} ⭐)` : `Need ${costPts} ⭐ to skip`;
      const skipTxt = this.add.text(W / 2, 363, skipLabel, {
        fontSize: '12px', fontFamily: 'Georgia, serif',
        color: canAfford ? '#e8c87a' : '#666666'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);
      toDestroy.push(skipTxt);

      if (canAfford) {
        const skipHit = this.add.rectangle(W / 2, 363, 160, 34, 0, 0)
          .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
        toDestroy.push(skipHit);
        skipHit.on('pointerover', () => drawSkip(true));
        skipHit.on('pointerout',  () => drawSkip(false));
        skipHit.on('pointerup',   () => { close(); this._spendPoints(costPts); onSkip(); });
      }
    };

    return { toDestroy, close, addSkip };
  }

  // ── Puzzle 0: Memory Card Match (3×2 grid, jungle theme) ────────────────
  _puzzleMemoryCards(onDone, _skip = false) {
    if (!_skip) { this._showActivityIntro('🃏', 'Memory Match', 'Flip and match all the pairs!', 5, () => this._puzzleMemoryCards(onDone, true), onDone); return; }
    // Three jungle-themed pairs
    const PAIRS = [
      { emoji: '🐾', color: 0xf5a020, name: 'Paw'   },
      { emoji: '🍓', color: 0xe03050, name: 'Berry'  },
      { emoji: '🗝️',  color: 0xd4a030, name: 'Key'   },
    ];
    const CARD_W = 85, CARD_H = 65, GAP = 16;
    // 3 columns, 2 rows — centred in popup panel (x:100-700, y:60-390)
    const COL_X = [299, 400, 501];
    const ROW_Y = [200, 281];

    // Shuffle 3 pairs into 6 slots
    let deck = [0, 0, 1, 1, 2, 2];
    for (let i = 5; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const { toDestroy, close, addSkip } = this._openPuzzlePopup('🃏 Memory Match!', 'Find all 3 matching pairs!');

    // Guard against the Play-button click accidentally triggering a card
    let inputReady = false;
    this.time.delayedCall(220, () => { inputReady = true; });

    let flipped = [], locked = false, matchedCount = 0;

    // Draws card back centered at (0,0) — graphics positioned at cx,cy
    const drawBack = (g) => {
      g.clear();
      // Shadow drop
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-CARD_W / 2 + 3, -CARD_H / 2 + 3, CARD_W, CARD_H, 9);
      // Body
      g.fillStyle(0x1a1208, 0.97);
      g.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
      // Top sheen
      g.fillStyle(0x2d1e0a, 0.5);
      g.fillRoundedRect(-CARD_W / 2 + 2, -CARD_H / 2 + 2, CARD_W - 4, CARD_H * 0.45, 7);
      // Outer border + inner border
      g.lineStyle(2, 0x7a4a18, 0.9);
      g.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
      g.lineStyle(1, 0xb07030, 0.35);
      g.strokeRoundedRect(-CARD_W / 2 + 4, -CARD_H / 2 + 4, CARD_W - 8, CARD_H - 8, 6);
      // Paw print — main pad
      g.fillStyle(0x3a2008, 0.75);
      g.fillCircle(0, 5, 12);
      // Toe pads
      g.fillStyle(0x2c1806, 0.6);
      [[-14, -9], [14, -9], [-7, -18], [7, -18]].forEach(([ox, oy]) => g.fillCircle(ox, oy, 4));
    };

    const drawFront = (g, pair, matched = false) => {
      g.clear();
      // Shadow drop
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-CARD_W / 2 + 3, -CARD_H / 2 + 3, CARD_W, CARD_H, 9);
      // Body
      g.fillStyle(0x0d1a0d, 0.97);
      g.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
      // Color tint fill
      g.fillStyle(pair.color, 0.13);
      g.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
      // Top sheen
      g.fillStyle(pair.color, 0.08);
      g.fillRoundedRect(-CARD_W / 2 + 2, -CARD_H / 2 + 2, CARD_W - 4, CARD_H * 0.4, 7);
      // Border — gold when matched, pair-color otherwise
      g.lineStyle(matched ? 3 : 2, matched ? 0xf5c87a : pair.color, 1);
      g.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9);
      if (matched) {
        g.lineStyle(1, 0xf5c87a, 0.4);
        g.strokeRoundedRect(-CARD_W / 2 + 5, -CARD_H / 2 + 5, CARD_W - 10, CARD_H - 10, 6);
      }
      // Corner diamonds (from HTML original, adapted)
      const cdx = CARD_W / 2 - 10, cdy = CARD_H / 2 - 10;
      [[-cdx, -cdy], [cdx, -cdy], [-cdx, cdy], [cdx, cdy]].forEach(([rx, ry]) => {
        g.fillStyle(pair.color, matched ? 0.8 : 0.5);
        g.fillTriangle(rx, ry - 4, rx + 4, ry, rx, ry + 4);
        g.fillTriangle(rx, ry - 4, rx - 4, ry, rx, ry + 4);
      });
    };

    const cardObjs = [];

    deck.forEach((pairIdx, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const cx = COL_X[col], cy = ROW_Y[row];
      const pair = PAIRS[pairIdx];

      // Back graphics — origin at (cx,cy) so scaleX squish is centered
      const backG = this.add.graphics().setScrollFactor(0).setDepth(78);
      backG.x = cx; backG.y = cy;
      drawBack(backG);

      // Front graphics
      const frontG = this.add.graphics().setScrollFactor(0).setDepth(78);
      frontG.x = cx; frontG.y = cy;
      frontG.setVisible(false);

      // Symbol text
      const symTxt = this.add.text(cx, cy - 1, pair.emoji, {
        fontSize: '30px',
        shadow: { color: `#${pair.color.toString(16).padStart(6, '0')}`, blur: 12, fill: true }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79).setVisible(false);

      toDestroy.push(backG, frontG, symTxt);

      const card = {
        pairIdx, cx, cy, pair, backG, frontG, symTxt,
        revealed: false, matched: false, flipping: false
      };
      cardObjs.push(card);

      // Invisible hit zone
      const hit = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      card.hit = hit;
      toDestroy.push(hit);

      // Hover glow
      hit.on('pointerover', () => {
        if (!card.revealed && !card.matched && !locked && !card.flipping)
          this.tweens.add({ targets: backG, alpha: 0.72, duration: 100 });
      });
      hit.on('pointerout', () => {
        if (!card.revealed && !card.matched)
          this.tweens.add({ targets: backG, alpha: 1, duration: 100 });
      });

      hit.on('pointerup', () => {
        if (!inputReady || locked || card.revealed || card.matched || card.flipping) return;
        card.flipping = true;

        // ── Phase 1: squish back to 0 width ─────────────────────────
        this.tweens.add({
          targets: [backG, hit], scaleX: 0,
          duration: 140, ease: 'Sine.easeIn',
          onComplete: () => {
            backG.setVisible(false);
            drawFront(frontG, pair, false);
            frontG.setVisible(true);
            frontG.scaleX = 0;
            symTxt.setVisible(true);
            symTxt.scaleX = 0;
            hit.scaleX = 0;
            card.revealed = true;

            // ── Phase 2: expand front from 0 ────────────────────────
            this.tweens.add({
              targets: [frontG, symTxt, hit], scaleX: 1,
              duration: 140, ease: 'Sine.easeOut',
              onComplete: () => {
                card.flipping = false;
                // Bounce (like HTML game)
                this.tweens.add({
                  targets: [frontG, symTxt, hit],
                  scaleX: 1.06, scaleY: 1.06, duration: 90,
                  yoyo: true, ease: 'Sine.easeOut',
                  onComplete: () => {
                    frontG.setScale(1); symTxt.setScale(1); hit.setScale(1);
                    flipped.push(card);
                    if (flipped.length === 2) {
                      locked = true;
                      this.time.delayedCall(880, checkMemMatch);
                    }
                  }
                });
              }
            });
          }
        });
      });
    });

    // ── Flip a card back to its back face ────────────────────────────────
    const flipToBack = (card, cb) => {
      card.flipping = true;
      this.tweens.add({
        targets: [card.frontG, card.symTxt], scaleX: 0,
        duration: 130, ease: 'Sine.easeIn',
        onComplete: () => {
          card.frontG.setVisible(false);
          card.symTxt.setVisible(false);
          drawBack(card.backG);
          card.backG.setVisible(true);
          card.backG.scaleX = 0;
          card.revealed = false;
          this.tweens.add({
            targets: card.backG, scaleX: 1,
            duration: 130, ease: 'Sine.easeOut',
            onComplete: () => { card.flipping = false; if (cb) cb(); }
          });
        }
      });
    };

    // ── Check for a match ────────────────────────────────────────────────
    const checkMemMatch = () => {
      const [a, b] = flipped;
      if (a.pairIdx === b.pairIdx) {
        // ✅ MATCH — golden glow + sparkle burst (from HTML original)
        a.matched = true; b.matched = true;
        [a, b].forEach(c => {
          drawFront(c.frontG, c.pair, true);
          this.tweens.add({
            targets: [c.frontG, c.symTxt], scaleX: 1.14, scaleY: 1.14,
            duration: 200, ease: 'Back.easeOut', yoyo: true,
            onComplete: () => {
              // Sparkle burst (adapted from HTML spawnSparkles)
              for (let k = 0; k < 10; k++) {
                const angle = (k / 10) * Math.PI * 2;
                const dist  = 40 + Math.random() * 30;
                const sp = this.add.image(c.cx, c.cy, 'sparkle')
                  .setScrollFactor(0).setDepth(83).setScale(0.6);
                this.tweens.add({
                  targets: sp,
                  x: c.cx + Math.cos(angle) * dist,
                  y: c.cy + Math.sin(angle) * dist,
                  alpha: 0, scaleX: 0.1, scaleY: 0.1,
                  duration: 480 + Math.random() * 200,
                  ease: 'Sine.easeOut',
                  onComplete: () => sp.destroy()
                });
              }
            }
          });
        });

        matchedCount++;
        flipped = []; locked = false;

        if (matchedCount === 3) {
          this.time.delayedCall(700, () => {
            close();
            this.physics.resume();
            this._givePoints(2);
            onDone();
          });
        }
      } else {
        // ❌ MISMATCH — shake + red flash, then flip back (from HTML mismatchShake)
        [a, b].forEach(c => {
          const oxG = c.cx, oxT = c.cx;
          this.tweens.add({
            targets: c.frontG, x: oxG - 8, duration: 58, ease: 'Sine.easeOut',
            yoyo: true, repeat: 3,
            onComplete: () => { c.frontG.x = oxG; }
          });
          this.tweens.add({
            targets: c.symTxt, x: oxT - 8, duration: 58, ease: 'Sine.easeOut',
            yoyo: true, repeat: 3,
            onComplete: () => { c.symTxt.x = oxT; }
          });
          // Red flash outline
          const flash = this.add.graphics().setScrollFactor(0).setDepth(81);
          flash.lineStyle(3, 0xff2040, 0.9);
          flash.strokeRoundedRect(c.cx - CARD_W / 2, c.cy - CARD_H / 2, CARD_W, CARD_H, 9);
          toDestroy.push(flash);
          this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
        });

        this.time.delayedCall(380, () => {
          flipToBack(a, () => {});
          flipToBack(b, () => { flipped = []; locked = false; });
        });
      }
    };

    addSkip(5, onDone);
  }

  // ── Puzzle 1: Color Match (for under-7s) ─────────────────────────────────
  _puzzleColorMatch(onDone) {
    const colors = [
      { name: 'Red',    hex: 0xe03030, label: '🔴 Red'    },
      { name: 'Blue',   hex: 0x3060e0, label: '🔵 Blue'   },
      { name: 'Yellow', hex: 0xe0c030, label: '🟡 Yellow' },
      { name: 'Green',  hex: 0x30b030, label: '🟢 Green'  },
    ];
    const correct = Phaser.Math.RND.pick(colors);
    const choices = Phaser.Utils.Array.Shuffle([correct, ...Phaser.Utils.Array.Shuffle(colors.filter(c => c !== correct)).slice(0, 2)]);

    const { toDestroy, close, addSkip } = this._openPuzzlePopup('🎨 Match the Color!', 'Tap the button that matches the big color!');

    // Big color circle
    const bigCirc = this.add.graphics().setScrollFactor(0).setDepth(78);
    bigCirc.fillStyle(correct.hex, 1);
    bigCirc.fillCircle(W / 2, 200, 52);
    toDestroy.push(bigCirc);

    // 3 answer buttons
    choices.forEach((c, i) => {
      const bx = 170 + i * 165;
      const by = 285;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(78);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3a2a10 : 0x221808, 0.95);
        bg.fillRoundedRect(bx - 70, by - 20, 140, 40, 10);
        bg.lineStyle(2, c.hex, hover ? 1 : 0.7);
        bg.strokeRoundedRect(bx - 70, by - 20, 140, 40, 10);
      };
      draw(false);
      toDestroy.push(bg);

      const lbl = this.add.text(bx, by, c.label, {
        fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5e0b0'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);
      toDestroy.push(lbl);

      const hit = this.add.rectangle(bx, by, 140, 40, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup', () => {
        if (c === correct) {
          this._showMessage('🌟 Correct! Great job!');
          close();
          this._givePoints(2);
          onDone();
        } else {
          this._showMessage('Try again! 🎨');
          bg.clear();
          bg.fillStyle(0x550000, 0.95);
          bg.fillRoundedRect(bx - 70, by - 20, 140, 40, 10);
          bg.lineStyle(2, 0xff3333, 1);
          bg.strokeRoundedRect(bx - 70, by - 20, 140, 40, 10);
          this.time.delayedCall(600, () => draw(false));
        }
      });
    });

    addSkip(5, onDone);
  }

  // ── Puzzle 2: Count the Stars ─────────────────────────────────────────────
  _puzzleCountItems(onDone) {
    const count = Phaser.Math.Between(2, 5);
    const { toDestroy, close, addSkip } = this._openPuzzlePopup('⭐ Count the Stars!', 'How many stars do you see? Tap the number!');

    // Display stars
    for (let i = 0; i < count; i++) {
      const sx = 180 + (i % 4) * 115;
      const sy = 180 + Math.floor(i / 4) * 60;
      toDestroy.push(this.add.text(sx, sy, '⭐', { fontSize: '36px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(78));
    }

    // Number buttons 1–5
    for (let n = 1; n <= 5; n++) {
      const bx = 110 + (n - 1) * 120;
      const by = 305;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(78);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3a2a10 : 0x221808, 0.95);
        bg.fillRoundedRect(bx - 44, by - 22, 88, 44, 10);
        bg.lineStyle(2, 0xd4a040, hover ? 1 : 0.6);
        bg.strokeRoundedRect(bx - 44, by - 22, 88, 44, 10);
      };
      draw(false);
      toDestroy.push(bg);

      const lbl = this.add.text(bx, by, `${n}`, {
        fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5e0b0'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);
      toDestroy.push(lbl);

      const hit = this.add.rectangle(bx, by, 88, 44, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup', () => {
        if (n === count) {
          this._showMessage('🌟 Correct! You can count!');
          close();
          this._givePoints(2);
          onDone();
        } else {
          this._showMessage('Try again! Count carefully! ⭐');
          bg.clear();
          bg.fillStyle(0x550000, 0.95);
          bg.fillRoundedRect(bx - 44, by - 22, 88, 44, 10);
          bg.lineStyle(2, 0xff3333, 1);
          bg.strokeRoundedRect(bx - 44, by - 22, 88, 44, 10);
          this.time.delayedCall(600, () => draw(false));
        }
      });
    }

    addSkip(5, onDone);
  }

  // ── Puzzle 3: Size Compare — tap the biggest ──────────────────────────────
  _puzzleSizeCompare(onDone, _skip = false) {
    if (!_skip) { this._showActivityIntro('📏', 'Size Compare', 'Tap the biggest one!', 5, () => this._puzzleSizeCompare(onDone, true), onDone); return; }
    const sizes = Phaser.Utils.Array.Shuffle([28, 48, 68]);
    const biggestIdx = sizes.indexOf(68);
    const { toDestroy, close, addSkip } = this._openPuzzlePopup('🔵 Which is Biggest?', 'Tap the biggest circle!');

    sizes.forEach((r, i) => {
      const cx = 185 + i * 215;
      const cy = 210;
      const g = this.add.graphics().setScrollFactor(0).setDepth(78);
      const draw = (hover) => {
        g.clear();
        g.fillStyle(hover ? 0x4488ee : 0x3366cc, 0.9);
        g.fillCircle(cx, cy, r);
        g.lineStyle(3, 0x88bbff, hover ? 1 : 0.5);
        g.strokeCircle(cx, cy, r);
      };
      draw(false);
      toDestroy.push(g);

      const hit = this.add.circle(cx, cy, r + 8, 0, 0)
        .setScrollFactor(0).setDepth(79).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup', () => {
        if (i === biggestIdx) {
          this._showMessage('🌟 Yes! That is the biggest!');
          close();
          this._givePoints(2);
          onDone();
        } else {
          this._showMessage('Look for the biggest one! 🔵');
          g.clear();
          g.fillStyle(0x770000, 0.9);
          g.fillCircle(cx, cy, r);
          g.lineStyle(3, 0xff3333, 1);
          g.strokeCircle(cx, cy, r);
          this.time.delayedCall(600, () => draw(false));
        }
      });
    });

    addSkip(5, onDone);
  }

  // ── Puzzle 4: Pattern Completion — what comes next? ───────────────────────
  _puzzlePattern(onDone, _skip = false) {
    if (!_skip) { this._showActivityIntro('🔢', 'What Comes Next?', 'Finish the pattern!', 5, () => this._puzzlePattern(onDone, true), onDone); return; }
    const patterns = [
      { seq: ['🍓','🍊','🍓','🍊'], answer: '🍓', choices: ['🍓','🍌','🍇'] },
      { seq: ['🌟','🌙','🌟','🌙'], answer: '🌟', choices: ['🌟','☀️','⭐'] },
      { seq: ['🐾','🌿','🐾','🌿'], answer: '🐾', choices: ['🐾','🌸','🍀'] },
    ];
    const pat = Phaser.Math.RND.pick(patterns);
    const { toDestroy, close, addSkip } = this._openPuzzlePopup('🔁 What Comes Next?', 'Look at the pattern and tap the right answer!');

    // Pattern display
    pat.seq.forEach((em, i) => {
      toDestroy.push(this.add.text(140 + i * 120, 190, em, { fontSize: '38px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(78));
    });
    toDestroy.push(this.add.text(620, 190, '?', {
      fontSize: '38px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(78));

    // Answer buttons
    const shuffled = Phaser.Utils.Array.Shuffle([...pat.choices]);
    shuffled.forEach((em, i) => {
      const bx = 190 + i * 210;
      const by = 300;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(78);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3a2a10 : 0x221808, 0.95);
        bg.fillRoundedRect(bx - 70, by - 30, 140, 60, 12);
        bg.lineStyle(2, 0xd4a040, hover ? 1 : 0.6);
        bg.strokeRoundedRect(bx - 70, by - 30, 140, 60, 12);
      };
      draw(false);
      toDestroy.push(bg);

      toDestroy.push(this.add.text(bx, by, em, { fontSize: '32px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(79));

      const hit = this.add.rectangle(bx, by, 140, 60, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup', () => {
        if (em === pat.answer) {
          this._showMessage('🌟 Perfect pattern!');
          close();
          this._givePoints(2);
          onDone();
        } else {
          this._showMessage('Look at the pattern again! 🔁');
          bg.clear();
          bg.fillStyle(0x550000, 0.95);
          bg.fillRoundedRect(bx - 70, by - 30, 140, 60, 12);
          bg.lineStyle(2, 0xff3333, 1);
          bg.strokeRoundedRect(bx - 70, by - 30, 140, 60, 12);
          this.time.delayedCall(600, () => draw(false));
        }
      });
    });

    addSkip(5, onDone);
  }

  // ── Puzzle 5b: Match Columns (tap name → tap matching picture) ───────────
  // Adapted from kids_click_match_quiz.html — 3 pairs, jungle theme, in-popup SVG-style arrows
  _puzzleMatchColumns(onDone, _skip = false) {
    if (!_skip) { this._showActivityIntro('🔗', 'Match It!', 'Match each item with its pair!', 5, () => this._puzzleMatchColumns(onDone, true), onDone); return; }
    // Game-character pairs (all under-7s will recognise from playing)
    const PAIRS = [
      { name: 'Shadow', emoji: '🐾', mColor: 0xd4a030 },
      { name: 'Gemma',  emoji: '🐱', mColor: 0xcc5588 },
      { name: 'Snake',  emoji: '🐍', mColor: 0x4a9a4a },
    ];
    const ITEM_W = 170, ITEM_H = 44;
    const LEFT_CX = 195, RIGHT_CX = 605;
    const ROW_Y   = [200, 254, 308];     // 3 rows, 54px apart

    // Independent shuffles — like the HTML game's nameOrder / imageOrder
    const nameOrder = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    const imgOrder  = Phaser.Utils.Array.Shuffle([0, 1, 2]);

    const { toDestroy, close, addSkip } =
      this._openPuzzlePopup('🔗 Match It!', 'Tap a name → then tap its matching picture!');

    let inputReady = false;
    this.time.delayedCall(220, () => { inputReady = true; });

    // ── Inline feedback (depth 82 > popup, so it's always visible) ─────────
    const feedbackTxt = this.add.text(W / 2, 333, '', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#88ee88', stroke: '#0a0502', strokeThickness: 1, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(82).setAlpha(0);
    toDestroy.push(feedbackTxt);

    const showFB = (msg, good = true) => {
      this.tweens.killTweensOf(feedbackTxt);
      feedbackTxt.setText(msg).setColor(good ? '#88ee88' : '#ff7070').setAlpha(1);
      this.tweens.add({ targets: feedbackTxt, alpha: 0, delay: 1600, duration: 400 });
    };

    // ── Column headers (adapted from HTML .col-hd style) ───────────────────
    [
      { cx: LEFT_CX,  label: '📝 Names',    fillC: 0x1a2e10, strokeC: 0x5a9a4a, txtC: '#88cc88' },
      { cx: RIGHT_CX, label: '🖼️ Pictures', fillC: 0x10182e, strokeC: 0x4a6aaa, txtC: '#8899cc' },
    ].forEach(h => {
      const hg = this.add.graphics().setScrollFactor(0).setDepth(78);
      hg.fillStyle(h.fillC, 0.88);
      hg.fillRoundedRect(h.cx - ITEM_W / 2, 148, ITEM_W, 22, 7);
      hg.lineStyle(1.5, h.strokeC, 0.8);
      hg.strokeRoundedRect(h.cx - ITEM_W / 2, 148, ITEM_W, 22, 7);
      toDestroy.push(hg);
      toDestroy.push(this.add.text(h.cx, 159, h.label, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: h.txtC
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79));
    });

    // Middle connector dots (like HTML .mid spacer column)
    ROW_Y.forEach(y => {
      const dot = this.add.circle(W / 2, y, 3, 0x5a4020, 0.5)
        .setScrollFactor(0).setDepth(77);
      toDestroy.push(dot);
    });

    // Persistent line graphics — redrawn with each correct match (like HTML drawArrow/SVG)
    const lineG = this.add.graphics().setScrollFactor(0).setDepth(81);
    toDestroy.push(lineG);

    let selectedPairIdx = null;
    let matchedCount    = 0;
    const nameCards     = [];
    const imgCards      = [];

    // Shared card-background drawer (normal / selected / matched states)
    const drawBg = (g, cx, cy, state, mColor) => {
      g.clear();
      if (state === 'normal') {
        g.fillStyle(0x1a1208, 0.92);
        g.fillRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
        g.lineStyle(2, 0x5a3a10, 0.7);
        g.strokeRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
      } else if (state === 'selected') {
        g.fillStyle(0x2d2010, 0.97);
        g.fillRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
        g.lineStyle(2.5, 0xf5c87a, 1);
        g.strokeRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
        g.lineStyle(1, 0xf5c87a, 0.28);
        g.strokeRoundedRect(cx - ITEM_W / 2 + 4, cy - ITEM_H / 2 + 4, ITEM_W - 8, ITEM_H - 8, 5);
      } else if (state === 'matched') {
        g.fillStyle(mColor, 0.18);
        g.fillRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
        g.lineStyle(2.5, mColor, 1);
        g.strokeRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
      }
    };

    // ── Name cards (left column, shuffled) ──────────────────────────────────
    nameOrder.forEach((pairIdx, row) => {
      const cx = LEFT_CX, cy = ROW_Y[row];
      const pair = PAIRS[pairIdx];
      const g   = this.add.graphics().setScrollFactor(0).setDepth(78);
      drawBg(g, cx, cy, 'normal', pair.mColor);
      const txt = this.add.text(cx, cy, pair.name, {
        fontSize: '15px', fontFamily: 'Georgia, serif', color: '#e8d0a8', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);
      const hit = this.add.rectangle(cx, cy, ITEM_W, ITEM_H, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(g, txt, hit);
      const card = { pairIdx, cx, cy, g, txt, hit, locked: false };
      nameCards.push(card);

      hit.on('pointerover', () => { if (!card.locked) this.tweens.add({ targets: txt, scaleX: 1.06, scaleY: 1.06, duration: 100 }); });
      hit.on('pointerout',  () => { if (!card.locked) this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 100 }); });
      hit.on('pointerup', () => {
        if (!inputReady || card.locked) return;
        // Deselect previous (like HTML handleClick deselect logic)
        if (selectedPairIdx !== null && selectedPairIdx !== pairIdx) {
          const prev = nameCards.find(c => c.pairIdx === selectedPairIdx);
          if (prev && !prev.locked) drawBg(prev.g, prev.cx, prev.cy, 'normal', PAIRS[prev.pairIdx].mColor);
        }
        if (selectedPairIdx === pairIdx) {
          drawBg(g, cx, cy, 'normal', pair.mColor);
          selectedPairIdx = null;
        } else {
          selectedPairIdx = pairIdx;
          drawBg(g, cx, cy, 'selected', pair.mColor);
        }
      });
    });

    // ── Image cards (right column, independently shuffled) ──────────────────
    imgOrder.forEach((pairIdx, row) => {
      const cx = RIGHT_CX, cy = ROW_Y[row];
      const pair = PAIRS[pairIdx];
      const g   = this.add.graphics().setScrollFactor(0).setDepth(78);
      drawBg(g, cx, cy, 'normal', pair.mColor);
      const txt = this.add.text(cx, cy, pair.emoji, { fontSize: '26px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(79);
      const hit = this.add.rectangle(cx, cy, ITEM_W, ITEM_H, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(g, txt, hit);
      const card = { pairIdx, cx, cy, g, txt, hit, locked: false };
      imgCards.push(card);

      hit.on('pointerover', () => { if (!card.locked) this.tweens.add({ targets: txt, scaleX: 1.12, scaleY: 1.12, duration: 100 }); });
      hit.on('pointerout',  () => { if (!card.locked) this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 100 }); });
      hit.on('pointerup', () => {
        if (!inputReady || card.locked) return;

        if (selectedPairIdx === null) {
          showFB('Tap a name on the left first! 📝', false);
          return;
        }

        const nameCard = nameCards.find(c => c.pairIdx === selectedPairIdx);

        if (selectedPairIdx === pairIdx) {
          // ✅ CORRECT (like HTML lockItem + drawArrow + matchedCount++)
          card.locked = true;
          nameCard.locked = true;
          drawBg(g, cx, cy, 'matched', pair.mColor);
          drawBg(nameCard.g, nameCard.cx, nameCard.cy, 'matched', pair.mColor);

          // Checkmarks (like HTML .check-icon)
          [[nameCard.cx + ITEM_W / 2 - 10, nameCard.cy - ITEM_H / 2 + 10],
           [cx + ITEM_W / 2 - 10,          cy - ITEM_H / 2 + 10]].forEach(([tx, ty]) => {
            toDestroy.push(this.add.text(tx, ty, '✓', {
              fontSize: '13px', color: '#77ee77', fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(83));
          });

          // Scale pulse on both labels
          this.tweens.add({ targets: [nameCard.txt, txt], scaleX: 1.15, scaleY: 1.15, duration: 190, ease: 'Back.easeOut', yoyo: true });

          // Arrow line with arrowhead (like HTML SVG line + marker)
          const x1 = nameCard.cx + ITEM_W / 2;
          const y1 = nameCard.cy;
          const x2 = cx - ITEM_W / 2;
          const y2 = cy;
          const ang = Math.atan2(y2 - y1, x2 - x1);
          lineG.lineStyle(3, pair.mColor, 0.88);
          lineG.lineBetween(x1, y1, x2, y2);
          lineG.fillStyle(pair.mColor, 0.88);
          lineG.fillTriangle(
            x2,                                   y2,
            x2 - 11 * Math.cos(ang - 0.42),  y2 - 11 * Math.sin(ang - 0.42),
            x2 - 11 * Math.cos(ang + 0.42),  y2 - 11 * Math.sin(ang + 0.42)
          );

          // Sparkle at midpoint
          const sp = this.add.image((x1 + x2) / 2, (y1 + y2) / 2, 'sparkle')
            .setScrollFactor(0).setDepth(84);
          this.tweens.add({ targets: sp, scale: 1.6, alpha: 0, duration: 600, onComplete: () => sp.destroy() });

          selectedPairIdx = null;
          matchedCount++;
          showFB(matchedCount < 3 ? '✓ Match! Find the next pair!' : '🌟 All matched! Amazing!', true);

          if (matchedCount === 3) {
            this.time.delayedCall(900, () => {
              close();
              this.physics.resume();
              this._givePoints(2);
              onDone();
            });
          }

        } else {
          // ❌ WRONG — shake + red flash (like HTML mismatchShake + .shake CSS)
          const origX = txt.x;
          this.tweens.add({
            targets: txt, x: origX - 8, duration: 55, ease: 'Sine.easeOut',
            yoyo: true, repeat: 3, onComplete: () => { txt.x = origX; }
          });
          const flash = this.add.graphics().setScrollFactor(0).setDepth(82);
          flash.lineStyle(3, 0xff2040, 0.9);
          flash.strokeRoundedRect(cx - ITEM_W / 2, cy - ITEM_H / 2, ITEM_W, ITEM_H, 8);
          toDestroy.push(flash);
          this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
          showFB('Not quite! Try again! 🔗', false);
        }
      });
    });

    addSkip(5, onDone);
  }

  // ── Puzzle: Missing Letter (LEXIS cipher adapted for under-7s) ───────────
  // Adapted from missing-letter-game.html — tile states, key states, shake/popIn anims
  _puzzleMissingLetter(onDone, _skip = false) {
    if (!_skip) { this._showActivityIntro('🔤', 'Missing Letter', 'Find the missing letter!', 5, () => this._puzzleMissingLetter(onDone, true), onDone); return; }
    // Simple 4-letter jungle/food words (under-7 vocab)
    const WORDS = [
      { word: 'LEAF', emoji: '🌿', clue: 'Found on jungle trees!' },
      { word: 'FROG', emoji: '🐸', clue: 'Hops and says Ribbit!' },
      { word: 'PEAR', emoji: '🍐', clue: 'A sweet green fruit!' },
      { word: 'KIWI', emoji: '🥝', clue: 'A small fuzzy fruit!' },
      { word: 'TREE', emoji: '🌳', clue: 'Tall with big branches!' },
      { word: 'BIRD', emoji: '🐦', clue: 'Flies above the trees!' },
      { word: 'RAIN', emoji: '🌧️', clue: 'Falls from the sky!' },
      { word: 'FISH', emoji: '🐟', clue: 'Swims in the river!' },
      { word: 'BEAR', emoji: '🐻', clue: 'Big furry forest animal!' },
      { word: 'SEED', emoji: '🌱', clue: 'Plants grow from this!' },
    ];

    const picked        = Phaser.Math.RND.pick(WORDS);
    const word          = picked.word;
    const blankIdx      = Phaser.Math.Between(0, word.length - 1);
    const correctLetter = word[blankIdx];

    // 4 choices: correct + 3 random distractors (like HTML KEYBOARD_ROWS → 4-btn simplification)
    const choices = Phaser.Utils.Array.Shuffle([
      correctLetter,
      ...Phaser.Utils.Array.Shuffle(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== correctLetter)
      ).slice(0, 3)
    ]);

    let lives  = 3;
    let solved = false;

    const { toDestroy, close, addSkip } =
      this._openPuzzlePopup('🔤 Fill the Gap!', 'Which letter is missing?');

    let inputReady = false;
    this.time.delayedCall(220, () => { inputReady = true; });

    // ── Emoji picture clue on a gold medallion — replaces HTML .hint-box ───
    const medY = 162;
    const medal = this.add.graphics().setScrollFactor(0).setDepth(77);
    medal.fillStyle(0x000000, 0.35); medal.fillCircle(W / 2 + 1, medY + 2, 28);
    medal.fillStyle(0x0e0a06, 1);    medal.fillCircle(W / 2, medY, 28);
    medal.fillStyle(0xd4a847, 0.10); medal.fillCircle(W / 2, medY, 28);
    medal.lineStyle(2.5, 0xd4a847, 0.9); medal.strokeCircle(W / 2, medY, 28);
    medal.lineStyle(1, 0xf5d98a, 0.35);  medal.strokeCircle(W / 2, medY, 23);
    toDestroy.push(medal);

    const emojiTxt = this.add.text(W / 2, medY, picked.emoji, { fontSize: '40px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(78);
    toDestroy.push(emojiTxt);
    this.tweens.add({ targets: emojiTxt, y: medY - 3, duration: 1100,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    toDestroy.push(this.add.text(W / 2, 199, picked.clue, {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#dcc790', fontStyle: 'italic', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(78));

    // ── Inline feedback — depth 82 so it's above popup at 75-77 ───────────
    const fbTxt = this.add.text(W / 2, 332, '', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      color: '#88ee88', stroke: '#0a0502', strokeThickness: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(82).setAlpha(0);
    toDestroy.push(fbTxt);

    const showFB = (msg, good = true) => {
      this.tweens.killTweensOf(fbTxt);
      fbTxt.setText(msg).setColor(good ? '#88ee88' : '#ff7070').setAlpha(1);
      this.tweens.add({ targets: fbTxt, alpha: 0, delay: 1600, duration: 400 });
    };

    // ── Word tiles — positioned graphics (g.x=tx so shake/scale work) ──────
    // Mirrors HTML: .tile (filled) / .tile.blank / .tile.correct / .tile.wrong-letter
    const TILE_W = 54, TILE_H = 56, TILE_GAP = 10;
    const TILE_Y = 242;
    const totalTW  = word.length * TILE_W + (word.length - 1) * TILE_GAP;
    const tileBase = W / 2 - totalTW / 2 + TILE_W / 2;

    let blankTile = null;

    word.split('').forEach((letter, i) => {
      const tx      = tileBase + i * (TILE_W + TILE_GAP);
      const isBlank = i === blankIdx;

      const g = this.add.graphics().setScrollFactor(0).setDepth(78);
      g.x = tx; g.y = TILE_Y;

      const drawTile = (state) => {
        g.clear();
        const hw = TILE_W / 2, hh = TILE_H / 2, R = 9;
        // drop shadow (peeks bottom-right for depth)
        g.fillStyle(0x000000, 0.38);
        g.fillRoundedRect(-hw + 2, -hh + 3, TILE_W, TILE_H, R);
        switch (state) {
          case 'filled':
            g.fillStyle(0x2b2318, 1);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0x191309, 1);                       // darker lower half → bevel
            g.fillRoundedRect(-hw, -hh + TILE_H * 0.46, TILE_W, TILE_H * 0.54, R);
            g.fillStyle(0xffffff, 0.06);                    // top sheen
            g.fillRoundedRect(-hw + 3, -hh + 3, TILE_W - 6, TILE_H * 0.34, R - 3);
            g.lineStyle(2, 0x715c30, 0.9);
            g.strokeRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            break;
          case 'blank':
            g.fillStyle(0x120d07, 1);                       // deep inset well
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0x000000, 0.35);
            g.fillRoundedRect(-hw + 3, -hh + 3, TILE_W - 6, TILE_H * 0.4, R - 3);
            g.lineStyle(2.5, 0xd4a847, 0.95);               // gold border
            g.strokeRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0xf5d98a, 1);                       // gold underline
            g.fillRoundedRect(-hw + 9, hh - 12, TILE_W - 18, 3, 1.5);
            break;
          case 'correct':
            g.fillStyle(0x123a24, 1);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0x27c070, 0.16);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.lineStyle(2.5, 0x3ce089, 1);
            g.strokeRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.lineStyle(1, 0x9fffcf, 0.35);
            g.strokeRoundedRect(-hw + 4, -hh + 4, TILE_W - 8, TILE_H - 8, R - 3);
            break;
          case 'wrong':
            g.fillStyle(0x3a1512, 1);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0xc0392b, 0.20);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.lineStyle(2, 0xff5544, 0.95);
            g.strokeRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            break;
          case 'revealed':
            g.fillStyle(0x2e2410, 1);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.fillStyle(0xd4a847, 0.18);
            g.fillRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.lineStyle(2.5, 0xf5d98a, 1);
            g.strokeRoundedRect(-hw, -hh, TILE_W, TILE_H, R);
            g.lineStyle(1, 0xf5d98a, 0.35);
            g.strokeRoundedRect(-hw + 4, -hh + 4, TILE_W - 8, TILE_H - 8, R - 3);
            break;
        }
      };

      drawTile(isBlank ? 'blank' : 'filled');

      const tileTxt = this.add.text(tx, TILE_Y, isBlank ? '' : letter, {
        fontSize: '28px', fontFamily: 'Georgia, serif',
        color: '#f6ecd2', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);

      toDestroy.push(g, tileTxt);
      if (isBlank) {
        blankTile = { g, txt: tileTxt, tx, drawTile };
      } else {
        // staggered pop-in for the letters
        g.setScale(0.8); tileTxt.setScale(0.8);
        this.tweens.add({ targets: [g, tileTxt], scaleX: 1, scaleY: 1,
          duration: 320, delay: 90 + i * 60, ease: 'Back.easeOut' });
      }
    });

    // ── Letter choice buttons — 4 large touch-friendly buttons ─────────────
    // Mirrors HTML .key / .key:hover / .key.correct-key / .key.wrong-key
    const BTN_W = 72, BTN_H = 44, BTN_GAP = 12;
    const BTN_Y = 300;
    const totalBW  = choices.length * BTN_W + (choices.length - 1) * BTN_GAP;
    const btnBase  = W / 2 - totalBW / 2 + BTN_W / 2;

    choices.forEach((letter, i) => {
      const bx = btnBase + i * (BTN_W + BTN_GAP);
      let btnLocked = false;

      const bg = this.add.graphics().setScrollFactor(0).setDepth(78);
      bg.x = bx; bg.y = BTN_Y;   // positioned so the whole key can scale/pop

      const drawBtn = (state) => {
        bg.clear();
        const hw = BTN_W / 2, hh = BTN_H / 2, R = 10;
        bg.fillStyle(0x000000, 0.38);                       // drop shadow
        bg.fillRoundedRect(-hw + 2, -hh + 3, BTN_W, BTN_H, R);
        switch (state) {
          case 'normal':
            bg.fillStyle(0x312817, 1);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.fillStyle(0x1d1710, 1);                       // bevel lower half
            bg.fillRoundedRect(-hw, -hh + BTN_H * 0.5, BTN_W, BTN_H * 0.5, R);
            bg.fillStyle(0xffffff, 0.07);                    // top sheen
            bg.fillRoundedRect(-hw + 3, -hh + 3, BTN_W - 6, BTN_H * 0.4, R - 3);
            bg.lineStyle(1.5, 0x7c6636, 0.9);
            bg.strokeRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            break;
          case 'hover':
            bg.fillStyle(0x3d3119, 1);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.fillStyle(0xffffff, 0.08);
            bg.fillRoundedRect(-hw + 3, -hh + 3, BTN_W - 6, BTN_H * 0.4, R - 3);
            bg.lineStyle(2.5, 0xf5d98a, 1);                  // bright gold border
            bg.strokeRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.lineStyle(1.5, 0xd4a847, 0.28);               // outer glow ring
            bg.strokeRoundedRect(-hw - 3, -hh - 3, BTN_W + 6, BTN_H + 6, R + 3);
            break;
          case 'correct':
            bg.fillStyle(0x123a24, 1);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.fillStyle(0x27c070, 0.22);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.lineStyle(2.5, 0x3ce089, 1);
            bg.strokeRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            break;
          case 'wrong':
            bg.fillStyle(0x281310, 1);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.fillStyle(0xc0392b, 0.12);
            bg.fillRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            bg.lineStyle(1.5, 0x5a201a, 0.8);
            bg.strokeRoundedRect(-hw, -hh, BTN_W, BTN_H, R);
            break;
        }
      };

      drawBtn('normal');

      const btnTxt = this.add.text(bx, BTN_Y, letter, {
        fontSize: '24px', fontFamily: 'Georgia, serif',
        color: '#f6ecd2', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(79);

      const hit = this.add.rectangle(bx, BTN_Y, BTN_W, BTN_H, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });

      toDestroy.push(bg, btnTxt, hit);

      // staggered pop-in for the answer keys
      bg.setScale(0.85); btnTxt.setScale(0.85);
      this.tweens.add({ targets: [bg, btnTxt], scaleX: 1, scaleY: 1,
        duration: 320, delay: 260 + i * 70, ease: 'Back.easeOut' });

      hit.on('pointerover', () => { if (!btnLocked) drawBtn('hover'); });
      hit.on('pointerout',  () => { if (!btnLocked) drawBtn('normal'); });

      hit.on('pointerup', () => {
        if (!inputReady || btnLocked || solved) return;
        btnLocked = true;

        if (letter === correctLetter) {
          // ✅ CORRECT — .tile.correct + @keyframes popIn (scale 0.7→1 Back.easeOut)
          solved = true;
          drawBtn('correct');
          btnTxt.setColor('#4aee90');

          blankTile.drawTile('correct');
          blankTile.txt.setText(correctLetter).setColor('#27a060');
          blankTile.g.setAlpha(0).setScale(0.7);
          blankTile.txt.setAlpha(0).setScale(0.7);
          this.tweens.add({
            targets: [blankTile.g, blankTile.txt],
            alpha: 1, scaleX: 1, scaleY: 1,
            duration: 350, ease: 'Back.easeOut'
          });

          // Sparkle burst at tile
          const sp = this.add.image(blankTile.tx, TILE_Y, 'sparkle')
            .setScrollFactor(0).setDepth(83);
          this.tweens.add({ targets: sp, scale: 2.2, alpha: 0, duration: 600, onComplete: () => sp.destroy() });

          showFB('🌟 Correct! Amazing job!', true);
          this.time.delayedCall(950, () => { close(); this.physics.resume(); this._givePoints(2); onDone(); });

        } else {
          // ❌ WRONG — .tile.wrong-letter shake + @keyframes shake + lose life
          drawBtn('wrong');
          btnTxt.setColor('#6b2a22');
          lives--;
          if (lives <= 0) solved = true; // prevent onComplete from resetting tile

          blankTile.drawTile('wrong');
          // @keyframes shake: 0%,100% x=0 | 20% x=-6 | 40% x=+6 | etc.
          this.tweens.add({
            targets: [blankTile.g, blankTile.txt],
            x: blankTile.tx - 6, duration: 55, ease: 'Sine.easeOut',
            yoyo: true, repeat: 4,
            onComplete: () => {
              blankTile.g.x = blankTile.tx;
              blankTile.txt.x = blankTile.tx;
              if (!solved) blankTile.drawTile('blank'); // reset only if still playing
            }
          });

          if (lives <= 0) {
            // Out of lives — reveal answer (.tile.revealed gold style)
            this.time.delayedCall(500, () => {
              blankTile.drawTile('revealed');
              blankTile.txt.setText(correctLetter).setColor('#d4a847');
              showFB(`The letter was ${correctLetter}! Try next time! 🌿`, false);
              this.time.delayedCall(1400, () => { close(); onDone(); });
            });
          } else {
            const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
            showFB(`${hearts}  Try again!`, false);
          }
        }
      });
    });

    addSkip(5, onDone);
  }

  // ── Puzzle 5: Odd One Out ─────────────────────────────────────────────────
  _puzzleOddOneOut(onDone) {
    const sets = [
      { items: ['🍎','🍎','🍎','🍊'], odd: '🍊' },
      { items: ['🐶','🐶','🐶','🐱'], odd: '🐱' },
      { items: ['🌟','🌟','🌟','🌙'], odd: '🌙' },
      { items: ['🍓','🍓','🍓','🍇'], odd: '🍇' },
    ];
    const set = Phaser.Math.RND.pick(sets);
    const items = Phaser.Utils.Array.Shuffle([...set.items]);
    const { toDestroy, close, addSkip } = this._openPuzzlePopup('🔍 Odd One Out!', 'Which one is different? Tap it!');

    items.forEach((em, i) => {
      const bx = 140 + i * 170;
      const by = 220;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(78);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3a2a10 : 0x221808, 0.95);
        bg.fillRoundedRect(bx - 55, by - 45, 110, 90, 12);
        bg.lineStyle(2, 0xd4a040, hover ? 1 : 0.5);
        bg.strokeRoundedRect(bx - 55, by - 45, 110, 90, 12);
      };
      draw(false);
      toDestroy.push(bg);

      toDestroy.push(this.add.text(bx, by, em, { fontSize: '40px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(79));

      const hit = this.add.rectangle(bx, by, 110, 90, 0, 0)
        .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup', () => {
        if (em === set.odd) {
          this._showMessage('🌟 You found the different one!');
          close();
          this._givePoints(2);
          onDone();
        } else {
          this._showMessage('That one matches the others! Try again! 🔍');
          bg.clear();
          bg.fillStyle(0x550000, 0.95);
          bg.fillRoundedRect(bx - 55, by - 45, 110, 90, 12);
          bg.lineStyle(2, 0xff3333, 1);
          bg.strokeRoundedRect(bx - 55, by - 45, 110, 90, 12);
          this.time.delayedCall(600, () => draw(false));
        }
      });
    });

    addSkip(5, onDone);
  }
}

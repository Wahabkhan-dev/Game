import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { ACTIVITY_META } from './L8_Activities.js';
import { applyGlendaSkin } from './L8_GlendaSkin.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { makePanel, generatePremiumHudTextures, buildStandardHeader, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { launchRandomMiniGame } from '../../../utils/MiniGamePicker.js';
import { showTryAgainModal, doFullRestart } from '../../../utils/EndModals.js';
import { playVideoSequence } from '../../../utils/VideoOverlay.js';

// ════════════════════════════════════════════════════════════════════════════
// L8BaseScene — shared scaffolding for Level 8 "Puppy Care Day".
//
// Provides: bright daytime sky + parallax, runnable grass ground, an auto-running
// caretaker (Gleeda) with JUMP-only movement (no slide in Level 8), a cheerful
// HUD (banner / hearts / score /
// progress), a reusable modal-panel + button framework, toasts, sparkles, life
// handling, and the freeze-proof scene transition (fadeOut → _wakeLoop → start).
// Every Level 8 scene extends this. Themed deliberately apart from Level 7.
// ════════════════════════════════════════════════════════════════════════════

// Fixed bg/ground seam line, matching Level 4's own ground line exactly
// (GROUND_Y 408 - 16 = 392) — NOT Level 8's own (higher) groundY. Level 8's
// bottom band was sitting noticeably taller on screen than Level 4's simply
// because groundY (380) leaves more vertical room below it; pinning the seam
// here matches Level 4's band height while leaving groundY itself (and every
// obstacle/item/physics position tuned around it) untouched.
const GROUND_SEAM_Y = 392;

export class L8BaseScene extends Phaser.Scene {

  // ── Background — same seam technique as Level 4: ends EXACTLY where the
  // ground band begins (groundY - 16), so the two meet with no gap and no
  // overlap, and the ground doesn't eat more of the screen than Level 4's. ───
  buildSky(bgKey = 'l8_bg') {
    const bgDisplayH = GROUND_SEAM_Y;
    if (this.textures.exists(bgKey)) {
      const src  = this.textures.get(bgKey).getSourceImage();
      const srcH = src.naturalHeight || src.height || 700;
      const scale = bgDisplayH / srcH;
      this._bgTile = this.add.tileSprite(0, 0, W, bgDisplayH, bgKey)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-30);
      this._bgTile.setTileScale(scale, scale);
    } else {
      const sg = this.add.graphics().setDepth(-30).setScrollFactor(0);
      sg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE8F8FF, 0xE8F8FF, 1);
      sg.fillRect(0, 0, W, bgDisplayH);
    }
  }

  updateParallax() {
    const camX = this.cameras.main.scrollX;
    if (this._bgTile)   this._bgTile.tilePositionX   = camX * 0.25;
    if (this._surfTile) this._surfTile.tilePositionX = camX;
  }

  // ── Ground — same seam/band-height technique as Level 4 (surface starts at
  // groundY - 16, matching buildSky()'s bgDisplayH, instead of the old -65
  // which made the ground band nearly 2.5x taller than Level 4's).
  // `pits` (optional) is an array of { x, hw } fall-through gaps — Level-2/6
  // style holes the player loses a life for dropping into, instead of the old
  // "puddle" sprite hurdle. When omitted, behaves exactly as before: one
  // continuous physics floor + one screen-locked tileSprite. ─────────────────
  buildGround(worldW, groundY, pits = [], surfKey = 'l8_surface') {
    this._worldW = worldW; this._groundY = groundY;
    this._pitZones = pits;

    const surfaceY = GROUND_SEAM_Y;
    const surfaceH = H - surfaceY;
    const hasSurf = this.textures.exists(surfKey);
    let tileScale = 1;
    if (hasSurf) {
      const src = this.textures.get(surfKey).getSourceImage();
      const srcH = src.naturalHeight || src.height || 380;
      tileScale = surfaceH / srcH;
    }

    if (!pits.length) {
      // invisible physics floor across the whole world
      const body = this.add.rectangle(worldW / 2, groundY + 20, worldW, 40, 0, 0).setDepth(-9);
      this.physics.add.existing(body, true);
      this._ground = body;
      // surface image (screen-locked tileSprite, scrolls 1:1 with camera)
      if (hasSurf) {
        this._surfTile = this.add.tileSprite(0, surfaceY, W, surfaceH, surfKey)
          .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);
        this._surfTile.setTileScale(tileScale, tileScale);
      } else {
        const fg = this.add.graphics().setDepth(-8).setScrollFactor(0);
        fg.fillStyle(0x70B030, 1); fg.fillRect(0, surfaceY, W, surfaceH);
      }
      return body;
    }

    // ── Segmented floor with fall-through gaps at each pit (world-space, same
    // technique Level 6 uses — a screen-locked tileSprite can't show a real
    // gap while scrolling, so both the physics floor and the ground art are
    // split into one piece per solid span between pits). ─────────────────────
    const sorted = [...pits].sort((a, b) => a.x - b.x);
    this._floorSegs = [];
    const segments = [];
    let cursor = 0;
    sorted.forEach(pit => {
      const segEnd = pit.x - pit.hw;
      if (segEnd > cursor) {
        segments.push({ start: cursor, end: segEnd });
        const w = segEnd - cursor, cx = cursor + w / 2;
        const r = this.add.rectangle(cx, groundY + 20, w, 40, 0, 0).setDepth(-9);
        this.physics.add.existing(r, true);
        this._floorSegs.push(r);
      }
      cursor = pit.x + pit.hw;
    });
    const lastW = worldW - cursor;
    if (lastW > 0) {
      segments.push({ start: cursor, end: worldW });
      const r = this.add.rectangle(cursor + lastW / 2, groundY + 20, lastW, 40, 0, 0).setDepth(-9);
      this.physics.add.existing(r, true);
      this._floorSegs.push(r);
    }
    this._ground = this._floorSegs;

    segments.forEach(seg => {
      const w = seg.end - seg.start;
      if (w <= 0) return;
      if (hasSurf) {
        const ts = this.add.tileSprite(seg.start + w / 2, surfaceY + surfaceH / 2, w, surfaceH, surfKey).setDepth(-8);
        ts.tileScaleX = ts.tileScaleY = tileScale;
      } else {
        const fg = this.add.graphics().setDepth(-8);
        fg.fillStyle(0x70B030, 1); fg.fillRect(seg.start, surfaceY, w, surfaceH);
      }
    });

    sorted.forEach(pit => this._buildPitVisual(pit.x - pit.hw, pit.hw * 2, surfaceY));
    return this._ground;
  }

  // Level-2/6-style broken-ground pit — dark void + jagged edges + bouncing
  // jump hint. gx = gap's left edge, gw = gap's full width, topY = where the
  // ground surface starts (so the void seam lines up with no gap).
  _buildPitVisual(gx, gw, topY) {
    const gr = this.add.graphics().setDepth(4);
    gr.fillStyle(0x050302, 1);
    gr.fillRect(gx, topY, gw, H - topY + 20);
    gr.fillStyle(0x2a1608, 0.55);
    gr.fillRect(gx + 4, H - 10, gw - 8, 14);

    gr.fillStyle(0x3d3d4a, 1);
    gr.fillTriangle(gx, topY,      gx + 11, topY,      gx,      topY + 11);
    gr.fillTriangle(gx, topY + 15, gx + 7,  topY + 13, gx,      topY + 24);
    gr.fillStyle(0x2a2a38, 1);
    gr.fillTriangle(gx, topY + 9,  gx + 8,  topY + 9,  gx + 3,  topY + 19);
    gr.fillStyle(0x3d3d4a, 1);
    gr.fillTriangle(gx + gw, topY,      gx + gw - 11, topY,      gx + gw, topY + 11);
    gr.fillTriangle(gx + gw, topY + 15, gx + gw - 7,  topY + 13, gx + gw, topY + 24);
    gr.fillStyle(0x2a2a38, 1);
    gr.fillTriangle(gx + gw, topY + 9,  gx + gw - 8,  topY + 9,  gx + gw - 3, topY + 19);

    gr.lineStyle(1.5, 0x18182a, 1);
    gr.lineBetween(gx - 18, topY + 2,  gx,     topY + 8);
    gr.lineBetween(gx - 11, topY - 3,  gx,     topY + 3);
    gr.lineBetween(gx - 22, topY + 9,  gx - 4, topY + 7);
    gr.lineBetween(gx + gw + 16, topY + 2,  gx + gw,     topY + 8);
    gr.lineBetween(gx + gw +  9, topY - 3,  gx + gw,     topY + 3);
    gr.lineBetween(gx + gw + 20, topY + 9,  gx + gw + 4, topY + 7);

    const cx = gx + gw / 2;
    const arrow = this.add.text(cx, topY - 32, '⬆', {
      fontSize: '18px', color: '#ffee44', stroke: '#1a1008', strokeThickness: 3
    }).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: arrow, y: topY - 44, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Fall-through pit detection — call once per frame from a scene's update(),
  // after runMovement(). No-op if buildGround() wasn't given any pits.
  //
  // Two-phase, matching Level 4/5/6: once the player steps over a gap with
  // nothing beneath it, freeze horizontal drift and let gravity carry it
  // down — visible for a beat, then hidden once it's sunk into the hole —
  // before finishing the fall with a COMPLETE life loss and a checkpoint
  // respawn (not the usual partial-HP hit a regular obstacle bump gives).
  _checkPits() {
    if (!this._pitZones || !this._pitZones.length) return;
    if (this._paused || this._busy || this._done) return;
    const p = this.player;
    if (!p) return;

    if (this._fallingIntoPit) {
      if (!this._hiddenInHole && p.y - this._fallStartY > 40) {
        p.setVisible(false);
        this._hiddenInHole = true;
      }
      if (p.y > H + 80) this._fallIntoPit();
      return;
    }

    const onG = p.body.blocked.down || p.body.touching.down;
    if (!onG && p.body.bottom > this._groundY + 6) {
      const inPit = this._pitZones.some(z => Math.abs(p.body.x - z.x) < z.hw);
      if (inPit) {
        this._fallingIntoPit = true;
        this._fallStartY = p.y;
        this._hiddenInHole = false;
        p.setVelocityX(0);
      }
    }
  }

  _fallIntoPit() {
    this._fallingIntoPit = false;
    this.cameras.main.flash(320, 0, 0, 0, true);
    this.cameras.main.shake(200, 0.012);
    this.toast('💧 Fell in a hole!');
    this.loseLife(null, { fullLife: true });
  }

  // ── Gleeda character (Glenda): JUMP only — no slide in Level 8 ────────────────
  buildPlayer(x, groundY, runSpeed = 250, jumpV = -470) {
    this._runSpeed = runSpeed; this._jumpV = jumpV; this._pose = null; this._facing = 1;
    if (!this.anims.exists('gleeda_walk')) {
      this.anims.create({ key: 'gleeda_walk', frames: [{ key: 'gleeda_run1' }], frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'gleeda_idle', frames: [{ key: 'gleeda_idle' }], frameRate: 1, repeat: -1 });
      this.anims.create({ key: 'gleeda_jump', frames: [{ key: 'gleeda_jump' }], frameRate: 1, repeat: -1 });
    }
    this.player = this.physics.add.sprite(x, groundY - 40, 'gleeda_idle').setDepth(20);
    this.player.setScale(0.18);
    this.player.body.setSize(73, 56, true);
    this.player.setCollideWorldBounds(true);
    // _ground is a single body normally, or one body per solid segment when
    // buildGround() was given pit gaps — collide with each individually.
    (Array.isArray(this._ground) ? this._ground : [this._ground])
      .forEach(g => this.physics.add.collider(this.player, g));
    this.player.play('gleeda_idle');
    // applyGlendaSkin computes and stores _normalBodyW/H and _slideBodyW/H
    // (world-space, derived from the ORIGINAL 0.18 scale before it changes
    // this.player's scale) — _startSlide/_endSlide below use those so the
    // slide hitbox stays correct regardless of the scale the skin picks.
    applyGlendaSkin(this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
    return this.player;
  }

  _setPose(pose) {
    if (this._pose === pose) return;
    this._pose = pose;
    if (pose === 'walk') this.player.play('gleeda_walk', true);
    else if (pose === 'idle') this.player.play('gleeda_idle', true);
    else if (pose === 'jump') this.player.play('gleeda_jump', true);
  }

  // Player-controlled movement (Level 5/6 style: manual left/right, no auto-run).
  // No slide in Level 8 — jump is the only way past obstacles.
  runMovement() {
    if (this._paused || this._busy || !this.player) return false;
    const ts = window._touchState || {};
    const p = this.player, onG = p.body.blocked.down || p.body.touching.down;
    const left = this.cursors.left.isDown || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    let velX = 0;
    if (right && !left) { velX = this._runSpeed; this._facing = 1; }
    else if (left && !right) { velX = -this._runSpeed; this._facing = -1; }
    p.setVelocityX(velX);
    p.setFlipX(this._facing < 0);
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;
    if (jump && onG) { p.setVelocityY(this._jumpV); ts.jump = false; }
    if (!onG)            this._setPose('jump');
    else if (velX !== 0) this._setPose('walk');
    else                  this._setPose('idle');
    return onG;
  }

  // ── HUD: unified Level-2 header (health · banner · timer? · coin · menu) ─────
  // opts.timer = seconds → shows a countdown (runner stages only).
  buildTopBanner(stageNum, title, subtitle, opts = {}) {
    generatePremiumHudTextures(this);
    this._lives = this.registry.get('lives')  ?? 3;
    this._hp    = this.registry.get('l8_hp')  ?? 3;
    this._score = this.registry.get('l8_score') ?? 0;

    this._hdr = buildStandardHeader(this, {
      chapterLabel: `STAGE ${stageNum}`, title,
      timer: opts.timer ?? null,
      coinValue: this._score,
      lives: this._lives, hp: this._hp,
      onMenu: () => this.togglePause(), depth: 60,
    });
    this._hearts   = this._hdr.hearts;
    this._hpBars   = this._hdr.hpBars;
    this._scoreTxt = this._hdr.coinTxt;
    this._timerTxt = this._hdr.timerTxt;
    this._banMidY  = this._hdr.midY;
    this._hdr.setLives(this._lives);
    this._hdr.setHP(this._hp);

    // functional countdown (runner/action stages only)
    if (opts.timer) {
      this._timerFull = opts.timer; this._timerLeft = opts.timer;
      this._timerEvt = this.time.addEvent({ delay: 1000, loop: true, callback: () => this._tickHudTimer() });
    }

    // subtitle (objective line) — pinned to the bottom of the screen instead
    // of under the banner, so it doesn't crowd the top HUD.
    if (subtitle) this.add.text(W / 2, H - 20, subtitle, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#1a0f04', strokeThickness: 2,
      backgroundColor: '#2e1c0ecc', padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(62);

    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  // Countdown tick — at 0, lose a life and refill (only runs if a stage set a timer)
  _tickHudTimer() {
    if (this._paused || this._busy || this._done) return;
    this._timerLeft = Math.max(0, this._timerLeft - 1);
    if (this._timerTxt) {
      this._timerTxt.setText(`${this._timerLeft}s`);
      this._timerTxt.setColor(this._timerLeft <= 10 ? '#ff5a3a' : THEME.goldTxt);
    }
    if (this._timerLeft <= 0) {
      this._timerLeft = this._timerFull;
      if (this._timerTxt) { this._timerTxt.setText(`${this._timerFull}s`); this._timerTxt.setColor(THEME.goldTxt); }
      this.loseLife();
    }
  }

  // Kept for stage compatibility — the header already builds hearts/HP. If a
  // stage calls this before buildTopBanner, build a minimal header as a fallback.
  buildHearts() {
    if (!this._hearts) this.buildTopBanner(0, '', '');
  }

  _refreshHeartsHUD() {
    this._hdr?.setLives?.(this._lives);
    this._hdr?.setHP?.(this._hp);
  }

  // Kept for compatibility — the coin panel is part of the header.
  buildScore() { if (!this._scoreTxt) this.buildHearts(); }

  // Coins are awarded ONLY by solving mini-games now. Themed activities
  // (feeding, decorating, food/home runs) still call addScore(...) but it's a
  // no-op — running/collecting/decorating grants no coins. MiniGamePicker
  // routes the flat mini-game reward through _addPoints below instead.
  addScore(_n) { /* no coins from gameplay activities — mini-games only */ }

  _addPoints(n) {
    if (this._score == null) this._score = this.registry.get('l8_score') ?? 0;
    this._score += n;
    this.registry.set('l8_score', this._score);
    if (this._scoreTxt) {
      this._scoreTxt.setText(`${this._score}`);
      this.tweens.add({ targets: this._scoreTxt, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    }
  }

  // Lays out the collection-banner item icons (food run / prop run) so they:
  //   • sit with a real 20px gap from the panel's left AND right edges, and
  //   • keep each image's OWN aspect ratio (fit to a 24px height, capped to the
  //     per-slot width) instead of being squashed into one wrong 30×26 box —
  //     that squash is what made the icons look mismatched.
  // MAX_ICON_W / NOM_HW MUST stay in lockstep: NOM_HW is the half-width the
  // margin math below reserves for the outermost icons, and MAX_ICON_W is the
  // hard cap actually applied to icon width. They used to be different
  // numbers (a guessed 13 vs an actual cap of 32) — whenever an icon rendered
  // anywhere near that real 32px cap, its true half-width (16) exceeded the
  // 13px the margin math had reserved, so it rendered a few px closer to the
  // panel's edge than the intended 20px margin — occasionally poking past the
  // wood/gold frame's inner edge. Deriving both from ONE constant makes that
  // impossible: the outermost icon's half-width can never exceed what the
  // margin math assumed.
  // Sets/returns this._slots = [{ icon, chk }], read by the collection logic.
  _layoutCollectSlots(items, px, py, PW) {
    const MARGIN = 20, IH = 24, MAX_ICON_W = 28, NOM_HW = MAX_ICON_W / 2;
    const N = items.length;
    const first = px + MARGIN + NOM_HW;
    const last  = px + PW - MARGIN - NOM_HW;
    const step  = N > 1 ? (last - first) / (N - 1) : 0;
    const iy = py + 48;
    this._slots = items.map((it, i) => {
      const ix = N > 1 ? first + i * step : px + PW / 2;
      const src = this.textures.get(it.tex)?.getSourceImage();
      const ratio = (src && src.width && src.height) ? src.width / src.height : 1;
      let iw = IH * ratio, ih = IH;
      // Capped to MAX_ICON_W (matches the margin reservation above) AND to
      // the per-slot pitch (so neighbouring icons can't overlap each other).
      const maxW = Math.min(MAX_ICON_W, (step || MAX_ICON_W) - 6);
      if (iw > maxW) { iw = maxW; ih = iw / ratio; }
      const icon = this.add.image(ix, iy, it.tex).setDisplaySize(iw, ih)
        .setScrollFactor(0).setDepth(61).setAlpha(0.32);
      const chk = this.add.text(ix, iy + 16, '·', {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a8898'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(62);
      return { icon, chk };
    });
    return this._slots;
  }

  // Counter pill, e.g. "🧺 FOOD COLLECTED  3/8" — sits just below the banner
  // (the level's checkpoint/collection module). Returns an updater(n).
  buildCounterPill(icon, label, total) {
    const pw = 160, x = W / 2, y = (this._hdr?.bottom ?? 68) + 16;
    const g = this.add.graphics().setScrollFactor(0).setDepth(60);
    g.fillStyle(0xffffff, 0.6); g.fillRoundedRect(x - pw / 2, y - 13, pw, 26, 9);
    g.lineStyle(1.5, 0x6a3fa0, 0.7); g.strokeRoundedRect(x - pw / 2, y - 13, pw, 26, 9);
    this.add.text(x - pw / 2 + 10, y, icon, { fontSize: '14px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    const t = this.add.text(x + 16, y, `0/${total}`, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#3a1a5a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.add.text(x - pw / 2 + 30, y - 22, label, {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    return (n) => { t.setText(`${n}/${total}`); this.tweens.add({ targets: t, scale: { from: 1.4, to: 1 }, duration: 250, ease: 'Back.easeOut' }); };
  }

  // Bottom progress bar, e.g. "PUPPIES FED ▓▓▓ 4/7". Returns updater(n).
  buildProgressBar(label, total) {
    const bx = W / 2 - 150, by = H - 30, bw = 300, bh = 16;
    this.add.text(bx, by - 18, label, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setScrollFactor(0).setDepth(61);
    const frame = this.add.graphics().setScrollFactor(0).setDepth(60);
    frame.fillStyle(0x3a1a5a, 0.6); frame.fillRoundedRect(bx, by, bw, bh, 8);
    frame.lineStyle(1.5, 0xffffff, 0.7); frame.strokeRoundedRect(bx, by, bw, bh, 8);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(61);
    const cnt = this.add.text(bx + bw + 10, by + bh / 2, `0/${total}`, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    const draw = (n) => {
      fill.clear();
      const w = Math.max(0, Math.min(1, n / total)) * (bw - 4);
      if (w > 0) { fill.fillStyle(0x6ad06a, 1); fill.fillRoundedRect(bx + 2, by + 2, w, bh - 4, 6); }
      cnt.setText(`${n}/${total}`);
    };
    draw(0);
    return draw;
  }

  // ── Modal panel + button framework ──────────────────────────────────────────
  openPanel(title, sub, opts = {}) {
    this._busy = true;
    if (this.physics?.world) this.physics.pause();
    const pw = opts.w || 600, ph = opts.h || 320;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    const td = [];
    td.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(100).setInteractive());
    // Premium wood/gold panel (shared Level-1 modal art), procedural fallback
    const panelBg = drawModalPanelBg(this, px, py, pw, ph, 101);
    if (panelBg) td.push(panelBg);
    else {
      const g = this.add.graphics().setScrollFactor(0).setDepth(101);
      g.fillStyle(0xfff6e8, 0.99); g.fillRoundedRect(px, py, pw, ph, 18);
      g.lineStyle(3, 0x6a3fa0, 0.95); g.strokeRoundedRect(px, py, pw, ph, 18);
      g.fillStyle(0x6a3fa0, 1); g.fillRoundedRect(px, py, pw, 40, 18); g.fillRect(px, py + 24, pw, 16);
      td.push(g);
    }
    td.push(this.add.text(W / 2, py + 20, title, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    if (sub) td.push(this.add.text(W / 2, py + 58, sub, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: panelBg ? '#f0e6d0' : '#7a5a3a', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    const close = (resume = true) => {
      td.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch (_) {} });
      if (resume) { this._busy = false; if (this.physics?.world) this.physics.resume(); }
    };
    return { td, close, px, py, pw, ph };
  }

  panelButton(td, cx, cy, label, color, cb, w = 160, h = 44, depth = 103) {
    const bx = cx - w / 2, by = cy - h / 2;
    const g = this.add.graphics().setScrollFactor(0).setDepth(depth);
    const draw = (hov) => {
      g.clear();
      g.fillStyle(0x000000, 0.12); g.fillRoundedRect(bx + 2, by + 3, w, h, 11);
      g.fillStyle(color, 1); g.fillRoundedRect(bx, by, w, h, 11);
      g.fillStyle(0xffffff, hov ? 0.28 : 0.15); g.fillRoundedRect(bx + 8, by + 5, w - 16, 8, 4);
      g.lineStyle(2, hov ? 0xffd23a : 0xffffff, hov ? 1 : 0.6); g.strokeRoundedRect(bx, by, w, h, 11);
    };
    draw(false); td.push(g);
    const t = this.add.text(cx, cy, label, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    td.push(t);
    const hit = this.add.rectangle(cx, cy, w, h, 0, 0).setScrollFactor(0).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    td.push(hit);
    hit.on('pointerover', () => { draw(true); t.setScale(1.05); });
    hit.on('pointerout',  () => { draw(false); t.setScale(1); });
    hit.on('pointerdown', () => t.y += 1);
    hit.on('pointerup',   () => { t.y -= 1; cb(); });
    return hit;
  }

  // Intro card before an activity
  activityIntro(emoji, title, desc, onPlay) {
    const { td, close, py, ph } = this.openPanel(title, '', { w: 360, h: 250 });
    td.push(this.add.text(W / 2, py + 84, emoji, { fontSize: '44px' }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    td.push(this.add.text(W / 2, py + 138, desc, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f0e6d0', align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 36, '▶  Play', 0x6ad06a, () => { close(true); onPlay(); }, 160, 44);
  }

  // ── Mini-activity runner (Pattern from Levels 1–4) ──────────────────────────
  // Looks up `key` in ACTIVITY_META, shows the Play intro card, then opens a
  // modal panel and runs the activity builder inside it. On win it awards the
  // activity's score, closes the panel, and calls onDone(). An optional paid
  // Skip button (default 5 ⭐) lets the player bypass it.
  //
  //   this.runActivity('bed', () => { /* resume level here */ });
  //
  // Swap which activity plays just by changing the key — see L8_Activities.js.
  runActivity(key, onDone, opts = {}) {
    // Random mini-game from Level 8's slice of the 40 games (game-map.json).
    // No intro/ending screen — the Level-1-skinned game modal shows directly,
    // and onDone() fires on completion so scene progression is unchanged.
    launchRandomMiniGame(this, 8, () => onDone?.());
  }

  // ── Toast / banner / sparkle ────────────────────────────────────────────────
  toast(msg, ms = 2200) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 70, msg, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff',
      stroke: '#3a1a5a', strokeThickness: 3, backgroundColor: '#6a3fa0cc', padding: { x: 12, y: 6 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 76, duration: 220 });
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 350, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  banner(msg, color = '#6ad06a') {
    const b = this.add.text(W / 2, H / 2 - 70, msg, {
      fontSize: '24px', fontFamily: 'Georgia, serif', color, stroke: '#fff', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95);
    this.tweens.add({ targets: b, y: b.y - 30, alpha: 0, delay: 700, duration: 800, onComplete: () => b.destroy() });
  }

  sparkleBurst(x, y, n = 12, scroll = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 30;
      const s = this.add.image(x, y, 'l8_spark').setScale(0.7).setDepth(96);
      if (!scroll) s.setScrollFactor(0);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 1.3, duration: 650, onComplete: () => s.destroy() });
    }
  }

  // ── HP / Lives / damage ─────────────────────────────────────────────────────────
  // opts.fullLife: skip the partial-HP step and lose a whole life outright —
  // used for pit falls (matches Level 4/5/6: falling in a hole always costs a
  // complete life, not just one HP pip like a regular obstacle bump).
  loseLife(onRespawn, opts = {}) {
    if (this._invuln || this._done) return;
    // If the timer ran out to 0 while a mini-activity overlay was open, close
    // it before respawning — otherwise the iframe stays visible on top while
    // the player is silently teleported back to the checkpoint underneath it.
    if (this._miniGameOpen && this._miniGameClose) this._miniGameClose();
    this._invuln = true;
    if (!opts.fullLife) {
      this._hp--;
      this.registry.set('l8_hp', this._hp);
      // Dim an HP-bar segment (sub-life damage), NOT a heart — hearts
      // represent whole LIVES and must stay full until a life is actually
      // lost (this._hp <= 0, handled below). Indexing into this._hearts here
      // (the old bug) dimmed a life icon on every ordinary hit instead.
      // Fade only, no scale tween: the bar is a thin non-square icon (26×8)
      // built via setDisplaySize, so a uniform `scale` tween would distort
      // its aspect ratio the way it wouldn't for the roughly-square heart
      // icon this tween used to target.
      const lost = this._hpBars?.[this._hp];
      if (lost) { lost.setTint(0x444444); this.tweens.add({ targets: lost, alpha: 0.25, duration: 300 }); }
    }
    this.cameras.main.shake(300, 0.012);
    // brief red flash on player
    if (this.player) {
      this.player.setTint(0xff7070);
      this.tweens.add({ targets: this.player, alpha: 0.4, duration: 130, yoyo: true, repeat: 4,
        onComplete: () => { if (this.player) { this.player.clearTint(); this.player.setAlpha(1); } this._invuln = false; }
      });
    } else {
      this.time.delayedCall(900, () => { this._invuln = false; });
    }
    if (opts.fullLife || this._hp <= 0) {
      // HP gone — lose a life and respawn
      this._lives--;
      this.registry.set('lives', this._lives);
      this._done = true; this._busy = true;
      if (this.physics?.world) this.physics.pause();
      // overlay
      this._deathOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65)
        .setScrollFactor(0).setDepth(120);
      this._deathLabel = this.add.text(W / 2, H / 2 - 10,
        this._lives > 0 ? `💔 Life Lost! ${this._lives} left` : '💔 Game Over!', {
          fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#fff', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(121);
      this.time.delayedCall(1600, () => {
        if (this._lives > 0) {
          this._hp = 3;
          this.registry.set('l8_hp', 3);
          this._respawnAtCheckpoint();
        } else {
          this.registry.set('lives', 3);
          this.registry.set('l8_hp', 3);
          showTryAgainModal(this, this.sys.settings.key);
        }
      });
    } else {
      this.toast(`💔 ${this._hp} HP left!`);
      if (onRespawn) this.time.delayedCall(700, onRespawn);
    }
  }

  _respawnAtCheckpoint() {
    // clear death overlay
    try { this._deathOverlay?.destroy(); this._deathLabel?.destroy(); } catch (_) {}
    this._deathOverlay = null; this._deathLabel = null;
    // reset state
    this._done    = false;
    this._busy    = false;
    this._invuln  = false;
    this._fallingIntoPit = false;
    this._hiddenInHole = false;
    if (this.physics?.world) this.physics.resume();
    // restore hearts HUD
    this._refreshHeartsHUD();
    // teleport to checkpoint
    const cpX = this.registry.get('l8_checkpointX') ?? 80;
    const cpY = this.registry.get('l8_checkpointY') ?? (this._groundY ?? 380);
    if (this.player) {
      this.player.clearTint();
      this.player.setAlpha(1);
      this.player.setVisible(true);   // undo the pit-fall hide, if any
      // body.reset() (not setPosition + setVelocity) — teleporting a dynamic
      // Arcade body needs the body's own position/velocity forced directly,
      // otherwise a high fall speed built up over a long pit-drop can carry
      // it through the new spot for another frame or two before the
      // sprite/body re-sync, which looks like the checkpoint reset "missing".
      this.player.body.reset(cpX, cpY - 50);
    }
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.time.delayedCall(600, () => this.toast('💪 Continue! Use A/D to move'));
  }

  // ── Scene transition (freeze-proof) ─────────────────────────────────────────
  goToScene(nextScene, data = {}, fadeMs = 600) {
    this._busy = true;
    this.registry.set('lives', this._lives ?? 3);
    this.registry.set('l8_checkpoint', nextScene);
    this.cameras.main.fadeOut(fadeMs, 0, 0, 0);
    this._wakeLoop();
    // DOM timer (NOT this.time.delayedCall): after a video the RAF loop can be
    // asleep, which freezes the Phaser clock — a scene-clock callback would then
    // never fire and the screen would stay black. setTimeout always fires; then
    // _forceSceneStart wakes the loop and pumps game.step() until the next scene
    // is really running.
    setTimeout(() => this._forceSceneStart(nextScene, data), fadeMs + 30);
  }

  // Start a scene and GUARANTEE it takes effect even if the RAF loop stalled the
  // instant it fired (scene.start() is only processed on a loop tick; if that
  // tick never comes, the game silently sits on a black screen).
  //
  // On a HEALTHY loop (the normal case), scene.start() is processed on the
  // very next requestAnimationFrame tick with no help needed. Forcing
  // game.step() on a fixed setInterval regardless of loop health (the old
  // behaviour) raced a manually-forced step against the browser's own
  // already-ticking RAF loop, occasionally double-stepping the game for a
  // beat — a visible "jerk" right as the new scene loaded.
  //
  // Fixed by checking via rAF first so the healthy path never touches
  // game.step() at all. IMPORTANT: the "has it been a second yet" fallback
  // timer runs on setTimeout, NOT inside the rAF callback — gating it behind
  // rAF re-scheduling itself meant that if the loop was EVER actually
  // stalled (the one case this mechanism exists for), rAF would never fire
  // again to notice the timeout had elapsed, freezing the game on a black
  // screen forever instead of recovering. setTimeout doesn't depend on the
  // rendering pipeline, so it still fires and triggers the forced-step
  // fallback even when rAF itself has stopped ticking.
  _forceSceneStart(nextScene, data = {}) {
    this._wakeLoop();
    try { this.scene.start(nextScene, data); } catch (_) {}

    const isRunning = () => {
      const s = this.game.scene.getScene(nextScene);
      const status = s ? s.sys.settings.status : -1;
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
        try { const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()); this.game.step(t, 16); } catch (_) {}
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

  _wakeLoop() {
    try {
      const l = this.game.loop;
      if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
    } catch (_) {}
  }

  // ── Story videos (Cloudinary), played back-to-back as one overlay. Input/
  // physics stay frozen (_busy) the whole time, then onDone runs — used both
  // for start-of-stage intros (call in create, onDone omitted) and end-of-
  // stage bridges (onDone advances to the next scene via goToScene).
  playStoryVideos(keys, onDone) {
    this._busy = true;
    if (this.physics?.world) this.physics.pause();
    playVideoSequence(this, keys, () => {
      this._busy = false;
      if (this.physics?.world) this.physics.resume();
      if (onDone) onDone();
    });
  }

  // ── Pause menu — finalized wood/gold Game-Menu modal (approved via Theme Design)
  togglePause() {
    if (this._busy && !this._paused) return;
    if (this._paused) {
      this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} });
      this._pauseObjs = null; this._paused = false;
      if (this.physics?.world) this.physics.resume(); this.tweens.resumeAll();
      return;
    }
    this._paused = true; if (this.physics?.world) this.physics.pause(); this.tweens.pauseAll();
    this._pauseObjs = openGameMenuModal(this, {
      onResume:  () => this.togglePause(),
      onRestart: () => { this._pauseObjs?.forEach(o => { try { o.destroy(); } catch (_) {} }); this._paused = false; this.tweens.resumeAll(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); },
      onExit:    () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(210, () => this.scene.start('Menu')); },
    });
  }
}

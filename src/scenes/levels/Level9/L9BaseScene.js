import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { ACTIVITY_META } from './L9_Activities.js';
import { applyGlendaSkin } from './L9_GlendaSkin.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { makePanel, generatePremiumHudTextures, buildStandardHeader, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { launchRandomMiniGame } from '../../../utils/MiniGamePicker.js';
import { showTryAgainModal, doFullRestart } from '../../../utils/EndModals.js';
import { playVideoSequence } from '../../../utils/VideoOverlay.js';
import { toCanvas, bboxOf } from '../GlendaSkinCore.js';

// ════════════════════════════════════════════════════════════════════════════
// L9BaseScene — shared scaffolding for Level 9 "A Holiday for the Puppies".
//
// Provides: snowy-evening parallax OR cosy living-room background, snow-covered
// ground, Gleeda (JUMP only — no slide in Level 9), a festive HUD (banner / hearts / score /
// counters / progress), a reusable modal-panel + button framework, toasts,
// sparkles, gentle falling snow, HP/lives handling, and the freeze-proof scene
// transition (fadeOut → _wakeLoop → start). Mirrors the proven Level 8 base so
// it integrates cleanly. Palette: evergreen · holly-red · gold · snow-white.
// ════════════════════════════════════════════════════════════════════════════

export const L9 = {
  SKY:   0x14224a,
  PANEL: 0x1f3a2e,   // deep evergreen panel
  RED:   0xd23a4e,
  GREEN: 0x2f7a4a,
  GOLD:  0xffd24a,
  SNOW:  0xf4f8ff,
  WOOD:  0xb07a44,
  redS:  '#ff9ec4',
  goldS: '#ffe6a0',
  greenS:'#bfe8c8',
  snowS: '#eaf2ff',
  creamS:'#fff3d8',
};

// Fixed bg/ground seam line — same technique AND value as Level 8's own
// buildSky()/buildGround() (L8BaseScene.js). The old background here was a
// single static, screen-locked image that never scrolled at all while the
// ground/road beneath it scrolled normally — that mismatch (a frozen backdrop
// behind a moving world) was the visible "jiggle". Using one tileSprite tied
// to camera scroll, seam-matched to the ground so the two meet with no gap
// and no overlap, fixes it exactly the way Level 8 already does it.
const GROUND_SEAM_Y = 392;

export class L9BaseScene extends Phaser.Scene {

  // ── Snowy outdoor background (runs) — single scrolling tileSprite, seam-
  // matched to the ground (see GROUND_SEAM_Y above) — same art technique as
  // Level 8's buildSky(), just pointed at Level 9's own bg-l9.jpg art.
  buildSnowyBg(worldW) {
    const bgDisplayH = GROUND_SEAM_Y;
    if (this.textures.exists('l9_sky')) {
      const src  = this.textures.get('l9_sky').getSourceImage();
      const srcH = src.naturalHeight || src.height || 700;
      const scale = bgDisplayH / srcH;
      this._bgTile = this.add.tileSprite(0, 0, W, bgDisplayH, 'l9_sky')
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-30);
      this._bgTile.setTileScale(scale, scale);
    } else {
      this.add.rectangle(W / 2, bgDisplayH / 2, W, bgDisplayH, L9.SKY).setScrollFactor(0).setDepth(-30);
    }
    this._startSnow();
  }

  // ── Cosy room background (unwrap / bow-tie) — screen-locked ──────────────────
  // Prefers the real fully-decorated room photo (l9_room_bg_real) when a scene
  // has preloaded it; it already has its own tree/garland/lights baked in, so
  // the separate procedural tree overlay only draws for the older fallbacks.
  buildRoomBg() {
    if (this.textures.exists('l9_room_bg_real')) {
      this.add.image(W / 2, H / 2, 'l9_room_bg_real').setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
    } else if (this.textures.exists('l9_room_bg')) {
      this.add.image(W / 2, H / 2, 'l9_room_bg').setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
      if (this.textures.exists('l9_tree')) this.add.image(700, 250, 'l9_tree').setDisplaySize(150, 220).setDepth(-10);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0xf3ddc0).setScrollFactor(0).setDepth(-30);
    }
    this._startSnow(true);
  }

  _startSnow(indoor = false) {
    this._snowTimer = this.time.addEvent({ delay: indoor ? 900 : 320, loop: true, callback: () => this._spawnSnow(indoor) });
    this.events.once('shutdown', () => this._snowTimer?.remove());
  }

  _spawnSnow(indoor) {
    if (this._paused || this._busy) return;
    const cam = this.cameras.main;
    const x = (indoor ? 0 : cam.scrollX) + Math.random() * W;
    const s = this.add.image(x, -8, 'l9_snow')
      .setScrollFactor(indoor ? 0 : 1).setDepth(indoor ? 40 : -6)
      .setAlpha(0.3 + Math.random() * 0.6).setScale(0.4 + Math.random() * 0.8);
    this.tweens.add({
      targets: s, y: H + 10, x: `+=${(Math.random() - 0.5) * 80}`,
      angle: 180, alpha: 0, duration: 4200 + Math.random() * 3200,
      onComplete: () => s.destroy()
    });
  }

  updateParallax() {
    const camX = this.cameras.main.scrollX;
    if (this._bgTile)   this._bgTile.tilePositionX   = camX * 0.25;
    if (this._surfTile) this._surfTile.tilePositionX = camX;
  }

  // ── Snow-covered ground ──────────────────────────────────────────────────────
  buildGround(worldW, groundY) {
    this._worldW = worldW; this._groundY = groundY;
    const body = this.add.rectangle(worldW / 2, groundY + 20, worldW, 40, 0, 0).setDepth(-9);
    this.physics.add.existing(body, true);
    this._ground = body;
    const surfaceY = GROUND_SEAM_Y;
    const surfaceH = H - surfaceY;
    if (this.textures.exists('l9_ground')) {
      const src = this.textures.get('l9_ground').getSourceImage();
      const scale = surfaceH / (src.naturalHeight || src.height || 80);
      this._surfTile = this.add.tileSprite(0, surfaceY, W, surfaceH, 'l9_ground')
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);
      this._surfTile.setTileScale(scale, scale);
    } else {
      const fg = this.add.graphics().setDepth(-8).setScrollFactor(0);
      fg.fillStyle(0xf4f8ff, 1); fg.fillRect(0, surfaceY, W, surfaceH);
    }
    return body;
  }

  // Trims a texture down to the exact bounding box of its opaque pixels
  // (reusing the same alpha-bbox crop GlendaSkinCore uses for the character
  // skins) and caches the result under '<key>_trimmed'. Used for the floating
  // snow-ledge platforms: their source art has a chunk of transparent canvas
  // padding around the actual snow mound, so sizing setDisplaySize()/
  // refreshBody() off the RAW texture made the invisible collision box sit
  // above or below the visible snow depending on how much padding was
  // guessed away — repeated manual pixel-nudge attempts kept over/under-
  // shooting. Trimming the texture itself removes the guesswork entirely:
  // whatever size the (now padding-free) texture is displayed at, the
  // physics body built from it lines up with the visible art exactly.
  _getTrimmedTexture(key) {
    const trimmedKey = `${key}_trimmed`;
    if (this.textures.exists(trimmedKey)) return trimmedKey;
    const cv = toCanvas(this.textures.get(key).getSourceImage());
    const box = bboxOf(cv);
    const out = document.createElement('canvas');
    out.width = box.w; out.height = box.h;
    out.getContext('2d', { willReadFrequently: true }).drawImage(cv, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    this.textures.addCanvas(trimmedKey, out);
    return trimmedKey;
  }

  // ── Gleeda: JUMP only — no slide in Level 9 ───────────────────────────────────
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
    this.physics.add.collider(this.player, this._ground);
    this.player.play('gleeda_idle');
    applyGlendaSkin(this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE');
    const footer = document.getElementById('game-footer'); if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => {
      const f = document.getElementById('game-footer'); if (f) f.style.display = 'none';
    });
    return this.player;
  }

  _setPose(pose) {
    if (this._pose === pose) return;
    this._pose = pose;
    if (pose === 'walk') this.player.play('gleeda_walk', true);
    else if (pose === 'idle') this.player.play('gleeda_idle', true);
    else if (pose === 'jump') this.player.play('gleeda_jump', true);
  }

  runMovement() {
    if (this._paused || this._busy || !this.player) return false;
    const ts = window._touchState || {};
    const p = this.player, onG = p.body.blocked.down || p.body.touching.down;
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
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
  // opts.timer = seconds → shows a countdown (runner/action stages only).
  buildTopBanner(chapter, title, subtitle, opts = {}) {
    generatePremiumHudTextures(this);
    this._lives = this.registry.get('lives')  ?? 3;
    this._hp    = this.registry.get('l9_hp')  ?? 3;
    this._score = this.registry.get('l9_score') ?? 0;

    this._hdr = buildStandardHeader(this, {
      chapterLabel: chapter, title,
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

    if (opts.timer) {
      this._timerFull = opts.timer; this._timerLeft = opts.timer;
      this._timerEvt = this.time.addEvent({ delay: 1000, loop: true, callback: () => this._tickHudTimer() });
    }

    // subtitle (objective line) — pinned to the bottom of the screen instead
    // of under the banner, so it doesn't crowd the top HUD.
    if (subtitle) this.add.text(W / 2, H - 20, subtitle, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: L9.creamS, stroke: '#1a0f04', strokeThickness: 2,
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
      this.loseLife?.();
    }
  }

  // Kept for stage compatibility — the header already builds hearts/HP.
  buildHearts() { if (!this._hearts) this.buildTopBanner('', '', ''); }

  _refreshHeartsHUD() {
    this._hdr?.setLives?.(this._lives);
    this._hdr?.setHP?.(this._hp);
  }

  // Kept for compatibility — the coin panel is part of the header.
  buildScore()      { if (!this._scoreTxt) this.buildHearts(); }
  buildScorePause() { if (!this._scoreTxt) this.buildHearts(); }

  // Coins are awarded ONLY by solving mini-games now. Themed activities
  // (gift runs, unwrapping, bow runs, bow-tying) still call addScore(...) but
  // it's a no-op — none of that grants coins. MiniGamePicker routes the flat
  // mini-game reward through _addPoints below instead.
  addScore(_n) { /* no coins from gameplay activities — mini-games only */ }

  _addPoints(n) {
    if (this._score == null) this._score = this.registry.get('l9_score') ?? 0;
    this._score += n;
    this.registry.set('l9_score', this._score);
    if (this._scoreTxt) { this._scoreTxt.setText(`${this._score}`); this.tweens.add({ targets: this._scoreTxt, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.easeOut' }); }
  }

  // Counter pill — just below the banner (the level's checkpoint/collection module).
  // Returns updater(n).
  buildCounterPill(icon, label, total) {
    const PW = 476, PH = 40, px = W / 2 - PW / 2, py = (this._hdr?.bottom ?? 68) + 6;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1c4a2e, 0.9); bg.fillRoundedRect(px, py, PW, PH, 11);
    bg.lineStyle(2, L9.GOLD, 0.85); bg.strokeRoundedRect(px, py, PW, PH, 11);
    this.add.text(px + 16, py + PH / 2, icon, { fontSize: '18px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    const t = this.add.text(W / 2, py + PH / 2, `${label}  0 / ${total}`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    return (n) => { t.setText(`${label}  ${n} / ${total}`); this.tweens.add({ targets: t, scale: { from: 1.25, to: 1 }, duration: 250, ease: 'Back.easeOut' }); };
  }

  // Bottom progress bar, e.g. "PUPPIES ▓▓▓ 4/7". Returns updater(n).
  buildProgressBar(label, total) {
    const bx = W / 2 - 150, by = H - 30, bw = 300, bh = 16;
    this.add.text(bx, by - 18, label, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setScrollFactor(0).setDepth(61);
    const frame = this.add.graphics().setScrollFactor(0).setDepth(60);
    frame.fillStyle(0x0a1a0e, 0.6); frame.fillRoundedRect(bx, by, bw, bh, 8);
    frame.lineStyle(1.5, 0xffffff, 0.7); frame.strokeRoundedRect(bx, by, bw, bh, 8);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(61);
    const cnt = this.add.text(bx + bw + 10, by + bh / 2, `0/${total}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(61);
    const draw = (n) => {
      fill.clear();
      const w = Math.max(0, Math.min(1, n / total)) * (bw - 4);
      if (w > 0) { fill.fillStyle(L9.RED, 1); fill.fillRoundedRect(bx + 2, by + 2, w, bh - 4, 6); }
      cnt.setText(`${n}/${total}`);
    };
    draw(0);
    return draw;
  }

  // Bottom distance bar with checkpoint markers. Returns updater(px).
  buildDistanceBar(worldW, cpXs = []) {
    const bx = 100, bw = W - 200, by = H - 18;
    const dBg = this.add.graphics().setScrollFactor(0).setDepth(60);
    dBg.fillStyle(0x0a1a0e, 0.7); dBg.fillRoundedRect(bx - 2, by - 2, bw + 4, 14, 6);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(61);
    cpXs.forEach(cpx => {
      const rx = bx + (cpx / worldW) * bw;
      const mg = this.add.graphics().setScrollFactor(0).setDepth(62);
      mg.fillStyle(L9.GOLD, 0.9); mg.fillTriangle(rx, by - 2, rx - 5, by + 10, rx + 5, by + 10);
    });
    const label = this.add.text(W / 2, by - 14, '', { fontSize: '9px', fontFamily: 'Georgia, serif', color: L9.snowS, stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(62);
    return (px) => {
      const pct = Math.min(1, px / worldW);
      fill.clear();
      const fw = Math.max(0, pct * bw);
      if (fw > 0) { fill.fillStyle(L9.GREEN, 0.9); fill.fillRoundedRect(bx, by, fw, 10, 5); }
      label.setText(`${Math.floor(pct * 100)}%`);
    };
  }

  // ── Modal panel + button framework ───────────────────────────────────────────
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
      g.lineStyle(3, L9.RED, 0.95); g.strokeRoundedRect(px, py, pw, ph, 18);
      g.fillStyle(L9.GREEN, 1); g.fillRoundedRect(px, py, pw, 40, 18); g.fillRect(px, py + 24, pw, 16);
      td.push(g);
    }
    td.push(this.add.text(W / 2, py + 20, title, { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    if (sub) td.push(this.add.text(W / 2, py + 58, sub, { fontSize: '12px', fontFamily: 'Georgia, serif', color: panelBg ? '#f0e6d0' : '#7a5a3a', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
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
      g.fillStyle(0xffffff, hov ? 0.28 : 0.14); g.fillRoundedRect(bx + 8, by + 5, w - 16, 8, 4);
      g.lineStyle(2, hov ? L9.GOLD : 0xffffff, hov ? 1 : 0.6); g.strokeRoundedRect(bx, by, w, h, 11);
    };
    draw(false); td.push(g);
    const t = this.add.text(cx, cy, label, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    td.push(t);
    const hit = this.add.rectangle(cx, cy, w, h, 0, 0).setScrollFactor(0).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    td.push(hit);
    hit.on('pointerover', () => { draw(true); t.setScale(1.05); });
    hit.on('pointerout',  () => { draw(false); t.setScale(1); });
    hit.on('pointerdown', () => t.y += 1);
    hit.on('pointerup',   () => { t.y -= 1; cb(); });
    return hit;
  }

  activityIntro(emoji, title, desc, onPlay) {
    const { td, close, py, ph } = this.openPanel(title, '', { w: 360, h: 250 });
    td.push(this.add.text(W / 2, py + 84, emoji, { fontSize: '44px' }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    td.push(this.add.text(W / 2, py + 138, desc, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f0e6d0', align: 'center', lineSpacing: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 36, '▶  Play', L9.GREEN, () => { close(true); onPlay(); }, 160, 44);
  }

  runActivity(key, onDone, opts = {}) {
    // Random mini-game from Level 9's slice of the 40 games (game-map.json).
    // No intro/ending screen — the Level-1-skinned game modal shows directly,
    // and onDone() fires on completion so scene progression is unchanged.
    launchRandomMiniGame(this, 9, () => onDone?.());
  }

  // ── Toast / banner / sparkle / confetti ──────────────────────────────────────
  toast(msg, ms = 2200) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 70, msg, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3,
      backgroundColor: '#1c4a2ecc', padding: { x: 12, y: 6 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 76, duration: 220 });
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 350, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  banner(msg, color = '#ffe6a0') {
    const b = this.add.text(W / 2, H / 2 - 70, msg, { fontSize: '24px', fontFamily: 'Georgia, serif', color, stroke: '#0a1a0e', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(95);
    this.tweens.add({ targets: b, y: b.y - 30, alpha: 0, delay: 700, duration: 800, onComplete: () => b.destroy() });
  }

  sparkleBurst(x, y, n = 12, scroll = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 32;
      const s = this.add.image(x, y, 'l9_spark').setScale(0.7).setDepth(96);
      if (!scroll) s.setScrollFactor(0);
      s.setTint([0xffd24a, 0xd23a4e, 0x7fffc8, 0xffffff][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 1.4, duration: 680, onComplete: () => s.destroy() });
    }
  }

  confetti(x, y) {
    const cols = [0xd23a4e, 0x2f7a4a, 0xffd24a, 0x4a9fe0, 0xe06ab0, 0xffffff];
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + Phaser.Math.FloatBetween(-1, 1);
      const sp = Phaser.Math.Between(40, 110);
      const bit = this.add.rectangle(x, y, Phaser.Math.Between(4, 7), Phaser.Math.Between(6, 10), cols[i % cols.length]).setDepth(40).setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({ targets: bit, x: x + Math.cos(a) * sp, y: y + Math.sin(a) * sp + Phaser.Math.Between(30, 70), angle: bit.angle + Phaser.Math.Between(180, 540), alpha: 0, duration: Phaser.Math.Between(700, 1100), ease: 'Quad.easeIn', onComplete: () => bit.destroy() });
    }
  }

  popText(x, y, msg, color = '#ffffff') {
    const t = this.add.text(x, y, msg, { fontSize: '13px', fontFamily: 'Georgia, serif', color, stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, scale: 1.25, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  // ── HP / Lives / damage ──────────────────────────────────────────────────────
  loseLife(onRespawn) {
    if (this._invuln || this._done) return;
    // If the timer ran out to 0 while a mini-activity overlay was open, close
    // it before respawning — otherwise the iframe stays visible on top while
    // the player is silently teleported back to the checkpoint underneath it.
    if (this._miniGameOpen && this._miniGameClose) this._miniGameClose();
    this._invuln = true;
    this._hp--;
    this.registry.set('l9_hp', this._hp);
    // Dim an HP-bar segment (sub-life damage), NOT a heart — hearts represent
    // whole LIVES and must stay full until this._hp actually reaches 0 below.
    // Indexing into this._hearts here (the old bug) dimmed a life icon on
    // every ordinary hit, before any life was lost.
    const lost = this._hpBars?.[this._hp];
    // Fade only (no scale tween here) — the bar is a thin non-square icon
    // (26×8) built via setDisplaySize, so tweening a uniform `scale` would
    // distort its aspect ratio the way it wouldn't for the roughly-square
    // heart icon this tween used to target.
    if (lost) { lost.setTint(0x444444); this.tweens.add({ targets: lost, alpha: 0.25, duration: 300 }); }
    this.cameras.main.shake(300, 0.012);
    if (this.player) {
      this.player.setTint(0xff7070);
      this.tweens.add({ targets: this.player, alpha: 0.4, duration: 130, yoyo: true, repeat: 4, onComplete: () => { if (this.player) { this.player.clearTint(); this.player.setAlpha(1); } this._invuln = false; } });
    } else { this.time.delayedCall(900, () => { this._invuln = false; }); }
    if (this._hp <= 0) {
      this._lives--; this.registry.set('lives', this._lives);
      this._done = true; this._busy = true;
      if (this.physics?.world) this.physics.pause();
      this._deathOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.66).setScrollFactor(0).setDepth(120);
      this._deathLabel = this.add.text(W / 2, H / 2 - 10, this._lives > 0 ? `💔 Life Lost! ${this._lives} left` : '💔 Game Over!', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ff9ec4', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(121);
      this.time.delayedCall(1600, () => {
        if (this._lives > 0) { this._hp = 3; this.registry.set('l9_hp', 3); this._respawnAtCheckpoint(); }
        else {
          this.registry.set('lives', 3); this.registry.set('l9_hp', 3);
          showTryAgainModal(this, this.sys.settings.key);
        }
      });
    } else {
      this.toast(`💔 ${this._hp} HP left!`);
      if (onRespawn) this.time.delayedCall(700, onRespawn);
    }
  }

  _respawnAtCheckpoint() {
    try { this._deathOverlay?.destroy(); this._deathLabel?.destroy(); } catch (_) {}
    this._deathOverlay = null; this._deathLabel = null;
    this._done = false; this._busy = false; this._invuln = false;
    if (this.physics?.world) this.physics.resume();
    this._refreshHeartsHUD();
    const cpX = this.registry.get('l9_checkpointX') ?? 80;
    const cpY = this.registry.get('l9_checkpointY') ?? (this._groundY ?? 380);
    if (this.player) { this.player.clearTint(); this.player.setAlpha(1); this.player.setPosition(cpX, cpY - 50); this.player.setVelocity(0, 0); }
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.time.delayedCall(600, () => this.toast('💪 Keep going! A/D move · W jump · S slide'));
  }

  // ── Scene transition (freeze-proof) ──────────────────────────────────────────
  goToScene(nextScene, data = {}, fadeMs = 600) {
    this._busy = true;
    this.registry.set('lives', this._lives ?? 3);
    this.registry.set('l9_checkpoint', nextScene);
    this.cameras.main.fadeOut(fadeMs, 0, 0, 0);
    this._wakeLoop();
    // DOM timer (NOT this.time.delayedCall): after a video the RAF loop can be
    // asleep, freezing the Phaser clock — a scene-clock callback would never fire
    // and the screen would stay black. setTimeout always fires; _forceSceneStart
    // then wakes the loop and pumps game.step() until the next scene is running.
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
      const l = this.game.loop; if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
    } catch (_) {}
  }

  // ── Story videos (Cloudinary), played back-to-back as one overlay. Input/
  // physics stay frozen (_busy) the whole time, then onDone runs — used both
  // for start-of-stage intros (call in create, onDone omitted) and end-of-
  // stage bridges (onDone advances to the next scene via goToScene).
  playStoryVideos(keys, onDone, opts) {
    this._busy = true;
    if (this.physics?.world) this.physics.pause();
    playVideoSequence(this, keys, () => {
      this._busy = false;
      if (this.physics?.world) this.physics.resume();
      if (onDone) onDone();
    }, opts);
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
      onExit:    () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => { this._wakeLoop(); this.scene.start('Menu'); }); },
    });
  }
}

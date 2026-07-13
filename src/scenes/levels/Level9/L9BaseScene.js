import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { ACTIVITY_META } from './L9_Activities.js';
import { applyGlendaSkin } from './L9_GlendaSkin.js';

// ════════════════════════════════════════════════════════════════════════════
// L9BaseScene — shared scaffolding for Level 9 "A Holiday for the Puppies".
//
// Provides: snowy-evening parallax OR cosy living-room background, snow-covered
// ground, Gleeda (JUMP + SLIDE), a festive HUD (banner / hearts / score /
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

export class L9BaseScene extends Phaser.Scene {

  // ── Snowy outdoor background (runs) — sky + parallax hills + snowfall ────────
  buildSnowyBg(worldW) {
    if (this.textures.exists('l9_sky')) {
      this.add.image(W / 2, H / 2, 'l9_sky').setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, L9.SKY).setScrollFactor(0).setDepth(-30);
    }
    if (this.textures.exists('l9_hills')) {
      this._hills = this.add.tileSprite(0, H - 240, W, 240, 'l9_hills')
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-20).setAlpha(0.95);
    }
    // string lights across the top
    if (this.textures.exists('l9_lights')) {
      this._lights = this.add.tileSprite(0, 10, W, 30, 'l9_lights').setOrigin(0, 0).setScrollFactor(0).setDepth(-18).setAlpha(0.9);
    }
    this._startSnow();
  }

  // ── Cosy room background (unwrap / bow-tie) — screen-locked ──────────────────
  buildRoomBg() {
    if (this.textures.exists('l9_room_bg')) {
      this.add.image(W / 2, H / 2, 'l9_room_bg').setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0xf3ddc0).setScrollFactor(0).setDepth(-30);
    }
    // a decorated tree in the corner
    if (this.textures.exists('l9_tree')) this.add.image(700, 250, 'l9_tree').setDisplaySize(150, 220).setDepth(-10);
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
    if (this._hills)    this._hills.tilePositionX    = camX * 0.28;
    if (this._lights)   this._lights.tilePositionX   = camX * 0.5;
    if (this._surfTile) this._surfTile.tilePositionX = camX;
  }

  // ── Snow-covered ground ──────────────────────────────────────────────────────
  buildGround(worldW, groundY) {
    this._worldW = worldW; this._groundY = groundY;
    const body = this.add.rectangle(worldW / 2, groundY + 20, worldW, 40, 0, 0).setDepth(-9);
    this.physics.add.existing(body, true);
    this._ground = body;
    const surfaceY = groundY - 12;
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

  // ── Gleeda: JUMP + SLIDE ─────────────────────────────────────────────────────
  buildPlayer(x, groundY, runSpeed = 250, jumpV = -470) {
    this._runSpeed = runSpeed; this._jumpV = jumpV; this._sliding = false; this._pose = null; this._facing = 1;
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
    // applyGlendaSkin computes and stores _normalBodyW/H and _slideBodyW/H
    // (world-space, derived from the ORIGINAL 0.18 scale before it changes
    // this.player's scale) — _startSlide below uses those so the slide hitbox
    // stays correct regardless of the scale the skin picks.
    applyGlendaSkin(this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE');
    const footer = document.getElementById('game-footer'); if (footer) footer.style.display = 'flex';
    const slideBtn = document.getElementById('btn-slide'); if (slideBtn) slideBtn.style.display = '';
    this.events.once('shutdown', () => {
      const f = document.getElementById('game-footer'); if (f) f.style.display = 'none';
      const sb = document.getElementById('btn-slide'); if (sb) sb.style.display = 'none';
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

  _startSlide() {
    if (this._sliding) return;
    this._sliding = true;
    const s = this.player.scaleX;
    this.player.body.setSize(this._slideBodyW / s, this._slideBodyH / s, true);
    this._slideTimer = this.time.delayedCall(600, () => {
      this._sliding = false;
      if (this.player?.body) {
        const s2 = this.player.scaleX;
        this.player.body.setSize(this._normalBodyW / s2, this._normalBodyH / s2, true);
      }
    });
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
    const jump  = this.cursors.up.isDown   || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;
    const slide = this.cursors.down.isDown || this.keys.S.isDown || ts.slide;
    if (jump && onG && !this._sliding) { p.setVelocityY(this._jumpV); ts.jump = false; }
    if (slide && onG && !this._sliding) this._startSlide();
    if (!onG)               this._setPose('jump');
    else if (this._sliding) this._setPose('slide');
    else if (velX !== 0)    this._setPose('walk');
    else                    this._setPose('idle');
    return onG;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  buildTopBanner(chapter, title, subtitle) {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1c4a2e, 0.94); bg.fillRoundedRect(W / 2 - 240, 6, 480, 42, 12);
    bg.lineStyle(2, L9.GOLD, 0.9); bg.strokeRoundedRect(W / 2 - 240, 6, 480, 42, 12);
    this.add.text(W / 2, 17, chapter, { fontSize: '11px', fontFamily: 'Georgia, serif', color: L9.goldS, stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.add.text(W / 2, 34, title, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    if (subtitle) this.add.text(W / 2, 56, subtitle, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: L9.creamS, stroke: '#0a1a0e', strokeThickness: 2,
      backgroundColor: '#1c4a2ecc', padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    const pb = this.add.text(W - 22, 24, '⏸', { fontSize: '22px' }).setOrigin(0.5).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.togglePause());
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  buildHearts() {
    const lp = this.add.graphics().setScrollFactor(0).setDepth(60);
    lp.fillStyle(0x1c4a2e, 0.7); lp.fillRoundedRect(6, 6, 96, 32, 9);
    lp.lineStyle(1.5, L9.GOLD, 0.7); lp.strokeRoundedRect(6, 6, 96, 32, 9);
    this._lives = this.registry.get('lives') ?? 3;
    this._hp    = this.registry.get('l9_hp') ?? 3;
    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(24 + i * 28, 22, 'l9_heart').setScale(0.6).setScrollFactor(0).setDepth(61);
      h.setAlpha(i < this._hp ? 1 : 0.25);
      this._hearts.push(h);
    }
    const lv = this.add.graphics().setScrollFactor(0).setDepth(60);
    lv.fillStyle(0x1c4a2e, 0.7); lv.fillRoundedRect(6, 42, 96, 20, 7);
    lv.lineStyle(1.5, L9.GOLD, 0.7); lv.strokeRoundedRect(6, 42, 96, 20, 7);
    this._livesTxt = this.add.text(54, 52, `❤ LIVES: ${this._lives}`, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffd0d8', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
  }

  _refreshHeartsHUD() {
    for (let i = 0; i < 3; i++) if (this._hearts[i]) this._hearts[i].setAlpha(i < this._hp ? 1 : 0.25).setScale(0.6);
    if (this._livesTxt) this._livesTxt.setText(`❤ LIVES: ${this._lives}`);
  }

  buildScore() {
    // Score badge sits at bottom-left so it never collides with the top HUD /
    // pause button that buildTopBanner renders in the top-right corner.
    this._score = this.registry.get('l9_score') ?? 0;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1c4a2e, 0.72); bg.fillRoundedRect(6, H - 34, 120, 26, 7);
    bg.lineStyle(1, L9.GOLD, 0.5); bg.strokeRoundedRect(6, H - 34, 120, 26, 7);
    this._scoreFmt = (s) => `⭐ SCORE ${s}`;
    this._scoreTxt = this.add.text(66, H - 21, this._scoreFmt(this._score), { fontSize: '12px', fontFamily: 'Georgia, serif', color: L9.goldS }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
  }

  // Compact score + pause in the TOP-RIGHT corner (for run scenes whose
  // top-centre is taken by the counter pill). Binds pause + Esc itself, so a
  // scene using this must NOT also call buildTopBanner (which also binds them).
  buildScorePause() {
    this._score = this.registry.get('l9_score') ?? 0;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1c4a2e, 0.72); bg.fillRoundedRect(W - 150, 6, 104, 28, 7);
    bg.lineStyle(1, L9.GOLD, 0.5); bg.strokeRoundedRect(W - 150, 6, 104, 28, 7);
    this._scoreFmt = (s) => `⭐ ${s}`;
    this._scoreTxt = this.add.text(W - 98, 20, this._scoreFmt(this._score), { fontSize: '13px', fontFamily: 'Georgia, serif', color: L9.goldS }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    const pb = this.add.text(W - 24, 20, '⏸', { fontSize: '22px' }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.togglePause());
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  addScore(n) {
    if (this._score == null) this._score = this.registry.get('l9_score') ?? 0;
    this._score += n;
    this.registry.set('l9_score', this._score);
    if (this._scoreTxt) { this._scoreTxt.setText(this._scoreFmt ? this._scoreFmt(this._score) : `SCORE ${this._score}`); this.tweens.add({ targets: this._scoreTxt, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.easeOut' }); }
  }

  // Counter pill top-centre, e.g. "🎁 GIFTS 3/8". Returns updater(n).
  buildCounterPill(icon, label, total) {
    const PW = 476, PH = 40, px = W / 2 - PW / 2, py = 4;
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
    const g = this.add.graphics().setScrollFactor(0).setDepth(101);
    g.fillStyle(0xfff6e8, 0.99); g.fillRoundedRect(px, py, pw, ph, 18);
    g.lineStyle(3, L9.RED, 0.95); g.strokeRoundedRect(px, py, pw, ph, 18);
    g.fillStyle(L9.GREEN, 1); g.fillRoundedRect(px, py, pw, 40, 18); g.fillRect(px, py + 24, pw, 16);
    td.push(g);
    td.push(this.add.text(W / 2, py + 20, title, { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    if (sub) td.push(this.add.text(W / 2, py + 58, sub, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#7a5a3a', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
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
    td.push(this.add.text(W / 2, py + 138, desc, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#7a5a3a', align: 'center', lineSpacing: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 36, '▶  Play', L9.GREEN, () => { close(true); onPlay(); }, 160, 44);
  }

  runActivity(key, onDone, opts = {}) {
    const meta = ACTIVITY_META[key];
    if (!meta) { console.warn(`[L9] unknown activity "${key}"`); onDone?.(); return; }
    const play = () => {
      const { td, close, px, py, pw, ph } = this.openPanel(`${meta.emoji}  ${meta.title}`, '', { w: opts.w ?? meta.w ?? 460, h: opts.h ?? meta.h ?? 320 });
      const ax = px + 20, ay = py + 56, aw = pw - 40, ah = ph - 76, D = 103;
      let finished = false;
      const succeed = () => {
        if (finished) return; finished = true;
        this.sparkleBurst(W / 2, H / 2, 16, false);
        this.addScore?.(meta.score || 100);
        this.registry.set('points', (this.registry.get('points') || 0) + Math.round((meta.score || 100) / 20));
        close(true); onDone?.();
      };
      const skipCost = opts.skipCost ?? 5;
      if (opts.skip !== false) {
        const pts = this.registry.get('points') || 0;
        if (pts >= skipCost) {
          this.panelButton(td, px + pw - 70, py + 20, `Skip -${skipCost}⭐`, L9.RED, () => {
            if (finished) return; finished = true;
            this.registry.set('points', pts - skipCost);
            close(true); onDone?.();
          }, 110, 28, 103);
        }
      }
      meta.fn(this, ax, ay, aw, ah, td, succeed, D);
    };
    if (opts.intro === false) play();
    else this.activityIntro(meta.emoji, meta.title, meta.desc, play);
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
    this._invuln = true;
    this._hp--;
    this.registry.set('l9_hp', this._hp);
    const lost = this._hearts?.[this._hp];
    if (lost) this.tweens.add({ targets: lost, alpha: 0.25, scale: { from: 0.9, to: 0.6 }, duration: 300 });
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
        else { this.registry.set('lives', 3); this.registry.set('l9_hp', 3); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => { this._wakeLoop(); this.scene.start('Menu'); }); }
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
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.toast('💪 Keep going! A/D move · W jump · S slide'));
  }

  // ── Scene transition (freeze-proof) ──────────────────────────────────────────
  goToScene(nextScene, data = {}, fadeMs = 600) {
    this._busy = true;
    this.registry.set('lives', this._lives ?? 3);
    this.registry.set('l9_checkpoint', nextScene);
    this.cameras.main.fadeOut(fadeMs, 0, 0, 0);
    this.time.delayedCall(fadeMs + 30, () => { this._wakeLoop(); this.scene.start(nextScene, data); });
  }

  _wakeLoop() {
    try {
      const l = this.game.loop; if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
    } catch (_) {}
  }

  // ── Pause menu ───────────────────────────────────────────────────────────────
  togglePause() {
    if (this._busy && !this._paused) return;
    if (this._paused) { this._pauseObjs?.forEach(o => o.destroy()); this._pauseObjs = null; this._paused = false; if (this.physics?.world) this.physics.resume(); this.tweens.resumeAll(); return; }
    this._paused = true; if (this.physics?.world) this.physics.pause(); this.tweens.pauseAll();
    const objs = [];
    objs.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(120).setInteractive());
    const g = this.add.graphics().setScrollFactor(0).setDepth(121);
    g.fillStyle(0xfff6e8, 0.99); g.fillRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 16);
    g.lineStyle(3, L9.RED, 0.95); g.strokeRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 16);
    objs.push(g);
    objs.push(this.add.text(W / 2, H / 2 - 82, '⏸  Paused', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#2f7a4a', stroke: '#fff', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(122));
    const mk = (y, label, color, cb) => {
      const bx = W / 2 - 100, bw = 200, bh = 40;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(122);
      bg.fillStyle(color, 1); bg.fillRoundedRect(bx, y, bw, bh, 11); bg.lineStyle(2, 0xffffff, 0.6); bg.strokeRoundedRect(bx, y, bw, bh, 11);
      objs.push(bg);
      const t = this.add.text(W / 2, y + bh / 2, label, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
      objs.push(t);
      const hit = this.add.rectangle(W / 2, y + bh / 2, bw, bh, 0, 0).setScrollFactor(0).setDepth(124).setInteractive({ useHandCursor: true });
      objs.push(hit); hit.on('pointerup', cb);
    };
    mk(H / 2 - 56, '▶  Resume', L9.GREEN, () => this.togglePause());
    mk(H / 2 - 8,  '↺  Restart', L9.GOLD, () => { this._pauseObjs?.forEach(o => o.destroy()); this._paused = false; this.tweens.resumeAll(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); });
    mk(H / 2 + 40, '✕  Exit to Menu', L9.RED, () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => { this._wakeLoop(); this.scene.start('Menu'); }); });
    this._pauseObjs = objs;
  }
}

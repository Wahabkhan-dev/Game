import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { ACTIVITY_META } from './L8_Activities.js';
import { applyGlendaSkin } from './L8_GlendaSkin.js';

// ════════════════════════════════════════════════════════════════════════════
// L8BaseScene — shared scaffolding for Level 8 "Puppy Care Day".
//
// Provides: bright daytime sky + parallax, runnable grass ground, an auto-running
// caretaker (Gleeda) with JUMP + SLIDE, a cheerful HUD (banner / hearts / score /
// progress), a reusable modal-panel + button framework, toasts, sparkles, life
// handling, and the freeze-proof scene transition (fadeOut → _wakeLoop → start).
// Every Level 8 scene extends this. Themed deliberately apart from Level 7.
// ════════════════════════════════════════════════════════════════════════════
export class L8BaseScene extends Phaser.Scene {

  // ── Background — identical to Level 6: single garden image, parallax 25% ────
  buildSky() {
    const bgDisplayH = (this._groundY || 380) + 5;
    if (this.textures.exists('l8_bg')) {
      const src  = this.textures.get('l8_bg').getSourceImage();
      const srcH = src.naturalHeight || src.height || 700;
      const scale = bgDisplayH / srcH;
      this._bgTile = this.add.tileSprite(0, 0, W, bgDisplayH, 'l8_bg')
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

  // ── Ground — identical to Level 6: single surface image at groundY-65 ──────
  buildGround(worldW, groundY) {
    this._worldW = worldW; this._groundY = groundY;
    // invisible physics floor across the whole world
    const body = this.add.rectangle(worldW / 2, groundY + 20, worldW, 40, 0, 0).setDepth(-9);
    this.physics.add.existing(body, true);
    this._ground = body;
    // surface image (screen-locked tileSprite, scrolls 1:1 with camera)
    const surfaceY = groundY - 65;
    const surfaceH = H - surfaceY;
    if (this.textures.exists('l8_surface')) {
      const src  = this.textures.get('l8_surface').getSourceImage();
      const srcH = src.naturalHeight || src.height || 380;
      const scale = surfaceH / srcH;
      this._surfTile = this.add.tileSprite(0, surfaceY, W, surfaceH, 'l8_surface')
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-8);
      this._surfTile.setTileScale(scale, scale);
    } else {
      const fg = this.add.graphics().setDepth(-8).setScrollFactor(0);
      fg.fillStyle(0x70B030, 1); fg.fillRect(0, surfaceY, W, surfaceH);
    }
    return body;
  }

  // ── Gleeda character (Glenda): JUMP + SLIDE ───────────────────────────────────
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

  _startSlide() {
    if (this._sliding) return;
    this._sliding = true;
    const s = this.player.scaleX;
    this.player.body.setSize(this._slideBodyW / s, this._slideBodyH / s, true);
    this._slideTimer = this.time.delayedCall(620, () => {
      this._sliding = false;
      if (this.player?.body) {
        const s2 = this.player.scaleX;
        this.player.body.setSize(this._normalBodyW / s2, this._normalBodyH / s2, true);
      }
    });
  }

  // Player-controlled movement (Level 5/6 style: manual left/right, no auto-run).
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
    const jump  = this.cursors.up.isDown   || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;
    const slide = this.cursors.down.isDown || this.keys.S.isDown || ts.slide;
    if (jump && onG && !this._sliding) { p.setVelocityY(this._jumpV); ts.jump = false; }
    if (slide && onG && !this._sliding) this._startSlide();
    if (!onG)              this._setPose('jump');
    else if (this._sliding) this._setPose('slide');
    else if (velX !== 0)   this._setPose('walk');
    else                   this._setPose('idle');
    return onG;
  }

  // ── HUD: banner + hearts + score + progress ─────────────────────────────────
  buildTopBanner(stageNum, title, subtitle) {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x6a3fa0, 0.92); bg.fillRoundedRect(W / 2 - 240, 6, 480, 42, 12);
    bg.lineStyle(2, 0xffd23a, 0.85); bg.strokeRoundedRect(W / 2 - 240, 6, 480, 42, 12);
    this.add.text(W / 2, 17, `STAGE ${stageNum}`, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ffe08a', stroke: '#3a1a5a', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.add.text(W / 2, 34, title, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    if (subtitle) this.add.text(W / 2, 56, subtitle, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#3a1a5a', strokeThickness: 2,
      backgroundColor: '#6a3fa0aa', padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);

    // pause
    const pb = this.add.text(W - 22, 24, '⏸', { fontSize: '22px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.togglePause());
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  buildHearts() {
    // HP hearts panel
    const lp = this.add.graphics().setScrollFactor(0).setDepth(60);
    lp.fillStyle(0xffffff, 0.55); lp.fillRoundedRect(6, 6, 96, 32, 9);
    lp.lineStyle(1.5, 0xff9ab0, 0.8); lp.strokeRoundedRect(6, 6, 96, 32, 9);
    this._lives = this.registry.get('lives') ?? 3;
    this._hp    = this.registry.get('l8_hp')   ?? 3;
    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(24 + i * 28, 22, 'l8_heart').setScale(0.6).setScrollFactor(0).setDepth(61);
      h.setAlpha(i < this._hp ? 1 : 0.25);
      this._hearts.push(h);
    }
    // Lives counter below hearts
    const lv = this.add.graphics().setScrollFactor(0).setDepth(60);
    lv.fillStyle(0xffffff, 0.55); lv.fillRoundedRect(6, 42, 96, 20, 7);
    lv.lineStyle(1.5, 0xff9ab0, 0.8); lv.strokeRoundedRect(6, 42, 96, 20, 7);
    this._livesTxt = this.add.text(54, 52, `❤ LIVES: ${this._lives}`, {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#c0294a', stroke: '#fff', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
  }

  _refreshHeartsHUD() {
    for (let i = 0; i < 3; i++) {
      if (this._hearts[i]) this._hearts[i].setAlpha(i < this._hp ? 1 : 0.25).setScale(0.6);
    }
    if (this._livesTxt) this._livesTxt.setText(`❤ LIVES: ${this._lives}`);
  }

  // Score badge under the right side (used by runner stages)
  buildScore() {
    this._score = this.registry.get('l8_score') ?? 0;
    this._scoreTxt = this.add.text(W - 60, 58, `SCORE ${this._score}`, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
  }

  addScore(n) {
    if (this._score == null) this._score = this.registry.get('l8_score') ?? 0;
    this._score += n;
    this.registry.set('l8_score', this._score);
    if (this._scoreTxt) {
      this._scoreTxt.setText(`SCORE ${this._score}`);
      this.tweens.add({ targets: this._scoreTxt, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    }
  }

  // Counter pill, e.g. "🧺 FOOD COLLECTED  3/8". Returns an updater(n).
  buildCounterPill(icon, label, total) {
    const x = W - 150, y = 22, pw = 140;
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
    const g = this.add.graphics().setScrollFactor(0).setDepth(101);
    g.fillStyle(0xfff6e8, 0.99); g.fillRoundedRect(px, py, pw, ph, 18);
    g.lineStyle(3, 0x6a3fa0, 0.95); g.strokeRoundedRect(px, py, pw, ph, 18);
    g.fillStyle(0x6a3fa0, 1); g.fillRoundedRect(px, py, pw, 40, 18); g.fillRect(px, py + 24, pw, 16);
    td.push(g);
    td.push(this.add.text(W / 2, py + 20, title, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    if (sub) td.push(this.add.text(W / 2, py + 58, sub, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#7a5a3a', align: 'center'
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
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#7a5a3a', align: 'center', lineSpacing: 4
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
    const meta = ACTIVITY_META[key];
    if (!meta) { console.warn(`[L8] unknown activity "${key}"`); onDone?.(); return; }

    const play = () => {
      const { td, close, px, py, pw, ph } = this.openPanel(
        `${meta.emoji}  ${meta.title}`, '', { w: opts.w ?? meta.w ?? 460, h: opts.h ?? meta.h ?? 320 }
      );
      // content area inside the panel (below the 40px header)
      const ax = px + 20, ay = py + 56, aw = pw - 40, ah = ph - 76;
      const D = 103;   // panel is 100–102; activity content sits above it

      let finished = false;
      const succeed = () => {
        if (finished) return; finished = true;
        this.sparkleBurst(W / 2, H / 2, 16, false);
        this.addScore?.(meta.score || 100);
        close(true);
        onDone?.();
      };

      // optional paid skip (mirrors old levels' Skip button)
      const skipCost = opts.skipCost ?? 5;
      if (opts.skip !== false) {
        const pts = this.registry.get('points') || 0;
        if (pts >= skipCost) {
          this.panelButton(td, px + pw - 70, py + 20, `Skip -${skipCost}⭐`, 0xe06a6a, () => {
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
  loseLife(onRespawn) {
    if (this._invuln || this._done) return;
    this._invuln = true;
    this._hp--;
    this.registry.set('l8_hp', this._hp);
    // fade this heart out
    const lost = this._hearts?.[this._hp];
    if (lost) this.tweens.add({ targets: lost, alpha: 0.25, scale: { from: 0.9, to: 0.6 }, duration: 300 });
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
    if (this._hp <= 0) {
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
          this.cameras.main.fadeOut(450, 0, 0, 0);
          this.time.delayedCall(480, () => this.scene.start('Menu'));
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
    if (this.physics?.world) this.physics.resume();
    // restore hearts HUD
    this._refreshHeartsHUD();
    // teleport to checkpoint
    const cpX = this.registry.get('l8_checkpointX') ?? 80;
    const cpY = this.registry.get('l8_checkpointY') ?? (this._groundY ?? 380);
    if (this.player) {
      this.player.clearTint();
      this.player.setAlpha(1);
      this.player.setPosition(cpX, cpY - 50);
      this.player.setVelocity(0, 0);
    }
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.toast('💪 Continue! Use A/D to move'));
  }

  // ── Scene transition (freeze-proof) ─────────────────────────────────────────
  goToScene(nextScene, data = {}, fadeMs = 600) {
    this._busy = true;
    this.registry.set('lives', this._lives ?? 3);
    this.registry.set('l8_checkpoint', nextScene);
    this.cameras.main.fadeOut(fadeMs, 0, 0, 0);
    this.time.delayedCall(fadeMs + 30, () => {
      this._wakeLoop();
      this.scene.start(nextScene, data);
    });
  }

  _wakeLoop() {
    try {
      const l = this.game.loop;
      if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
    } catch (_) {}
  }

  // ── Pause menu ──────────────────────────────────────────────────────────────
  togglePause() {
    if (this._busy && !this._paused) return;
    if (this._paused) { this._pauseObjs?.forEach(o => o.destroy()); this._pauseObjs = null; this._paused = false; if (this.physics?.world) this.physics.resume(); this.tweens.resumeAll(); return; }
    this._paused = true; if (this.physics?.world) this.physics.pause(); this.tweens.pauseAll();
    const objs = [];
    objs.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(120).setInteractive());
    const g = this.add.graphics().setScrollFactor(0).setDepth(121);
    g.fillStyle(0xfff6e8, 0.99); g.fillRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 16);
    g.lineStyle(3, 0x6a3fa0, 0.95); g.strokeRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 16);
    objs.push(g);
    objs.push(this.add.text(W / 2, H / 2 - 82, '⏸  Paused', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(122));
    const mk = (y, label, color, cb) => {
      const bx = W / 2 - 100, bw = 200, bh = 40;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(122);
      bg.fillStyle(color, 1); bg.fillRoundedRect(bx, y, bw, bh, 11); bg.lineStyle(2, 0xffffff, 0.6); bg.strokeRoundedRect(bx, y, bw, bh, 11);
      objs.push(bg);
      const t = this.add.text(W / 2, y + bh / 2, label, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
      objs.push(t);
      const hit = this.add.rectangle(W / 2, y + bh / 2, bw, bh, 0, 0).setScrollFactor(0).setDepth(124).setInteractive({ useHandCursor: true });
      objs.push(hit); hit.on('pointerup', cb);
    };
    mk(H / 2 - 56, '▶  Resume', 0x6ad06a, () => this.togglePause());
    mk(H / 2 - 8,  '↺  Restart', 0xf0a93a, () => { this._pauseObjs?.forEach(o => o.destroy()); this._paused = false; this.tweens.resumeAll(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); });
    mk(H / 2 + 40, '✕  Exit to Menu', 0xe06a6a, () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => this.scene.start('Menu')); });
    this._pauseObjs = objs;
  }
}

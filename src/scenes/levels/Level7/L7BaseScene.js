import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// L7BaseScene — shared scaffolding for every Level 7 stage:
//   weather (rain / fog / lightning), HUD (stage banner + objective checklist +
//   lives), Glenda side-scroller controls, mini-game panel framework, pause
//   menu, and stage completion. Stages extend this and add their own gameplay.
// ════════════════════════════════════════════════════════════════════════════
export class L7BaseScene extends Phaser.Scene {

  // ── Weather ───────────────────────────────────────────────────────────────
  buildRain(intensity = 120, tint = 0xa0c8ff) {
    this._rain = [];
    for (let i = 0; i < intensity; i++) {
      const len = Phaser.Math.Between(8, 20);
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-H, H), 1, len, tint,
        Phaser.Math.FloatBetween(0.12, 0.4)
      ).setScrollFactor(0).setDepth(80).setOrigin(0.5, 0);
      this._rain.push({ obj: drop, speed: Phaser.Math.FloatBetween(7, 15) });
    }
    this._rainOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x0e1626, 0.20)
      .setScrollFactor(0).setDepth(79);
  }

  updateRain() {
    if (!this._rain) return;
    for (const d of this._rain) {
      d.obj.y += d.speed; d.obj.x += d.speed * 0.2;
      if (d.obj.y > H + 20) { d.obj.y = Phaser.Math.Between(-30, -5); d.obj.x = Phaser.Math.Between(0, W); }
      if (d.obj.x > W + 10) d.obj.x = Phaser.Math.Between(-10, 0);
    }
  }

  buildFog(depth = 18, alpha = 0.5) {
    this._fog = this.add.tileSprite(W / 2, H - 60, W, 130, 'l7_fog')
      .setScrollFactor(0).setDepth(depth).setAlpha(alpha);
    this._fog2 = this.add.tileSprite(W / 2, 120, W, 110, 'l7_fog')
      .setScrollFactor(0).setDepth(depth).setAlpha(alpha * 0.6);
  }

  updateFog() {
    if (this._fog)  this._fog.tilePositionX  += 0.25;
    if (this._fog2) this._fog2.tilePositionX -= 0.15;
  }

  startLightning() {
    const flash = () => {
      if (!this.scene.isActive()) return;
      // subtle blue-white sheet BEHIND the HUD (depth 50 < HUD 60) so it
      // briefly lights the scene without washing out the interface.
      const f = this.add.rectangle(W / 2, H / 2, W, H, 0xbcd0f0, 0).setScrollFactor(0).setDepth(50);
      this.tweens.add({
        targets: f, alpha: { from: 0, to: 0.28 }, duration: 110, yoyo: true,
        onComplete: () => f.destroy()
      });
      this.time.delayedCall(Phaser.Math.Between(6000, 13000), flash);
    };
    this.time.delayedCall(Phaser.Math.Between(3500, 7000), flash);
  }

  // ── HUD: stage banner + lives + objective checklist ─────────────────────────
  buildStageHUD(stageNum, stageName, objectives) {
    // Top banner
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x0a0f1a, 0.78); bg.fillRoundedRect(W / 2 - 230, 6, 460, 40, 9);
    bg.lineStyle(1.5, 0xf0a830, 0.6); bg.strokeRoundedRect(W / 2 - 230, 6, 460, 40, 9);
    this.add.text(W / 2, 16, `STAGE ${stageNum}`, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f0a830', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.add.text(W / 2, 33, stageName, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fde8c0', stroke: '#1a0e02', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);

    // Lives (top-left)
    const lp = this.add.graphics().setScrollFactor(0).setDepth(60);
    lp.fillStyle(0x1a0904, 0.72); lp.fillRoundedRect(4, 4, 92, 30, 7);
    lp.lineStyle(1, 0x5a3010, 0.6); lp.strokeRoundedRect(4, 4, 92, 30, 7);
    this._lives = this.registry.get('lives') ?? 3;
    this._hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(16 + i * 28, 19, '❤️', { fontSize: '16px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(61);
      if (i >= this._lives) h.setAlpha(0.25);
      this._hearts.push(h);
    }

    // Objective checklist (top-left, below lives)
    this._objectives = objectives.map(o => ({ label: o, done: false }));
    this._objPanel = this.add.graphics().setScrollFactor(0).setDepth(60);
    this._objTexts = [];
    const panelH = 22 + objectives.length * 18;
    this._objPanel.fillStyle(0x0a0f1a, 0.7); this._objPanel.fillRoundedRect(4, 40, 230, panelH, 8);
    this._objPanel.lineStyle(1, 0x3a5070, 0.6); this._objPanel.strokeRoundedRect(4, 40, 230, panelH, 8);
    this.add.text(14, 48, '🎯 OBJECTIVES', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7fb0e0'
    }).setScrollFactor(0).setDepth(61);
    this._objectives.forEach((o, i) => {
      const t = this.add.text(16, 66 + i * 18, `○ ${o.label}`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#cdd8e6'
      }).setScrollFactor(0).setDepth(61);
      this._objTexts.push(t);
    });

    // Pause button (top-right)
    const pb = this.add.text(W - 22, 22, '⏸', { fontSize: '22px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.togglePause());
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  completeObjective(idx) {
    const o = this._objectives?.[idx];
    if (!o || o.done) return;
    o.done = true;
    this._objTexts[idx].setText(`✓ ${o.label}`).setColor('#7dffa0');
    this.tweens.add({ targets: this._objTexts[idx], scale: { from: 1.25, to: 1 }, duration: 300, ease: 'Back.easeOut' });
  }

  allObjectivesDone() { return this._objectives?.every(o => o.done); }

  // ── Glenda side-scroller player ─────────────────────────────────────────────
  buildPlayer(x, groundY) {
    if (!this.anims.exists('gleeda_walk')) {
      this.anims.create({ key: 'gleeda_walk',      frames: [{ key: 'gleeda_run1' }], frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'gleeda_idle_anim', frames: [{ key: 'gleeda_idle' }], frameRate: 1, repeat: -1 });
      this.anims.create({ key: 'gleeda_jump_anim', frames: [{ key: 'gleeda_jump' }], frameRate: 1, repeat: -1 });
    }
    this.player = this.physics.add.sprite(x, groundY - 40, 'gleeda_idle').setDepth(20);
    this.player.setScale(0.18);
    this.player.body.setSize(73, 56, true);
    this.player.setCollideWorldBounds(true);
    this.player.play('gleeda_idle_anim');
    this._facing = 1;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE,E');
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'flex';
    this.events.once('shutdown', () => { const f = document.getElementById('game-footer'); if (f) f.style.display = 'none'; });
    return this.player;
  }

  runMovement(speed = 210, jumpV = -440) {
    if (this._paused || this._busy || !this.player) return false;
    const ts = window._touchState || {};
    const p = this.player, onG = p.body.blocked.down || p.body.touching.down;
    const left  = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
    const jump  = this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown || ts.jump;
    let vx = 0;
    if (left)  { vx = -speed; this._facing = -1; }
    if (right) { vx =  speed; this._facing =  1; }
    p.setVelocityX(vx);
    p.setFlipX(this._facing < 0);
    if (jump && onG) { p.setVelocityY(jumpV); ts.jump = false; }
    if (!onG)      p.play('gleeda_jump_anim', true);
    else if (vx)   p.play('gleeda_walk', true);
    else           p.play('gleeda_idle_anim', true);
    return right && onG;
  }

  // ── Generic mini-game / dialog panel framework ──────────────────────────────
  // returns { td:[], close(resume), addButton(...) }; pauses physics while open
  openPanel(title, sub, opts = {}) {
    this._busy = true;
    if (this.physics?.world) this.physics.pause();
    const pw = opts.w || 600, ph = opts.h || 320;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    const td = [];
    td.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.74).setScrollFactor(0).setDepth(100).setInteractive());
    const g = this.add.graphics().setScrollFactor(0).setDepth(101);
    g.fillStyle(0x10141e, 0.98); g.fillRoundedRect(px, py, pw, ph, 16);
    g.lineStyle(2.5, 0xf0a830, 0.9); g.strokeRoundedRect(px, py, pw, ph, 16);
    td.push(g);
    td.push(this.add.text(W / 2, py + 26, title, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f0c860', stroke: '#1a0e02', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    if (sub) td.push(this.add.text(W / 2, py + 52, sub, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#b8c4d4', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    const close = (resume = true) => {
      td.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch (_) {} });
      if (resume) { this._busy = false; if (this.physics?.world) this.physics.resume(); }
    };
    return { td, close, px, py, pw, ph };
  }

  // Reusable styled button inside a panel; returns the hit zone
  panelButton(td, cx, cy, label, color, cb, w = 150, h = 40, depth = 103) {
    const bx = cx - w / 2, by = cy - h / 2;
    const g = this.add.graphics().setScrollFactor(0).setDepth(depth);
    const draw = (hov) => {
      g.clear();
      g.fillStyle(hov ? 0x2e3a4e : 0x1c2436, 0.96); g.fillRoundedRect(bx, by, w, h, 9);
      g.lineStyle(2, hov ? color : 0x5a6a82, 1); g.strokeRoundedRect(bx, by, w, h, 9);
    };
    draw(false); td.push(g);
    const t = this.add.text(cx, cy, label, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: Phaser.Display.Color.IntegerToColor(color).rgba
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    // color text reliably
    t.setColor('#' + color.toString(16).padStart(6, '0'));
    td.push(t);
    const hit = this.add.rectangle(cx, cy, w, h, 0, 0).setScrollFactor(0).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    td.push(hit);
    hit.on('pointerover', () => { draw(true); t.setColor('#ffffff'); });
    hit.on('pointerout',  () => { draw(false); t.setColor('#' + color.toString(16).padStart(6, '0')); });
    hit.on('pointerup',   () => cb());
    return hit;
  }

  // Intro card before a mini-activity (Play / Skip)
  activityIntro(emoji, title, desc, onPlay) {
    const { td, close, py, ph } = this.openPanel(title, '', { w: 340, h: 240 });
    td.push(this.add.text(W / 2, py + 70, emoji, { fontSize: '40px' }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    td.push(this.add.text(W / 2, py + 122, desc, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8b890', align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 38, '▶  Play', 0x7dff88, () => { close(true); onPlay(); }, 150, 42);
  }

  // ── Toast / message ─────────────────────────────────────────────────────────
  toast(msg, ms = 2200) {
    if (this._toastObj) { try { this._toastObj.destroy(); } catch (_) {} }
    const t = this.add.text(W / 2, H - 64, msg, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff',
      stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 12, y: 6 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0);
    this._toastObj = t;
    this.tweens.add({ targets: t, alpha: 1, y: H - 70, duration: 220 });
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 350, onComplete: () => { try { t.destroy(); } catch (_) {} } });
  }

  banner(msg, color = '#7dffa0') {
    const b = this.add.text(W / 2, H / 2 - 70, msg, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color, stroke: '#0a1a08', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95);
    this.tweens.add({ targets: b, y: b.y - 30, alpha: 0, delay: 600, duration: 800, onComplete: () => b.destroy() });
  }

  sparkleBurst(x, y, n = 12, scroll = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 30;
      const s = this.add.image(x, y, 'l7_spark').setScale(0.7).setDepth(96);
      if (!scroll) s.setScrollFactor(0);
      s.setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 1.3, duration: 650, onComplete: () => s.destroy() });
    }
  }

  // ── Lives / damage ──────────────────────────────────────────────────────────
  loseLife(onRespawn) {
    this._lives--;
    this.registry.set('lives', this._lives);
    const lost = this._hearts[this._lives];
    if (lost) this.tweens.add({ targets: lost, alpha: 0.25, scale: { from: 1.4, to: 1 }, duration: 300 });
    this.cameras.main.shake(360, 0.014);
    if (this._lives <= 0) {
      this._busy = true;
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(110);
      this.add.text(W / 2, H / 2 - 10, '💔 Out of lives — try again', {
        fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
      this.time.delayedCall(1700, () => {
        this.registry.set('lives', 3);
        this.cameras.main.fadeOut(450, 0, 0, 0);
        this.time.delayedCall(480, () => this.scene.restart());
      });
    } else {
      this.toast(`💔 Life lost — ${this._lives} left`);
      if (onRespawn) this.time.delayedCall(700, onRespawn);
    }
  }

  // ── Stage completion ────────────────────────────────────────────────────────
  completeStage(nextScene, message, nextData = {}) {
    this._busy = true;
    if (this.physics?.world) this.physics.pause();
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', nextScene);
    this.sparkleBurst(W / 2, H / 2, 22, false);
    const { td, py, ph } = this.openPanel('✅ ' + message, '', { w: 460, h: 220 });
    td.push(this.add.text(W / 2, py + 96, 'Checkpoint saved!', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#9fe0b0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    this.panelButton(td, W / 2, py + ph - 40, '▶  Continue the Journey', 0xf0c860, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(640, () => this.scene.start(nextScene, nextData));
    }, 280, 44);
  }

  // ── Pause menu ──────────────────────────────────────────────────────────────
  togglePause() {
    if (this._busy && !this._paused) return;
    if (this._paused) { this._pauseObjs?.forEach(o => o.destroy()); this._pauseObjs = null; this._paused = false; if (this.physics?.world) this.physics.resume(); this.tweens.resumeAll(); return; }
    this._paused = true; if (this.physics?.world) this.physics.pause(); this.tweens.pauseAll();
    const objs = [];
    objs.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(120).setInteractive());
    const g = this.add.graphics().setScrollFactor(0).setDepth(121);
    g.fillStyle(0x10141e, 0.98); g.fillRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 14);
    g.lineStyle(2.5, 0xf0a830, 0.9); g.strokeRoundedRect(W / 2 - 130, H / 2 - 110, 260, 220, 14);
    objs.push(g);
    objs.push(this.add.text(W / 2, H / 2 - 84, '⏸  Paused', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setScrollFactor(0).setDepth(122));
    const mk = (y, label, color, cb) => {
      const bx = W / 2 - 100, by = y, bw = 200, bh = 40;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(122);
      bg.fillStyle(0x1c2436, 0.96); bg.fillRoundedRect(bx, by, bw, bh, 9); bg.lineStyle(2, color, 1); bg.strokeRoundedRect(bx, by, bw, bh, 9);
      objs.push(bg);
      const t = this.add.text(W / 2, by + bh / 2, label, { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#' + color.toString(16).padStart(6, '0') }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
      objs.push(t);
      const hit = this.add.rectangle(W / 2, by + bh / 2, bw, bh, 0, 0).setScrollFactor(0).setDepth(124).setInteractive({ useHandCursor: true });
      objs.push(hit); hit.on('pointerup', cb);
    };
    mk(H / 2 - 56, '▶  Resume', 0x7dff88, () => this.togglePause());
    mk(H / 2 - 8,  '↺  Restart', 0xf0c860, () => { this._pauseObjs?.forEach(o => o.destroy()); this._paused = false; this.tweens.resumeAll(); this.cameras.main.fadeOut(350, 0, 0, 0); this.time.delayedCall(380, () => this.scene.restart()); });
    mk(H / 2 + 40, '✕  Exit to Menu', 0xff7070, () => { this.tweens.resumeAll(); this.cameras.main.fadeOut(450, 0, 0, 0); this.time.delayedCall(480, () => this.scene.start('Menu')); });
    this._pauseObjs = objs;
  }
}

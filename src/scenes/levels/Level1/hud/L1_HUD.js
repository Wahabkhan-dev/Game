import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateHudTextures, THEME } from './L1_HudTheme.js';
import { L1Header } from './L1_Header.js';
import { L1Footer } from './L1_Footer.js';

// ════════════════════════════════════════════════════════════════════════════
// L1HUD — HUD MANAGER for Level 1's premium fantasy interface.
//
// Orchestrates the Header + Footer components and — crucially — re-creates every
// piece of state the shared BaseLevelScene logic reads/writes, using the SAME
// field names, so ALL existing gameplay code keeps working untouched:
//   _lives · _hearts[] · _shadowHP · _hpGraphics · _points · _pointsTxt
//   _timerFull/_timerLeft/_timerFired/_timerTxt (+ countdown) · _progressBar/_progressMax
//   _pauseMenuOpen · _escKey
//
// This class is instantiated ONLY from Level1Scene._buildHUD(), so no other level
// or shared file is affected.
// ════════════════════════════════════════════════════════════════════════════

export class L1HUD {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
  }

  build() {
    const s = this.scene, cfg = this.config;
    generateHudTextures(s);

    // ── restore persisted stats (same defaults the base HUD used) ─────────────
    const sl = s.registry.get('lives');    s._lives    = (sl != null) ? sl : 3;
    const sh = s.registry.get('shadowHP'); s._shadowHP = (sh != null) ? sh : 3;
    s._points = s.registry.get('points') || 0;

    // ── header (health panel · title banner · timer · menu) ───────────────────
    this.header = new L1Header(s, cfg, () => s._openPauseMenu()).build();
    s._hearts     = this.header.hearts;
    s._hpGraphics = this.header.hpGraphics;
    s._pointsTxt  = this.header.pointsTxt;

    // ── footer (control buttons; progress bar built later via delegate) ───────
    this.footer = new L1Footer(s).build();

    // ── base-compatible (invisible) progress bar — updateMovement writes .width
    s._progressBar = s.add.rectangle(W / 2 - 100, H - 12, 0, 8, 0xf5c87a, 1)
      .setScrollFactor(0).setDepth(1).setAlpha(0);
    s._progressMax = cfg.worldWidth || 2000;

    // initial HP bars
    if (s._drawHPPips) s._drawHPPips();

    // ── timer (replicates the base countdown, drives header.timerTxt) ─────────
    if (cfg.timer) {
      s._timerFull  = cfg.timer;
      s._timerLeft  = cfg.timer;
      s._timerFired = false;
      s._timerTxt   = this.header.timerTxt;
      this._timerEvt = s.time.addEvent({ delay: 1000, loop: true, callback: () => this._tick() });
    }

    // ── pause menu wiring (menu button + Esc), matching the base behaviour ────
    s._pauseMenuOpen = false;
    s._escKey = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    s._escKey.on('down', () => {
      if (s._pauseMenuOpen && s._pauseResumeFn) s._pauseResumeFn();
      else if (!s._pauseMenuOpen) s._openPauseMenu();
    });

    return this;
  }

  _tick() {
    const s = this.scene;
    if (s._levelDone || s._isDying || s._puzzleActive || s._pauseMenuOpen) return;
    s._timerLeft = Math.max(0, s._timerLeft - 1);
    if (s._timerTxt) {
      s._timerTxt.setText(`🕒 ${s._timerLeft}s`);
      s._timerTxt.setColor(s._timerLeft <= 10 ? '#ff5a3a' : THEME.goldTxt);
    }
    if (s._timerLeft <= 0 && !s._timerFired) {
      // Ran out mid-mini-game → close the overlay first (no reward, no bridge)
      if (s._miniGameOpen && s._miniGameClose) s._miniGameClose();
      s._timerFired = true;
      s._isDying = true;
      s._showMessage("⏱ Time's up! -1 Life! 💀");
      s.cameras.main.shake(300, 0.012);
      s.time.delayedCall(800, () => {
        s._timerFired = false;
        s._timerLeft  = s._timerFull;
        if (s._timerTxt) { s._timerTxt.setText(`🕒 ${s._timerFull}s`); s._timerTxt.setColor(THEME.goldTxt); }
        s._loseLife(0.012);
      });
    }
  }

  // ── delegates used by Level1Scene overrides ───────────────────────────────────
  drawHP(hp)          { this.header?.drawHP(hp); }
  buildProgressBar(w) { this.footer?.buildProgressBar(w); }
  setAttackVisible(v) { this.footer?.setAttackVisible(v); }
}

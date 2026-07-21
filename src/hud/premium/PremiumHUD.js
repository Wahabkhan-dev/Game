import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';
import { generatePremiumHudTextures, THEME } from './PremiumTheme.js';
import { PremiumHeader } from './PremiumHeader.js';
import { PremiumFooter } from './PremiumFooter.js';

// ════════════════════════════════════════════════════════════════════════════
// PremiumHUD — SHARED premium HUD manager (copied from Level 1's L1_HUD,
// generalized). Orchestrates PremiumHeader + PremiumFooter and re-creates every
// field the shared BaseLevelScene gameplay logic reads/writes — using the SAME
// field names — so existing gameplay code keeps working untouched:
//   _lives · _hearts[] · _shadowHP · _hpGraphics · _points · _pointsTxt
//   _timerFull/_timerLeft/_timerFired/_timerTxt (+ countdown) · _progressBar/_progressMax
//   _pauseMenuOpen · _escKey
//
// Any BaseLevelScene-derived level can override _buildHUD() to instantiate this
// (see Level 2). cfg: { chapterLabel, title, timer, worldWidth, zones, runnerEmoji }.
// ════════════════════════════════════════════════════════════════════════════

export class PremiumHUD {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
  }

  build() {
    const s = this.scene, cfg = this.cfg;
    generatePremiumHudTextures(s);

    const sl = s.registry.get('lives');    s._lives    = (sl != null) ? sl : 3;
    const sh = s.registry.get('shadowHP'); s._shadowHP = (sh != null) ? sh : 3;
    s._points = s.registry.get('points') || 0;

    // ── header (health · title · timer · coin · menu) ─────────────────────────
    this.header = new PremiumHeader(s, cfg, () => s._openPauseMenu()).build();
    s._hearts     = this.header.hearts;
    s._hpGraphics = this.header.hpGraphics;
    s._pointsTxt  = this.header.pointsTxt;

    // ── footer (premium checkpoint bar + optional attack button) ──────────────
    this.footer = new PremiumFooter(s, {
      worldWidth: cfg.worldWidth,
      zones: cfg.zones || [],
      runnerEmoji: cfg.runnerEmoji,
    }).build();

    // ── base-compatible (invisible) progress bar — updateMovement writes .width
    s._progressBar = s.add.rectangle(W / 2 - 100, H - 12, 0, 8, 0xf5c87a, 1)
      .setScrollFactor(0).setDepth(1).setAlpha(0);
    s._progressMax = cfg.worldWidth || 2000;

    if (s._drawHPPips) s._drawHPPips();

    // ── timer (replicates the base countdown, drives header.timerTxt) ─────────
    if (cfg.timer) {
      s._timerFull  = cfg.timer;
      s._timerLeft  = cfg.timer;
      s._timerFired = false;
      s._timerTxt   = this.header.timerTxt;
      this._timerEvt = s.time.addEvent({ delay: 1000, loop: true, callback: () => this._tick() });
    }

    // ── pause menu wiring (menu button + Esc), matching base behaviour ────────
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
      s._timerTxt.setText(`${s._timerLeft}s`);
      s._timerTxt.setColor(s._timerLeft <= 10 ? '#ff5a3a' : THEME.goldTxt);
    }
    if (s._timerLeft <= 0 && !s._timerFired) {
      s._timerFired = true;
      s._isDying = true;
      s._showMessage("⏱ Time's up! -1 Life! 💀");
      s.cameras.main.shake(300, 0.012);
      s.time.delayedCall(800, () => {
        s._timerFired = false;
        s._timerLeft  = s._timerFull;
        if (s._timerTxt) { s._timerTxt.setText(`${s._timerFull}s`); s._timerTxt.setColor(THEME.goldTxt); }
        s._loseLife(0.012);
      });
    }
  }

  // ── delegates used by scene overrides ─────────────────────────────────────────
  drawHP(hp)         { this.header?.drawHP(hp); }
  updateFooter(x)    { this.footer?.update(x); }
  setAttackVisible(v){ this.footer?.setAttackVisible(v); }
  resetTimer(seconds) {
    const s = this.scene;
    s._timerFull = seconds; s._timerLeft = seconds; s._timerFired = false;
    if (s._timerTxt) { s._timerTxt.setText(`${seconds}s`); s._timerTxt.setColor(THEME.goldTxt); }
  }
  givePoints(n) {
    const s = this.scene;
    s._points = (s._points || 0) + n;
    s.registry.set('points', s._points);
    if (s._pointsTxt) s._pointsTxt.setText(`${s._points}`);
  }
  spendPoints(n) {
    const s = this.scene;
    s._points = Math.max(0, (s._points || 0) - n);
    s.registry.set('points', s._points);
    if (s._pointsTxt) s._pointsTxt.setText(`${s._points}`);
  }
}

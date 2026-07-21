// ════════════════════════════════════════════════════════════════════════════
// TimerHud — piece 3: timer countdown. Literal extraction of
// BaseLevelScene's timer tick logic (decrement every second, red at
// ≤redThreshold, one-shot onExpire) but driven by an injected isPaused()
// predicate instead of hardcoded field reads (_levelDone/_isDying/etc) — so any
// scene type (BaseLevelScene-derived OR plain Phaser.Scene) can use it.
// ════════════════════════════════════════════════════════════════════════════
import { W } from '../config/GameConfig.js';
import { SEMANTIC } from './HudTheme.js';

export class TimerController {
  constructor(scene, theme, cfg = {}) {
    const {
      seconds, x = W / 2, y = 44, depth = 50, label = '⏱',
      isPaused = () => false,
      onExpire = () => {},
      redThreshold = 10,
    } = cfg;

    this.scene = scene;
    this.theme = theme;
    this.label = label;
    this.isPaused = isPaused;
    this.onExpire = onExpire;
    this.redThreshold = redThreshold;
    this.full = seconds;
    this.leftSec = seconds;
    this.fired = false;

    this.txt = scene.add.text(x, y, `${label} ${seconds}s`, {
      fontSize: '14px', fontFamily: theme.font,
      color: theme.textColor, stroke: theme.textStroke, strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth);

    this._event = null;
  }

  start() {
    if (this._event) return;
    this._event = this.scene.time.addEvent({
      delay: 1000, loop: true,
      callback: () => this._tick(),
    });
  }

  _tick() {
    if (this.isPaused()) return;
    this.leftSec = Math.max(0, this.leftSec - 1);
    this.txt.setText(`${this.label} ${this.leftSec}s`);
    this.txt.setColor(this.leftSec <= this.redThreshold ? SEMANTIC.dangerTxt : this.theme.textColor);
    if (this.leftSec <= 0 && !this.fired) {
      this.fired = true;
      this.scene.time.delayedCall(800, () => {
        this.fired = false;
        this.reset(this.full);
        this.onExpire();
      });
    }
  }

  reset(seconds) {
    this.full = seconds;
    this.leftSec = seconds;
    this.fired = false;
    if (this.txt) {
      this.txt.setText(`${this.label} ${seconds}s`);
      this.txt.setColor(this.theme.textColor);
    }
  }

  get left() { return this.leftSec; }

  destroy() {
    if (this._event) { this._event.remove(); this._event = null; }
    if (this.txt) { this.txt.destroy(); this.txt = null; }
  }
}

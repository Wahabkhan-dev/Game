import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
import { applyL3Frame } from './L3Modal.js';
import { launchRandomMiniGame } from '../../../../utils/MiniGamePicker.js';
import { playVideoOverlay } from '../../../../utils/VideoOverlay.js';

// MG5 — Treatment Steps: tap the treatment icons in order within 30 seconds
const STEP_ICONS  = ['💊', '💉', '❤️', '🩹'];
const STEP_LABELS = ['Medicine', 'Injection', 'Heartbeat', 'Stabilizer'];

export class L3_MG5_DeliveryScene extends Phaser.Scene {
  constructor() { super('L3_MG5'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    const l3Frame = applyL3Frame(this);

    this._done     = false;
    this._next     = 1;
    this._timeLeft = 30;
    this._health   = this.registry.get('l3_health') || 100;

    this._buildHUD(3);
    this._buildTitle('💊 Treatment Steps', 'Tap the steps in order:  💊 → 💉 → ❤️ → 🩹');

    // Random mini-game from Level 3's slice of the 40 games overlays on top —
    // no intro/ending screen. It must finish before the tap-order puzzle
    // below is reachable (the iframe overlay blocks pointer input on it
    // while open); on close it just steps aside into that real care step,
    // and the decorative gold frame goes with it — only the arcade activity gets it.
    launchRandomMiniGame(this, 3, () => { l3Frame?.setVisible(false); });

    // Gamma on table
    if (this.textures.exists('gemma_idle')) {
      this.add.image(W / 2, H - 48, 'gemma_idle').setDisplaySize(200, 110).setOrigin(0.5, 1).setDepth(8).setTint(0xffddcc);
    }

    // Timer countdown — neutralized immediately: the random mini-game overlay
    // above has no time limit, so this must never reach 0 and call _fail().
    // Left as a (stopped) TimerEvent object so _complete()'s .remove() stays safe.
    this._timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: () => {
        if (this._done) return;
        this._timeLeft = Math.max(0, this._timeLeft - 1);
        this._timerTxt.setText(`⏱ ${this._timeLeft}s`);
        if (this._timeLeft <= 10) this._timerTxt.setColor('#ff4466');
        if (this._timeLeft <= 0) this._fail();
      }
    });
    this._timerEvent.remove();

    // Progress arrow display
    this._buildArrows();

    // Number buttons — scatter them on screen
    const positions = [
      { x: 240, y: 200 }, { x: 560, y: 180 },
      { x: 200, y: 330 }, { x: 590, y: 320 },
    ];
    // Shuffle
    Phaser.Utils.Array.Shuffle(positions);
    this._numBtns = [];
    for (let n = 1; n <= 4; n++) {
      const pos = positions[n - 1];
      this._buildNumBtn(n, pos.x, pos.y);
    }

    this._timerTxt = this.add.text(W / 2, H - 28, '⏱ 30s', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(20);
  }

  _buildArrows() {
    // 1 → 2 → 3 → 4 flow display
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x060e1a, 0.88); g.fillRoundedRect(W / 2 - 140, 108, 280, 44, 6);
    g.lineStyle(1.5, 0x44aaff, 0.5); g.strokeRoundedRect(W / 2 - 140, 108, 280, 44, 6);

    this._stepDots = [];
    for (let i = 1; i <= 4; i++) {
      const dotX = W / 2 - 90 + (i - 1) * 60;
      const dot = this.add.circle(dotX, 130, 15, 0x1a3040, 1).setDepth(10).setStrokeStyle(2, 0x44aaff, 0.6);
      this.add.text(dotX, 130, STEP_ICONS[i - 1], { fontSize: '16px' }).setOrigin(0.5).setDepth(11);
      if (i < 4) this.add.text(dotX + 30, 130, '→', { fontSize: '12px', color: '#44aaff' }).setOrigin(0.5).setDepth(11);
      this._stepDots.push(dot);
    }
  }

  _buildNumBtn(n, x, y) {
    const btn = this.add.rectangle(x, y, 64, 64, 0x1a3a5a, 1).setDepth(12)
      .setStrokeStyle(3, 0x44aaff, 0.8).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y - 4, STEP_ICONS[n - 1], { fontSize: '30px' })
      .setOrigin(0.5).setDepth(13);
    // Label so the player knows each treatment step
    this.add.text(x, y + 40, STEP_LABELS[n - 1], {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#aaccee', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(13);

    // Pulsing glow on the NEXT expected button
    const glow = this.add.circle(x, y, 36, 0x44aaff, 0).setDepth(11);
    const updateGlow = () => {
      if (n === this._next) {
        this.tweens.add({ targets: glow, alpha: 0.22, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1, key: `glow${n}` });
      } else {
        this.tweens.killTweensOf(glow);
        glow.setAlpha(0).setScale(1);
      }
    };
    updateGlow();
    this._numBtns.push({ btn, txt, glow, n, updateGlow });

    btn.on('pointerover', () => { if (n === this._next) btn.setStrokeStyle(4, 0x88eeff, 1); });
    btn.on('pointerout',  () => btn.setStrokeStyle(3, 0x44aaff, 0.8));
    btn.on('pointerup',   () => this._onTap(n, btn, txt, glow, x, y));
  }

  _onTap(n, btn, txt, glow, x, y) {
    if (this._done) return;
    if (n === this._next) {
      // Correct
      this._next++;
      btn.setFillStyle(0x1a5a2a).setStrokeStyle(3, 0x44ff88, 1);
      txt.setColor('#88ffaa');
      this.tweens.killTweensOf(glow);
      glow.setAlpha(0);
      this._stepDots[n - 1]?.setFillStyle(0x44ff88, 1);
      this.cameras.main.flash(160, 20, 160, 40);

      // Spawn step-complete icon
      this._spawnStepIcon(n - 1);

      // Update glows
      this._numBtns.forEach(b => b.updateGlow());

      const ok = this.add.text(x, y - 48, `✅ ${n}!`, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: ok, y: ok.y - 28, alpha: 0, duration: 700, onComplete: () => ok.destroy() });

      if (this._next > 4) this._complete();
    } else {
      // Wrong order
      this.cameras.main.shake(200, 0.01);
      this.cameras.main.flash(200, 160, 0, 0);
      const err = this.add.text(x, y - 48, `❌ Wrong order!`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff4466', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: err, y: err.y - 22, alpha: 0, duration: 600, onComplete: () => err.destroy() });
      this._health = Math.max(0, this._health - 8);
      this.registry.set('l3_health', this._health);
    }
  }

  _spawnStepIcon(slot) {
    const icons = STEP_ICONS;
    const stepX = W / 2 - 90 + slot * 60;
    const icon = this.add.text(stepX, 155, icons[slot] || '✅', { fontSize: '20px' })
      .setOrigin(0.5).setDepth(16).setAlpha(0).setScale(0);
    this.tweens.add({ targets: icon, alpha: 1, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut' });
  }

  _fail() {
    if (this._done) return;
    this._done = true;
    this._timerEvent.remove();
    this.cameras.main.flash(400, 160, 0, 0);
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(50);
    this.add.text(W / 2, H / 2 - 20, '⏱ Time\'s up!\nTrying again...', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ff4466',
      stroke: '#000', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setDepth(51);
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.restart());
    });
  }

  _buildHUD(step) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 44, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 44, 6);
    this.add.text(W / 2, 14, `HOSPITAL TREATMENT  —  STEP ${step} of 4`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc'
    }).setOrigin(0.5).setDepth(21);
    for (let i = 0; i < 4; i++) {
      const dot = this.add.circle(W / 2 - 45 + i * 30, 34, 7, i < step ? 0x44aaff : 0x1a3040, 1).setDepth(21);
      dot.setStrokeStyle(1.5, 0x88aacc, 0.6);
    }
  }

  _buildTitle(main, sub) {
    this.add.text(W / 2, 64, main, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);
    this.add.text(W / 2, 88, sub, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#e8d0a8', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);
  }

  _complete() {
    if (this._done) return;
    this._done = true;
    this._timerEvent.remove();
    this._health = Math.min(100, this._health + 10);
    this.registry.set('l3_health', this._health);
    this.cameras.main.flash(600, 80, 200, 80);
    this.add.text(W / 2, H / 2 - 60, '✅ Treatment Steps Done!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa',
      stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(2200, () => {
      // All treatment done → play the recovery cinematic, THEN the end scene.
      playVideoOverlay(this, 'l3_recovery_video', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () => this.scene.start('L3_End'));
      });
    });
  }
}

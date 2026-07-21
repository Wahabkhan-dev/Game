import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
<<<<<<< Updated upstream
import { applyL3Frame } from './L3Modal.js';
=======
import { applyL3Frame, showTreatmentPrompt } from './L3Modal.js';
import { launchRandomMiniGame } from '../../../../utils/MiniGamePicker.js';
>>>>>>> Stashed changes

// MG3 — Heart Monitor: tap SPACE or heart button when EKG cursor enters the green zone, 4 times
export class L3_MG3_HeartScene extends Phaser.Scene {
  constructor() { super('L3_MG3'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(0);
    applyL3Frame(this);

    this._hits   = 0;
    this._onBeat = false;
    this._done   = false;
    this._treatmentPhase = false;
    this._health = this.registry.get('l3_health') || 100;
    this._bpm    = 110;
    this._BEAT   = 900;

    this._buildHUD(3);
    this._buildTitle('💚 Heart Monitor', 'First, a quick warm-up activity — then read Gamma\'s heartbeat yourself.');

<<<<<<< Updated upstream
=======
    // Random mini-game from Level 3's slice of the 40 games plays FIRST — only
    // once it's won does the real tap-the-beat treatment unlock.
    launchRandomMiniGame(this, 3, () => this._startTreatment());

>>>>>>> Stashed changes
    // Characters
    if (this.textures.exists('gemma_idle'))  this.add.image(560, H - 50, 'gemma_idle').setDisplaySize(150, 82).setOrigin(0.5, 1).setDepth(8).setTint(0xffcccc);
    if (this.textures.exists('gleeda_idle')) this.add.image(110, H - 50, 'gleeda_idle').setDisplaySize(90, 52).setOrigin(0.5, 1).setDepth(8);

    // EKG monitor frame
    const monX = W / 2 - 110, monY = 112;
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x0a1820, 1); g.fillRoundedRect(monX - 10, monY - 10, 240, 140, 8);
    g.lineStyle(2, 0x1e4060, 0.8); g.strokeRoundedRect(monX - 10, monY - 10, 240, 140, 8);
    this.add.image(W / 2 - 10, monY + 55, 'l3_ekg_screen').setDisplaySize(200, 120).setOrigin(0.5).setDepth(10);

    // Green zone highlight
    const gzX = monX + 20, gzW = 50, gzY = monY, gzH = 120;
    const gzG = this.add.graphics().setDepth(11);
    gzG.fillStyle(0x00ff44, 0.18); gzG.fillRect(gzX, gzY, gzW, gzH);
    gzG.lineStyle(2, 0x00ff44, 0.7); gzG.strokeRect(gzX, gzY, gzW, gzH);
    this.add.text(gzX + gzW / 2, gzY - 16, '✅ TAP HERE', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#44ff88'
    }).setOrigin(0.5).setDepth(12);

    // EKG moving cursor (vertical line)
    this._cursor = this.add.rectangle(monX, monY + gzH / 2, 3, gzH, 0x44ff88, 0.9).setDepth(13);
    this._cursorX = monX;
    this._cursorMaxX = monX + 200;
    this._greenZoneLeft  = gzX;
    this._greenZoneRight = gzX + gzW;

    // EKG wave line (drawn each frame)
    this._ekgLine = this.add.graphics().setDepth(12);
    this._waveOffset = 0;

    // BPM display
    this.add.rectangle(W / 2 + 115, monY + 45, 80, 110, 0x0a1820, 1).setDepth(10).setStrokeStyle(1.5, 0x1e4060, 0.8);
    this._bpmTxt = this.add.text(W / 2 + 115, monY + 48, `${this._bpm}`, {
      fontSize: '36px', fontFamily: 'Georgia, serif', color: '#ff4466'
    }).setOrigin(0.5).setDepth(11);
    this.add.text(W / 2 + 115, monY + 88, 'BPM', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ff8899'
    }).setOrigin(0.5).setDepth(11);
    this.add.text(W / 2 + 115, monY + 108, '❤️', { fontSize: '18px' }).setOrigin(0.5).setDepth(11);

    // Tap progress dots
    this._dots = [];
    for (let i = 0; i < 4; i++) {
      const d = this.add.circle(W / 2 - 45 + i * 30, monY + 132, 8, 0x1a3040, 1).setDepth(11).setStrokeStyle(1.5, 0x44ff88, 0.8);
      this._dots.push(d);
    }

    // Heart button
    const hBtn = this.add.text(W / 2, H - 50, '❤️', { fontSize: '44px' })
      .setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: hBtn, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    hBtn.on('pointerdown', () => this._doTap());

    const spKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spKey.on('down', () => this._doTap());

    this.add.text(W / 2, H - 22, 'Press SPACE or tap ❤️', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#888888'
    }).setOrigin(0.5).setDepth(20);
  }

  // Unlocks the real treatment interaction once the warm-up activity is won.
  _startTreatment() {
    this._treatmentPhase = true;
    showTreatmentPrompt(this, '💚 Now watch for the beat!');
    this._beatTimer = this.time.addEvent({
      delay: this._BEAT, loop: true, callback: () => {
        if (this._done) return;
        this._onBeat = true;
        this._cursor.setFillStyle(0xffffff, 1);
        this.time.delayedCall(320, () => {
          this._onBeat = false;
          this._cursor.setFillStyle(0x44ff88, 0.9);
        });
      }
    });
  }

  update(time, delta) {
    if (this._done || !this._treatmentPhase) return;
    const dt = delta / 1000;
    // Advance cursor
    this._waveOffset += dt * 80;
    this._cursorX += dt * 100;
    if (this._cursorX > this._cursorMaxX) this._cursorX = this._cursorMaxX - 200;
    this._cursor.x = this._cursorX;

    // Draw EKG wave
    this._ekgLine.clear();
    this._ekgLine.lineStyle(2, 0x00ff88, 0.8);
    this._ekgLine.beginPath();
    const monX = W / 2 - 110, monY = 112;
    for (let xi = 0; xi < 200; xi++) {
      const progress = xi / 200;
      const base = monY + 60;
      let yOff = Math.sin((xi + this._waveOffset) * 0.12) * 10;
      // spike every ~50px
      const spikePos = (xi + this._waveOffset) % 50;
      if (spikePos < 4)       yOff -= 28;
      else if (spikePos < 8)  yOff += 18;
      else if (spikePos < 12) yOff -= 6;
      if (xi === 0) this._ekgLine.moveTo(monX + xi, base + yOff);
      else          this._ekgLine.lineTo(monX + xi, base + yOff);
    }
    this._ekgLine.strokePath();
  }

  _doTap() {
    if (!this._treatmentPhase || this._done || this._hits >= 4) return;
    const inGreen = this._cursorX >= this._greenZoneLeft && this._cursorX <= this._greenZoneRight;
    if (inGreen || this._onBeat) {
      this._hits++;
      this._bpm = Math.max(72, this._bpm - 10);
      this._bpmTxt.setText(`${this._bpm}`);
      this._dots[this._hits - 1]?.setFillStyle(0x44ff88, 1);
      this.cameras.main.flash(140, 30, 160, 60);

      const ok = this.add.text(W / 2, 100, '💚 Perfect!', {
        fontSize: '18px', fontFamily: 'Georgia, serif', color: '#44ff88', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: ok, y: ok.y - 28, alpha: 0, duration: 700, onComplete: () => ok.destroy() });

      if (this._hits >= 4) {
        this._beatTimer.remove();
        this._complete();
      }
    } else {
      const miss = this.add.text(W / 2, 100, 'Wait for green zone...', {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#888888', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: miss, alpha: 0, duration: 700, onComplete: () => miss.destroy() });
    }
  }

  _buildHUD(step) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 44, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 44, 6);
    this.add.text(W / 2, 14, `HOSPITAL TREATMENT  —  STEP ${step} of 6`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc'
    }).setOrigin(0.5).setDepth(21);
    for (let i = 0; i < 6; i++) {
      const dot = this.add.circle(W / 2 - 75 + i * 30, 34, 7, i < step ? 0x44aaff : 0x1a3040, 1).setDepth(21);
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
    this._bpmTxt.setText('72').setColor('#44ff88');
    this.cameras.main.flash(600, 30, 180, 60);
    this.add.text(W / 2, H / 2 - 20, '💚 Heartbeat Stable!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#44ff88',
      stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L3_MG4'));
    });
  }
}

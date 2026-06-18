import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { createTrustMeter, addBondAtmosphere } from './L2_TrustMeter.js';

// L2 Mini-Activity 3 — Rhythm Beat: tap the heart on the beat 4 times → 100% trust
export class L2_RhythmScene extends Phaser.Scene {
  constructor() { super('L2_Rhythm'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.5).setTint(0x121a14).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x1a0a14, 0.46).setDepth(-4);
    this.add.rectangle(400, 40, 800, 100, 0x000000, 0.45).setDepth(-3);
    this.add.rectangle(400, 430, 800, 60, 0x000000, 0.45).setDepth(-3);
    this.add.tileSprite(400, H - 11, 800, 70, 'ground').setTileScale(0.14, 0.14).setDepth(5);

    // Soft aura + floating hearts behind characters
    addBondAtmosphere(this, { auraX: 400, auraY: 360 });

    // Title panel
    const tp = this.add.graphics().setDepth(20);
    tp.fillStyle(0x1a0a12, 0.92); tp.fillRoundedRect(150, 12, 500, 38, 12);
    tp.lineStyle(2, 0xff88bb, 0.6); tp.strokeRoundedRect(150, 12, 500, 38, 12);
    this.add.text(400, 31, '🎵 Match the beat — full trust!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#3a0820', strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);

    this.add.text(400, 60, 'Press SPACE or tap the ❤️ when it pulses  (4 times)', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0a8', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(20);

    // Polished trust meter (starts at 50% from the petting activity)
    this._trust = createTrustMeter(this, W / 2, 90, { w: 330, startPct: 50 });

    // Characters — grass surface at y=418; +4/+3 compensates PNG transparent bottom padding
    this.add.image(150, 422, 'gleeda_idle').setDisplaySize(120, 70).setOrigin(0.5, 1).setDepth(8);
    this._gemmaImg = this.add.image(560, 421, 'gemma_happy').setDisplaySize(140, 77).setOrigin(0.5, 1).setDepth(8);

    // Beat indicator dots (4 dots showing progress)
    this._dots = [];
    for (let i = 0; i < 4; i++) {
      const dot = this.add.circle(310 + i * 60, 128, 12, 0x442244, 1).setDepth(20).setStrokeStyle(2, 0xff55aa, 0.8);
      this._dots.push(dot);
    }

    // Soft halo behind the heart target
    const halo = this.add.circle(400, 178, 60, 0xff66aa, 0.12).setDepth(23);
    this.tweens.add({ targets: halo, alpha: 0.3, scaleX: 1.14, scaleY: 1.14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Big pulsing heart — the target (upper half so characters stay clear)
    this._heart = this.add.text(400, 175, '❤️', { fontSize: '70px' })
      .setOrigin(0.5).setDepth(25).setInteractive({ useHandCursor: true });

    // Beat ring beneath heart (visual cue)
    this._beatRing = this.add.circle(400, 185, 52, 0xff55aa, 0).setDepth(24).setStrokeStyle(3, 0xff55aa, 0);

    this._hits  = 0;
    this._onBeat = false;
    this._done   = false;
    const BEAT   = 950;

    // Beat timer — pulses the heart
    this._beatTimer = this.time.addEvent({
      delay: BEAT, loop: true, callback: () => {
        if (this._done) return;
        this._onBeat = true;
        // Pulse heart
        this.tweens.add({ targets: this._heart, scale: 1.5, duration: 180, yoyo: true });
        // Pulse ring
        this._beatRing.setStrokeStyle(3, 0xff55aa, 0.8);
        this.tweens.add({ targets: this._beatRing, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 380,
          onComplete: () => { this._beatRing.setScale(1); this._beatRing.setAlpha(1); this._beatRing.setStrokeStyle(3, 0xff55aa, 0); }
        });
        this.time.delayedCall(380, () => { this._onBeat = false; });
      }
    });

    const doHit = () => {
      if (this._done || this._hits >= 4) return;
      if (this._onBeat) {
        this._hits++;
        const pct = 50 + this._hits * 12.5;
        this._trust.setPct(pct);

        // Light up dot
        if (this._dots[this._hits - 1]) {
          this._dots[this._hits - 1].setFillStyle(0xff55aa, 1);
        }

        // Gemma bounces — kill prior tween so y never drifts
        this.tweens.killTweensOf(this._gemmaImg);
        this._gemmaImg.y = 421;
        this.tweens.add({ targets: this._gemmaImg, y: 407, duration: 160, yoyo: true });

        const ok = this.add.text(400, 105, '♥ Perfect!', {
          fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff66aa', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: ok, y: ok.y - 30, alpha: 0, duration: 700, onComplete: () => ok.destroy() });

        this.cameras.main.flash(120, 80, 10, 60);

        if (this._hits >= 4) {
          this._done = true;
          this._beatTimer.remove();
          this._trust.setPct(100);

          this.time.delayedCall(800, () => {
            this.cameras.main.flash(600, 150, 80, 180);

            // Big celebration
            for (let i = 0; i < 14; i++) {
              this.time.delayedCall(i * 80, () => {
                const sp = this.add.ellipse(
                  300 + Math.random() * 200, H / 2 + (Math.random() - 0.5) * 100,
                  20, 20, 0xffcc44, 0.9
                ).setDepth(35);
                this.tweens.add({ targets: sp, y: sp.y - 80, alpha: 0, scaleX: 3, scaleY: 3, duration: 900, onComplete: () => sp.destroy() });
              });
            }

            const total = (this.registry.get('points') || 0) + 2;
            this.registry.set('points', total);
            this.add.text(W / 2, H / 2 + 60, '🐾 Gemma trusts you completely! 💛', {
              fontSize: '19px', fontFamily: 'Georgia, serif', color: '#f5c87a',
              stroke: '#1a0802', strokeThickness: 3, align: 'center'
            }).setOrigin(0.5).setDepth(40);
            this.add.text(W / 2, H / 2 + 92, `+2 ⭐   (Total: ${total})`, {
              fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd86a',
              stroke: '#1a0802', strokeThickness: 3
            }).setOrigin(0.5).setDepth(40);

            this.time.delayedCall(2800, () => {
              this.cameras.main.fadeOut(600, 0, 0, 0);
              this.time.delayedCall(650, () => this.scene.start('L2_End'));
            });
          });
        }
      } else {
        const miss = this.add.text(400, 105, 'Wait for the pulse... 🎵', {
          fontSize: '13px', fontFamily: 'Georgia, serif', color: '#888888', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: miss, alpha: 0, duration: 800, onComplete: () => miss.destroy() });
      }
    };

    this._heart.on('pointerdown', doHit);
    const spKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spKey.on('down', doHit);
  }
}

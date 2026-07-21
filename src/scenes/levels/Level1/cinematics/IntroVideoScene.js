import Phaser from 'phaser';

export class IntroVideoScene extends Phaser.Scene {
  constructor() { super('IntroVideo'); }

  create() {
    this._gone = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const W = this.scale.width;
    const H = this.scale.height;

    // ── Video ────────────────────────────────────────────────────────────────
    const video = this.add.video(W / 2, H / 2, 'intro_video').setDepth(0);
    video.on('created', () => {
      const scale = Math.min(W / video.width, H / video.height);
      video.setScale(scale);
    });
    video.play();
    video.on('complete', () => this._goNext());

    // ── Cinematic letterbox bars ─────────────────────────────────────────────
    this.add.rectangle(W / 2, 28,     W, 56, 0x000000, 1).setDepth(10);
    this.add.rectangle(W / 2, H - 28, W, 56, 0x000000, 1).setDepth(10);

    // ── Character intro cards ─────────────────────────────────────────────────
    // Each card: delay=when it appears, name, role, duration=how long it stays
    const cards = [
      {
        delay:    1200,
        duration: 3200,
        label:    'SHADOW',
        role:     'Guardian of the Forest',
      },
      {
        delay:    5200,
        duration: 3200,
        label:    'GEMMA',
        role:     'Shadow\'s Dearest Friend',
      },
      {
        delay:    9000,
        duration: 3800,
        label:    'Chapter I',
        role:     '"The Warning"',
        isTitle:  true,
      },
    ];

    cards.forEach(card => this._showCard(card, W, H));

    // ── Skip button ──────────────────────────────────────────────────────────
    const skip = this.add.text(W - 20, H - 10, 'SKIP  ›', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#776655', stroke: '#000000', strokeThickness: 2,
      letterSpacing: 2,
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setDepth(30);

    skip.on('pointerover', () => skip.setColor('#c8a870'));
    skip.on('pointerout',  () => skip.setColor('#776655'));
    skip.on('pointerup',   () => { video.stop(); this._goNext(); });
  }

  _showCard({ delay, duration, label, role, isTitle }, W, H) {
    // Dark gradient backing — bottom-left strip
    const BX  = isTitle ? W / 2 : 28;         // x anchor
    const BY  = H - 56;                        // y anchor (inside bottom bar)
    const ORG = isTitle ? 0.5 : 0;            // text origin x

    const backing = this.add.graphics().setDepth(11).setAlpha(0);
    if (!isTitle) {
      backing.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0);
      backing.fillRect(0, H - 58, 320, 58);
    }

    // Gold accent line
    const line = this.add.graphics().setDepth(12).setAlpha(0);
    if (isTitle) {
      line.fillStyle(0xc8a050, 1);
      line.fillRect(W / 2 - 60, BY - 4, 0, 1);   // starts at 0 width, tweened open
    } else {
      line.fillStyle(0xc8a050, 1);
      line.fillRect(BX, BY - 2, 0, 1);
    }

    // Main name / title text
    const nameTxt = this.add.text(BX, BY + 4, label, {
      fontSize:        isTitle ? '26px' : '20px',
      fontFamily:      'Georgia, serif',
      color:           isTitle ? '#f5d080' : '#ffffff',
      stroke:          '#000000',
      strokeThickness: isTitle ? 5 : 4,
      fontStyle:       isTitle ? 'italic' : 'normal',
    }).setOrigin(ORG, 0).setAlpha(0).setDepth(13);

    // Subtitle / role text
    const roleTxt = this.add.text(BX, BY + (isTitle ? 32 : 26), role, {
      fontSize:        '10px',
      fontFamily:      'Georgia, serif',
      color:           '#b8a080',
      stroke:          '#000000',
      strokeThickness: 3,
      letterSpacing:   isTitle ? 3 : 1,
      fontStyle:       isTitle ? 'italic' : 'normal',
    }).setOrigin(ORG, 0).setAlpha(0).setDepth(13);

    // ── Fade in ──────────────────────────────────────────────────────────────
    this.time.delayedCall(delay, () => {
      this.tweens.add({ targets: [backing, nameTxt, roleTxt], alpha: 1, duration: 700, ease: 'Sine.easeOut' });

      // Animate the gold line growing
      let lineW = 0;
      const targetW = isTitle ? 120 : 180;
      const lineX   = isTitle ? W / 2 - 60 : BX;
      const lineY   = BY - 2;
      this.tweens.addCounter({
        from: 0, to: targetW, duration: 800, ease: 'Power2.easeOut',
        onUpdate: t => {
          line.clear();
          line.fillStyle(0xc8a050, 1);
          line.fillRect(lineX, lineY, t.getValue(), 1);
        },
        onStart: () => line.setAlpha(1),
      });
    });

    // ── Fade out ─────────────────────────────────────────────────────────────
    this.time.delayedCall(delay + duration, () => {
      this.tweens.add({
        targets: [backing, nameTxt, roleTxt, line],
        alpha: 0, duration: 500, ease: 'Sine.easeIn',
      });
    });
  }

  _goNext() {
    if (this._gone) return;
    this._gone = true;
    this.cameras.main.fadeOut(700, 0, 0, 0);
    // Skip the Cinematic1 story-panel screen (not needed for now) — the intro
    // video is the intro; go straight into Level 1.
    this.time.delayedCall(750, () => this.scene.start('Level1'));
  }
}

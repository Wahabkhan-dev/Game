import Phaser from 'phaser';

export class IntroVideoScene extends Phaser.Scene {
  constructor() { super('IntroVideo'); }

  create() {
    this._gone = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(220, 0, 0, 0);

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

    // ── Skip button — hidden for the first 3s (same rule as every other video),
    // then fades in and becomes tappable. ─────────────────────────────────────
    const skip = this.add.text(W - 20, H - 10, 'SKIP  ›', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#776655', stroke: '#000000', strokeThickness: 2,
      letterSpacing: 2,
    }).setOrigin(1, 1).setDepth(30).setAlpha(0);

    skip.on('pointerover', () => skip.setColor('#c8a870'));
    skip.on('pointerout',  () => skip.setColor('#776655'));
    skip.on('pointerup',   () => { video.stop(); this._goNext(); });
    this.time.delayedCall(3000, () => {
      if (this._gone) return;
      skip.setAlpha(1).setInteractive({ useHandCursor: true });
    });
  }

  _goNext() {
    if (this._gone) return;
    this._gone = true;
    // Start Level 1 immediately when the intro video ends or is skipped.
    // The warmup logic already buffers the intro video, so this avoids
    // extra black-screen wait between the video and gameplay.
    this.scene.start('Level1');
  }
}

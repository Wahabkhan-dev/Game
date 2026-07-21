import Phaser from 'phaser';

// Level 5 intro — plays intro-l5-pain → after-intro back-to-back as ONE combined
// intro, then starts gameplay. Unlike Level 4's intro (whose skip advances one
// clip at a time), here the single SKIP button skips the WHOLE intro at once.
const VIDEOS = ['l5_intro1', 'l5_intro2'];

export class L5_IntroVideoScene extends Phaser.Scene {
  constructor() { super('L5_Intro'); }

  create() {
    this._gone = false;
    this._idx  = 0;
    this._video = null;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this._W = this.scale.width;
    this._H = this.scale.height;

    this._skip = this.add.text(this._W - 20, this._H - 10, 'SKIP  ›', {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      color: '#776655', stroke: '#000000', strokeThickness: 2,
      letterSpacing: 2,
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setDepth(30);
    this._skip.on('pointerover', () => this._skip.setColor('#c8a870'));
    this._skip.on('pointerout',  () => this._skip.setColor('#776655'));
    // Skip the ENTIRE intro (both clips) at once.
    this._skip.on('pointerup',   () => this._goNext());

    this._playCurrent();
  }

  _playCurrent() {
    const key = VIDEOS[this._idx];
    if (!key || !this.cache.video.exists(key)) { this._advance(); return; }

    const W = this._W, H = this._H;
    this._video = this.add.video(W / 2, H / 2, key).setDepth(0);
    this._video.on('created', () => {
      const scale = Math.min(W / this._video.width, H / this._video.height);
      this._video.setScale(scale);
    });
    this._video.play();
    this._video.once('complete', () => this._advance());

    // Safety net: if a clip never fires 'complete' (bad codec, load glitch)
    this._safety = this.time.delayedCall(25000, () => this._advance());
  }

  // Natural end of one clip → move to the next, or finish after the last.
  _advance() {
    if (this._gone) return;
    this._safety?.remove(false);
    try { this._video?.stop(); this._video?.destroy(); } catch (_) {}
    this._video = null;
    this._idx++;
    if (this._idx < VIDEOS.length) this._playCurrent();
    else this._goNext();
  }

  _goNext() {
    if (this._gone) return;
    this._gone = true;
    this._safety?.remove(false);
    try { this._video?.stop(); this._video?.destroy(); } catch (_) {}
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('L5_EquipmentRun'));
  }
}

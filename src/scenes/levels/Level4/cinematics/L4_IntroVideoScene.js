import Phaser from 'phaser';

// Level 4 intro — plays intro-1 → intro-2 → intro-3 back-to-back, then starts
// gameplay. Mirrors Level 1's IntroVideoScene (full-screen video + skip
// button), minus the character cards — just the 3 clips in sequence.
const VIDEOS = ['l4_intro1', 'l4_intro2', 'l4_intro3'];

export class L4_IntroVideoScene extends Phaser.Scene {
  constructor() { super('L4_Intro'); }

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
    this._skip.on('pointerup',   () => this._nextVideo());

    this._playCurrent();
  }

  _playCurrent() {
    const key = VIDEOS[this._idx];
    if (!key || !this.cache.video.exists(key)) { this._nextVideo(); return; }

    const W = this._W, H = this._H;
    this._video = this.add.video(W / 2, H / 2, key).setDepth(0);
    this._video.on('created', () => {
      const scale = Math.min(W / this._video.width, H / this._video.height);
      this._video.setScale(scale);
    });
    this._video.play();
    this._video.once('complete', () => this._nextVideo());

    // Safety net: if a clip never fires 'complete' (bad codec, load glitch)
    this._safety = this.time.delayedCall(25000, () => this._nextVideo());
  }

  _nextVideo() {
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
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('Level4'));
  }
}

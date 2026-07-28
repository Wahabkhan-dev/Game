import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// LoadingScene — a persistent overlay LAUNCHED (never created/destroyed by the
// normal scene-swap machinery) on top of whatever scene is being torn down and
// rebuilt. Because it lives in its OWN scene, it keeps rendering continuously
// across the old scene's stop() and the new scene's full preload()+create()
// (including any real videos/images the new scene still needs to load) —
// unlike loading UI drawn directly on the dying scene, which disappears the
// instant that scene stops, however long the new one then takes to actually
// become ready.
//
// The caller (see utils/EndModals.js's transitionToScene) explicitly stops
// THIS scene only once the target scene is CONFIRMED running — never on a
// guessed fixed timer — so there is no gap where the player could see a
// blank frame, a leftover frozen frame from the level they just left (e.g. a
// death pose), or a "hang".
// ════════════════════════════════════════════════════════════════════════════
export class LoadingScene extends Phaser.Scene {
  constructor() { super('LoadingScene'); }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a05, 1).setDepth(0);
    this.add.text(W / 2, H / 2 - 30, "Gemma's Story", {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#0a0502', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    this.add.rectangle(W / 2, H / 2 + 20, 220, 10, 0xffffff, 0.1)
      .setDepth(1).setStrokeStyle(1, 0xf5c87a, 0.5);
    const barFill = this.add.rectangle(W / 2 - 110, H / 2 + 20, 4, 10, 0xf5c87a, 1)
      .setOrigin(0, 0.5).setDepth(2);
    this.add.text(W / 2, H / 2 + 44, 'Loading…', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c9956b',
    }).setOrigin(0.5).setDepth(1);

    // Indefinite back-and-forth fill — purely visual, has no fixed "done"
    // point; this scene is stopped externally once the real target scene is
    // confirmed running, whether that takes 100ms or several seconds.
    this.tweens.add({
      targets: barFill, width: 220, duration: 700, ease: 'Sine.easeInOut',
      yoyo: true, repeat: -1,
    });
  }
}

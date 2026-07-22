import Phaser from 'phaser';
import { generateL3Assets } from './L3Assets.js';
import { playVideoOverlay } from '../../../utils/VideoOverlay.js';
import { resetGameHistory } from '../../../utils/MiniGamePicker.js';

// Level 3 intro — plays the intro cinematic, then goes straight into the drive.
// (The old story-text + "TAP TO BEGIN" screen was removed; the video is the intro.)
export class Level3Scene extends Phaser.Scene {
  constructor() { super('Level3'); }

  create() {
    generateL3Assets(this);
    // Fresh playthrough → clear the used-game history so Level 3's six treatment
    // steps each get a DISTINCT random mini-game (no repeats within the level).
    resetGameHistory(3);
    const footer = document.getElementById('game-footer');
    if (footer) footer.style.display = 'none';
    this.cameras.main.setBackgroundColor('#070912');
    playVideoOverlay(this, 'l3_intro_video', () => this.scene.start('L3_Drive'));
  }
}

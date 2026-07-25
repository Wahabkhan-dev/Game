import Phaser from 'phaser';
import { showLevelCompleteModal } from '../../../utils/EndModals.js';

// Level 3 Success — skip straight to the shared Level Complete modal, no
// separate celebration screen.
export class L3_EndScene extends Phaser.Scene {
  constructor() { super('L3_End'); }

  create() {
    // Show ONLY the coins collected from solving mini-games (registry 'points')
    // — no more health/base-bonus padding, matching every other level now.
    const points = this.registry.get('points') || 0;

    this.cameras.main.setBackgroundColor('#0a1020');
    showLevelCompleteModal(this, points, { nextLevelKey: 'L4_Intro' });
  }
}

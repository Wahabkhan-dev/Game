import Phaser from 'phaser';
import { showLevelCompleteModal } from '../../../utils/EndModals.js';

// Level 3 Success — skip straight to the shared Level Complete modal, no
// separate celebration screen.
export class L3_EndScene extends Phaser.Scene {
  constructor() { super('L3_End'); }

  create() {
    const health = this.registry.get('l3_health') || 100;
    const coins  = this.registry.get('l3_coins')  || 0;
    const points = coins + 250 + Math.round(health);

    this.cameras.main.setBackgroundColor('#0a1020');
    showLevelCompleteModal(this, points, { nextLevelKey: 'L4_Intro' });
  }
}

import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
import { applyL3Frame } from './L3Modal.js';
import { launchRandomMiniGame } from '../../../../utils/MiniGamePicker.js';

// MG2 — Give Injection: drag syringe to the glowing spot on Gamma, twice
export class L3_MG2_InjectionScene extends Phaser.Scene {
  constructor() { super('L3_MG2'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(0);
    applyL3Frame(this);

    this._hits  = 0;
    this._done  = false;
    this._health = this.registry.get('l3_health') || 100;

    this._buildHUD(2);
    this._buildTitle('💉 Give the Injection', 'Drag the syringe to the glowing target on Gamma.');

    // Gamma on table
    if (this.textures.exists('gemma_idle')) {
      this.add.image(500, H - 50, 'gemma_idle').setDisplaySize(190, 105).setOrigin(0.5, 1).setDepth(8).setTint(0xffdddd);
    }
    if (this.textures.exists('gleeda_idle')) {
      this.add.image(130, H - 50, 'gleeda_idle').setDisplaySize(90, 52).setOrigin(0.5, 1).setDepth(8);
    }

    // Hospital table
    const g = this.add.graphics().setDepth(7);
    g.fillStyle(0x182838, 1); g.fillRoundedRect(310, H - 65, 360, 18, 4);
    g.lineStyle(1, 0x2a4a68, 0.6); g.strokeRoundedRect(310, H - 65, 360, 18, 4);

    // Random mini-game from Level 3's slice of the 40 games — no intro/ending
    // screen; hospital background/HUD stay visible, game overlays on top.
    launchRandomMiniGame(this, 3, () => this._complete());
  }

  _buildInjection() {
    const targX = 480, targY = H - 90;

    // Target spot on Gamma (shoulder)
    this._target = this.add.image(targX, targY, 'l3_inject_spot').setDisplaySize(40, 40).setDepth(12);
    this.tweens.add({ targets: this._target, scaleX: 1.3, scaleY: 1.3, alpha: 0.65, duration: 500, yoyo: true, repeat: -1 });

    // Syringe — draggable
    const sx = 180, sy = H - 110;
    this._syringe = this.add.image(sx, sy, 'l3_syringe').setDisplaySize(96, 28).setDepth(15).setInteractive({ useHandCursor: true });
    this._syringe._origX = sx; this._syringe._origY = sy;
    this.input.setDraggable(this._syringe);

    // Drag arrow hint
    const hint = this.add.text(sx, sy - 36, '→ Drag to target', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(14);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this._hint = hint;

    this.input.on('drag', (ptr, obj, dx, dy) => {
      if (this._done) return;
      obj.x = dx; obj.y = dy;
    });

    this.input.on('dragend', (ptr, obj) => {
      if (this._done) return;
      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, targX, targY);
      if (dist < 44) {
        this._hits++;
        this._doInject(targX, targY, obj);
      } else {
        this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 220 });
      }
    });
  }

  _doInject(tx, ty, syringe) {
    this.cameras.main.flash(200, 30, 180, 60);
    this.cameras.main.shake(100, 0.006);
    this.tweens.add({ targets: syringe, x: tx, y: ty, duration: 180 });

    const pop = this.add.text(tx, ty - 50, '💉 Done!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: pop, y: pop.y - 28, alpha: 0, duration: 900, onComplete: () => pop.destroy() });

    // Health progress
    this._health = Math.min(100, this._health + 8);
    this.registry.set('l3_health', this._health);
    this._updateBar();

    if (this._hits >= 2) {
      this._complete();
    } else {
      // Second injection at different spot
      this.time.delayedCall(900, () => {
        if (this._done) return;
        this.tweens.add({ targets: syringe, x: syringe._origX, y: syringe._origY, duration: 300 });
        this._target.x = 530; this._target.y = ty + 20;
        if (this._hint && this._hint.active) this._hint.setText('→ One more!');
      });
    }
  }

  _buildHUD(step) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 44, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 44, 6);
    this.add.text(W / 2, 14, `HOSPITAL TREATMENT  —  STEP ${step} of 5`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc'
    }).setOrigin(0.5).setDepth(21);
    for (let i = 0; i < 5; i++) {
      const dot = this.add.circle(W / 2 - 60 + i * 30, 34, 7, i < step ? 0x44aaff : 0x1a3040, 1).setDepth(21);
      dot.setStrokeStyle(1.5, 0x88aacc, 0.6);
    }
    // Health: name label on top, bar clearly below (no overlap)
    this.add.text(12, 6, '❤️ GAMMA', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ff99aa' }).setDepth(21);
    this.add.rectangle(12, 33, 100, 10, 0x330011, 1).setOrigin(0, 0.5).setDepth(21).setStrokeStyle(1, 0x88aacc, 0.4);
    this._healthBarFill = this.add.rectangle(12, 33, 100 * (this._health || 100) / 100, 10, 0xff3355, 1).setOrigin(0, 0.5).setDepth(22);
  }

  _updateBar() {
    if (this._healthBarFill) this._healthBarFill.setDisplaySize(Math.max(0, this._health), 10);
  }

  _buildTitle(main, sub) {
    this.add.text(W / 2, 64, main, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);
    this.add.text(W / 2, 88, sub, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0a8', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);
  }

  _complete() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.flash(500, 30, 180, 80);
    this.add.text(W / 2, H / 2 - 20, '💉 Injection complete!', {
      fontSize: '23px', fontFamily: 'Georgia, serif', color: '#88ffaa',
      stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L3_MG3'));
    });
  }
}

import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
import { applyL3Frame } from './L3Modal.js';

// MG4 — Special Treatment: drag oxygen mask to Gamma, then watch vitals stabilise
export class L3_MG4_OxygenScene extends Phaser.Scene {
  constructor() { super('L3_MG4'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(0);
    applyL3Frame(this);

    this._done   = false;
    this._health = this.registry.get('l3_health') || 100;
    this._phase  = 0; // 0=place mask, 1=stabilise

    this._buildHUD(4);
    this._buildTitle('🫁 Oxygen Treatment', 'Drag the oxygen mask to Gamma\'s face, then stabilise the vitals.');

    // Characters
    if (this.textures.exists('gemma_idle')) {
      this._gammaImg = this.add.image(480, H - 50, 'gemma_idle').setDisplaySize(180, 100).setOrigin(0.5, 1).setDepth(8).setTint(0xffcccc);
    }
    if (this.textures.exists('gleeda_idle')) {
      this.add.image(120, H - 50, 'gleeda_idle').setDisplaySize(90, 52).setOrigin(0.5, 1).setDepth(8);
    }

    // Table
    const g = this.add.graphics().setDepth(7);
    g.fillStyle(0x182838, 1); g.fillRoundedRect(290, H - 65, 370, 18, 4);
    g.lineStyle(1, 0x2a4a68, 0.6); g.strokeRoundedRect(290, H - 65, 370, 18, 4);

    // Vitals panel
    this._buildVitals();

    // Oxygen mask (draggable)
    const mx = 170, my = H - 120;
    this._mask = this.add.image(mx, my, 'l3_oxygen').setDisplaySize(62, 64).setDepth(15).setInteractive({ useHandCursor: true });
    this._mask._origX = mx; this._mask._origY = my;
    this.input.setDraggable(this._mask);

    // Face target on Gamma
    const targX = 440, targY = H - 110;
    this._faceTarget = this.add.circle(targX, targY, 22, 0x44ff88, 0.2).setDepth(11).setStrokeStyle(2, 0x44ff88, 0.8);
    this.tweens.add({ targets: this._faceTarget, scaleX: 1.25, scaleY: 1.25, alpha: 0.4, duration: 550, yoyo: true, repeat: -1 });

    const hint = this.add.text(mx, my - 44, '→ Drag to Gamma\'s face', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(14);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    this._hint = hint;

    this.input.on('drag', (ptr, obj, dx, dy) => {
      if (this._done || this._phase > 0) return;
      obj.x = dx; obj.y = dy;
    });

    this.input.on('dragend', (ptr, obj) => {
      if (this._done || this._phase > 0) return;
      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, targX, targY);
      if (dist < 50) {
        this._placeMask(targX, targY, obj);
      } else {
        this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 220 });
      }
    });
  }

  _buildVitals() {
    const vx = 600, vy = 120;
    this.add.image(vx, vy + 50, 'l3_vitals_bg').setDisplaySize(160, 110).setOrigin(0.5).setDepth(9);
    this.add.text(vx, vy, '📊 VITALS', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc' }).setOrigin(0.5).setDepth(10);

    this._vitals = [
      { label: '❤️ HEART', val: 115, target: 72,  unit: '', color: '#ff4466' },
      { label: '🫁 O₂',   val: 78,  target: 96,  unit: '%', color: '#44aaff' },
      { label: '🌡 TEMP',  val: 39.2, target: 37.1, unit: '°', color: '#ffaa44' },
    ];

    this._vitalTxts = this._vitals.map((v, i) => {
      this.add.text(vx - 66, vy + 22 + i * 30, v.label, {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#88aacc'
      }).setDepth(10);
      const vt = this.add.text(vx + 50, vy + 22 + i * 30, `${v.val}${v.unit}`, {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ff4466'
      }).setOrigin(1, 0).setDepth(10);
      return vt;
    });
  }

  _placeMask(tx, ty, mask) {
    this._phase = 1;
    if (this._hint && this._hint.active) { this.tweens.killTweensOf(this._hint); this._hint.destroy(); }
    this.tweens.killTweensOf(this._faceTarget);
    this.tweens.add({ targets: mask, x: tx, y: ty, duration: 220 });
    this._faceTarget.setFillStyle(0x44ff88, 0.4);

    this.cameras.main.flash(300, 30, 180, 80);
    const pop = this.add.text(tx, ty - 60, '🫁 Mask placed!', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#44ffaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: pop, y: pop.y - 28, alpha: 0, duration: 900, onComplete: () => pop.destroy() });

    // Animate vitals to healthy
    this.add.text(W / 2, H / 2 - 80, 'Stabilising vitals...', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ccff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);

    this._vitals.forEach((v, i) => {
      this.time.addEvent({
        delay: 500 + i * 700,
        callback: () => {
          if (this._done) return;
          v.val = v.target;
          this._vitalTxts[i].setText(`${v.val}${v.unit}`).setColor('#44ff88');
          this.cameras.main.flash(180, 20, 140, 40);
        }
      });
    });

    this.time.delayedCall(2800, () => this._complete());
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
    this._health = Math.min(100, this._health + 12);
    this.registry.set('l3_health', this._health);
    this.cameras.main.flash(600, 30, 180, 80);
    this.add.text(W / 2, H / 2 - 20, '🫁 Vitals Stable!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#44ffaa',
      stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L3_MG5'));
    });
  }
}

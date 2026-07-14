import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
import { applyL3Frame } from './L3Modal.js';

// MG6 — Post Care: drag food bowl and medicine to Gamma to complete treatment
export class L3_MG6_PostCareScene extends Phaser.Scene {
  constructor() { super('L3_MG6'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(0);
    applyL3Frame(this);

    this._done    = false;
    this._fed     = false;
    this._medGiven = false;
    this._health  = this.registry.get('l3_health') || 100;

    this._buildHUD(6);
    this._buildTitle('🍲 Post Care', 'Feed Gamma and give her medicine to complete the treatment!');

    // Gamma on bed, happy
    if (this.textures.exists('gemma_happy')) {
      this._gammaImg = this.add.image(490, H - 48, 'gemma_happy').setDisplaySize(200, 110).setOrigin(0.5, 1).setDepth(8);
    }
    if (this.textures.exists('gleeda_idle')) {
      this.add.image(120, H - 50, 'gleeda_idle').setDisplaySize(90, 52).setOrigin(0.5, 1).setDepth(8);
    }

    // Hospital table
    const g = this.add.graphics().setDepth(7);
    g.fillStyle(0x182838, 1); g.fillRoundedRect(290, H - 64, 380, 18, 4);
    g.lineStyle(1, 0x2a4a68, 0.6); g.strokeRoundedRect(290, H - 64, 380, 18, 4);

    // Gamma's feed zone (mouth area)
    const feedX = 390, feedY = H - 100;
    this._feedZone = this.add.circle(feedX, feedY, 28, 0xffcc44, 0.15).setDepth(10).setStrokeStyle(2, 0xffcc44, 0.7);
    this.tweens.add({ targets: this._feedZone, scaleX: 1.2, scaleY: 1.2, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    this.add.text(feedX, feedY - 44, '🍲 Feed here', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ffcc44'
    }).setOrigin(0.5).setDepth(11);

    // Medicine zone (paw)
    const medX = 540, medY = H - 95;
    this._medZone = this.add.circle(medX, medY, 28, 0x44aaff, 0.15).setDepth(10).setStrokeStyle(2, 0x44aaff, 0.7);
    this.tweens.add({ targets: this._medZone, scaleX: 1.2, scaleY: 1.2, alpha: 0.25, duration: 600, yoyo: true, repeat: -1, delay: 300 });
    this.add.text(medX, medY - 44, '💊 Give here', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#44aaff'
    }).setOrigin(0.5).setDepth(11);

    this._feedZoneRect  = new Phaser.Geom.Circle(feedX, feedY, 40);
    this._medZoneRect   = new Phaser.Geom.Circle(medX, medY, 40);

    // Progress checklist
    this._fedTxt  = this.add.text(W - 160, 120, '☐ Feed Gamma', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setDepth(12);
    this._medTxt  = this.add.text(W - 160, 148, '☐ Give Medicine', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
    }).setDepth(12);

    // Draggable items
    this._buildItems();
  }

  _buildItems() {
    // Food bowl
    const bx = 160, by = H - 130;
    this._bowl = this.add.image(bx, by, 'l3_bowl').setDisplaySize(60, 44).setDepth(15).setInteractive({ useHandCursor: true });
    this._bowl._origX = bx; this._bowl._origY = by;
    this._bowl._type  = 'food';
    this.tweens.add({ targets: this._bowl, y: by - 5, duration: 600, yoyo: true, repeat: -1 });
    this.add.text(bx, by - 30, '🍲 Food', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ffcc44' }).setOrigin(0.5).setDepth(14);

    // Medicine bottle
    const mx = 220, my = H - 132;
    this._medBottle = this.add.image(mx, my, 'l3_med_ok').setDisplaySize(30, 50).setDepth(15).setInteractive({ useHandCursor: true });
    this._medBottle._origX = mx; this._medBottle._origY = my;
    this._medBottle._type  = 'medicine';
    this.tweens.add({ targets: this._medBottle, y: my - 5, duration: 600, yoyo: true, repeat: -1, delay: 300 });
    this.add.text(mx, my - 30, '💊 Med', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#44aaff' }).setOrigin(0.5).setDepth(14);

    [this._bowl, this._medBottle].forEach(item => this.input.setDraggable(item));

    this.input.on('drag', (ptr, obj, dx, dy) => {
      if (this._done) return;
      this.tweens.killTweensOf(obj);
      obj.x = dx; obj.y = dy;
    });

    this.input.on('dragend', (ptr, obj) => {
      if (this._done) return;
      if (obj._type === 'food' && !this._fed) {
        if (this._feedZoneRect.contains(obj.x, obj.y)) {
          this._doFeed(obj);
        } else {
          this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 220 });
          this.tweens.add({ targets: obj, y: obj._origY - 5, duration: 600, yoyo: true, repeat: -1 });
        }
      } else if (obj._type === 'medicine' && !this._medGiven) {
        if (this._medZoneRect.contains(obj.x, obj.y)) {
          this._doMed(obj);
        } else {
          this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 220 });
          this.tweens.add({ targets: obj, y: obj._origY - 5, duration: 600, yoyo: true, repeat: -1, delay: 300 });
        }
      }
    });
  }

  _doFeed(obj) {
    this._fed = true;
    this.tweens.killTweensOf(this._feedZone);
    this.tweens.add({ targets: obj, x: this._feedZone.x, y: this._feedZone.y, duration: 200 });
    this._feedZone.setFillStyle(0xffcc44, 0.4);
    this._fedTxt.setText('✅ Fed Gamma').setColor('#88ffaa');
    this.cameras.main.flash(200, 80, 160, 20);

    const h = this.add.text(this._feedZone.x, this._feedZone.y - 48, '🍲 Yum!', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffcc44', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 900, onComplete: () => h.destroy() });

    if (this._medGiven) this._complete();
  }

  _doMed(obj) {
    this._medGiven = true;
    this.tweens.killTweensOf(this._medZone);
    this.tweens.add({ targets: obj, x: this._medZone.x, y: this._medZone.y, duration: 200 });
    this._medZone.setFillStyle(0x44aaff, 0.4);
    this._medTxt.setText('✅ Medicine given').setColor('#88ffaa');
    this.cameras.main.flash(200, 20, 80, 160);

    const h = this.add.text(this._medZone.x, this._medZone.y - 48, '💊 Done!', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#44aaff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 900, onComplete: () => h.destroy() });

    if (this._fed) this._complete();
  }

  _buildHUD(step) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 44, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 44, 6);
    this.add.text(W / 2, 14, `HOSPITAL TREATMENT  —  STEP ${step} of 6`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc'
    }).setOrigin(0.5).setDepth(21);
    for (let i = 0; i < 6; i++) {
      const dot = this.add.circle(W / 2 - 75 + i * 30, 34, 7, i < step ? 0x44aaff : 0x1a3040, 1).setDepth(21);
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
    this._health = Math.min(100, this._health + 15);
    this.registry.set('l3_health', this._health);
    this.cameras.main.flash(700, 100, 200, 80);

    // Gamma bounces happily
    if (this._gammaImg) {
      this.tweens.add({ targets: this._gammaImg, y: this._gammaImg.y - 10, duration: 250, yoyo: true, repeat: 3 });
    }

    this.add.text(W / 2, H / 2 - 30, '🐾 Treatment Complete!\nGamma is recovering! 💛', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#0a0502', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5).setDepth(40);

    this.time.delayedCall(2400, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(750, () => this.scene.start('L3_End'));
    });
  }
}

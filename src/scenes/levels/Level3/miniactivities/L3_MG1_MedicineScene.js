import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { generateL3Assets } from '../L3Assets.js';
import { applyL3Frame } from './L3Modal.js';
import { launchRandomMiniGame } from '../../../../utils/MiniGamePicker.js';

// MG1 — Select Medicines: drag 3 correct bottles into tray, avoid 2 wrong ones
export class L3_MG1_MedicineScene extends Phaser.Scene {
  constructor() { super('L3_MG1'); }

  create() {
    generateL3Assets(this);
    this.cameras.main.setBackgroundColor('#0d1620');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(W / 2, H / 2, 'l3_hospital_bg').setDisplaySize(W, H).setDepth(-1);
    const l3Frame = applyL3Frame(this);

    this._correct = 0;
    this._wrong   = 0;
    this._done    = false;
    this._health  = this.registry.get('l3_health') || 100;

    this._buildHUD(1);
    this._buildTitle('💊 Select the correct medicines!', 'Drag GREEN bottles to the tray. Avoid RED ones.');
    this._buildTable();
    this._buildTray();
    this._buildBottles();
    // Random mini-game from Level 3's slice of the 40 games overlays on top —
    // no intro/ending screen. It must finish before the medicine-tray puzzle
    // built above is reachable (the iframe overlay blocks pointer input on it
    // while open); on close it just steps aside into that real care step, and
    // the decorative gold frame goes with it — only the arcade activity gets it.
    launchRandomMiniGame(this, 3, () => { l3Frame?.setVisible(false); });

    // Gamma on bed
    if (this.textures.exists('gemma_idle')) {
      this.add.image(620, H - 52, 'gemma_idle').setDisplaySize(130, 72).setOrigin(0.5, 1).setDepth(8).setTint(0xffdddd);
    }
  }

  // Stainless-steel medical counter the bottles & tray rest on
  _buildTable() {
    const g = this.add.graphics().setDepth(3);
    const topY = 250, left = 116, right = 684, w = right - left;
    // Cabinet body
    g.fillStyle(0x1e2a38, 1); g.fillRect(left, topY, w, 80);
    g.fillStyle(0x16202c, 0.6); g.fillRect(left, topY + 62, w, 18);          // lower shadow
    // Cabinet door seams
    g.lineStyle(1.5, 0x101820, 0.8);
    for (let dx = left; dx <= right; dx += 95) g.lineBetween(dx, topY + 12, dx, topY + 72);
    // Door handles
    g.fillStyle(0x7a8ea2, 0.9);
    for (let dx = left + 70; dx < right; dx += 95) g.fillRoundedRect(dx, topY + 32, 5, 18, 2);
    // Steel counter top
    g.fillStyle(0x4a5c70, 1);  g.fillRoundedRect(left - 8, topY - 14, w + 16, 18, 5);
    g.fillStyle(0x6b8096, 0.8); g.fillRoundedRect(left - 8, topY - 14, w + 16, 6, 4);  // top shine
    g.fillStyle(0x2c3a48, 0.7); g.fillRect(left - 8, topY + 2, w + 16, 2);             // bottom edge
  }

  _buildTray() {
    const trayX = 575, trayY = 216;
    const bg = this.add.graphics().setDepth(5);
    // Metal medical tray — outer rim + inner well
    bg.fillStyle(0x3a4c5e, 1);   bg.fillRoundedRect(trayX - 100, trayY - 36, 200, 72, 10);
    bg.fillStyle(0x6b8096, 0.7);  bg.fillRoundedRect(trayX - 100, trayY - 36, 200, 7, 6);   // rim shine
    bg.fillStyle(0x223040, 1);    bg.fillRoundedRect(trayX - 90, trayY - 28, 180, 56, 7);    // inner well
    bg.lineStyle(2, 0x88ffaa, 0.5); bg.strokeRoundedRect(trayX - 90, trayY - 28, 180, 56, 7);
    // Slot guides
    bg.lineStyle(1, 0x3a6a4a, 0.5);
    [trayX - 56, trayX, trayX + 56].forEach(sx => bg.strokeRect(sx - 22, trayY - 22, 44, 44));

    this.add.text(trayX, trayY - 50, '🧪 MEDICINE TRAY', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88ffaa', stroke: '#06120c', strokeThickness: 2
    }).setOrigin(0.5).setDepth(6);

    this._trayZone = new Phaser.Geom.Rectangle(trayX - 100, trayY - 36, 200, 72);
    this._trayX = trayX; this._trayY = trayY;
    this._traySlots = [trayX - 56, trayX, trayX + 56].map(x => ({ x, y: trayY, filled: false }));
  }

  _buildBottles() {
    // 3 correct (green) + 2 wrong (red), shuffled positions
    const items = [
      { key: 'l3_med_ok',    correct: true  },
      { key: 'l3_med_ok',    correct: true  },
      { key: 'l3_med_ok',    correct: true  },
      { key: 'l3_med_wrong', correct: false },
      { key: 'l3_med_wrong', correct: false },
    ];
    Phaser.Utils.Array.Shuffle(items);

    const startX = 152, gap = 70, baseY = 213;
    this._bottles = [];

    items.forEach((it, i) => {
      const ox = startX + i * gap, oy = baseY;
      const img = this.add.image(ox, oy, it.key).setDisplaySize(42, 74).setDepth(10).setInteractive({ useHandCursor: true });
      img._correct = it.correct;
      img._origX = ox; img._origY = oy;
      img._used = false;
      this.input.setDraggable(img);
      this._bottles.push(img);

      // Pulse for correct
      if (it.correct) {
        this.tweens.add({ targets: img, y: oy - 5, duration: 550, yoyo: true, repeat: -1 });
      }
    });

    this.input.on('drag', (ptr, obj, dx, dy) => {
      if (obj._used || this._done) return;
      obj.x = dx; obj.y = dy;
    });

    this.input.on('dragend', (ptr, obj) => {
      if (obj._used || this._done) return;
      if (this._trayZone.contains(obj.x, obj.y)) {
        if (obj._correct) {
          this._placeCorrect(obj);
        } else {
          this._placeWrong(obj);
        }
      } else {
        // Snap back
        this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, duration: 200 });
      }
    });
  }

  _placeCorrect(obj) {
    const slot = this._traySlots.find(s => !s.filled);
    if (!slot) return;
    slot.filled = true;
    obj._used = true;
    this.tweens.killTweensOf(obj);
    this.tweens.add({ targets: obj, x: slot.x, y: slot.y, duration: 220 });
    this.cameras.main.flash(180, 30, 180, 60);
    this._correct++;
    const ok = this.add.text(obj.x, obj.y - 60, '✅ Correct!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: ok, y: ok.y - 28, alpha: 0, duration: 800, onComplete: () => ok.destroy() });

    if (this._correct >= 3) this._complete();
  }

  _placeWrong(obj) {
    obj._used = true;
    this.cameras.main.shake(300, 0.014);
    this.cameras.main.flash(300, 180, 0, 0);
    obj.setTint(0xff4444);
    this._health = Math.max(0, this._health - 10);
    this.registry.set('l3_health', this._health);
    this._updateBar();
    const err = this.add.text(obj.x, obj.y - 60, '❌ Wrong!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ff4466', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: err, y: err.y - 28, alpha: 0, duration: 800, onComplete: () => err.destroy() });
    this.tweens.add({ targets: obj, x: obj._origX, y: obj._origY, alpha: 0.35, duration: 300 });
  }

  _buildHUD(step) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x060e1a, 0.92); g.fillRoundedRect(4, 4, W - 8, 44, 6);
    g.lineStyle(1.5, 0x88aacc, 0.4); g.strokeRoundedRect(4, 4, W - 8, 44, 6);

    this.add.text(W / 2, 14, `HOSPITAL TREATMENT  —  STEP ${step} of 2`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#88aacc'
    }).setOrigin(0.5).setDepth(21);

    // Step progress dots
    for (let i = 0; i < 2; i++) {
      const dot = this.add.circle(W / 2 - 15 + i * 30, 34, 7, i < step ? 0x44aaff : 0x1a3040, 1).setDepth(21);
      dot.setStrokeStyle(1.5, 0x88aacc, 0.6);
    }

    // Health: name label on top, bar clearly below (no overlap)
    this.add.text(12, 6, '❤️ GAMMA', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ff99aa' }).setDepth(21);
    this.add.rectangle(12, 33, 100, 10, 0x330011, 1).setOrigin(0, 0.5).setDepth(21).setStrokeStyle(1, 0x88aacc, 0.4);
    this._healthBarFill = this.add.rectangle(12, 33, 100 * (this._health || 100) / 100, 10, 0xff3355, 1).setOrigin(0, 0.5).setDepth(22);
  }

  _updateBar() {
    if (this._healthBarFill) this._healthBarFill.setDisplaySize(Math.max(0, 100 * this._health / 100), 10);
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
    this.cameras.main.flash(500, 30, 180, 60);
    const ok = this.add.text(W / 2, H / 2 - 20, '💊 Medicines selected!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#88ffaa',
      stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: ok, scale: 1.08, duration: 300, yoyo: true, repeat: 1 });
    this.time.delayedCall(2000, () => {
      // Medicine tray ready → straight to the injection scene, no cinematic.
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L3_MG2'));
    });
  }
}

import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';

// L2 Mini-Activity 1 — Calm Gemma: choose the right action
export class L2_CalmerScene extends Phaser.Scene {
  constructor() { super('L2_Calmer'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    if (this.textures.exists('l2cal_bg')) {
      this.add.image(W / 2, H / 2, 'l2cal_bg').setDisplaySize(W, H).setDepth(-5);
    } else if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.4).setTint(0x0a150a).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.22).setDepth(-4);   // gentle darken for text legibility

    // Gleeda on left, Gemma in center (scared)
    // y=422/421: grass surface at 418, +4/+3 to compensate transparent bottom padding in PNGs
    this.add.image(120, 422, 'gleeda_idle').setDisplaySize(110, 65).setOrigin(0.5, 1).setDepth(8);
    const gemmaImg = this.add.image(420, 421, 'gemma_idle').setDisplaySize(130, 71).setOrigin(0.5, 1).setDepth(8);

    // Gemma looks scared — shake effect
    this.tweens.add({ targets: gemmaImg, x: gemmaImg.x + 4, duration: 80, yoyo: true, repeat: -1 });

    // Speech bubble above Gemma
    this.add.text(500, 278, '😰', { fontSize: '30px' }).setOrigin(0.5).setDepth(12);

    // Story panel
    this.add.rectangle(400, 50, 740, 72, 0x1a0d06, 0.92).setDepth(10).setStrokeStyle(2, 0xf5c87a, 0.5);
    this.add.text(400, 50, 'Gemma is frightened after escaping the cage!\nWhat should Gleeda do?', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#f5e0b0', align: 'center', lineSpacing: 5
    }).setOrigin(0.5).setDepth(11);

    const choices = [
      { tex: 'l2cal_speak', label: 'Speak softly', desc: 'Calm voice', color: 0x163a12, border: 0x4a9a38, correct: true  },
      { tex: 'l2cal_bark',  label: 'Bark loudly',  desc: 'Make noise', color: 0x3a1410, border: 0xaa3838, correct: false },
      { tex: 'l2cal_run',   label: 'Run towards',  desc: 'Move fast',  color: 0x142440, border: 0x3a6aaa, correct: false },
    ];

    this._done = false;

    choices.forEach((c, i) => {
      const bx = 160 + i * 240;
      const by = 300;
      const cw = 200, ch = 184;

      // Rounded storybook card (graphics) inside a container so it scales as one
      const cont = this.add.container(bx, by).setDepth(10);
      const panel = this.add.graphics();
      panel.fillStyle(c.color, 0.92); panel.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 16);
      panel.lineStyle(3, c.border, 1); panel.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 16);
      panel.fillStyle(0xffffff, 0.06); panel.fillRoundedRect(-cw / 2 + 6, -ch / 2 + 6, cw - 12, 30, 10);

      const ic = this.textures.get(c.tex).getSourceImage();
      const ih = 78, iw = ih * (ic.width / ic.height);
      const icon = this.add.image(0, -34, c.tex).setDisplaySize(Math.min(iw, 130), ih);
      const lbl = this.add.text(0, 44, c.label, { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5e0b0' }).setOrigin(0.5);
      const dsc = this.add.text(0, 66, c.desc, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#cdbfa0' }).setOrigin(0.5);
      cont.add([panel, icon, lbl, dsc]);

      const hit = this.add.rectangle(bx, by, cw, ch, 0xffffff, 0.001).setDepth(11).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => cont.setScale(1.05));
      hit.on('pointerout',  () => cont.setScale(1));
      hit.on('pointerup', () => {
        if (this._done) return;
        this._done = true;
        if (c.correct) this._correct(gemmaImg, bx, by);
        else           this._wrong(cont, bx, by);
      });

      cont.setScale(0);
      this.tweens.add({ targets: cont, scale: 1, duration: 420, delay: 300 + i * 160, ease: 'Back.easeOut' });
    });

    this.add.text(400, 420, 'Choose wisely — Gemma is scared!', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c9956b'
    }).setOrigin(0.5).setDepth(10);
  }

  _correct(gemmaImg, bx, by) {
    this.cameras.main.flash(350, 60, 200, 80);

    // Gemma calms down — stops shaking
    this.tweens.killTweensOf(gemmaImg);

    for (let i = 0; i < 10; i++) {
      const sp = this.add.image(bx + (Math.random() - 0.5) * 160, by + (Math.random() - 0.5) * 100, 'sparkle').setDepth(20).setScale(1.6);
      this.tweens.add({ targets: sp, y: sp.y - 60, alpha: 0, duration: 700, delay: i * 40, onComplete: () => sp.destroy() });
    }

    const h = this.add.image(420, 310, 'heart').setDepth(30).setScale(0.7);
    this.tweens.add({ targets: h, y: 265, alpha: 0, duration: 900, onComplete: () => h.destroy() });

    const total = (this.registry.get('points') || 0) + 2;
    this.registry.set('points', total);
    const tick = this.add.text(bx, by - 130, '✅ Good choice!', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#88ff88', stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: tick, alpha: 1, y: tick.y - 10, duration: 400 });
    const pts = this.add.text(bx, by - 104, `+2 ⭐  (Total: ${total})`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: pts, alpha: 1, duration: 400, delay: 200 });

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L2_Feed'));
    });
  }

  _wrong(cont, bx, by) {
    this.cameras.main.shake(400, 0.012);

    // red flash over the chosen card
    const flash = this.add.graphics();
    flash.fillStyle(0xff2020, 0.4); flash.fillRoundedRect(-100, -92, 200, 184, 16);
    cont.add(flash);
    this.tweens.add({ targets: flash, alpha: 0, duration: 550, onComplete: () => flash.destroy() });

    const cross = this.add.text(bx, by - 130, '❌ That scared her more!', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ff8888', stroke: '#0a0502', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: cross, alpha: 1, duration: 300 });
    this.tweens.add({ targets: cont, x: bx + 8, duration: 80, yoyo: true, repeat: 4 });

    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(450, () => this.scene.restart());
    });
  }
}

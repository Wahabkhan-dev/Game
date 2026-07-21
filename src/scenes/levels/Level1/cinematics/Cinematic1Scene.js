import Phaser from 'phaser';

export class Cinematic1Scene extends Phaser.Scene {
  constructor() { super('Cinematic1'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0502');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const panels = [
      { text: "A quiet forest...\nRain falls softly.", delay: 0 },
      { text: "Gemma is trapped.\nScared and alone.", delay: 2200 },
      { text: "A snake approaches\nher cage... slowly.", delay: 4600 },
      { text: "But Shadow sees.\nHe won't let her down.", delay: 7200 },
      { text: "Chapter 1:\n'The Warning'", delay: 9800, title: true }
    ];

    this.add.rectangle(400, 225, 800, 450, 0x050e05).setDepth(-6);
    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.85).setTint(0x0a150a).setDepth(-5);
    }
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.5).setDepth(-4);

    this._rainData = [];
    for (let i = 0; i < 80; i++) {
      const r = this.add.image(Math.random() * 800, Math.random() * 450, 'raindrop');
      r.setAlpha(0.2 + Math.random() * 0.2);
      this._rainData.push({ img: r, speed: 4 + Math.random() * 3 });
    }

    // Drawn cage — same style as feed round, no generated image
    const cinGx = 480, cinGy = 390, cinCW = 110, cinCH = 100;
    const cinCL = cinGx - cinCW / 2, cinCT = cinGy - cinCH;
    const cageBack = this.add.graphics().setDepth(4).setAlpha(0);
    cageBack.fillStyle(0x1a1208, 1);
    cageBack.fillRect(cinCL, cinCT, cinCW, cinCH);
    cageBack.lineStyle(3, 0x2a2010, 0.9);
    for (let r = 1; r <= 3; r++) {
      const by = cinCT + (cinCH / 4) * r;
      cageBack.lineBetween(cinCL + 4, by, cinCL + cinCW - 4, by);
    }
    const gemma  = this.add.image(cinGx, cinGy, 'gemma_idle').setDisplaySize(110, 60).setAlpha(0).setDepth(5).setOrigin(0.5, 1);
    const cageFront = this.add.graphics().setDepth(6).setAlpha(0);
    { const bc = 6, bg = cinCW / (bc + 1);
      cageFront.lineStyle(5, 0x4a3a18, 1);
      for (let b = 1; b <= bc; b++) { const bx = cinCL + bg * b; cageFront.lineBetween(bx, cinCT + 3, bx, cinGy - 2); }
      cageFront.lineStyle(6, 0x4a3a18, 1);
      cageFront.lineBetween(cinCL, cinCT + 3, cinCL + cinCW, cinCT + 3);
      cageFront.lineBetween(cinCL, cinCT + cinCH * 0.45, cinCL + cinCW, cinCT + cinCH * 0.45);
      cageFront.lineBetween(cinCL, cinGy - 2, cinCL + cinCW, cinGy - 2);
      cageFront.lineStyle(2, 0xc8a040, 0.4);
      for (let b = 1; b <= bc; b++) { const bx = cinCL + bg * b - 1; cageFront.lineBetween(bx, cinCT + 3, bx, cinGy - 2); }
    }
    const snake  = this.add.image(300, 378, 'snake').setDisplaySize(110, 34).setAlpha(0);
    const shadow = this.add.image(100, 352, 'shadow_idle').setDisplaySize(150, 82).setAlpha(0);

    this.panelText = this.add.text(400, 60, '', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: '#e8d0a8', stroke: '#0a0502', strokeThickness: 3,
      align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    this.add.rectangle(400, 22, 800, 44, 0x000000, 0.85);
    this.add.rectangle(400, 428, 800, 44, 0x000000, 0.85);

    panels.forEach((p, i) => {
      this.time.delayedCall(p.delay, () => {
        this.cameras.main.fadeIn(400, 0, 0, 0);
        if (p.title) this.panelText.setStyle({ fontSize: '24px', color: '#f5c87a' });
        this.panelText.setText(p.text);
        this.tweens.add({ targets: this.panelText, alpha: { from: 0, to: 1 }, duration: 600 });

        if (i === 1) this.tweens.add({ targets: [cageBack, gemma, cageFront], alpha: 1, duration: 800 });
        if (i === 2) this.tweens.add({ targets: snake, alpha: 1, duration: 800, x: { from: 220, to: 360 } });
        if (i === 3) this.tweens.add({ targets: shadow, alpha: 1, duration: 800 });

        if (i < panels.length - 1) {
          this.time.delayedCall(p.delay + 1900, () => {
            this.tweens.add({ targets: this.panelText, alpha: 0, duration: 400 });
          });
        }
      });
    });

    const skipTxt = this.add.text(700, 420, '[ Skip ]', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#7a6040'
    }).setInteractive({ useHandCursor: true });
    skipTxt.on('pointerup', () => this._startGame());

    this.time.delayedCall(11800, () => this._startGame());
  }

  _startGame() {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('Level1'));
  }

  update() {
    if (!this._rainData) return;
    for (const r of this._rainData) {
      r.img.y += r.speed;
      if (r.img.y > 460) { r.img.y = -10; r.img.x = Math.random() * 800; }
    }
  }
}

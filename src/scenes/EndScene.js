import Phaser from 'phaser';

export class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#0d0806');
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    if (this.textures.exists('jungle_bg')) {
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.5).setTint(0x0d1a0d).setDepth(-5);
      this.add.image(400, 225, 'jungle_bg').setDisplaySize(800, 450).setAlpha(0.78).setDepth(-4);
    }
    this.add.rectangle(400, 40, 800, 100, 0x000000, 0.55).setDepth(-3);
    this.add.rectangle(400, 430, 800, 50, 0x000000, 0.5).setDepth(-3);
    for (let x = 0; x < 800; x += 32) this.add.image(x + 16, 434, 'ground').setDisplaySize(32, 32);

    this.add.image(300, 358, 'shadow_idle').setDisplaySize(150, 82).setDepth(5);
    this.add.image(490, 388, 'gemma_happy').setDisplaySize(110, 60).setDepth(5);

    this.time.addEvent({
      delay: 600, loop: true, callback: () => {
        const h = this.add.image(400, 330 + Math.random() * 20, 'heart').setDepth(10).setScale(0.8 + Math.random() * 0.4);
        this.tweens.add({ targets: h, y: h.y - 60, alpha: 0, duration: 1200, onComplete: () => h.destroy() });
      }
    });

    this.add.rectangle(400, 22, 800, 44, 0x000000, 0.8);
    this.add.rectangle(400, 428, 800, 44, 0x000000, 0.8);

    const lines = [
      { t: 0,    text: '"Gemma is safe."',             size: '28px', color: '#f5c87a' },
      { t: 2000, text: 'Shadow never left her side.',  size: '18px', color: '#e8d0a8' },
      { t: 4000, text: 'A bond of love.\nA life saved.', size: '22px', color: '#f5c87a' },
      { t: 6500, text: '🐾  Thank you for playing  🐾', size: '20px', color: '#c9956b' },
      { t: 8500, text: "Gemma's Story",                size: '36px', color: '#f5c87a' },
    ];

    lines.forEach(l => {
      this.time.delayedCall(l.t, () => {
        const txt = this.add.text(400, 60, l.text, {
          fontSize: l.size, fontFamily: 'Georgia, serif',
          color: l.color, stroke: '#0a0502', strokeThickness: 3,
          align: 'center', lineSpacing: 8
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: txt, alpha: 1, duration: 800 });
        this.tweens.add({ targets: txt, alpha: 0, delay: 1800, duration: 600, onComplete: () => txt.destroy() });
      });
    });

    this.time.delayedCall(10500, () => {
      this.cameras.main.fadeIn(400);
      const btn = this.add.image(400, 380, 'button_bg').setInteractive({ useHandCursor: true });
      const txt = this.add.text(400, 380, '🐾 Play Again', {
        fontSize: '18px', fontFamily: 'Georgia, serif',
        color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
      }).setOrigin(0.5);
      this.tweens.add({ targets: [btn, txt], alpha: { from: 0, to: 1 }, duration: 600 });
      btn.on('pointerup', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(550, () => this.scene.start('Menu'));
      });
      btn.on('pointerover', () => { btn.setScale(1.05); txt.setScale(1.05); });
      btn.on('pointerout',  () => { btn.setScale(1);    txt.setScale(1); });
    });

    this.time.addEvent({
      delay: 400, loop: true, callback: () => {
        const leaf = this.add.image(Math.random() * 800, -10, 'leaf').setAlpha(0.6).setDepth(15);
        this.tweens.add({
          targets: leaf, y: 460, x: `+=${(Math.random() - 0.5) * 80}`,
          rotation: `+=${Math.PI * 3}`, alpha: 0,
          duration: 3500 + Math.random() * 2000,
          onComplete: () => leaf.destroy()
        });
      }
    });
  }
}

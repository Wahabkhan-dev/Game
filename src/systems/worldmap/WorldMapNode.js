// WorldMapNode — one interactive node per level, placeholder-styled (plain
// Phaser shapes + emoji, no external art yet) but matching the reference
// layout exactly: locked/current nodes show their level number with a small
// corner padlock badge when locked; completed nodes show a paw glyph with a
// 3-star row underneath instead of a number. Bonus/treasure/boss keep their
// own icon identity regardless of state.
import Phaser from 'phaser';

const PALETTE = {
  locked:    { fill: 0x5a6478, ring: 0xd4a040, glow: 0x000000 },
  current:   { fill: 0x3aa0e8, ring: 0xffe27a, glow: 0x6fd0ff },
  completed: { fill: 0xd9a12e, ring: 0xffe27a, glow: 0x9be79e },
  bonus:     { fill: 0xb46be0, ring: 0x7a3aa8, glow: 0xe0b6ff },
  treasure:  { fill: 0xe0a83a, ring: 0xa8781a, glow: 0xffe08a },
  boss:      { fill: 0xd6402c, ring: 0x8f1c10, glow: 0xff7a5c },
};

export class WorldMapNode {
  // status: 'locked' | 'current' | 'completed'
  constructor(scene, data, status, onPlay) {
    this.scene = scene;
    this.data = data;
    this.status = status;
    this.onPlay = onPlay;
    this.container = scene.add.container(data.x, data.y).setDepth(10);
    this._build();
  }

  _paletteKey() {
    if (this.status === 'locked') return 'locked';
    if (this.status === 'current') return 'current';
    if (this.data.type === 'bonus') return 'bonus';
    if (this.data.type === 'treasure') return 'treasure';
    if (this.data.type === 'boss') return 'boss';
    return 'completed';
  }

  // Locked/current nodes show their level number (like the reference); only
  // completed normal levels swap the number for a paw glyph. Special node
  // types (bonus/treasure/boss) keep their own icon in every state.
  _centerGlyph() {
    if (this.data.type === 'bonus') return '🎁';
    if (this.data.type === 'treasure') return '💎';
    if (this.data.type === 'boss') return '👑';
    if (this.status === 'completed') return '🐾';
    return `${this.data.id}`;
  }

  _build() {
    const s = this.scene, c = this.container;
    const pal = PALETTE[this._paletteKey()];
    const R = this.status === 'current' ? 40 : (this.data.type === 'boss' ? 44 : 34);

    if (this.status === 'current') {
      this.glow = s.add.circle(0, 0, R + 18, pal.glow, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      c.add(this.glow);
    }

    c.add(s.add.ellipse(0, R * 0.9, R * 1.5, R * 0.5, 0x000000, 0.28));

    const ring = s.add.circle(0, 0, R + 5, pal.ring);
    const fill = s.add.circle(0, 0, R, pal.fill);
    c.add(ring); c.add(fill);

    const glyphSize = this.status === 'completed' ? R * 0.9 : R * 0.8;
    c.add(s.add.text(0, this.status === 'completed' ? -6 : 0, this._centerGlyph(), {
      fontFamily: 'Georgia, serif', fontSize: `${glyphSize}px`, color: '#fff8ec',
      stroke: '#2a1a0e', strokeThickness: 3,
    }).setOrigin(0.5));

    if (this.status === 'completed') {
      const earned = Phaser.Math.Clamp(this.data.stars ?? 3, 0, 3);
      for (let i = 0; i < 3; i++) {
        c.add(s.add.text((i - 1) * 15, R * 0.6, '⭐', { fontSize: '13px' }).setOrigin(0.5).setAlpha(i < earned ? 1 : 0.3));
      }
    }

    if (this.status === 'locked') {
      const bx = R * 0.62, by = R * 0.62;
      c.add(s.add.circle(bx, by, 13, 0x2a1608).setStrokeStyle(2, 0xd4a040, 0.9));
      c.add(s.add.text(bx, by, '🔒', { fontSize: '13px' }).setOrigin(0.5));
    }

    const hit = s.add.circle(0, 0, R + 8, 0, 0).setInteractive({ useHandCursor: this.status !== 'locked' });
    c.add(hit);
    hit.on('pointerup', () => this._handleTap());

    if (this.status === 'current') this._pulse(ring);
    this._float();
  }

  _pulse(ring) {
    this.scene.tweens.add({ targets: this.glow, scale: { from: 0.9, to: 1.15 }, alpha: { from: 0.35, to: 0.12 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: ring, scaleX: { from: 1, to: 1.06 }, scaleY: { from: 1, to: 1.06 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _float() {
    this.scene.tweens.add({
      targets: this.container, y: this.data.y - 6,
      duration: 1600 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _handleTap() {
    if (this.status === 'locked') {
      this.scene.tweens.add({ targets: this.container, x: this.data.x - 6, duration: 60, yoyo: true, repeat: 3 });
      return;
    }
    this.onPlay?.(this.data);
  }

  // Rebuilds visuals for a new status (e.g. current → completed on unlock).
  setStatus(status) {
    this.status = status;
    this.container.removeAll(true);
    this._build();
  }

  destroy() { this.container.destroy(); }
}

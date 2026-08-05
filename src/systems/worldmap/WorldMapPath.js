// WorldMapPath — draws the winding road connecting every node as a smooth
// spline. Two graphics layers: a neutral "unfinished" road, and a gold
// "completed" overlay redrawn up to the player's current progress, with a
// short sparkle burst played at the leading edge on unlock.
import Phaser from 'phaser';

const SAMPLE_POINTS = 240;

export class WorldMapPath {
  constructor(scene, nodes) {
    this.scene = scene;
    this.nodes = nodes;
    this.curve = new Phaser.Curves.Spline(nodes.map((n) => new Phaser.Math.Vector2(n.x, n.y)));
    this.samples = this.curve.getPoints(SAMPLE_POINTS);

    this.neutral = scene.add.graphics().setDepth(1);
    this.gold = scene.add.graphics().setDepth(2);
    this._drawNeutral();
  }

  _drawNeutral() {
    this.neutral.clear();
    this.neutral.lineStyle(24, 0x7a6242, 0.95);
    this.curve.draw(this.neutral, SAMPLE_POINTS);
    this.neutral.lineStyle(15, 0xb9a06a, 0.95);
    this.curve.draw(this.neutral, SAMPLE_POINTS);
  }

  // progressT in [0,1] — how far along the full path the gold fill reaches.
  setProgress(progressT, { sparkle = false } = {}) {
    this.gold.clear();
    if (progressT <= 0) return;

    const count = Math.max(2, Math.ceil(this.samples.length * progressT) + 1);
    const pts = this.samples.slice(0, count);

    this.gold.lineStyle(17, 0xd89a1a, 1);
    this.gold.strokePoints(pts, false);
    this.gold.lineStyle(9, 0xf5c840, 1);
    this.gold.strokePoints(pts, false);
    this.gold.lineStyle(3, 0xfff6d0, 0.9);
    this.gold.strokePoints(pts, false);

    if (sparkle) this._burstSparkles(pts[pts.length - 1]);
  }

  // Short-lived burst of small glowing dots at the leading edge of the gold
  // fill — kept brief and localized (not a continuous emitter along the
  // whole path) so it stays cheap even once the map has hundreds of nodes.
  _burstSparkles(at) {
    if (!at) return;
    const s = this.scene;
    for (let i = 0; i < 10; i++) {
      const dot = s.add.circle(at.x, at.y, 3, 0xfff6d0, 1).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(20, 60);
      s.tweens.add({
        targets: dot,
        x: at.x + Math.cos(angle) * dist,
        y: at.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 500 + Math.random() * 300,
        ease: 'Cubic.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }
}

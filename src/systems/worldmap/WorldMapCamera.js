// WorldMapCameraController — drag/swipe/wheel scrolling with inertia and
// clamped bounds, plus a tween-based focusOn() used to auto-scroll to the
// current level whenever the map opens or a level unlocks.
import Phaser from 'phaser';

const FRICTION = 0.92;
const STOP_THRESHOLD = 0.05;

export class WorldMapCameraController {
  // bounds: { minX, maxX, minY, maxY } in world coordinates.
  constructor(scene, bounds) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.bounds = bounds;
    this.cam.setBounds(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

    this.dragging = false;
    this.lastPointer = null;
    this.velocity = { x: 0, y: 0 };
    this._focusTween = null;

    this._wire();
  }

  _wire() {
    const s = this.scene;
    s.input.on('pointerdown', (p) => {
      this.dragging = true;
      this.lastPointer = { x: p.x, y: p.y };
      this.velocity = { x: 0, y: 0 };
      this._focusTween?.stop();
    });
    s.input.on('pointermove', (p) => {
      if (!this.dragging || !p.isDown) return;
      const dx = p.x - this.lastPointer.x;
      const dy = p.y - this.lastPointer.y;
      this.cam.scrollX -= dx;
      this.cam.scrollY -= dy;
      this.velocity = { x: dx, y: dy };
      this.lastPointer = { x: p.x, y: p.y };
    });
    s.input.on('pointerup', () => { this.dragging = false; });
    s.input.on('pointerupoutside', () => { this.dragging = false; });

    s.input.on('wheel', (_pointer, _objs, _dx, dy) => {
      this._focusTween?.stop();
      this.cam.scrollY += dy * 0.6;
      this.velocity = { x: 0, y: 0 };
    });
  }

  // Called once per frame from the scene's update().
  update() {
    if (this.dragging) return;
    if (Math.abs(this.velocity.x) > STOP_THRESHOLD || Math.abs(this.velocity.y) > STOP_THRESHOLD) {
      this.cam.scrollX -= this.velocity.x;
      this.cam.scrollY -= this.velocity.y;
      this.velocity.x *= FRICTION;
      this.velocity.y *= FRICTION;
    }
  }

  focusOn(x, y, duration = 900) {
    const maxScrollX = Math.max(this.bounds.minX, this.bounds.maxX - this.cam.width);
    const maxScrollY = Math.max(this.bounds.minY, this.bounds.maxY - this.cam.height);
    const targetX = Phaser.Math.Clamp(x - this.cam.width / 2, this.bounds.minX, maxScrollX);
    const targetY = Phaser.Math.Clamp(y - this.cam.height / 2, this.bounds.minY, maxScrollY);

    this._focusTween?.stop();
    this._focusTween = this.scene.tweens.add({
      targets: this.cam, scrollX: targetX, scrollY: targetY,
      duration, ease: 'Cubic.easeOut',
    });
  }
}

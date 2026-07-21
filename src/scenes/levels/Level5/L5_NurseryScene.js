import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL5Assets } from './L5Assets.js';
import { applyModalFrame } from '../ModalFrame.js';
import { addStandaloneMenuButton } from '../../../hud/premium/PremiumTheme.js';

// ── Level 5 · Scene 4 — NURSERY SETUP → FINAL CUTSCENE ───────────────────────
// Drag 5 nursery items into place; the room grows warmer & prettier as it fills.
// Then the emotional finale: rain stops, sunlight, Gamma + 7 puppies, "A New
// Family Is Born".
const ITEMS = [
  { icon: '🛏️', label: 'Bed',     tx: 250, ty: 320 },
  { icon: '🧸', label: 'Toys',    tx: 350, ty: 330 },
  { icon: '🥣', label: 'Bowls',   tx: 450, ty: 332 },
  { icon: '🎀', label: 'Decor',   tx: 550, ty: 318 },
  { icon: '🧣', label: 'Blankets',tx: 320, ty: 360 },
];

export class L5_NurseryScene extends Phaser.Scene {
  constructor() { super('L5_Nursery'); }

  create(data) {
    generateL5Assets(this);
    this._stars = (data && data.stars) || 0;
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // The conclusion cinematic already tells the "puppies arrive" story —
    // skip straight to the finale + reward (no extra decorating busywork).
    if (data && data.skipDecorate) { this._finale(); return; }

    if (this.textures.exists('l5_garage_bg'))
      this.add.image(W / 2, H / 2, 'l5_garage_bg').setDisplaySize(W, H).setDepth(-30).setTint(0xc8c0d0);
    else this.add.rectangle(W / 2, H / 2, W, H, 0x241c2a, 1).setDepth(-30);
    this._dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0814, 0.4).setDepth(-29);
    this._warm = this.add.rectangle(W / 2, H / 2, W, H, 0xffb060, 0).setDepth(-28);
    // Gold border frame (shared Level-1 modal art) — decorative, never blocks input
    applyModalFrame(this, 1);
    addStandaloneMenuButton(this);

    this.add.text(W / 2, 26, '🏡 Nursery Setup', { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffd0e4', stroke: '#2a0818', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);
    this._sub = this.add.text(W / 2, 52, 'Drag each item into the nursery to make it cozy', { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#e8d0e8', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(40);

    // target zone outline
    const zone = this.add.graphics().setDepth(2);
    zone.lineStyle(2, 0x88ddaa, 0.4); zone.strokeRoundedRect(200, 280, 400, 110, 14);
    this.add.text(400, 270, 'Nursery', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#88ddaa' }).setOrigin(0.5).setDepth(2);

    this._placed = 0;
    ITEMS.forEach((it, i) => {
      const ix = 130 + i * 110, iy = 150;
      const obj = this.add.text(ix, iy, it.icon, { fontSize: '34px' }).setOrigin(0.5).setDepth(10).setInteractive({ draggable: true, useHandCursor: true });
      this.add.text(ix, iy + 28, it.label, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#cfe0f5' }).setOrigin(0.5).setDepth(10);
      this.input.setDraggable(obj);
      const home = { x: ix, y: iy };
      obj.on('drag', (p, x, y) => { obj.x = x; obj.y = y; });
      obj.on('dragend', () => {
        if (it.done) return;
        if (obj.x > 200 && obj.x < 600 && obj.y > 270 && obj.y < 395) {
          it.done = true; obj.disableInteractive();
          this.tweens.add({ targets: obj, x: it.tx, y: it.ty, duration: 250, ease: 'Back.easeOut' });
          this._placed++;
          // room grows warmer with each item
          this.tweens.add({ targets: this._warm, alpha: 0.06 * this._placed, duration: 400 });
          this.tweens.add({ targets: this._dim, alpha: Math.max(0.1, 0.4 - this._placed * 0.07), duration: 400 });
          this._sparkle(it.tx, it.ty);
          this.cameras.main.flash(100, 120, 100, 40);
          if (this._placed >= ITEMS.length) { this._sub.setText('The nursery is ready… 💛'); this.time.delayedCall(1200, () => this._finale()); }
        } else { this.tweens.add({ targets: obj, x: home.x, y: home.y, duration: 250, ease: 'Back.easeOut' }); }
      });
    });
  }

  // ── FINAL CUTSCENE ────────────────────────────────────────────────────────────
  _finale() {
    this.children.removeAll();
    this.cameras.main.fadeIn(600, 0, 0, 0);

    if (this.textures.exists('l5_garage_bg'))
      this.add.image(W / 2, H / 2, 'l5_garage_bg').setDisplaySize(W, H).setDepth(-30).setTint(0xfff2d8);
    else this.add.rectangle(W / 2, H / 2, W, H, 0x3a2a16, 1).setDepth(-30);

    // ── Display the Level 4 doghouse (built earlier, now home for puppies) ──
    if (this.textures.exists('l4_house_finished')) {
      const src = this.textures.get('l4_house_finished').getSourceImage();
      const hh = 200; // house height (larger in finale)
      const hw = hh * (src.width / src.height); // maintain aspect ratio
      const hx = W / 2 + 180, hy = 240; // position on right-center, visible background
      this.add.ellipse(hx + 4, hy + 8, hw * 0.85, 20, 0x000000, 0.2).setDepth(2); // shadow
      this.add.image(hx, hy, 'l4_house_finished').setOrigin(0.5, 1).setDisplaySize(hw, hh).setDepth(3).setAlpha(0.95);
    }

    // sunlight rays
    for (const rx of [150, 640]) {
      const ray = this.add.graphics().setDepth(-20);
      ray.fillStyle(0xfff3b0, 0.0); ray.fillTriangle(rx, 0, rx + 140, 0, rx + 70, 320);
      this.tweens.add({ targets: ray, alpha: 0.5, duration: 1400, yoyo: true, repeat: -1 });
    }
    const sun = this.add.circle(110, 70, 200, 0xfff3b0, 0.0).setDepth(-21);
    this.tweens.add({ targets: sun, alpha: 0.3, duration: 2000 });

    this.add.text(W / 2, 40, '🐾 Gamma\'s Seven Puppies', { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ffd86a', stroke: '#3a1e08', strokeThickness: 4 }).setOrigin(0.5).setDepth(20).setAlpha(0).setData('fin', 1);

    // Gamma on her bed + Gleenda
    const gy = 360;
    this.add.ellipse(W / 2, gy + 16, 360, 38, 0x000000, 0.18).setDepth(2);
    if (this.textures.exists('gemma_happy')) this.add.image(W / 2, gy, 'gemma_happy').setOrigin(0.5, 1).setDisplaySize(170, 94).setDepth(5);
    else this.add.text(W / 2, gy, '🐕', { fontSize: '80px' }).setOrigin(0.5, 1).setDepth(5);
    if (this.textures.exists('gleeda_idle')) this.add.image(W / 2 - 150, gy + 2, 'gleeda_idle').setOrigin(0.5, 1).setDisplaySize(86, 104).setDepth(5);

    // 7 puppies gather one by one
    const tints = [0xc8915a, 0x3a2a22, 0xf0e6d2, 0xe0b060, 0xa88858, 0x806048, 0xd8c8a8];
    const spots = [[255, 392], [335, 404], [415, 408], [495, 404], [560, 392], [300, 410], [470, 412]];
    const useImg = this.textures.exists('gemma_idle');
    spots.forEach((s, i) => this.time.delayedCall(400 + i * 280, () => {
      let pup, base;
      if (useImg) { pup = this.add.image(s[0], s[1], 'gemma_idle').setOrigin(0.5, 1).setDisplaySize(56, 33).setDepth(6).setTint(tints[i]); base = pup.scaleX; pup.setScale(base * 0.2); this.tweens.add({ targets: pup, scaleX: base, scaleY: base, duration: 380, ease: 'Back.easeOut' }); }
      else { pup = this.add.text(s[0], s[1], '🐶', { fontSize: '28px' }).setOrigin(0.5, 1).setDepth(6).setScale(0.2); this.tweens.add({ targets: pup, scale: 1, duration: 380, ease: 'Back.easeOut' }); }
      const h = this.add.text(s[0], s[1] - 38, '💛', { fontSize: '15px' }).setOrigin(0.5).setDepth(7).setAlpha(0);
      this.tweens.add({ targets: h, alpha: 1, y: h.y - 22, duration: 600, yoyo: true });
      this.cameras.main.flash(110, 255, 230, 180);
    }));

    // falling hearts/petals
    this.time.addEvent({ delay: 500, repeat: 16, callback: () => {
      const x = 100 + Math.random() * (W - 200);
      const e = Phaser.Math.RND.pick(['💛', '🐾', '✨']);
      const h = this.add.text(x, 110, e, { fontSize: `${12 + Math.random() * 10}px` }).setDepth(8).setAlpha(0.9);
      this.tweens.add({ targets: h, y: h.y + 170, alpha: 0, duration: 2400, onComplete: () => h.destroy() });
    }});

    // slow camera zoom-in then captions
    this.cameras.main.zoomTo(1.12, 3000, 'Sine.easeInOut');
    this.time.delayedCall(3000, () => {
      this.add.text(W / 2, 84, 'A New Family Is Born 💛', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffe0b0', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20).setAlpha(0).setData('fin', 1);
      this.children.list.filter(c => c.getData && c.getData('fin')).forEach(c => this.tweens.add({ targets: c, alpha: 1, duration: 700 }));
      this.time.delayedCall(1400, () => this._reward());
    });
  }

  // No popup modal — the finale cutscene above (puppies gathering, "A New
  // Family Is Born") is the ending. Just settle, then quietly fade to the menu.
  _reward() {
    try { this.registry.set('points', (this.registry.get('points') || 0) + 1000); } catch (_) {}
    try { localStorage.setItem('shadowgamma_level5_done', '1'); } catch (_) {}
    this.cameras.main.zoomTo(1, 600);

    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.time.delayedCall(950, () => this.scene.start('Menu'));
    });
  }

  _sparkle(x, y) { for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 22; const s = this.add.text(x, y, '✨', { fontSize: '15px' }).setDepth(30); this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 600, onComplete: () => s.destroy() }); } }
}

import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';
import { buildWorldLayout } from '../config/worldMapConfig.js';
import { WorldMapProgress } from '../systems/worldmap/WorldMapProgress.js';
import { WorldMapPath } from '../systems/worldmap/WorldMapPath.js';
import { WorldMapNode } from '../systems/worldmap/WorldMapNode.js';
import { WorldMapCameraController } from '../systems/worldmap/WorldMapCamera.js';
import { buildWorldMapDecor } from '../systems/worldmap/WorldMapDecor.js';
import { buildWorldMapUI } from '../systems/worldmap/WorldMapUI.js';

// WorldMapScene — Candy-Crush-style scrollable level-select map. Frontend
// placeholder pass: real level completion doesn't call into this yet (see
// the "🧪 Test" button), and every visual is a plain Phaser shape standing
// in for the designer's eventual art — but the architecture (config-driven
// nodes, modular systems, drag/inertia camera, save-backed progress) is the
// real thing and scales to hundreds of levels without code changes.
export class WorldMapScene extends Phaser.Scene {
  constructor() { super('WorldMap'); }

  create() {
    this.cameras.main.setBackgroundColor('#bfe3c0');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.nodesData = buildWorldLayout(W / 2);
    this.progress = new WorldMapProgress(this.nodesData.map((n) => n.id));

    const ys = this.nodesData.map((n) => n.y);
    const xs = this.nodesData.map((n) => n.x);
    this.bounds = {
      minX: Math.min(...xs) - 220, maxX: Math.max(...xs) + 220,
      minY: Math.min(...ys) - 260, maxY: Math.max(...ys) + 260,
    };

    buildWorldMapDecor(this, this.bounds, this.nodesData);

    this.path = new WorldMapPath(this, this.nodesData);
    this._renderPathProgress();

    this.nodeObjs = this.nodesData.map((data) =>
      new WorldMapNode(this, data, this._statusFor(data.id), (nd) => this._onPlay(nd)));

    this.camCtl = new WorldMapCameraController(this, this.bounds);

    const current = this.nodesData.find((n) => n.id === this.progress.state.currentId);
    this.ui = buildWorldMapUI(this, {
      onBack: () => this._backToMenu(),
      onTestComplete: () => this._testCompleteCurrent(),
      onPlayCurrent: () => this._onPlay(this.nodesData.find((n) => n.id === this.progress.state.currentId)),
      chapterLabel: this._chapterLabelFor(current),
      playLabel: current?.label,
    });
    this.ui.setChapterFill(this._chapterProgressFor(current));

    if (current) this.time.delayedCall(150, () => this.camCtl.focusOn(current.x, current.y));
  }

  update() {
    this.camCtl?.update();
  }

  _statusFor(id) {
    if (this.progress.isCurrent(id)) return 'current';
    return this.progress.isLocked(id) ? 'locked' : 'completed';
  }

  _chapterLabelFor(node) {
    if (!node) return 'Chapter';
    return `${node.chapterTitle}`;
  }

  // Fraction of THIS node's chapter completed so far (bottom bar shows
  // chapter-local progress, e.g. "20%", not overall-map progress).
  _chapterProgressFor(node) {
    if (!node) return 0;
    const chapterNodes = this.nodesData.filter((n) => n.chapterId === node.chapterId);
    const idx = chapterNodes.findIndex((n) => n.id === node.id);
    return chapterNodes.length <= 1 ? 0 : idx / (chapterNodes.length - 1);
  }

  _renderPathProgress(opts) {
    const ids = this.nodesData.map((n) => n.id);
    const currentIdx = ids.indexOf(this.progress.state.currentId);
    const t = currentIdx <= 0 ? 0 : currentIdx / (ids.length - 1);
    this.path.setProgress(t, opts);
  }

  _onPlay(nodeData) {
    if (nodeData.bonus) {
      this._toast(`${nodeData.label} — coming soon!`);
      return;
    }
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start(nodeData.sceneKey));
  }

  // Demo-only: simulates finishing the current level so the unlock → gold
  // road fill → camera-scroll sequence can be seen without playing through
  // the real game. Wire real level EndScenes to progress.completeLevel(id)
  // to replace this once that hookup is wanted.
  _testCompleteCurrent() {
    const id = this.progress.state.currentId;
    const nextId = this.progress.completeLevel(id, 3);

    this.nodeObjs.find((n) => n.data.id === id)?.setStatus('completed');
    this._renderPathProgress({ sparkle: true });

    if (nextId != null) {
      const nextObj = this.nodeObjs.find((n) => n.data.id === nextId);
      nextObj?.setStatus('current');
      const nextData = this.nodesData.find((n) => n.id === nextId);
      this.ui.setChapterLabel(this._chapterLabelFor(nextData));
      this.ui.setPlayLabel(nextData.label);
      this.ui.setChapterFill(this._chapterProgressFor(nextData));
      this.time.delayedCall(300, () => this.camCtl.focusOn(nextData.x, nextData.y));
    } else {
      this._toast('🎉 World complete!');
    }
  }

  _backToMenu() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('Menu'));
  }

  _toast(msg) {
    const t = this.add.text(W / 2, H / 2, msg, {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff8ec',
      backgroundColor: '#140a04', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(500).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 200, yoyo: true, hold: 900, onComplete: () => t.destroy() });
  }
}

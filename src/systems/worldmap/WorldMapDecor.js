// WorldMapDecor — scatters placeholder cartoon scenery (trees, bushes,
// rocks, flowers, drifting clouds) around the path using plain Phaser
// shapes, entirely from config — no single giant background image. Every
// shape here is a 1:1 stand-in for a real sprite once the designer's art
// lands (see the asset prompt pack): same positions, only the draw function
// changes from "circle/rect" to "image".
import Phaser from 'phaser';
import { THEME_COLORS } from '../../config/worldMapConfig.js';

const TREE_LEAF_COLORS = [0x3f7d3a, 0x4c9450, 0x2e6b34];

export function buildWorldMapDecor(scene, bounds, nodesData) {
  const decorLayer = scene.add.container(0, 0).setDepth(0);
  const bgLayer = scene.add.graphics().setDepth(-2);

  _drawChapterBands(bgLayer, bounds, nodesData);

  const rand = mulberry32(1337); // deterministic seed → stable layout across reloads
  const spanY = bounds.maxY - bounds.minY;
  const decorCount = Math.max(24, Math.round(spanY / 70));

  for (let i = 0; i < decorCount; i++) {
    const y = bounds.minY + rand() * spanY;
    const side = rand() < 0.5 ? -1 : 1;
    const nearest = nodesData.reduce((a, b) => (Math.abs(a.y - y) < Math.abs(b.y - y) ? a : b));
    const x = Phaser.Math.Clamp(nearest.x + side * (110 + rand() * 140), bounds.minX + 30, bounds.maxX - 30);

    const roll = rand();
    let piece;
    if (roll < 0.4) piece = drawTree(scene, x, y, rand);
    else if (roll < 0.65) piece = drawBush(scene, x, y);
    else if (roll < 0.85) piece = drawRock(scene, x, y, rand);
    else piece = drawFlowerPatch(scene, x, y, rand);
    decorLayer.add(piece);
  }

  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const y = bounds.minY + rand() * spanY;
    const x = bounds.minX + rand() * (bounds.maxX - bounds.minX);
    const cloud = drawCloud(scene, x, y);
    decorLayer.add(cloud);
    clouds.push(cloud);
  }
  scene.tweens.add({ targets: clouds, x: '+=40', duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  return decorLayer;
}

function _drawChapterBands(g, bounds, nodesData) {
  const chapterIds = [...new Set(nodesData.map((n) => n.chapterId))];
  chapterIds.forEach((chId) => {
    const chapterNodes = nodesData.filter((n) => n.chapterId === chId);
    const theme = chapterNodes[0]?.chapterTheme;
    const colors = THEME_COLORS[theme] || THEME_COLORS.village;
    const yTop = Math.min(...chapterNodes.map((n) => n.y)) - 200;
    const yBottom = Math.max(...chapterNodes.map((n) => n.y)) + 200;
    g.fillGradientStyle(colors[1], colors[1], colors[0], colors[0], 1);
    g.fillRect(bounds.minX, yTop, bounds.maxX - bounds.minX, yBottom - yTop);
  });
}

function drawTree(scene, x, y, rand) {
  const c = scene.add.container(x, y);
  const trunk = scene.add.rectangle(0, 10, 8, 22, 0x6b4423);
  const leaves = scene.add.circle(0, -14, 20, TREE_LEAF_COLORS[Math.floor(rand() * TREE_LEAF_COLORS.length)]);
  c.add([trunk, leaves]);
  scene.tweens.add({ targets: leaves, angle: { from: -3, to: 3 }, duration: 2200 + rand() * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
}

function drawBush(scene, x, y) {
  return scene.add.circle(x, y, 12, 0x4c9450);
}

function drawRock(scene, x, y, rand) {
  return scene.add.ellipse(x, y, 26 + rand() * 10, 16 + rand() * 6, 0x8a8a8a);
}

function drawFlowerPatch(scene, x, y, rand) {
  const c = scene.add.container(x, y);
  const colors = [0xe86a8a, 0xf0c840, 0xffffff];
  for (let i = 0; i < 3; i++) {
    c.add(scene.add.circle((i - 1) * 8, rand() * 4, 3, colors[i % colors.length]));
  }
  return c;
}

function drawCloud(scene, x, y) {
  const c = scene.add.container(x, y).setAlpha(0.9);
  [[-14, 0, 14], [0, -6, 18], [14, 0, 14]].forEach(([ox, oy, r]) => c.add(scene.add.circle(ox, oy, r, 0xffffff)));
  return c;
}

// Deterministic PRNG (mulberry32) so decoration scatter is stable across reloads.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

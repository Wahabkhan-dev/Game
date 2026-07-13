// ════════════════════════════════════════════════════════════════════════════
// CheckpointBar — piece 6: dynamic checkpoint/zone progress bar. Generalizes
// L1's hardcoded 4-zone footer bar, Level 2's hand-rolled zone bar, and L5's
// hardcoded _pbMarkerDefs / L9's buildDistanceBar into ONE component that takes
// an arbitrary-length `checkpoints` array — no level hardcodes a zone count.
// ════════════════════════════════════════════════════════════════════════════
import { W, H } from '../config/GameConfig.js';

export function buildCheckpointBar(scene, theme, cfg = {}) {
  const {
    worldW,
    checkpoints = [],
    x0 = 88, x1 = W - 88, y = H - 12,
    runnerEmoji = '🐾',
    depth = 46,
  } = cfg;

  const barW = x1 - x0;
  const toX = (worldX) => x0 + Math.max(0, Math.min(1, worldX / worldW)) * barW;

  // Track shell
  const shell = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  shell.fillStyle(0x000000, 0.34); shell.fillRoundedRect(x0 - 10, y - 7, barW + 20, 12, 6);
  shell.fillStyle(theme.barTrack, 0.92); shell.fillRoundedRect(x0 - 8, y - 6, barW + 16, 10, 5);
  shell.lineStyle(1.5, theme.bannerStroke, 0.8); shell.strokeRoundedRect(x0 - 8, y - 6, barW + 16, 10, 5);

  // Fill (grows with player progress)
  const fill = scene.add.rectangle(x0, y, 2, 6, theme.barFill, 1)
    .setScrollFactor(0).setDepth(depth + 1).setOrigin(0, 0.5);

  // Optional zone-colored fill: if the checkpoints carry colors, the fill takes
  // the color of the zone the player is currently in (matches Level 1/2's
  // green→gold→red progression) — fully data-driven, no hardcoded thresholds.
  const zoneStops = checkpoints
    .filter(cp => cp.color != null)
    .map(cp => ({ x: cp.x, color: cp.color }))
    .sort((a, b) => a.x - b.x);
  const zoneColorAt = (playerWorldX) => {
    let c = theme.barFill;
    for (const z of zoneStops) { if (playerWorldX >= z.x) c = z.color; else break; }
    return c;
  };

  // Checkpoint markers
  const markers = checkpoints.map((cp) => {
    const mx = toX(cp.x);
    const g = scene.add.graphics().setScrollFactor(0).setDepth(depth + 1);
    const color = cp.color ?? 0x888888;
    const drawState = (done) => {
      g.clear();
      g.fillStyle(done ? theme.accent : color, 1);
      g.fillCircle(mx, y, 5);
      g.lineStyle(1.5, 0xffffff, done ? 0.9 : 0.4);
      g.strokeCircle(mx, y, 5);
    };
    drawState(false);
    const label = cp.label
      ? scene.add.text(mx, y - 14, cp.label, {
          fontSize: '9px', fontFamily: theme.font, color: theme.textColor,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1)
      : null;
    return { mx, drawState, label, g, done: false };
  });

  // Finish flag at the end
  const finish = scene.add.text(x1, y, '🏁', { fontSize: '12px' })
    .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

  // Runner marker
  const runner = scene.add.text(x0, y - 10, runnerEmoji, { fontSize: '12px' })
    .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);

  function update(playerWorldX) {
    const rx = toX(playerWorldX);
    fill.width = Math.max(2, rx - x0);
    runner.x = rx;
    if (zoneStops.length) fill.setFillStyle(zoneColorAt(playerWorldX));
  }

  function markDone(index) {
    const m = markers[index];
    if (!m || m.done) return;
    m.done = true;
    m.drawState(true);
  }

  function destroy() {
    shell.destroy(); fill.destroy(); finish.destroy(); runner.destroy();
    markers.forEach(m => { m.g.destroy(); m.label?.destroy(); });
  }

  return { update, markDone, destroy };
}

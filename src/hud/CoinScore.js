// ════════════════════════════════════════════════════════════════════════════
// CoinScore — piece 4: coins/score display. Reads/writes registry 'points',
// the same key BaseLevelScene and Level1/2 already use, so this stays in sync
// with any existing points logic (e.g. Level4's checkpoint-skip spend).
// ════════════════════════════════════════════════════════════════════════════

export function buildCoinScore(scene, theme, cfg = {}) {
  const {
    x = 14, y = 49, depth = 50,
    format = (n) => `⭐ ${n}`,
  } = cfg;

  const txt = scene.add.text(x, y, format(scene.registry.get('points') || 0), {
    fontSize: '13px', fontFamily: theme.font,
    color: theme.textColor, stroke: theme.textStroke, strokeThickness: 2,
  }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);

  function refresh() {
    txt.setText(format(scene.registry.get('points') || 0));
  }

  function add(n) {
    const pts = (scene.registry.get('points') || 0) + n;
    scene.registry.set('points', pts);
    refresh();
  }

  function spend(n) {
    const pts = Math.max(0, (scene.registry.get('points') || 0) - n);
    scene.registry.set('points', pts);
    refresh();
  }

  function canAfford(n) {
    return (scene.registry.get('points') || 0) >= n;
  }

  return { txt, refresh, add, spend, canAfford };
}

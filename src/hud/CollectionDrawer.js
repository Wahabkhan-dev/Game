// ════════════════════════════════════════════════════════════════════════════
// CollectionDrawer — piece 7: item-collection UI. Two modes sharing one data
// shape (`items: [{key,label,tex,w,h}]`):
//   'row'  (default) — per-item icon + checkmark, ported 1:1 from Level 4/5/6's
//           hand-rolled inline tray. itemHud[key].icon/.chk are real Image/Text
//           objects supporting the exact same .setAlpha/.setText/.setColor
//           calls the existing inline code uses, so callers that manipulate
//           them directly (e.g. Level4's _checkItems()) need zero changes.
//   'pill' — L8/L9-style aggregate "icon label n/total" badge. Not migrated
//            anywhere yet (L8/L9 keep their own buildCounterPill for now) but
//            offered here so a future phase can share the same data shape.
// ════════════════════════════════════════════════════════════════════════════
import { drawBadge } from './PanelKit.js';

export function buildCollectionDrawer(scene, theme, cfg = {}) {
  const {
    items = [],
    x, y,
    depth = 50,
    iconScale = 0.42,
    spacing = 56,
    mode = 'row',
    assignTo = '_itemHud',
    icon: pillIcon = '📦',
    label: pillLabel = 'ITEMS',
  } = cfg;

  if (mode === 'pill') {
    const total = items.length;
    const w = 200, h = 40;
    drawBadge(scene, x - w / 2, y - h / 2, w, h, theme, depth);
    const txt = scene.add.text(x, y, `${pillIcon} ${pillLabel}  0/${total}`, {
      fontSize: '13px', fontFamily: theme.font, color: theme.textColor,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

    const collected = new Set();
    function collect(key) {
      collected.add(key);
      txt.setText(`${pillIcon} ${pillLabel}  ${collected.size}/${total}`);
    }
    function reset() { collected.clear(); txt.setText(`${pillIcon} ${pillLabel}  0/${total}`); }

    return { itemHud: null, collect, reset };
  }

  // ── 'row' mode (default) ──────────────────────────────────────────────────
  const itemHud = {};
  items.forEach((it, i) => {
    const ix = x + i * spacing, iy = y;
    const icon = scene.add.image(ix, iy, it.tex)
      .setDisplaySize(it.w * iconScale, it.h * iconScale)
      .setScrollFactor(0).setDepth(depth).setAlpha(0.4);
    const chk = scene.add.text(ix, iy + 14, '0/1', {
      fontSize: '9px', fontFamily: theme.font, color: '#aab',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    itemHud[it.key] = { icon, chk };
  });

  if (assignTo) scene[assignTo] = itemHud;

  function collect(key) {
    const h = itemHud[key];
    if (!h) return;
    h.icon.setAlpha(1);
    h.chk.setText('✓').setColor('#66ff88').setFontSize(13);
  }

  function reset() {
    Object.values(itemHud).forEach(h => {
      h.icon.setAlpha(0.4);
      h.chk.setText('0/1').setColor('#aab').setFontSize(9);
    });
  }

  return { itemHud, collect, reset };
}

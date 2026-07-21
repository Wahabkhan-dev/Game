// ════════════════════════════════════════════════════════════════════════════
// HudTheme — shared color/style palette for the HUD component library.
// Each level supplies its OWN theme (via makeTheme(overrides)) so every level
// keeps its own visual identity; only the LAYOUT/behavior of src/hud/* is shared.
// SEMANTIC colors are never themed — they carry fixed meaning (HP tiers, dimmed
// hearts) the same way in every level.
// ════════════════════════════════════════════════════════════════════════════

export const SEMANTIC = {
  hpGreen: 0x33dd33, hpYellow: 0xeecc00, hpRed: 0xff3300,
  heartDimTint: 0x444444, heartDimAlpha: 0.25,
  dangerTxt: '#ff3300',
};

export const defaultTheme = {
  font: 'Georgia, serif',
  panelFill: 0x1a0904, panelFillAlpha: 0.72,
  panelStroke: 0x5a3010, panelStrokeAlpha: 0.6,
  bannerFill: 0x1a2230, bannerFillAlpha: 0.9,
  bannerStroke: 0x4a6080, bannerStrokeAlpha: 0.8,
  textColor: '#f5c87a', textStroke: '#1a0802',
  barTrack: 0x2a1a0a, barFill: 0xf5c87a,
  accent: 0xf5c87a,
};

export function makeTheme(overrides = {}) {
  return { ...defaultTheme, ...overrides };
}

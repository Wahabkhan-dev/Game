// World Map configuration — chapters + level nodes. Positions are generated
// procedurally (a winding sine-wave path) rather than hand-placed, so adding
// a new chapter with hundreds of nodes is just adding a config block below —
// no manual coordinate math and no changes to WorldMapScene/systems code.
// This is what lets the same renderer scale from 9 nodes (today) to 500+.

export const NODE_TYPES = {
  NORMAL: 'normal',
  BONUS: 'bonus',
  TREASURE: 'treasure',
  BOSS: 'boss',
};

const SPACING_Y = 230;       // vertical gap between consecutive nodes
const WAVE_AMPLITUDE = 200;  // how far the path swings left/right
const WAVE_PERIOD = 3;       // nodes per full left-right-left cycle

function waveX(index, centerX) {
  return centerX + Math.sin((index / WAVE_PERIOD) * Math.PI) * WAVE_AMPLITUDE;
}

// Each chapter maps to real scenes already in main.js's scene list — bonus/
// treasure nodes have no scene yet (`sceneKey` omitted, `bonus: true`) and
// are handled as "coming soon" stubs until that content exists.
export const CHAPTERS = [
  {
    id: 'ch1',
    title: 'The Jungle Rescue',
    theme: 'jungle',
    levels: [
      { id: 1,   sceneKey: 'IntroVideo',  label: 'Level 1', type: NODE_TYPES.NORMAL },
      { id: 2,   sceneKey: 'Level2',      label: 'Level 2', type: NODE_TYPES.NORMAL },
      { id: 'b1', label: 'Bonus',         type: NODE_TYPES.BONUS, bonus: true },
      { id: 3,   sceneKey: 'Level3',      label: 'Level 3', type: NODE_TYPES.NORMAL },
    ],
  },
  {
    id: 'ch2',
    title: 'Coming Home',
    theme: 'village',
    levels: [
      { id: 4,   sceneKey: 'L4_Intro',    label: 'Level 4', type: NODE_TYPES.NORMAL },
      { id: 5,   sceneKey: 'L5_Intro',    label: 'Level 5', type: NODE_TYPES.NORMAL },
      { id: 't1', label: 'Treasure',      type: NODE_TYPES.TREASURE, bonus: true },
      { id: 6,   sceneKey: 'Level6',      label: 'Level 6', type: NODE_TYPES.NORMAL },
    ],
  },
  {
    id: 'ch3',
    title: 'The Emergency',
    theme: 'night',
    levels: [
      { id: 7,   sceneKey: 'L7_Stage1',   label: 'Level 7', type: NODE_TYPES.BOSS },
      { id: 8,   sceneKey: 'L8_FoodRun',  label: 'Level 8', type: NODE_TYPES.NORMAL },
      { id: 9,   sceneKey: 'L9_GiftRun',  label: 'Level 9', type: NODE_TYPES.NORMAL },
    ],
  },
];

export const THEME_COLORS = {
  jungle:  [0x1f4d2b, 0x3f7d3a],
  village: [0xbfe3c0, 0x8fcf9a],
  night:   [0x1a1030, 0x2a2050],
};

// Flattens chapters into one ordered node list with generated world
// positions (index 0 = bottom/start of the map; y decreases going "up" the
// map as the player progresses, matching Candy-Crush-style vertical scroll).
export function buildWorldLayout(centerX = 400) {
  const flat = [];
  CHAPTERS.forEach((ch) => {
    ch.levels.forEach((lv) => flat.push({ ...lv, chapterId: ch.id, chapterTitle: ch.title, chapterTheme: ch.theme }));
  });

  return flat.map((node, i) => ({
    ...node,
    x: waveX(i, centerX),
    y: -i * SPACING_Y,
  }));
}

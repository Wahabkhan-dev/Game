import Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { MenuScene }       from './scenes/MenuScene.js';
import { EndScene }        from './scenes/EndScene.js';
import { IntroVideoScene }  from './scenes/levels/Level1/cinematics/IntroVideoScene.js';
import { Cinematic1Scene }  from './scenes/levels/Level1/cinematics/Cinematic1Scene.js';
import { Level1Scene }      from './scenes/levels/Level1/Level1Scene.js';
import { L1_FoodScene }     from './scenes/levels/Level1/miniactivities/L1_FoodScene.js';
import { L1_EndScene }      from './scenes/levels/Level1/miniactivities/L1_EndScene.js';
import { Cinematic2Scene }  from './scenes/levels/Level2/cinematics/Cinematic2Scene.js';
import { Level2Scene }      from './scenes/levels/Level2/Level2Scene.js';
import { L2_CalmerScene }   from './scenes/levels/Level2/miniactivities/L2_CalmerScene.js';
import { L2_FeedScene }     from './scenes/levels/Level2/miniactivities/L2_FeedScene.js';
import { L2_CatchScene }    from './scenes/levels/Level2/miniactivities/L2_CatchScene.js';
import { L2_DodgeScene }    from './scenes/levels/Level2/miniactivities/L2_DodgeScene.js';
import { L2_FirefliesScene } from './scenes/levels/Level2/miniactivities/L2_FirefliesScene.js';
import { L2_PetScene }      from './scenes/levels/Level2/miniactivities/L2_PetScene.js';
import { L2_RhythmScene }   from './scenes/levels/Level2/miniactivities/L2_RhythmScene.js';
import { L2_EndScene }      from './scenes/levels/Level2/miniactivities/L2_EndScene.js';
import { Level3Scene }            from './scenes/levels/Level3/Level3Scene.js';
import { L3_CarJourneyScene }    from './scenes/levels/Level3/L3_CarJourneyScene.js';
import { L3_MG1_MedicineScene }  from './scenes/levels/Level3/miniactivities/L3_MG1_MedicineScene.js';
import { L3_MG2_InjectionScene } from './scenes/levels/Level3/miniactivities/L3_MG2_InjectionScene.js';
import { L3_MG3_HeartScene }     from './scenes/levels/Level3/miniactivities/L3_MG3_HeartScene.js';
import { L3_MG4_OxygenScene }    from './scenes/levels/Level3/miniactivities/L3_MG4_OxygenScene.js';
import { L3_MG5_DeliveryScene }  from './scenes/levels/Level3/miniactivities/L3_MG5_DeliveryScene.js';
import { L3_EndScene }           from './scenes/levels/Level3/L3_EndScene.js';
// Level 4
import { Level4Scene }       from './scenes/levels/Level4/Level4Scene.js';
import { L4_DecorateScene }  from './scenes/levels/Level4/L4_DecorateScene.js';
import { L4_CP1Scene }       from './scenes/levels/Level4/L4_CP1Scene.js';
import { L4_CP2Scene }       from './scenes/levels/Level4/L4_CP2Scene.js';
import { L4_CP3Scene }       from './scenes/levels/Level4/L4_CP3Scene.js';
// Level 5 — Gamma's Seven Puppies (equipment run → garage treatment → puppies → nursery → final)
import { L5_EquipmentRunScene } from './scenes/levels/Level5/L5_EquipmentRunScene.js';
import { L5_CP1Scene }          from './scenes/levels/Level5/L5_CP1Scene.js';
import { L5_CP2Scene }          from './scenes/levels/Level5/L5_CP2Scene.js';
import { L5_CP3Scene }          from './scenes/levels/Level5/L5_CP3Scene.js';
import { L5_DecorateScene }     from './scenes/levels/Level5/L5_DecorateScene.js';
import { Level5Scene }          from './scenes/levels/Level5/Level5Scene.js';
import { L5_NurseryScene }      from './scenes/levels/Level5/L5_NurseryScene.js';
// Level 6 — Second Treatment Cycle (same structure as Level 5)
import { L6_EquipmentRunScene } from './scenes/levels/Level6/L6_EquipmentRunScene.js';
import { L6_CP1Scene }          from './scenes/levels/Level6/L6_CP1Scene.js';
import { L6_CP2Scene }          from './scenes/levels/Level6/L6_CP2Scene.js';
import { L6_CP3Scene }          from './scenes/levels/Level6/L6_CP3Scene.js';
import { L6_DecorateScene }     from './scenes/levels/Level6/L6_DecorateScene.js';
import { Level6Scene }          from './scenes/levels/Level6/Level6Scene.js';
import { L6_NamingCeremonyScene } from './scenes/levels/Level6/L6_NamingCeremonyScene.js';
import { L6_IntroductionScene } from './scenes/levels/Level6/L6_IntroductionScene.js';
import { L6_NurseryScene }      from './scenes/levels/Level6/L6_NurseryScene.js';
// Level 7 — Emergency Journey (5 story-driven stages)
import { L7_CutsceneScene } from './scenes/levels/Level7/L7_CutsceneScene.js';
import { L7_Stage1Scene }   from './scenes/levels/Level7/L7_Stage1Scene.js';
import { L7_Stage2Scene }   from './scenes/levels/Level7/L7_Stage2Scene.js';
import { L7_Stage3Scene }   from './scenes/levels/Level7/L7_Stage3Scene.js';
import { L7_Stage4Scene }   from './scenes/levels/Level7/L7_Stage4Scene.js';
import { L7_Stage5Scene }   from './scenes/levels/Level7/L7_Stage5Scene.js';
// Level 8 — Puppy Care Day (collect food → feed → collect home items → decorate)
import { L8_FoodRunScene }  from './scenes/levels/Level8/L8_FoodRunScene.js';
import { L8_FeedingScene }  from './scenes/levels/Level8/L8_FeedingScene.js';
import { L8_HomeRunScene }  from './scenes/levels/Level8/L8_HomeRunScene.js';
import { L8_DecorateScene } from './scenes/levels/Level8/L8_DecorateScene.js';
// Level 9 — A Holiday for the Puppies (collect gifts → unwrap → collect bows → tie a bow on each puppy)
import { L9_GiftRunScene }  from './scenes/levels/Level9/L9_GiftRunScene.js';
import { L9_UnwrapScene }   from './scenes/levels/Level9/L9_UnwrapScene.js';
import { L9_BowRunScene }   from './scenes/levels/Level9/L9_BowRunScene.js';
import { L9_BowTieScene }   from './scenes/levels/Level9/L9_BowTieScene.js';
// Sprite Animator / Test Simulator
import { SpriteSimulator }  from './scenes/SpriteSimulator.js';
import { GlendaAnimSimulator } from './scenes/GlendaAnimSimulator.js';
import { ShadowAnimSimulator } from './scenes/ShadowAnimSimulator.js';
import { W, H }                  from './config/GameConfig.js';

// ── Shared touch state: HTML footer buttons write here, Phaser reads here ──
window._touchState = { left: false, right: false, jump: false, slide: false };

function wireHoldBtn(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const press   = () => { window._touchState[key] = true;  btn.classList.add('pressed'); };
  const release = () => { window._touchState[key] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('pointerdown',   e => { e.preventDefault(); press(); });
  btn.addEventListener('pointerup',     e => { e.preventDefault(); release(); });
  btn.addEventListener('pointercancel', e => { e.preventDefault(); release(); });
  btn.addEventListener('pointerleave',  e => { release(); });
}

wireHoldBtn('btn-left',  'left');
wireHoldBtn('btn-right', 'right');
wireHoldBtn('btn-jump',  'jump');
wireHoldBtn('btn-slide', 'slide');

const barkBtn = document.getElementById('btn-bark');
if (barkBtn) {
  barkBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    barkBtn.classList.add('pressed');
    if (window._currentLevel?._doBark) window._currentLevel._doBark();
  });
  barkBtn.addEventListener('pointerup',     () => barkBtn.classList.remove('pressed'));
  barkBtn.addEventListener('pointercancel', () => barkBtn.classList.remove('pressed'));
}

const attackBtn = document.getElementById('btn-attack');
if (attackBtn) {
  attackBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    attackBtn.classList.add('pressed');
    if (window._currentLevel?._doSnakeAttack) window._currentLevel._doSnakeAttack();
  });
  attackBtn.addEventListener('pointerup',     () => attackBtn.classList.remove('pressed'));
  attackBtn.addEventListener('pointercancel', () => attackBtn.classList.remove('pressed'));
}

// ── Phaser game config ─────────────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-container',
  backgroundColor: '#0d0806',
  antialias: true,
  roundPixels: false,
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    smoothStep: true
  },
  device: {
    videoRender: 'AUTO',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,   // CSS flex centers the canvas (avoids double-centering offset)
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    EndScene,
    // Level 1
    IntroVideoScene,
    Cinematic1Scene,
    Level1Scene,
    L1_FoodScene,
    L1_EndScene,
    // Level 2
    Cinematic2Scene,
    Level2Scene,
    L2_CalmerScene,
    L2_FeedScene,
    L2_CatchScene,
    L2_DodgeScene,
    L2_FirefliesScene,
    L2_PetScene,
    L2_RhythmScene,
    L2_EndScene,
    // Level 3
    Level3Scene,
    L3_CarJourneyScene,
    L3_MG1_MedicineScene,
    L3_MG2_InjectionScene,
    L3_MG3_HeartScene,
    L3_MG4_OxygenScene,
    L3_MG5_DeliveryScene,
    L3_EndScene,
    // Level 4
    Level4Scene,
    L4_CP1Scene,
    L4_CP2Scene,
    L4_CP3Scene,
    L4_DecorateScene,
    // Level 5
    L5_EquipmentRunScene,
    L5_CP1Scene,
    L5_CP2Scene,
    L5_CP3Scene,
    L5_DecorateScene,
    Level5Scene,
    L5_NurseryScene,
    // Level 6 — Puppy Naming Adventure
    L6_EquipmentRunScene,
    L6_CP1Scene,
    L6_CP2Scene,
    L6_CP3Scene,
    L6_DecorateScene,
    Level6Scene,
    L6_NamingCeremonyScene,
    L6_IntroductionScene,
    L6_NurseryScene,
    // Level 7 — Emergency Journey
    L7_CutsceneScene,
    L7_Stage1Scene,
    L7_Stage2Scene,
    L7_Stage3Scene,
    L7_Stage4Scene,
    L7_Stage5Scene,
    // Level 8 — Puppy Care Day
    L8_FoodRunScene,
    L8_FeedingScene,
    L8_HomeRunScene,
    L8_DecorateScene,
    // Level 9 — A Holiday for the Puppies
    L9_GiftRunScene,
    L9_UnwrapScene,
    L9_BowRunScene,
    L9_BowTieScene,
    // Sprite Simulator (test scene)
    SpriteSimulator,
    GlendaAnimSimulator,
    ShadowAnimSimulator,
  ]
};

window._game = new Phaser.Game(config);

// ── Frozen-loop safety net ───────────────────────────────────────────────────
// Some embedded browsers / webviews (and backgrounded or covered tabs) put
// Phaser's requestAnimationFrame loop to SLEEP and don't reliably wake it. While
// asleep, a queued scene.start never boots, so screens (e.g. cutscene → next
// stage) appear frozen and buttons "do nothing". Wake the loop on any user input
// or when the page regains focus/visibility. No-op while already running.
function _wakeGameLoop() {
  try {
    const l = window._game && window._game.loop;
    if (l && l.running === false) { if (l.wake) l.wake(); if (l.resume) l.resume(); }
  } catch (_) {}
}
window.addEventListener('pointerdown', _wakeGameLoop, true);
window.addEventListener('keydown',     _wakeGameLoop, true);
window.addEventListener('touchstart',  _wakeGameLoop, { capture: true, passive: true });
window.addEventListener('focus',       _wakeGameLoop);
document.addEventListener('visibilitychange', () => { if (!document.hidden) _wakeGameLoop(); });

// Enable super-sampling for crisp high-resolution rendering
setTimeout(() => {
  const canvas = document.querySelector('canvas');
  if (canvas && window._game.renderer) {
    const superSample = 2; // 2x internal resolution
    const webglRenderer = window._game.renderer;
    if (webglRenderer.resize) {
      // Use internal WebGL upsampling for crisp edges
      canvas.style.imageRendering = 'auto';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    }
  }
}, 50);

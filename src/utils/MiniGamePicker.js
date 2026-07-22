/**
 * MiniGamePicker — Random game selector for levels
 * Loads game-map.json and picks games randomly for each level
 */

let gameMapCache = null;

// Load game map from JSON
async function loadGameMap() {
  if (gameMapCache) return gameMapCache;

  try {
    const response = await fetch('/mini-games/game-map.json?t=' + Date.now());
    gameMapCache = await response.json();
    return gameMapCache;
  } catch (err) {
    console.warn('Failed to load game-map.json, using fallback', err);
    // Fallback hardcoded map
    return {
      Level1: ['09-pattern-sequence', '03-shape-sorter', '10-sorting-by-size', '22-fruit-vegetable-sort'],
      Level2: ['01-alphabet-catch', '02-number-match', '04-color-mixing-lab', '05-word-builder', '06-animal-sound-match'],
      Level3: ['25-opposites-match', '08-memory-flip-cards', '11-missing-letter-fill', '12-coin-counting', '13-days-of-week-order', '30-counting-by-groups'],
      Level4: ['14-emotion-matching', '15-rhyme-time', '16-plant-growth-sequence', '17-traffic-light-rules'],
      Level5: ['10-sorting-by-size', '19-weather-dress-up', '20-musical-instrument-match'],
      Level6: ['23-shadow-matching', '24-time-telling-clock', '25-opposites-match', '26-space-objects-match'],
      Level7: ['27-community-helpers-match', '28-sink-or-float', '29-odd-one-out', '30-counting-by-groups'],
      Level8: ['31-vowel-consonant-sort', '32-multiplication-groups', '33-seasons-sort', '34-feelings-story-choice', '35-compound-word-builder'],
      Level9: ['36-animal-baby-match', '37-simple-fractions', '38-instrument-rhythm-copy', '39-nocturnal-diurnal-sort', '40-story-word-fill-in'],
    };
  }
}

// Get all games for a level
async function getGamesForLevel(levelNum) {
  const gameMap = await loadGameMap();
  const levelKey = `Level${levelNum}`;
  return gameMap[levelKey] || [];
}

// Every game already shown this level PLAYTHROUGH, per level — so a level
// with several trigger points (e.g. Level 1's two levers + its food bonus
// round) never shows the same activity twice in one run, not just avoids an
// immediate back-to-back repeat. Call resetGameHistory(levelNum) whenever a
// level starts a fresh playthrough (including on restart after game over).
const _usedThisSession = {};
const _lastPick = {};

// Clears the used-game history for a level — call at the start of a fresh
// playthrough (e.g. the top of that level's Scene.create()).
function resetGameHistory(levelNum) {
  _usedThisSession[levelNum] = new Set();
  delete _lastPick[levelNum];
}

// Pick a random game from a level's game list, avoiding every game already
// shown this playthrough. Once the whole pool has been used, it reopens
// (so long levels don't run out) but still skips an immediate repeat.
async function pickRandomGame(levelNum) {
  const games = await getGamesForLevel(levelNum);
  if (games.length === 0) return null;
  if (games.length === 1) return games[0];

  if (!_usedThisSession[levelNum]) _usedThisSession[levelNum] = new Set();
  const used = _usedThisSession[levelNum];

  let pool = games.filter(g => !used.has(g));
  if (pool.length === 0) {
    // Whole pool used this playthrough — reopen it, but still avoid
    // an immediate repeat of whatever was just shown.
    used.clear();
    pool = games.filter(g => g !== _lastPick[levelNum]);
    if (pool.length === 0) pool = games;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  used.add(pick);
  _lastPick[levelNum] = pick;
  return pick;
}

// Get games in order (for sequential usage)
async function getGameSequence(levelNum) {
  return await getGamesForLevel(levelNum);
}

/**
 * launchRandomMiniGame — overlay a RANDOM game for this level as an iframe.
 * Works in ANY Phaser scene (doesn't depend on BaseLevelScene). Preserves the
 * caller's onComplete callback so story/scene progression is untouched.
 *
 *   scene      — the calling Phaser.Scene
 *   levelNum   — 1..9, selects the slice from game-map.json
 *   onComplete — called ONLY on a win (so progression fires like before)
 *   opts       — { awardPoints:true } give ⭐ via scene._givePoints if present
 */
async function launchRandomMiniGame(scene, levelNum, onComplete, opts = {}) {
  if (scene._miniGameOpen) return;
  const folder = await pickRandomGame(levelNum);
  if (!folder) { if (onComplete) onComplete(0); return; }

  scene._miniGameOpen = true;
  // Freeze gameplay if this scene has physics.
  try { scene.physics?.pause?.(); } catch (_) {}
  // Freeze the character EXACTLY where the activity triggered — zero its velocity
  // so it can't drift forward (physics is paused, but this also kills any residual
  // velocity so there's no lurch when the level resumes afterwards).
  try { (scene.player || scene.shadow)?.setVelocity?.(0, 0); } catch (_) {}

  const host = document.getElementById('game-wrapper') || document.body;
  const overlay = document.createElement('div');
  overlay.id = 'mini-game-overlay';
  // Start slightly zoomed-in + transparent, then ease to normal → a smooth, slow
  // zoom-out fade-in so the activity settles in instead of popping abruptly.
  overlay.style.cssText =
    'position:absolute;inset:0;z-index:60;background:rgba(2,4,2,0.9);' +
    'display:flex;align-items:center;justify-content:center;' +
    'opacity:0;transform:scale(1.12);transform-origin:center center;' +
    'transition:opacity .5s ease, transform .5s ease;';

  const frame = document.createElement('iframe');
  frame.src   = `/mini-games/${folder}/index.html?t=${Date.now()}`;
  frame.title = folder;
  frame.style.cssText = 'width:100%;height:100%;border:0;background:transparent;';
  overlay.appendChild(frame);

  // Mirror the level countdown on top of the overlay if the scene runs a timer.
  let timerInt = null;
  if (scene._timerTxt) {
    const badge = document.createElement('div');
    badge.style.cssText =
      'position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:62;' +
      'font:bold 20px Georgia,serif;background:rgba(18,12,6,.92);' +
      'border:1.5px solid rgba(245,200,122,.6);border-radius:999px;padding:6px 18px;' +
      'pointer-events:none;text-shadow:0 2px 4px rgba(0,0,0,.6);';
    overlay.appendChild(badge);
    const tick = () => {
      const left = (scene._timerLeft != null) ? scene._timerLeft : 0;
      badge.textContent = `⏱ ${left}s`;
      badge.style.color = left <= 10 ? '#ff5544' : '#f5c87a';
    };
    tick();
    timerInt = setInterval(tick, 250);
  }

  host.appendChild(overlay);
  // Force a reflow so the browser commits the initial opacity:0 / scale(1.12)
  // BEFORE we change them — otherwise the transition is skipped and it snaps in.
  void overlay.offsetWidth;
  overlay.style.opacity = '1';
  overlay.style.transform = 'scale(1)';

  let done = false;
  // reason: 'win' | 'exit' | 'abort'
  //   win  → award points, run onComplete (progression continues)
  //   exit → player closed the game: NO points, but STILL run onComplete so the
  //          level never gets stuck (matches the old "skip and continue" flow)
  //   abort→ scene is shutting down: clean up only, do NOT run onComplete
  const finish = (reason, stars) => {
    if (done) return; done = true;
    if (timerInt) clearInterval(timerInt);
    window.removeEventListener('message', onMsg);
    try { overlay.remove(); } catch (_) {}
    scene._miniGameOpen  = false;
    scene._miniGameClose = null;
    try { scene.physics?.resume?.(); } catch (_) {}
    if (reason === 'abort') return;
    if (reason === 'win' && opts.awardPoints !== false &&
        typeof stars === 'number' && stars > 0 && scene._givePoints) {
      scene._givePoints(stars);
    }
    if (onComplete) onComplete(reason === 'win' ? (stars || 0) : 0);
  };

  const onMsg = (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'minigame-complete') finish('win', d.stars || 1);
    else if (d.type === 'minigame-exit') finish('exit');
  };
  window.addEventListener('message', onMsg);

  // Abort cleanly if the scene shuts down before the game is finished.
  scene._miniGameClose = () => finish('abort');
  scene.events.once('shutdown', () => { if (!done) finish('abort'); });
}

export {
  loadGameMap, getGamesForLevel, pickRandomGame, resetGameHistory, getGameSequence, launchRandomMiniGame
};

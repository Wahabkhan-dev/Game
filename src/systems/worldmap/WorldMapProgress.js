// WorldMapProgress — localStorage-backed unlock/star state for the world
// map. Frontend-only placeholder: swap _load()/_save() for real API calls
// (game-backend's /api/game/save, /api/game/state) once that endpoint is
// wired up to level completion; the public API (isLocked/isCompleted/
// completeLevel) stays the same either way.
const STORAGE_KEY = 'shadowgamma_worldmap_progress_v1';

function defaultState(nodeIds) {
  const stars = {};
  nodeIds.forEach((id, i) => { stars[id] = i === 0 ? 0 : -1; }); // -1 = locked, 0-3 = stars earned
  return { stars, currentId: nodeIds[0] };
}

export class WorldMapProgress {
  constructor(nodeIds) {
    this.nodeIds = nodeIds;
    this.state = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.stars && parsed.currentId != null) return parsed;
      }
    } catch (_) { /* ignore corrupt/unavailable storage, fall through to defaults */ }
    return defaultState(this.nodeIds);
  }

  _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (_) { /* storage unavailable (private mode etc.) — progress just won't persist */ }
  }

  starsFor(id) { return this.state.stars[id] ?? -1; }
  isLocked(id) { return this.starsFor(id) < 0; }
  isCompleted(id) { return this.starsFor(id) > 0; }
  isCurrent(id) { return this.state.currentId === id; }

  // Marks `id` complete with `stars` (1-3), unlocks + advances to the next
  // node in sequence. Returns the newly-unlocked node id (or null at the end
  // of the map).
  completeLevel(id, stars = 3) {
    const idx = this.nodeIds.indexOf(id);
    if (idx === -1) return null;

    this.state.stars[id] = Math.max(this.starsFor(id), stars);
    const nextId = this.nodeIds[idx + 1] ?? null;
    if (nextId != null) {
      if (this.isLocked(nextId)) this.state.stars[nextId] = 0;
      this.state.currentId = nextId;
    }
    this._save();
    return nextId;
  }

  reset() {
    this.state = defaultState(this.nodeIds);
    this._save();
  }
}

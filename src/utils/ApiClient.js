// ApiClient — the frontend's only bridge to the two backends:
//   - WordPress (game-handoff plugin): /wp-json/game/v1/login, /forgot-password
//   - Node (game-backend): /api/auth/exchange, /api/auth/refresh, /api/game/*
// Both WP routes return { handoff_token }, which is then exchanged with Node
// for a Node session — see wordpress-plugins/game-handoff/game-handoff.php
// and game-backend/controllers/authController.js. VITE_WP_URL empty means
// "same origin as the game", correct for production (see .env).
const WP_URL = (import.meta.env.VITE_WP_URL || '').replace(/\/$/, '');
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

let accessToken = null;

export class ApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

async function parseJson(res) {
  try { return await res.json(); } catch (_) { return {}; }
}

// ── WordPress ────────────────────────────────────────────────────────────
async function wpLogin(email, password) {
  const res = await fetch(`${WP_URL}/wp-json/game/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new ApiError(body.error || 'login_failed', body.reason || 'Login failed.');
  return body.handoff_token;
}

async function wpForgotPassword(email) {
  const res = await fetch(`${WP_URL}/wp-json/game/v1/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  // This route always responds 200 with a generic message (see the plugin) —
  // a network/server error is the only realistic failure case here.
  if (!res.ok) throw new ApiError('forgot_password_failed', 'Could not reach the server. Try again later.');
  return parseJson(res);
}

// ── Node ─────────────────────────────────────────────────────────────────
async function exchangeHandoff(handoffToken) {
  const res = await fetch(`${API_URL}/api/auth/exchange`, {
    method: 'POST',
    credentials: 'include', // receives the httpOnly refresh cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handoff_token: handoffToken }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new ApiError(body.error || 'exchange_failed', body.message || 'Could not start a session.');
  accessToken = body.accessToken;
  return body.user;
}

async function refresh() {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const body = await parseJson(res);
  if (!res.ok) {
    accessToken = null;
    throw new ApiError(body.error || 'refresh_failed', body.message || 'Session expired.');
  }
  accessToken = body.accessToken;
  return accessToken;
}

// Authenticated fetch to Node — attaches the bearer token, retries once via
// refresh() on a token_expired 401.
async function authFetch(path, opts = {}) {
  const doFetch = () => fetch(`${API_URL}${path}`, {
    ...opts,
    credentials: 'include',
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${accessToken}` },
  });

  let res = await doFetch();
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.error === 'token_expired') {
      await refresh();
      res = await doFetch();
    }
  }
  return res;
}

// ── Combined flow used by the login screen: WP password check → Node session ──
async function login(email, password) {
  const handoffToken = await wpLogin(email, password);
  return exchangeHandoff(handoffToken);
}

export const ApiClient = {
  login,
  forgotPassword: wpForgotPassword,
  exchangeHandoff,
  refresh,
  authFetch,
  getAccessToken: () => accessToken,
};

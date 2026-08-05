// Login + forgot-password screens. Real auth: email + a game-only password
// (separate from the player's WordPress account password — see
// wordpress-plugins/game-handoff/game-handoff.php) checked via WordPress,
// then exchanged for a Node session via ApiClient. The game (already
// loading underneath in the background) shows through once login succeeds.
import { ApiClient } from './ApiClient.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initLoginOverlay() {
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const forgotScreen = document.getElementById('forgot-screen');
  const forgotForm = document.getElementById('forgot-form');
  if (!loginScreen || !loginForm) return;

  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const forgotLink = document.getElementById('login-forgot');

  const showMessage = (box, msg) => {
    box.textContent = msg;
    box.hidden = false;
  };
  const clearBox = (box) => {
    box.hidden = true;
    box.textContent = '';
  };

  const dismiss = (screen) => {
    screen.style.opacity = '0';
    setTimeout(() => { screen.style.display = 'none'; }, 500);
  };

  const loginSubmitBtn = loginForm.querySelector('.login-btn');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBox(loginError);

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showMessage(loginError, 'Please enter your email and password.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      showMessage(loginError, 'Please enter a valid email address.');
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Logging in…';
    try {
      await ApiClient.login(email, password);
      dismiss(loginScreen);
    } catch (err) {
      showMessage(loginError, err.message || 'Login failed. Please try again.');
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = 'Log In 🐾';
    }
  });

  if (forgotLink && forgotScreen) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginScreen.hidden = true;
      forgotScreen.hidden = false;
    });
  }

  if (forgotForm && forgotScreen) {
    const forgotEmail = document.getElementById('forgot-email');
    const forgotError = document.getElementById('forgot-error');
    const forgotSuccess = document.getElementById('forgot-success');
    const forgotBack = document.getElementById('forgot-back');

    const backToLogin = () => {
      forgotScreen.hidden = true;
      loginScreen.hidden = false;
      clearBox(forgotError);
      clearBox(forgotSuccess);
      forgotForm.reset();
    };

    const forgotSubmitBtn = forgotForm.querySelector('.login-btn');

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearBox(forgotError);
      clearBox(forgotSuccess);

      const email = forgotEmail.value.trim();

      if (!email) {
        showMessage(forgotError, 'Please enter your email address.');
        return;
      }
      if (!EMAIL_RE.test(email)) {
        showMessage(forgotError, 'Please enter a valid email address.');
        return;
      }

      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.textContent = 'Sending…';
      try {
        await ApiClient.forgotPassword(email);
        showMessage(forgotSuccess, `If an account with a game purchase exists for ${email}, a new password is on its way.`);
      } catch (err) {
        showMessage(forgotError, err.message || 'Could not send the reset email. Please try again.');
      } finally {
        forgotSubmitBtn.disabled = false;
        forgotSubmitBtn.textContent = 'Send Reset Link';
      }
    });

    if (forgotBack) {
      forgotBack.addEventListener('click', (e) => {
        e.preventDefault();
        backToLogin();
      });
    }
  }
}

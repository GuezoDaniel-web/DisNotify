/* ============================================================
   DisNotify — auth.js  (page controller for login.html)
   Sign-in / sign-up form. Talks to /api/auth/* via api.js.
   ============================================================ */
import { $, initTheme, toast } from './ui.js';
import * as api from './api.js';
import * as store from './store.js';

initTheme();
if (store.isLoggedIn()) location.replace('index.html');

let mode = 'login';   // 'login' | 'register'

const form = $('#authForm');
const err = $('#formError');

$('#switchMode').addEventListener('click', e => {
  e.preventDefault();
  mode = mode === 'login' ? 'register' : 'login';
  const isReg = mode === 'register';
  $('#formTitle').textContent = isReg ? 'Create your account' : 'Welcome back';
  $('#formSub').textContent = isReg
    ? 'Free forever for up to 20 tracked products.'
    : 'Sign in to sync your watchlist and alerts across devices.';
  $('#nameField').classList.toggle('hidden', !isReg);
  $('#submitBtn').textContent = isReg ? 'Create account' : 'Sign in';
  $('#switchText').textContent = isReg ? 'Already have an account?' : 'New here?';
  $('#switchMode').textContent = isReg ? 'Sign in' : 'Create an account';
  $('#password').autocomplete = isReg ? 'new-password' : 'current-password';
  err.classList.add('hidden');
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  err.classList.add('hidden');

  const email = $('#email').value.trim();
  const password = $('#password').value;
  const name = $('#name').value.trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address.');
  if (password.length < 8) return fail('Password must be at least 8 characters.');
  if (mode === 'register' && !name) return fail('Tell us your name.');

  const btn = $('#submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    mode === 'login' ? await api.login(email, password) : await api.register(name, email, password);
    toast('Welcome', 'Taking you to the deals…');
    location.href = 'index.html';
  } catch (e2) {
    fail(e2.message || 'Something went wrong.');
    btn.disabled = false;
    btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
  }
});

function fail(msg) { err.textContent = msg; err.classList.remove('hidden'); }

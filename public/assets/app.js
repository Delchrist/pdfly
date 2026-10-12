// ZoungPDF front end: account, sign-in, checkout, and the tool runner.
const LANG = document.body.dataset.lang === 'fr' ? 'fr' : 'en';
const P = LANG === 'fr' ? '/fr' : '';

const STR = {
  en: {
    signin: 'Sign in', account: 'Account', signinTitle: 'Sign in to ZoungPDF', signinLead: 'We’ll email you a 6-digit code. No password needed.',
    email: 'Email address', sendCode: 'Email me a code', codeTitle: 'Check your email', codeLead: (e) => `We sent a 6-digit code to ${e}. It may take a minute to arrive.`,
    verify: 'Sign in', useOther: 'Use a different email', resend: 'Resend code', sending: 'Sending…', checking: 'Checking…',
    proTitle: 'Unlock with ZoungPDF Pro', proLead: 'Watermarks, page numbers, password protection, e-signatures, batch processing and files up to 1 GB.',
    seePlans: 'See plans', notNow: 'Not now', perMonth: '/month', perYear: '/year', equals: (x) => `That’s ${x}/month, billed yearly`,
    billedMonthly: 'Billed monthly. Cancel anytime.', redirecting: 'Redirecting to secure checkout…', alreadyPro: 'You already have Pro.',
    plan: 'Plan', free: 'Free', pro: 'Pro', status: 'Status', renews: 'Renews', ends: 'Ends', billing: 'Billing', manage: 'Manage billing', signout: 'Sign out', upgrade: 'Upgrade to Pro',
    monthly: 'Monthly', yearly: 'Yearly', emailLabel: 'Email', welcomePro: 'Payment received. Welcome to Pro! If your plan still says Free, refresh in a few seconds.',
    signedOutLead: 'Sign in to manage your subscription.', genericError: 'Something went wrong. Please try again.',
    pastDue: 'Payment issue: please update your card.',
  },
  fr: {
    signin: 'Connexion', account: 'Compte', signinTitle: 'Se connecter à ZoungPDF', signinLead: 'Nous vous envoyons un code à 6 chiffres. Aucun mot de passe.',
    email: 'Adresse courriel', sendCode: 'Recevoir un code', codeTitle: 'Vérifiez vos courriels', codeLead: (e) => `Code envoyé à ${e}. Il peut prendre une minute à arriver.`,
    verify: 'Se connecter', useOther: 'Utiliser un autre courriel', resend: 'Renvoyer le code', sending: 'Envoi…', checking: 'Vérification…',
    proTitle: 'Débloquez avec ZoungPDF Pro', proLead: 'Filigranes, numérotation, mot de passe, signature, traitement par lots et fichiers jusqu’à 1 Go.',
    seePlans: 'Voir les forfaits', notNow: 'Plus tard', perMonth: '/mois', perYear: '/an', equals: (x) => `Soit ${x}/mois, facturé annuellement`,
    billedMonthly: 'Facturé mensuellement. Annulable en tout temps.', redirecting: 'Redirection vers le paiement sécurisé…', alreadyPro: 'Vous avez déjà Pro.',
    plan: 'Forfait', free: 'Gratuit', pro: 'Pro', status: 'Statut', renews: 'Renouvellement', ends: 'Se termine', billing: 'Facturation', manage: 'Gérer la facturation', signout: 'Se déconnecter', upgrade: 'Passer à Pro',
    monthly: 'Mensuel', yearly: 'Annuel', emailLabel: 'Courriel', welcomePro: 'Paiement reçu. Bienvenue dans Pro ! Si votre forfait indique encore Gratuit, actualisez dans quelques secondes.',
    signedOutLead: 'Connectez-vous pour gérer votre abonnement.', genericError: 'Une erreur est survenue. Réessayez.',
    pastDue: 'Problème de paiement : mettez à jour votre carte.',
  },
}[LANG];

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export function toast(msg, ms = 3200) {
  const el = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'content-type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || STR.genericError);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- Account state ----------
let mePromise = null;
export function getMe(force = false) {
  if (!mePromise || force) mePromise = api('/api/me').catch(() => ({ signedIn: false, pro: false, offline: true }));
  return mePromise;
}

async function paintHeader() {
  const me = await getMe();
  const link = $('[data-account-link]');
  if (link && me.signedIn) {
    link.textContent = me.pro ? `★ ${STR.account}` : STR.account;
  }
}

// ---------- Modal ----------
export function modal(build) {
  const back = h('div', { class: 'modal-back' });
  const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  box.append(h('button', { class: 'icon-btn close', 'aria-label': 'Close', onclick: close }, '✕'));
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  build(box, close);
  back.append(box);
  document.body.append(back);
  setTimeout(() => $('input', box)?.focus(), 30);
  return close;
}

// Sign-in form: renders into `root`, resolves via onDone after a successful sign-in.
function signInForm(root, { next = location.pathname, onDone } = {}) {
  let email = '';
  const stepEmail = () => {
    root.replaceChildren();
    const err = h('div', { class: 'error-box hidden' });
    const input = h('input', { type: 'email', class: 'input', placeholder: 'you@example.com', autocomplete: 'email', required: true, 'aria-label': STR.email, value: email });
    const btn = h('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, STR.sendCode);
    const form = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        err.classList.add('hidden');
        btn.disabled = true; btn.textContent = STR.sending;
        try {
          email = input.value.trim();
          await api('/api/auth/request', { method: 'POST', body: { email, lang: LANG, next } });
          stepCode();
        } catch (ex) {
          err.textContent = ex.message; err.classList.remove('hidden');
          btn.disabled = false; btn.textContent = STR.sendCode;
        }
      },
    }, input, btn, err);
    root.append(h('h2', {}, STR.signinTitle), h('p', { class: 'muted' }, STR.signinLead), form);
    setTimeout(() => input.focus(), 30);
  };
  const stepCode = () => {
    root.replaceChildren();
    const err = h('div', { class: 'error-box hidden' });
    const input = h('input', { class: 'input code-input', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, pattern: '[0-9]*', placeholder: '000000', 'aria-label': 'Code' });
    const btn = h('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, STR.verify);
    const submit = async () => {
      err.classList.add('hidden');
      btn.disabled = true; btn.textContent = STR.checking;
      try {
        const r = await api('/api/auth/code', { method: 'POST', body: { email, code: input.value } });
        await getMe(true);
        paintHeader();
        onDone ? onDone(r) : (location.href = r.next || `${P}/account/`);
      } catch (ex) {
        err.textContent = ex.message; err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = STR.verify;
      }
    };
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      if (input.value.length === 6) submit();
    });
    const form = h('form', { onsubmit: (e) => { e.preventDefault(); submit(); } }, input, btn, err,
      h('div', { class: 'row', style: 'margin-top:4px' },
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: stepEmail }, STR.useOther),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: async (e) => { e.target.disabled = true; try { await api('/api/auth/request', { method: 'POST', body: { email, lang: LANG, next } }); toast('✓'); } catch (ex) { toast(ex.message); } e.target.disabled = false; } }, STR.resend)));
    root.append(h('h2', {}, STR.codeTitle), h('p', { class: 'muted' }, STR.codeLead(email)), form);
    setTimeout(() => input.focus(), 30);
  };
  stepEmail();
}

export function openSignIn(opts = {}) {
  return new Promise((resolve) => {
    modal((box, close) => {
      const inner = h('div');
      box.append(inner);
      signInForm(inner, { ...opts, onDone: (r) => { close(); resolve(r); } });
    });
  });
}

export function openUpgrade() {
  modal((box, close) => {
    box.append(
      h('span', { class: 'badge', style: 'margin-bottom:10px' }, '★ Pro'),
      h('h2', {}, STR.proTitle),
      h('p', { class: 'muted' }, STR.proLead),
      h('div', { class: 'actions' },
        h('a', { class: 'btn btn-pro btn-lg', href: `${P}/pricing/` }, STR.seePlans),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: close }, STR.notNow)));
  });
}

// ---------- Checkout ----------
async function startCheckout(interval, btn) {
  const me = await getMe();
  if (!me.signedIn) {
    await openSignIn({ next: `${P}/pricing/?buy=${interval}` });
  }
  const label = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = STR.redirecting; }
  try {
    const r = await api('/api/checkout', { method: 'POST', body: { interval, lang: LANG } });
    location.href = r.url;
  } catch (ex) {
    if (ex.data?.error === 'already_pro') { toast(STR.alreadyPro); location.href = `${P}/account/`; return; }
    toast(ex.message);
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }
}

function money(cents, currency) {
  return new Intl.NumberFormat(LANG === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

async function initPricing() {
  let interval = 'year';
  let prices = null;
  const priceEl = $('[data-price]');
  const noteEl = $('[data-price-note]');
  const paint = () => {
    $$('[data-interval]').forEach((b) => b.classList.toggle('on', b.dataset.interval === interval));
    if (!prices) return;
    const p = prices[interval];
    if (!p) return;
    priceEl.innerHTML = `${money(p.amount, p.currency)}<small>${interval === 'year' ? STR.perYear : STR.perMonth}</small>`;
    noteEl.textContent = interval === 'year' ? STR.equals(money(Math.round(p.amount / 12), p.currency)) : STR.billedMonthly;
    if (prices.month && prices.year) {
      const pct = Math.round((1 - prices.year.amount / (prices.month.amount * 12)) * 100);
      const tag = $('[data-save-tag]');
      if (tag && pct > 0) tag.textContent = LANG === 'fr' ? `−${pct} %` : `Save ${pct}%`;
    }
  };
  $$('[data-interval]').forEach((b) => b.addEventListener('click', () => { interval = b.dataset.interval; paint(); }));
  const btn = $('[data-checkout]');
  btn.addEventListener('click', () => startCheckout(interval, btn));
  try { prices = await api('/api/prices'); } catch { /* keep placeholder */ }
  paint();
  const me = await getMe();
  if (me.pro) { btn.textContent = STR.manage; btn.onclick = (e) => { e.stopImmediatePropagation(); location.href = `${P}/account/`; }; }
  const buy = new URLSearchParams(location.search).get('buy');
  if (buy && me.signedIn && !me.pro) { interval = buy === 'month' ? 'month' : 'year'; paint(); startCheckout(interval, btn); }
}

async function initAccount() {
  const root = $('#account-root');
  const me = await getMe(true);
  root.replaceChildren();
  if (!me.signedIn) {
    const card = h('div', { class: 'card' });
    root.append(card);
    signInForm(card, { next: `${P}/account/`, onDone: () => initAccount() });
    return;
  }
  const params = new URLSearchParams(location.search);
  if (params.get('checkout') === 'success') {
    root.append(h('div', { class: 'notice' }, STR.welcomePro));
    if (!me.pro) setTimeout(() => initAccount(), 4000);
    history.replaceState(null, '', location.pathname);
  }
  const fmtDate = (s) => new Date(s * 1000).toLocaleDateString(LANG === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const plan = me.plan || {};
  const rows = [
    [STR.emailLabel, me.email],
    [STR.plan, me.pro ? `★ ${STR.pro}${plan.interval ? ` · ${plan.interval === 'year' ? STR.yearly : STR.monthly}` : ''}` : STR.free],
  ];
  if (me.pro && plan.periodEnd) rows.push([plan.cancelAtPeriodEnd ? STR.ends : STR.renews, fmtDate(plan.periodEnd)]);
  const card = h('div', { class: 'card' }, ...rows.map(([k, v]) => h('div', { class: 'kv' }, h('span', {}, k), h('span', {}, v))));
  if (plan.status === 'past_due') card.prepend(h('div', { class: 'error-box', style: 'margin:0 0 12px' }, STR.pastDue));
  const actions = h('div', { class: 'actions' });
  if (plan.hasBilling) {
    const b = h('button', { class: 'btn btn-dark', type: 'button', onclick: async () => {
      b.disabled = true;
      try { const r = await api('/api/portal', { method: 'POST' }); location.href = r.url; } catch (ex) { toast(ex.message); b.disabled = false; }
    } }, STR.manage);
    actions.append(b);
  }
  if (!me.pro) actions.append(h('a', { class: 'btn btn-pro', href: `${P}/pricing/` }, STR.upgrade));
  actions.append(h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = P || '/'; } }, STR.signout));
  card.append(actions);
  root.append(card);
}

function initLogin() {
  const root = $('#login-root');
  const card = h('div', { class: 'card' });
  root.append(card);
  signInForm(card, { next: '/account/' });
}

function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) { menu.classList.add('hidden'); toggle.setAttribute('aria-expanded', 'false'); } });
}

// ---------- Boot ----------
initMenu();
paintHeader();
const page = document.body.dataset.page;
if (page === 'pricing') initPricing();
if (page === 'account') initAccount();
if (page === 'login') initLogin();
if (document.body.dataset.tool) {
  import('./tools.js').then((m) => m.initTool({ lang: LANG, getMe, openUpgrade, openSignIn, toast, h, $, $$ }));
}

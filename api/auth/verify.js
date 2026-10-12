// GET  /api/auth/verify?token=...  -> confirmation page (link scanners in school/work inboxes only do GETs,
//                                     so the token is NOT consumed here)
// POST /api/auth/verify  token=...  -> consumes token, sets session cookie, redirects
import { html, redirect, sha256, escapeHtml } from '../_lib/util.js';
import { redis, upsertUser } from '../_lib/redis.js';
import { createSessionCookie } from '../_lib/session.js';

function page(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} · ZoungPDF</title><link rel="stylesheet" href="/assets/app.css"></head>
<body><main class="auth-page"><div class="auth-card"><a class="logo" href="/"><span class="logo-mark"></span>ZoungPDF</a>${inner}</div></main></body></html>`;
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!token) return redirect('/');
  return html(
    page(
      'Sign in',
      `<h1>Sign in to ZoungPDF</h1><p class="muted">Se connecter à ZoungPDF</p>
<form method="post" action="/api/auth/verify"><input type="hidden" name="token" value="${escapeHtml(token)}">
<button class="btn btn-primary btn-lg" type="submit" autofocus>Continue · Continuer</button></form>`
    )
  );
}

export async function POST(request) {
  const form = await request.formData().catch(() => null);
  const token = form?.get('token');
  if (!token || typeof token !== 'string') return redirect('/');
  const raw = await redis('GETDEL', `v2:login:tok:${sha256(token)}`);
  if (!raw) {
    return html(
      page('Link expired', `<h1>This link has expired</h1><p class="muted">Sign-in links work once and expire after 15 minutes.</p><a class="btn btn-primary" href="/login/">Get a new link</a>`),
      400
    );
  }
  const { email, next } = JSON.parse(raw);
  await Promise.all([upsertUser(email, {}), redis('DEL', `v2:login:code:${email}`)]);
  return redirect(next || '/account/', { 'set-cookie': createSessionCookie(email) });
}

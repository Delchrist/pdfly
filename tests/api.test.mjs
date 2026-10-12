// End-to-end API tests against in-memory fakes: sign-in, checkout, webhook → Pro, portal, cancel.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { installMocks } from '../scripts/mocks.mjs';

installMocks();
const { store, sentEmails, stripeState } = globalThis.__pdflyMocks;

const auth = {
  request: await import('../api/auth/request.js'),
  code: await import('../api/auth/code.js'),
  verify: await import('../api/auth/verify.js'),
  logout: await import('../api/auth/logout.js'),
};
const me = await import('../api/me.js');
const checkout = await import('../api/checkout.js');
const portal = await import('../api/portal.js');
const prices = await import('../api/prices.js');
const webhook = await import('../api/stripe-webhook.js');

const BASE = 'http://localhost:8787';
const req = (path, { method = 'GET', body, cookie, headers = {} } = {}) =>
  new Request(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', origin: BASE, ...(cookie ? { cookie } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
const cookieOf = (res) => (res.headers.get('set-cookie') || '').split(';')[0];

function signed(event) {
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${payload}`).digest('hex');
  return new Request(`${BASE}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': `t=${t},v1=${sig}` }, body: payload });
}

let cookie;
const EMAIL = 'student@uottawa.ca';

test('prices come from Stripe lookup keys', async () => {
  const r = await prices.GET(req('/api/prices'));
  const d = await r.json();
  assert.equal(d.month.amount, 499);
  assert.equal(d.year.amount, 3900);
});

test('signed-out /api/me', async () => {
  const d = await (await me.GET(req('/api/me'))).json();
  assert.equal(d.signedIn, false);
});

test('rejects bad email and cross-origin', async () => {
  assert.equal((await auth.request.POST(req('/api/auth/request', { method: 'POST', body: { email: 'nope' } }))).status, 400);
  assert.equal((await auth.request.POST(req('/api/auth/request', { method: 'POST', body: { email: EMAIL }, headers: { origin: 'https://evil.example' } }))).status, 403);
});

test('sign in with 6-digit code', async () => {
  const r = await auth.request.POST(req('/api/auth/request', { method: 'POST', body: { email: EMAIL.toUpperCase(), next: '/pricing/' } }));
  assert.equal(r.status, 200);
  const mail = sentEmails.at(-1);
  assert.deepEqual(mail.to, [EMAIL]);
  const code = mail.subject.match(/(\d{6})/)[1];
  // wrong code first
  const bad = await auth.code.POST(req('/api/auth/code', { method: 'POST', body: { email: EMAIL, code: code === '000000' ? '111111' : '000000' } }));
  assert.equal(bad.status, 400);
  const ok = await auth.code.POST(req('/api/auth/code', { method: 'POST', body: { email: EMAIL, code } }));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).next, '/pricing/');
  cookie = cookieOf(ok);
  const d = await (await me.GET(req('/api/me', { cookie }))).json();
  assert.equal(d.signedIn, true);
  assert.equal(d.email, EMAIL);
  assert.equal(d.pro, false);
  // code is single-use
  const again = await auth.code.POST(req('/api/auth/code', { method: 'POST', body: { email: EMAIL, code } }));
  assert.equal(again.status, 400);
});

test('magic link: GET does not consume (link scanners), POST signs in once', async () => {
  await auth.request.POST(req('/api/auth/request', { method: 'POST', body: { email: 'scan@school.edu' } }));
  const link = sentEmails.at(-1).text.match(/(http\S+token=\S+)/)[1];
  const token = new URL(link).searchParams.get('token');
  const page1 = await auth.verify.GET(new Request(link));
  const page2 = await auth.verify.GET(new Request(link)); // scanner + human
  assert.equal(page1.status, 200);
  assert.equal(page2.status, 200);
  const form = new FormData();
  form.set('token', token);
  const post = await auth.verify.POST(new Request(`${BASE}/api/auth/verify`, { method: 'POST', body: form }));
  assert.equal(post.status, 303);
  assert.match(post.headers.get('set-cookie'), /pdfly_session=/);
  const form2 = new FormData();
  form2.set('token', token);
  assert.equal((await auth.verify.POST(new Request(`${BASE}/api/auth/verify`, { method: 'POST', body: form2 }))).status, 400);
});

test('tampered session cookie is rejected', async () => {
  const forged = cookie.replace(/\.[^.]+$/, '.AAAA');
  const d = await (await me.GET(req('/api/me', { cookie: forged }))).json();
  assert.equal(d.signedIn, false);
});

test('checkout requires sign-in', async () => {
  const r = await checkout.POST(req('/api/checkout', { method: 'POST', body: { interval: 'year' } }));
  assert.equal(r.status, 401);
});

let customerId;
test('checkout creates customer + subscription session with tax and the right price', async () => {
  const r = await checkout.POST(req('/api/checkout', { method: 'POST', body: { interval: 'year' }, cookie }));
  assert.equal(r.status, 200);
  const { url } = await r.json();
  assert.match(url, /checkout\.stripe\.com/);
  const s = Object.values(stripeState.sessions).at(-1);
  assert.equal(s.mode, 'subscription');
  assert.equal(s['line_items[0][price]'], 'price_mock_year');
  assert.equal(s['automatic_tax[enabled]'], 'true');
  customerId = s.customer;
  assert.ok(customerId.startsWith('cus_'));
  // second checkout reuses the same customer
  await checkout.POST(req('/api/checkout', { method: 'POST', body: { interval: 'month' }, cookie }));
  assert.equal(Object.values(stripeState.sessions).at(-1).customer, customerId);
});

test('webhook rejects bad signatures', async () => {
  const r = await webhook.POST(new Request(`${BASE}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': 't=1,v1=bad' }, body: '{}' }));
  assert.equal(r.status, 400);
});

const periodEnd = Math.floor(Date.now() / 1000) + 365 * 86400;
test('checkout.session.completed → user becomes Pro + welcome email', async () => {
  stripeState.subscriptions.sub_1 = { id: 'sub_1', customer: customerId, status: 'active', cancel_at_period_end: false, metadata: { email: EMAIL }, items: { data: [{ current_period_end: periodEnd, price: { recurring: { interval: 'year' } } }] } };
  const before = sentEmails.length;
  const r = await webhook.POST(signed({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_1', customer: customerId, client_reference_id: EMAIL, metadata: { email: EMAIL } } } }));
  assert.equal(r.status, 200);
  const d = await (await me.GET(req('/api/me', { cookie }))).json();
  assert.equal(d.pro, true);
  assert.equal(d.plan.interval, 'year');
  assert.equal(d.plan.periodEnd, periodEnd);
  assert.equal(sentEmails.length, before + 1);
  assert.match(sentEmails.at(-1).subject, /Welcome/);
});

test('duplicate events are ignored', async () => {
  const before = sentEmails.length;
  const r = await webhook.POST(signed({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_1', customer: customerId } } }));
  assert.equal((await r.json()).duplicate, true);
  assert.equal(sentEmails.length, before);
});

test('Pro user cannot buy twice; portal works', async () => {
  const r = await checkout.POST(req('/api/checkout', { method: 'POST', body: { interval: 'month' }, cookie }));
  assert.equal(r.status, 409);
  const p = await portal.POST(req('/api/portal', { method: 'POST', cookie }));
  assert.equal(p.status, 200);
  assert.match((await p.json()).url, /billing\.stripe\.com/);
});

test('cancel at period end keeps Pro; deletion removes it', async () => {
  const sub = { ...stripeState.subscriptions.sub_1, cancel_at_period_end: true };
  await webhook.POST(signed({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: sub } }));
  let d = await (await me.GET(req('/api/me', { cookie }))).json();
  assert.equal(d.pro, true);
  assert.equal(d.plan.cancelAtPeriodEnd, true);
  await webhook.POST(signed({ id: 'evt_3', type: 'customer.subscription.deleted', data: { object: { ...sub, status: 'canceled' } } }));
  d = await (await me.GET(req('/api/me', { cookie }))).json();
  assert.equal(d.pro, false);
});

test('payment failure emails the customer once', async () => {
  const before = sentEmails.length;
  await webhook.POST(signed({ id: 'evt_4', type: 'invoice.payment_failed', data: { object: { customer: customerId, attempt_count: 1 } } }));
  assert.equal(sentEmails.length, before + 1);
  assert.match(sentEmails.at(-1).subject, /payment/i);
});

test('logout clears cookie', async () => {
  const r = await auth.logout.POST(req('/api/auth/logout', { method: 'POST', cookie }));
  assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
});

test('code brute force is capped', async () => {
  const e = 'brute@example.com';
  await auth.request.POST(req('/api/auth/request', { method: 'POST', body: { email: e } }));
  const real = sentEmails.at(-1).subject.match(/(\d{6})/)[1];
  const wrong = real === '123456' ? '654321' : '123456';
  for (let i = 0; i < 5; i++) await auth.code.POST(req('/api/auth/code', { method: 'POST', body: { email: e, code: wrong } }));
  const r = await auth.code.POST(req('/api/auth/code', { method: 'POST', body: { email: e, code: real } }));
  assert.notEqual(r.status, 200);
});

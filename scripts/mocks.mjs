// In-memory fakes for Upstash REST, Stripe and Resend, installed by overriding global fetch.
export const store = new Map(); // key -> { v, exp }
export const sentEmails = [];
export const stripeState = { customers: {}, sessions: {}, subscriptions: {}, n: 0 };

const now = () => Date.now();
function get(k) {
  const e = store.get(k);
  if (!e) return undefined;
  if (e.exp && e.exp < now()) { store.delete(k); return undefined; }
  return e;
}

function exec(cmd) {
  const [op, ...a] = cmd;
  const O = op.toUpperCase();
  switch (O) {
    case 'SET': {
      const [k, v, ...opts] = a;
      const up = opts.map((x) => String(x).toUpperCase());
      if (up.includes('NX') && get(k)) return null;
      const exIdx = up.indexOf('EX');
      store.set(k, { v, exp: exIdx >= 0 ? now() + Number(opts[exIdx + 1]) * 1000 : 0 });
      return 'OK';
    }
    case 'GET': return get(a[0])?.v ?? null;
    case 'GETDEL': { const v = get(a[0])?.v ?? null; store.delete(a[0]); return v; }
    case 'DEL': { let n = 0; for (const k of a) if (store.delete(k)) n++; return n; }
    case 'INCR': { const e = get(a[0]) || { v: '0', exp: 0 }; e.v = String(Number(e.v) + 1); store.set(a[0], e); return Number(e.v); }
    case 'EXPIRE': { const e = get(a[0]); if (!e) return 0; if (String(a[2] || '').toUpperCase() === 'NX' && e.exp) return 0; e.exp = now() + Number(a[1]) * 1000; return 1; }
    case 'HSET': { const e = get(a[0]) || { v: {}, exp: 0 }; let n = 0; for (let i = 1; i < a.length; i += 2) { if (!(a[i] in e.v)) n++; e.v[a[i]] = String(a[i + 1]); } store.set(a[0], e); return n; }
    case 'HSETNX': { const e = get(a[0]) || { v: {}, exp: 0 }; if (a[1] in e.v) return 0; e.v[a[1]] = String(a[2]); store.set(a[0], e); return 1; }
    case 'HGETALL': { const e = get(a[0]); return e ? Object.entries(e.v).flat() : []; }
    case 'HMGET': { const e = get(a[0]); return a.slice(1).map((f) => (e ? e.v[f] ?? null : null)); }
    case 'HINCRBY': { const e = get(a[0]) || { v: {}, exp: 0 }; e.v[a[1]] = String(Number(e.v[a[1]] || 0) + Number(a[2])); store.set(a[0], e); return Number(e.v[a[1]]); }
    default: throw new Error(`mock redis: unsupported ${O}`);
  }
}

const jsonRes = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json' } });

function parseForm(body) {
  const out = {};
  for (const [k, v] of new URLSearchParams(body || '')) out[k] = v;
  return out;
}

const PRICES = {
  pdfly_pro_monthly: { id: 'price_mock_month', lookup_key: 'pdfly_pro_monthly', unit_amount: 499, currency: 'cad', recurring: { interval: 'month' } },
  pdfly_pro_yearly: { id: 'price_mock_year', lookup_key: 'pdfly_pro_yearly', unit_amount: 3900, currency: 'cad', recurring: { interval: 'year' } },
};

function fakeStripe(method, url, body) {
  const u = new URL(url);
  const p = u.pathname.replace('/v1', '');
  const f = parseForm(body);
  if (method === 'GET' && p === '/prices') return jsonRes({ data: Object.values(PRICES) });
  if (method === 'GET' && p === '/customers') {
    const email = u.searchParams.get('email');
    return jsonRes({ data: Object.values(stripeState.customers).filter((c) => c.email === email) });
  }
  if (method === 'POST' && p === '/customers') {
    const id = `cus_mock${++stripeState.n}`;
    stripeState.customers[id] = { id, email: f.email };
    return jsonRes(stripeState.customers[id]);
  }
  let m;
  if (method === 'GET' && (m = p.match(/^\/customers\/(.+)$/))) return stripeState.customers[m[1]] ? jsonRes(stripeState.customers[m[1]]) : jsonRes({ error: { message: 'No such customer' } }, 404);
  if (method === 'POST' && p === '/checkout/sessions') {
    const id = `cs_mock${++stripeState.n}`;
    stripeState.sessions[id] = { id, ...f };
    return jsonRes({ id, url: `https://checkout.stripe.com/mock/${id}` });
  }
  if (method === 'GET' && (m = p.match(/^\/subscriptions\/(.+)$/))) return jsonRes(stripeState.subscriptions[m[1]]);
  if (method === 'POST' && p === '/billing_portal/sessions') return jsonRes({ url: `https://billing.stripe.com/mock/${f.customer}` });
  return jsonRes({ error: { message: `mock stripe: ${method} ${p}` } }, 400);
}

export function installMocks() {
  process.env.UPSTASH_REDIS_REST_URL ||= 'https://mock-redis.local';
  process.env.UPSTASH_REDIS_REST_TOKEN ||= 'mock';
  process.env.STRIPE_SECRET_KEY ||= 'sk_test_mock';
  process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_mock';
  process.env.RESEND_API_KEY ||= 're_mock';
  process.env.SESSION_SECRET ||= 'mock-session-secret-mock-session-secret-0123456789';
  process.env.SITE_URL ||= 'http://localhost:8787';
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();
    if (url.startsWith('https://mock-redis.local')) {
      const body = JSON.parse(init.body);
      if (url.endsWith('/pipeline')) return jsonRes(body.map((c) => ({ result: exec(c) })));
      return jsonRes({ result: exec(body) });
    }
    if (url.startsWith('https://api.stripe.com')) return fakeStripe(method, url, init.body);
    if (url.startsWith('https://api.resend.com')) {
      sentEmails.push(JSON.parse(init.body));
      if (process.env.MOCK_LOG_EMAIL) console.log('[mock email]', JSON.parse(init.body).subject);
      return jsonRes({ id: `email_${sentEmails.length}` });
    }
    return realFetch(input, init);
  };
  globalThis.__pdflyMocks = { store, sentEmails, stripeState };
}

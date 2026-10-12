// Tiny Stripe REST client (form-encoded) + webhook signature verification. No SDK needed.
import crypto from 'node:crypto';
import { timingSafeEqualStr } from './util.js';

const API = 'https://api.stripe.com/v1';

function encode(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') encode(item, `${key}[${i}]`, out);
        else out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`);
      });
    } else if (typeof v === 'object') {
      encode(v, key, out);
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return out;
}

export async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  let url = `${API}${path}`;
  const init = { method, headers: { authorization: `Bearer ${key}` } };
  if (params) {
    const body = encode(params).join('&');
    if (method === 'GET') url += (url.includes('?') ? '&' : '?') + body;
    else {
      init.body = body;
      init.headers['content-type'] = 'application/x-www-form-urlencoded';
    }
  }
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Stripe error ${res.status}`);
    err.stripe = data?.error;
    throw err;
  }
  return data;
}

export const PRICE_LOOKUP = {
  month: process.env.STRIPE_LOOKUP_MONTHLY || 'pdfly_pro_monthly',
  year: process.env.STRIPE_LOOKUP_YEARLY || 'pdfly_pro_yearly',
};

let priceCache = null;
let priceCacheAt = 0;
export async function getPrices() {
  if (priceCache && Date.now() - priceCacheAt < 10 * 60 * 1000) return priceCache;
  const list = await stripe('GET', '/prices', { active: 'true', lookup_keys: [PRICE_LOOKUP.month, PRICE_LOOKUP.year], limit: 10 });
  const byKey = Object.fromEntries(list.data.map((p) => [p.lookup_key, p]));
  priceCache = {
    month: byKey[PRICE_LOOKUP.month] || null,
    year: byKey[PRICE_LOOKUP.year] || null,
  };
  priceCacheAt = Date.now();
  return priceCache;
}

// Verify a Stripe-Signature header against the raw request body.
export function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }).filter(([k]) => k !== 'v1')
  );
  const signatures = header.split(',').map((s) => s.trim()).filter((s) => s.startsWith('v1=')).map((s) => s.slice(3));
  const t = Number(parts.t);
  if (!t || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return signatures.some((sig) => timingSafeEqualStr(sig, expected));
}

// Subscription period end moved to subscription items in newer API versions; handle both.
export function periodEndOf(sub) {
  return sub.current_period_end || sub.items?.data?.[0]?.current_period_end || 0;
}

export function intervalOf(sub) {
  return sub.items?.data?.[0]?.price?.recurring?.interval || sub.plan?.interval || '';
}

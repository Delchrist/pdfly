// Shared helpers for ZoungPDF serverless functions (Vercel, Node runtime, Web Request/Response API).
import crypto from 'node:crypto';

export const SITE_URL = (process.env.SITE_URL || 'https://zoungpdf.com').replace(/\/$/, '');

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store', ...headers } });
}

export function html(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}

export function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null;
  return e;
}

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function randomCode() {
  // 6-digit numeric code, uniform
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Reject cross-site state-changing requests (simple CSRF guard on top of SameSite=Lax cookies).
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser or same-origin GET-like navigation
  try {
    const o = new URL(origin);
    const self = new URL(request.url);
    const allowed = new Set([self.host, new URL(SITE_URL).host]);
    return allowed.has(o.host);
  } catch {
    return false;
  }
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

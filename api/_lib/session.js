// Stateless signed session cookie: base64url(payload).base64url(hmac)
import crypto from 'node:crypto';
import { timingSafeEqualStr } from './util.js';

const COOKIE = 'pdfly_session';
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)');
  return s;
}

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

export function createSessionCookie(email) {
  const payload = Buffer.from(JSON.stringify({ e: email, x: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getSessionEmail(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return null;
  const value = match.slice(COOKIE.length + 1);
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return null;
  try {
    if (!timingSafeEqualStr(sig, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.e || !data.x || data.x < Math.floor(Date.now() / 1000)) return null;
    return data.e;
  } catch {
    return null;
  }
}

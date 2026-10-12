// POST /api/auth/code  { email, code }  -> sets session cookie
import { json, readJson, normalizeEmail, sha256, timingSafeEqualStr, sameOrigin } from '../_lib/util.js';
import { redis, redisPipeline, upsertUser } from '../_lib/redis.js';
import { createSessionCookie } from '../_lib/session.js';

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Bad origin' }, 403);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return json({ error: 'Enter the 6-digit code from the email.' }, 400);

  const key = `v2:login:code:${email}`;
  const [h, attempts, next] = await redis('HMGET', key, 'h', 'a', 'next');
  if (!h) return json({ error: 'This code has expired. Request a new one.' }, 400);
  if (Number(attempts) >= MAX_ATTEMPTS) {
    await redis('DEL', key);
    return json({ error: 'Too many wrong codes. Request a new one.' }, 429);
  }
  if (!timingSafeEqualStr(h, sha256(`${email}:${code}`))) {
    await redis('HINCRBY', key, 'a', 1);
    return json({ error: 'That code is not right. Check the email and try again.' }, 400);
  }
  await redisPipeline([['DEL', key]]);
  await upsertUser(email, {});
  return json({ ok: true, next: next || '/account/' }, 200, { 'set-cookie': createSessionCookie(email) });
}

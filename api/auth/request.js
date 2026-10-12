// POST /api/auth/request  { email, lang?, next? }  -> emails a 6-digit code + magic link
import { json, readJson, normalizeEmail, clientIp, randomToken, randomCode, sha256, sameOrigin, SITE_URL } from '../_lib/util.js';
import { redisPipeline, rateLimit } from '../_lib/redis.js';
import { sendLoginEmail } from '../_lib/email.js';

const TTL = 15 * 60;

function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next.slice(0, 300) : '/account/';
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Bad origin' }, 403);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email) return json({ error: 'Please enter a valid email address.' }, 400);
  const lang = body.lang === 'fr' ? 'fr' : 'en';

  const ip = clientIp(request);
  const [okIp, okEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 10, 3600), rateLimit(`login-email:${email}`, 5, 3600)]);
  if (!okIp || !okEmail) return json({ error: 'Too many sign-in attempts. Please wait a few minutes and try again.' }, 429);

  const token = randomToken();
  const code = randomCode();
  await redisPipeline([
    ['SET', `v2:login:tok:${sha256(token)}`, JSON.stringify({ email, next: safeNext(body.next) }), 'EX', TTL],
    ['DEL', `v2:login:code:${email}`],
    ['HSET', `v2:login:code:${email}`, 'h', sha256(`${email}:${code}`), 'a', '0', 'next', safeNext(body.next)],
    ['EXPIRE', `v2:login:code:${email}`, TTL],
  ]);

  const link = `${SITE_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendLoginEmail(email, code, link, lang);
  } catch (e) {
    console.error('login email failed', e);
    return json({ error: 'We could not send the email right now. Please try again in a minute.' }, 502);
  }
  return json({ ok: true });
}

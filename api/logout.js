// /api/logout.js
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}

export default async function handler(req, res) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const sessionToken = cookies.pdfly_session;
    if (sessionToken) {
      await redis.del(`session:${sessionToken}`);
    }
  } catch (err) {
    console.error('logout error:', err);
  }
  res.setHeader('Set-Cookie', [
    'pdfly_session=; Path=/; Max-Age=0',
    'pdfly_email=; Path=/; Max-Age=0',
  ]);
  return res.status(200).json({ ok: true });
}

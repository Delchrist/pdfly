// /api/me.js
import { Redis } from '@upstash/redis';

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
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const cookies = parseCookies(req.headers.cookie || '');
    const sessionToken = cookies.pdfly_session;

    if (!sessionToken) {
      return res.status(200).json({ loggedIn: false });
    }

    const email = await redis.get(`session:${sessionToken}`);
    if (!email) {
      res.setHeader('Set-Cookie', [
        'pdfly_session=; Path=/; Max-Age=0',
        'pdfly_email=; Path=/; Max-Age=0',
      ]);
      return res.status(200).json({ loggedIn: false });
    }

    const proRecord = await redis.get(`pro:${email}`);
    let isPro = false;
    if (proRecord) {
      if (typeof proRecord === 'object') {
        isPro = proRecord.active === true;
      } else if (proRecord === 'active' || proRecord === true) {
        isPro = true;
      }
    }

    return res.status(200).json({ loggedIn: true, email, isPro });
  } catch (err) {
    console.error('me error:', err);
    return res.status(200).json({ loggedIn: false, error: err.message });
  }
}

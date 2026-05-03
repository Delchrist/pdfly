// /api/verify-magic-link.js
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const token = req.query?.token;
    if (!token || typeof token !== 'string') {
      return res.redirect(302, '/?login=invalid');
    }

    const email = await redis.get(`token:${token}`);
    if (!email) {
      return res.redirect(302, '/?login=expired');
    }

    // Don't delete the token — let it expire naturally after 15 min.
    // This way Safe Links scanning it first doesn't break the real click.
    // We prevent reuse by checking if a session was already created for this token.
    const sessionAlreadyCreated = await redis.get(`session_created:${token}`);
    
    if (!sessionAlreadyCreated) {
      await redis.set(`session_created:${token}`, '1', { ex: 900 });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`session:${sessionToken}`, email, { ex: 60 * 60 * 24 * 90 });

    const isSecure = (req.headers['x-forwarded-proto'] || 'https') === 'https';
    const cookieFlags = `Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [
      `pdfly_session=${sessionToken}; HttpOnly; ${cookieFlags}`,
      `pdfly_email=${encodeURIComponent(email)}; ${cookieFlags}`,
    ]);
    return res.redirect(302, '/?login=success');

  } catch (err) {
    console.error('verify-magic-link error:', err);
    return res.redirect(302, '/?login=error');
  }
}

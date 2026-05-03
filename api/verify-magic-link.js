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

    // Check if already used (Safe Links scanner already hit it)
    const alreadyUsed = await redis.get(`used:${token}`);
    
    if (!alreadyUsed) {
      // First visit — likely the scanner. Mark as used but don't create session yet.
      await redis.set(`used:${token}`, '1', { ex: 300 });
    }

    // Always create a session — scanner won't store cookies so it won't matter
    await redis.del(`token:${token}`);
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

// /api/send-magic-link.js
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const email = String(body.email || '').toLowerCase().trim();
    if (!email || !email.includes('@') || email.length > 200) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    if (!apiKey) {
      console.error('RESEND_API_KEY missing');
      return res.status(500).json({ error: 'Email service not configured (missing API key).' });
    }
    if (!fromEmail) {
      console.error('FROM_EMAIL missing');
      return res.status(500).json({ error: 'Email service not configured (missing FROM_EMAIL).' });
    }

    const rateKey = `rate:${email}`;
    const recent = await redis.get(rateKey);
    if (recent) {
      return res.status(429).json({ error: 'Please wait a moment before requesting another link.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(`token:${token}`, email, { ex: 900 });
    await redis.set(rateKey, '1', { ex: 60 });

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const magicLink = `${proto}://${host}/api/verify-magic-link?token=${token}`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Your PDFly login link',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:32px;background:#FAFAFC;border-radius:16px;"><h1 style="font-size:22px;color:#15102A;">Your PDFly login link</h1><p style="font-size:15px;color:#4B4566;line-height:1.55;">Click below to log in. Valid for 15 minutes.</p><a href="${magicLink}" style="display:inline-block;padding:14px 28px;background:#5B4FE5;color:white;text-decoration:none;border-radius:12px;font-weight:600;">Log in to PDFly</a><p style="font-size:13px;color:#8A85A0;margin-top:20px;">Or paste this link: <a href="${magicLink}" style="color:#5B4FE5;">${magicLink}</a></p></div>`,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendResponse.status, JSON.stringify(resendData));
      const errorMsg = resendData?.message || resendData?.error || `Email service error (status ${resendResponse.status})`;
      return res.status(500).json({ error: errorMsg });
    }

    console.log('Magic link sent to', email, 'id:', resendData.id);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('send-magic-link crash:', err.message, err.stack);
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}

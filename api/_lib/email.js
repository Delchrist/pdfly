// Transactional email via Resend REST API.
import { SITE_URL, escapeHtml } from './util.js';

const FROM = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'ZoungPDF <hello@zoungpdf.com>';

async function send({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text, reply_to: process.env.EMAIL_REPLY_TO || undefined }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return res.json();
}

function layout(title, inner) {
  return `<!doctype html><html><body style="margin:0;background:#f6f5f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1b18">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;padding:32px;border:1px solid #e8e5df">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:20px"><span style="color:#e5484d">■</span> ZoungPDF</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${inner}</td></tr>
</table>
<p style="font-size:12px;color:#8a857c;margin-top:16px">${escapeHtml(title)} · <a href="${SITE_URL}" style="color:#8a857c">zoungpdf.com</a></p>
</td></tr></table></body></html>`;
}

export async function sendLoginEmail(to, code, link, lang = 'en') {
  const fr = lang === 'fr';
  const subject = fr ? `Votre code de connexion ZoungPDF : ${code}` : `Your ZoungPDF sign-in code: ${code}`;
  const inner = fr
    ? `<p>Entrez ce code pour vous connecter :</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p>Ou cliquez ici :</p>
<p><a href="${link}" style="display:inline-block;background:#1d1b18;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Se connecter à ZoungPDF</a></p>
<p style="color:#8a857c;font-size:13px">Le code expire dans 15 minutes. Si vous n'avez rien demandé, ignorez ce courriel.</p>`
    : `<p>Enter this code to sign in:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p>Or use this button:</p>
<p><a href="${link}" style="display:inline-block;background:#1d1b18;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Sign in to ZoungPDF</a></p>
<p style="color:#8a857c;font-size:13px">The code expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>`;
  const text = fr
    ? `Votre code ZoungPDF : ${code}\nOu ouvrez : ${link}\nExpire dans 15 minutes.`
    : `Your ZoungPDF code: ${code}\nOr open: ${link}\nExpires in 15 minutes.`;
  return send({ to, subject, html: layout(subject, inner), text });
}

export async function sendWelcomeEmail(to) {
  const subject = 'Welcome to ZoungPDF Pro';
  const inner = `<p>Thanks for upgrading. Every Pro tool is now unlocked on your account:</p>
<ul><li>Watermarks, page numbers, password protection and e-signatures</li><li>Batch processing</li><li>Files up to 1 GB</li></ul>
<p><a href="${SITE_URL}/" style="display:inline-block;background:#e5484d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Open ZoungPDF</a></p>
<p style="color:#8a857c;font-size:13px">Manage or cancel anytime from <a href="${SITE_URL}/account/">your account</a>.</p>`;
  return send({ to, subject, html: layout(subject, inner), text: `Thanks for upgrading to ZoungPDF Pro. Manage your plan at ${SITE_URL}/account/` });
}

export async function sendPaymentFailedEmail(to) {
  const subject = 'Your ZoungPDF payment didn’t go through';
  const inner = `<p>We couldn't charge your card for ZoungPDF Pro. Stripe will retry automatically over the next few days.</p>
<p>To keep Pro active, please update your payment method:</p>
<p><a href="${SITE_URL}/account/" style="display:inline-block;background:#1d1b18;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Update payment method</a></p>`;
  return send({ to, subject, html: layout(subject, inner), text: `Your ZoungPDF payment failed. Update your card at ${SITE_URL}/account/` });
}

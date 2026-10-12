// POST /api/auth/logout
import { json, sameOrigin } from '../_lib/util.js';
import { clearSessionCookie } from '../_lib/session.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Bad origin' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}

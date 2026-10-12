// GET /api/me -> { signedIn, email, pro, plan }
import { json } from './_lib/util.js';
import { getSessionEmail } from './_lib/session.js';
import { getUser, isPro } from './_lib/redis.js';

export async function GET(request) {
  const email = getSessionEmail(request);
  if (!email) return json({ signedIn: false, pro: false });
  const user = await getUser(email);
  return json({
    signedIn: true,
    email,
    pro: isPro(user),
    plan: user
      ? {
          status: user.status || 'none',
          interval: user.interval || null,
          periodEnd: user.periodEnd ? Number(user.periodEnd) : null,
          cancelAtPeriodEnd: user.cancelAtPeriodEnd === 'true',
          hasBilling: Boolean(user.customerId),
        }
      : null,
  });
}

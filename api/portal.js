// POST /api/portal -> { url } Stripe customer portal (update card, cancel, invoices)
import { json, sameOrigin, SITE_URL } from './_lib/util.js';
import { getSessionEmail } from './_lib/session.js';
import { getUser } from './_lib/redis.js';
import { stripe } from './_lib/stripe.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Bad origin' }, 403);
  const email = getSessionEmail(request);
  if (!email) return json({ error: 'signin_required' }, 401);
  const user = await getUser(email);
  if (!user?.customerId) return json({ error: 'No billing account yet.' }, 404);
  const params = { customer: user.customerId, return_url: `${SITE_URL}/account/` };
  if (process.env.STRIPE_PORTAL_CONFIG) params.configuration = process.env.STRIPE_PORTAL_CONFIG;
  const session = await stripe('POST', '/billing_portal/sessions', params);
  return json({ url: session.url });
}

// POST /api/checkout { interval: 'month'|'year' } -> { url } Stripe Checkout (subscription)
import { json, readJson, sameOrigin, SITE_URL } from './_lib/util.js';
import { getSessionEmail } from './_lib/session.js';
import { getUser, upsertUser, isPro } from './_lib/redis.js';
import { stripe, getPrices } from './_lib/stripe.js';

async function ensureCustomer(email, user) {
  if (user?.customerId) {
    try {
      const c = await stripe('GET', `/customers/${user.customerId}`);
      if (!c.deleted) return c.id;
    } catch {
      /* fall through and recreate */
    }
  }
  // Reuse an existing Stripe customer with this email if one exists (e.g. from the old version of the site).
  const found = await stripe('GET', '/customers', { email, limit: 1 });
  const customer = found.data[0] || (await stripe('POST', '/customers', { email, metadata: { app: 'pdfly' } }));
  await upsertUser(email, { customerId: customer.id });
  return customer.id;
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Bad origin' }, 403);
  const email = getSessionEmail(request);
  if (!email) return json({ error: 'signin_required' }, 401);

  const body = await readJson(request);
  const interval = body.interval === 'year' ? 'year' : 'month';
  const user = await getUser(email);
  if (isPro(user)) return json({ error: 'already_pro', url: `${SITE_URL}/account/` }, 409);

  const prices = await getPrices();
  const price = prices[interval];
  if (!price) return json({ error: 'This plan is not available right now.' }, 503);

  const customer = await ensureCustomer(email, user);
  const lang = body.lang === 'fr' ? 'fr' : 'auto';
  const session = await stripe('POST', '/checkout/sessions', {
    mode: 'subscription',
    customer,
    client_reference_id: email,
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: 'true',
    automatic_tax: { enabled: 'true' },
    customer_update: { address: 'auto', name: 'auto' },
    billing_address_collection: 'auto',
    locale: lang,
    subscription_data: { metadata: { email, app: 'pdfly' } },
    metadata: { email, app: 'pdfly' },
    success_url: `${SITE_URL}/account/?checkout=success`,
    cancel_url: `${SITE_URL}/pricing/?checkout=cancelled`,
  });
  return json({ url: session.url });
}

// POST /api/stripe-webhook — keeps each user's plan in Redis in sync with Stripe.
// Same URL as the original site, so the existing Stripe webhook endpoint keeps working.
import { json } from './_lib/util.js';
import { redis, upsertUser, emailForCustomer, getUser } from './_lib/redis.js';
import { stripe, verifyStripeSignature, periodEndOf, intervalOf } from './_lib/stripe.js';
import { sendWelcomeEmail, sendPaymentFailedEmail } from './_lib/email.js';

async function resolveEmail({ customerId, metadataEmail }) {
  if (metadataEmail) return metadataEmail.toLowerCase();
  if (customerId) {
    const known = await emailForCustomer(customerId);
    if (known) return known;
    const c = await stripe('GET', `/customers/${customerId}`);
    if (c?.email) return c.email.toLowerCase();
  }
  return null;
}

async function syncSubscription(sub, hintEmail) {
  const email = hintEmail || (await resolveEmail({ customerId: sub.customer, metadataEmail: sub.metadata?.email }));
  if (!email) {
    console.warn('webhook: no email for subscription', sub.id);
    return null;
  }
  const existing = await getUser(email);
  // Ignore stale events for an older subscription when the user already has a newer active one.
  if (existing?.subscriptionId && existing.subscriptionId !== sub.id && ['active', 'trialing'].includes(existing.status) && !['active', 'trialing'].includes(sub.status)) {
    return email;
  }
  await upsertUser(email, {
    customerId: sub.customer,
    subscriptionId: sub.id,
    status: sub.status,
    interval: intervalOf(sub),
    periodEnd: periodEndOf(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    plan: ['active', 'trialing', 'past_due'].includes(sub.status) ? 'pro' : 'free',
  });
  return email;
}

export async function POST(request) {
  const raw = await request.text();
  const ok = verifyStripeSignature(raw, request.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return json({ error: 'Invalid signature' }, 400);

  const event = JSON.parse(raw);
  // Idempotency: Stripe may deliver the same event more than once.
  const first = await redis('SET', `v2:evt:${event.id}`, '1', 'NX', 'EX', 7 * 24 * 3600);
  if (first !== 'OK') return json({ received: true, duplicate: true });

  const obj = event.data.object;
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (obj.mode !== 'subscription' || !obj.subscription) break;
        const email = (obj.metadata?.email || obj.client_reference_id || obj.customer_details?.email || '').toLowerCase();
        const sub = await stripe('GET', `/subscriptions/${obj.subscription}`);
        const synced = await syncSubscription(sub, email || null);
        if (synced) await sendWelcomeEmail(synced).catch((e) => console.error('welcome email failed', e));
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await syncSubscription(obj);
        break;
      case 'invoice.paid': {
        const subId = obj.subscription || obj.parent?.subscription_details?.subscription;
        if (subId) await syncSubscription(await stripe('GET', `/subscriptions/${subId}`));
        break;
      }
      case 'invoice.payment_failed': {
        const email = await resolveEmail({ customerId: obj.customer });
        if (email && obj.attempt_count <= 1) await sendPaymentFailedEmail(email).catch((e) => console.error(e));
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Let Stripe retry: release the idempotency key and return 500.
    console.error('webhook handler error', event.type, e);
    await redis('DEL', `v2:evt:${event.id}`).catch(() => {});
    return json({ error: 'handler_failed' }, 500);
  }
  return json({ received: true });
}

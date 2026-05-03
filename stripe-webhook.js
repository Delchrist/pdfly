// /api/stripe-webhook.js
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe env vars missing');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeKey);
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
        if (email) {
          await redis.set(`pro:${email}`, {
            active: true,
            customerId: session.customer,
            subscriptionId: session.subscription,
            activatedAt: Date.now(),
          });
          console.log(`Pro activated: ${email}`);
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        if (sub.status === 'canceled' || sub.status === 'unpaid') {
          const customer = await stripe.customers.retrieve(sub.customer);
          const email = (customer.email || '').toLowerCase().trim();
          if (email) {
            await redis.set(`pro:${email}`, { active: false, deactivatedAt: Date.now() });
            console.log(`Pro deactivated: ${email}`);
          }
        }
        break;
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

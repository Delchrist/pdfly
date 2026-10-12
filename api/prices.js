// GET /api/prices -> live prices from Stripe (so the pricing page never drifts from what checkout charges)
import { json } from './_lib/util.js';
import { getPrices } from './_lib/stripe.js';

export async function GET() {
  try {
    const p = await getPrices();
    const fmt = (price) => (price ? { amount: price.unit_amount, currency: price.currency, interval: price.recurring?.interval } : null);
    return json({ month: fmt(p.month), year: fmt(p.year) }, 200, { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600' });
  } catch (e) {
    console.error(e);
    return json({ error: 'Prices unavailable' }, 503);
  }
}

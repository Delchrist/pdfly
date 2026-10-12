# ZoungPDF v3

Private PDF tools that run entirely in the browser, with a Stripe-powered Pro plan. Live at https://zoungpdf.com.

## What's here

| Path | Purpose |
|---|---|
| `public/` | The static site served by Vercel (generated pages + `assets/` + `vendor/` libraries) |
| `public/assets/app.js` | Account, sign-in modal, pricing and checkout |
| `public/assets/tools.js` | All 13 PDF tools (pdf-lib + pdf.js, client-side) |
| `scripts/tools.mjs` | Tool catalogue and bilingual SEO copy. **Edit this to change tool text** |
| `scripts/build.mjs` | Generates every page in `public/` (EN + FR, sitemap, robots) |
| `api/` | Vercel Functions: sign-in, `/api/me`, checkout, billing portal, Stripe webhook |
| `tests/` | API tests against in-memory fakes (`npm test`) |

After editing `scripts/*.mjs`, run `npm run build` and commit the regenerated `public/` folder.

## Free vs Pro

- **Free:** merge, split, compress, organize, rotate, delete, extract, JPG→PDF, PDF→JPG, files up to 25 MB
- **Pro:** watermark, page numbers, password protection, signatures, batch processing, files up to 1 GB

Prices come live from Stripe via the lookup keys `pdfly_pro_monthly` and `pdfly_pro_yearly`. To change a price, create a new Stripe price and move the lookup key to it (with "transfer lookup key"); no code change is needed.

## Environment variables (Vercel)

| Name | Notes |
|---|---|
| `STRIPE_SECRET_KEY` | Live secret key |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint `https://zoungpdf.com/api/stripe-webhook/` (keep the trailing slash: the site redirects URLs without one, and Stripe does not follow redirects) |
| `RESEND_API_KEY` | Sending domain zoungpdf.com |
| `FROM_EMAIL` | e.g. `ZoungPDF <hello@zoungpdf.com>` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (set by the Vercel integration) |
| `SESSION_SECRET` | Random 32+ chars, signs login cookies |

Stripe webhook events used: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`.

## Local development

```bash
npm install           # only needed to refresh vendor libs
MOCK=1 npm run dev    # http://localhost:8787 with fake Stripe/Redis/email
npm test
```

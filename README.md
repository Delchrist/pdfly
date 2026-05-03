 PDFly

Every PDF tool you need, in one place. Free for everyone, supercharged for Pro members.

## Quick start

1. Read `DEPLOYMENT_GUIDE.md` — it walks you through everything.
2. Push these files to a GitHub repo.
3. Import to Vercel → set 3 environment variables → done.

## What's in this folder

| File | What it does |
|------|--------------|
| `index.html` | The entire website — landing page, tools, pricing, success/cancel pages. Tools work 100% in-browser. |
| `api/create-checkout.js` | Vercel serverless function that creates a Stripe Checkout session when someone clicks "Upgrade to Pro". |
| `package.json` | Lists the one dependency (`stripe`) that the API function needs. |
| `vercel.json` | Vercel deployment config + security headers. |
| `DEPLOYMENT_GUIDE.md` | Step-by-step instructions to deploy and configure payments. |

## Tools included

**Free**
- Merge PDF · Split PDF · Compress PDF · Rotate PDF · JPG to PDF · PDF to JPG

**Pro**
- Watermark · Page Numbers · Protect PDF · Unlimited file size

## Tech

- Pure HTML/CSS/JS — no build step
- PDF processing via [pdf-lib](https://pdf-lib.js.org/) and [pdf.js](https://mozilla.github.io/pdf.js/)
- Payments via [Stripe Checkout](https://stripe.com/payments/checkout)
- Hosted on [Vercel](https://vercel.com)

## License

MIT — do whatever you want.

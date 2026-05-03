# PDFly v2 — Login & Pro Access Setup

You now have a full magic-link login system, so customers can access Pro from any device after paying. Here's what you need to do to make it work.

**Estimated time: 25-30 minutes** (you'll set up Resend, Vercel KV, and a Stripe webhook)

---

## What's new in v2

- **Magic-link login** — customers enter email → receive a login link → click to log in
- **Server-side Pro status** — Pro is unlocked across all devices, not just one browser
- **Stripe webhook** — when someone pays, the system automatically marks them as Pro
- **Customer dashboard** — they see their account in the top-right when logged in

---

## ⚠️ Important: Update your existing repo

Replace the files in your `pdfly` GitHub repo with the new versions. You should now have these files:

```
pdfly/
├── index.html
├── package.json          ← NEW
├── vercel.json
└── api/                  ← NEW FOLDER
    ├── stripe-webhook.js
    ├── send-magic-link.js
    ├── verify-magic-link.js
    ├── me.js
    └── logout.js
```

**To update via GitHub web UI:**
1. Open your repo
2. Delete the old `index.html` (open it → ⋯ menu → Delete file)
3. Click **Add file → Upload files**
4. Drag in the new `index.html`, `package.json`, and the entire `api` folder
5. Commit changes

Vercel will auto-deploy in ~30 seconds.

---

## Part 1 — Set up Vercel KV (database)

Vercel KV is a tiny, fast database for storing user sessions and Pro status. Free tier is plenty.

1. Go to your Vercel project dashboard
2. Click **Storage** tab (top)
3. Click **Create Database** → choose **KV**
4. Name it: `pdfly-kv`
5. Region: pick the one closest to you
6. Click **Create**
7. On the next screen, you'll see **"Connect Project"** — connect it to your `pdfly` project
8. Vercel automatically adds these environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`

You don't need to copy these manually — Vercel handles it.

---

## Part 2 — Set up Resend (email service)

This sends the magic-link login emails to your customers.

### 2.1 Create Resend account
1. Go to https://resend.com → **Sign Up** (use your GitHub login for speed)
2. Verify your email

### 2.2 Get API key
1. In Resend dashboard → **API Keys** → **Create API Key**
2. Name: `PDFly`
3. Permission: **Sending access**
4. Click **Create**
5. **Copy the key** (starts with `re_…`) — you can only see it once

### 2.3 (Optional but recommended) Verify your domain
For now, you can send emails from `onboarding@resend.dev` — works for testing but emails may go to spam.

If you have your domain (e.g., `pdfly.com`):
1. Resend → **Domains** → **Add Domain**
2. Enter `pdfly.com`
3. Add the DNS records Resend shows you to your registrar (same place you set up Vercel DNS)
4. Wait 5-15 minutes for verification
5. Now you can send from `hello@pdfly.com`

**Skip this for now if you haven't bought a domain yet** — `onboarding@resend.dev` is fine for testing.

### 2.4 Add to Vercel
1. Vercel project → **Settings** → **Environment Variables**
2. Add two variables:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_…` (from step 2.2) |
| `FROM_EMAIL` | `PDFly <onboarding@resend.dev>` (or your verified domain like `PDFly <hello@pdfly.com>`) |

3. Save each → check **All Environments**

---

## Part 3 — Set up Stripe webhook

This is what tells your site "hey, this person just paid — make them Pro."

### 3.1 Get your Stripe Secret Key
1. Stripe dashboard → **Developers** → **API keys**
2. Find **Secret key** (starts with `sk_live_…` or `sk_test_…`)
3. Click **Reveal**, copy it

### 3.2 Add to Vercel
1. Vercel → Settings → Environment Variables
2. Add:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (the secret key) |

### 3.3 Create the webhook endpoint
1. Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://YOUR-VERCEL-URL.vercel.app/api/stripe-webhook`
   *(or `https://pdfly.com/api/stripe-webhook` if you have a custom domain)*
3. **Events to send** — click **Select events** and check these 3:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Click **Add endpoint**

### 3.4 Get the webhook signing secret
1. After creating the webhook, you're on its detail page
2. Find **Signing secret** → click **Reveal** → copy (starts with `whsec_…`)

### 3.5 Add it to Vercel
1. Vercel → Settings → Environment Variables
2. Add:

| Name | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

### 3.6 Redeploy
After adding env vars, Vercel needs to rebuild:
1. **Deployments** → latest one → ⋯ → **Redeploy**

---

## Part 4 — Update your Payment Links

Right now your Payment Links don't redirect customers back to your site after paying. Fix this:

For **both** the monthly and yearly Payment Links:

1. Stripe → **Payment Links** → click on the link
2. ⋯ menu → **Edit link**
3. Scroll to **After payment**
4. Choose: **Don't show confirmation page** → **Redirect customers to your website**
5. Enter:
   ```
   https://YOUR-VERCEL-URL.vercel.app/#success
   ```
   (or your custom domain)
6. Save
7. **Repeat for the second Payment Link**

---

## Part 5 — Test the complete flow

### Test 1: Login with non-paid email
1. Go to your site → click **Log in**
2. Enter ANY email (e.g., your personal email)
3. Click **Send me a login link**
4. Check your email → you should get a login email within 30 seconds
5. Click the link → you should be redirected to your site, logged in
6. Top-right should show your email
7. Click a Pro tool (Watermark) → it should show "This is a Pro feature → Upgrade to Pro"

If this works, login is good ✅

### Test 2: Real purchase + auto-Pro
1. Open an **incognito/private** browser window
2. Go to your site → **Pricing** → **Upgrade to Pro**
3. At Stripe Checkout, use the **same email as Test 1**
4. Pay $3 with a real card
5. You should be redirected back to `/#success`
6. Click **Log in now** → enter the email → click the magic link
7. You should now be logged in **AND** see "PRO" badge in top-right
8. Click Watermark — it should work without the Pro gate

If this works, full system is live ✅

### Test 3: Cross-device
1. Open your site on your phone
2. Log in with the same email
3. You should be Pro on your phone too 🎉

### Cleanup test purchase
- Stripe → **Customers** → find your charge → **Refund** the test purchase

---

## Troubleshooting

**Magic-link email never arrives**
- Check your spam folder first
- Vercel → Functions → click `send-magic-link` → check the logs
- Make sure `RESEND_API_KEY` and `FROM_EMAIL` are set in Vercel
- If using `onboarding@resend.dev`, some email providers reject it — verify your own domain in Resend

**Stripe webhook isn't firing**
- Stripe → Developers → Webhooks → click your endpoint → **Recent events** tab
- If you see ❌ failures, the response will tell you why
- Most common: `STRIPE_WEBHOOK_SECRET` mismatch — re-copy it and make sure it's the latest one

**"This is a Pro feature" still shows after paying**
- The webhook didn't fire OR the email used at Stripe Checkout doesn't match the login email
- Check Stripe Customer record → confirm the email
- Vercel → Functions → `stripe-webhook` → check logs for "Pro activated for [email]" message
- Customer must log in with the SAME email they paid with

**KV errors in logs**
- Make sure you connected the KV database to your project (Storage tab)
- Vercel auto-creates the env vars — if missing, click "Connect" again

---

## How everything fits together

```
                    ┌──────────────────┐
                    │  Customer pays   │
                    │  via Stripe link │
                    └────────┬─────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │ Stripe sends webhook    │
                │ event with email        │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │ /api/stripe-webhook     │
                │ saves: pro:email = true │  → Vercel KV
                └─────────────────────────┘

                  ─────  Later, on any device  ─────

                ┌─────────────────────────┐
                │ Customer enters email   │
                │ "Send me a login link"  │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │ /api/send-magic-link    │
                │ creates token, sends    │  → Resend
                │ email with link         │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │ Customer clicks link    │
                │ /api/verify-magic-link  │
                │ creates session cookie  │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │ Site calls /api/me      │
                │ → returns Pro status    │
                │ → Pro tools unlocked    │
                └─────────────────────────┘
```

---

## Cost summary (still free!)

| Service | Free tier | Your usage |
|---|---|---|
| Vercel hosting | 100 GB/mo bandwidth | A site this size: ~10MB/visitor → 10,000 visitors/mo |
| Vercel KV | 30,000 commands/day | Each user = ~5 commands per session. ~6,000 daily logins free. |
| Resend | 3,000 emails/month, 100/day | ~100 new logins per day = free. |
| Stripe | 2.9% + 30¢ per transaction | Standard, only when you make a sale |
| **Total fixed cost** | **$0/month** | + a domain (~$10/year) |

You can support hundreds of paying customers before paying for any service.

---

## You're done!

After completing all 5 parts, your PDFly is a real production product:
- ✅ Works on any device after login
- ✅ Pro unlocks automatically when someone pays
- ✅ Customers can log in from anywhere with just their email
- ✅ Subscriptions auto-cancel access if they're cancelled
- ✅ Fully secure — no localStorage trick to bypass payments

Now go get your first paying customer. 🚀

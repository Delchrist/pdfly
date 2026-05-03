# PDFly — FIX YOUR LOGIN (5 minutes)

The login system is being rebuilt with bulletproof code. Here's exactly what to do.

---

## Step 1: Replace files on GitHub (3 minutes)

You need to **replace** these 5 files in your GitHub repo. They're the API folder + package.json:

### File 1: `package.json` (in root)
1. Go to your GitHub repo: https://github.com/Delchrist/pdfly
2. Click on **`package.json`**
3. Click the **pencil ✏️ icon** (edit)
4. Select all content (Cmd+A) → Delete
5. Open the new `package.json` from this folder, copy ALL of it, paste into GitHub
6. Scroll down → **Commit changes**

### Files 2-6: Replace ALL files in the `api` folder
For each of these files (`send-magic-link.js`, `verify-magic-link.js`, `me.js`, `logout.js`, `stripe-webhook.js`):

1. Go into the `api` folder on GitHub
2. Click on the file
3. Click pencil ✏️ to edit
4. Select all → Delete
5. Copy ALL content from the new file
6. Paste into GitHub
7. **Commit changes**

Repeat for all 5 files in `api/`.

---

## Step 2: Verify the FROM_EMAIL value (1 minute)

In Vercel → Settings → Environment Variables:

1. Click the **eye icon 👁️** on `FROM_EMAIL` to reveal the value
2. The value MUST be **EXACTLY** one of these (copy-paste, don't type):

   ```
   PDFly <hello@pdfly.lol>
   ```
   
   OR (simpler, also works):
   
   ```
   hello@pdfly.lol
   ```

3. If it's wrong (like `PDFlyhello@pdfly.lol` with no space), **edit it**:
   - Click ⋯ on the row → Edit
   - Clear the value field completely
   - **COPY-PASTE** the correct value above (do not type by hand)
   - Save

---

## Step 3: Force a fresh redeploy (1 minute)

This is critical — env var changes only take effect after redeploy:

1. Vercel → **Deployments** tab
2. Click the **⋯ menu** on the most recent deployment (top of list)
3. Click **Redeploy**
4. **Check the box that says "Redeploy with existing Build Cache"** — actually **UNCHECK it** if you see it (forces fresh build)
5. Click **Redeploy** button
6. Wait until status shows **"Ready"** (about 60 seconds)

---

## Step 4: Test (1 minute)

1. Open https://pdfly.lol in **incognito/private window**
2. Click **Log in**
3. Enter your email
4. Click **Send me a login link**

### What you'll see now (key change):

If it fails this time, you'll get a **specific error message** like:
- "Email service error (status 403)" — means Resend domain not actually verified
- "Email service not configured" — means env vars missing
- Or actually: a success! ✓

If it succeeds, check your inbox AND spam folder for the login email.

---

## If it STILL fails — check the logs

1. Vercel → **Logs** in left sidebar
2. Try logging in on the site, then refresh the logs
3. Look for `/api/send-magic-link` row with red error
4. Click it → see the actual error message
5. **Send the error message to Claude** — I'll know exactly what to fix

---

## Common errors and instant fixes

| Error in logs | What's actually wrong | Fix |
|---|---|---|
| `Cannot find module '@vercel/kv'` | Old code still cached | Hard redeploy without cache |
| `RESEND_API_KEY is missing` | Env var not set | Add it to Vercel |
| `The email address must be in a verified domain` | FROM_EMAIL doesn't match Resend's verified domain | Use `hello@pdfly.lol` exactly (matching what you verified) |
| `Could not connect to Redis` | Upstash env vars missing | Reconnect Upstash to project |
| `Invalid API key` | RESEND_API_KEY wrong | Generate new key in Resend, update Vercel |

---

## What I changed in this rebuild

1. **Removed `@vercel/kv`** dependency (it sometimes has issues) — using `@upstash/redis` directly instead. Same database, more reliable client.
2. **Removed Resend SDK** dependency — calling Resend's API directly with `fetch`. Simpler, more reliable, no version issues.
3. **Better error handling** — when something fails, you get a specific error message instead of generic "Failed to send email".
4. **Detailed console logging** — every error is logged to Vercel so we can see exactly what's happening.

This should work. If it doesn't, the error message will tell us exactly why in 5 seconds.

// Minimal Upstash Redis REST client (no dependencies).
// Accepts either UPSTASH_REDIS_REST_* or the Vercel KV-style KV_REST_API_* variable names.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function redis(...command) {
  if (!URL_ || !TOKEN) throw new Error('Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)');
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(command.map((c) => (typeof c === 'number' ? String(c) : c))),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Redis error: ${data.error || res.status}`);
  return data.result;
}

export async function redisPipeline(commands) {
  if (!URL_ || !TOKEN) throw new Error('Redis is not configured');
  const res = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands.map((cmd) => cmd.map((c) => (typeof c === 'number' ? String(c) : c)))),
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(`Redis pipeline error: ${res.status}`);
  return data.map((r) => r.result);
}

// Fixed-window rate limiter. Returns true when the call is allowed.
export async function rateLimit(key, limit, windowSeconds) {
  const [count] = await redisPipeline([
    ['INCR', `v2:rl:${key}`],
    ['EXPIRE', `v2:rl:${key}`, windowSeconds, 'NX'],
  ]);
  return Number(count) <= limit;
}

// ---- User records ----
// user:<email>  hash { email, customerId, plan, status, subscriptionId, interval, periodEnd, cancelAtPeriodEnd, createdAt }
// cust:<customerId> -> email

export async function getUser(email) {
  const arr = await redis('HGETALL', `v2:user:${email}`);
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i + 1];
  return obj;
}

export async function upsertUser(email, fields) {
  const flat = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    flat.push(k, String(v));
  }
  const cmds = [['HSETNX', `v2:user:${email}`, 'createdAt', String(Date.now())], ['HSET', `v2:user:${email}`, 'email', email, ...flat]];
  if (fields.customerId) cmds.push(['SET', `v2:cust:${fields.customerId}`, email]);
  await redisPipeline(cmds);
}

export async function emailForCustomer(customerId) {
  return redis('GET', `v2:cust:${customerId}`);
}

export function isPro(user) {
  if (!user) return false;
  if (!['active', 'trialing', 'past_due'].includes(user.status)) return false;
  // Belt and braces: if we know the period end and it is well in the past, treat as expired.
  const end = Number(user.periodEnd || 0);
  if (end && end * 1000 < Date.now() - 3 * 24 * 3600 * 1000) return false;
  return true;
}

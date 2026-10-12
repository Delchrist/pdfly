// Generates every static page into public/. Run: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS, ICONS, COMMON_FAQ } from './tools.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public');
const SITE = 'https://pdfly.lol';
const VERSION = Date.now().toString(36);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const T = {
  en: {
    tools: 'Tools', pricing: 'Pricing', signin: 'Sign in', account: 'Account', allTools: 'All PDF tools',
    heroTitle: 'Every PDF tool you need. <em>None of the uploading.</em>',
    heroLead: 'Merge, split, compress, convert, sign and protect PDFs right in your browser. Your files never leave your device.',
    trust: ['No upload, 100% private', 'No sign-up for free tools', 'Works on phone & desktop', 'Bilingual EN/FR'],
    pick: 'Pick a tool', how: 'How it works', faq: 'Questions', related: 'More PDF tools',
    drop: 'Drop your files here', choose: 'Choose files', orDrop: 'or drag and drop',
    footerTag: 'Private PDF tools that run in your browser.', privacy: 'Privacy', terms: 'Terms', contact: 'Contact',
    proBadge: 'Pro', freeBadge: 'Free',
    pricingTitle: 'Simple pricing', pricingLead: 'The essentials are free forever. Go Pro when you need more.',
    monthly: 'Monthly', yearly: 'Yearly', save: 'Save 35%',
    freePlan: 'Free', freePrice: '$0', freeNote: 'No account needed',
    freeFeatures: ['Merge, split, compress', 'Organize, rotate, delete & extract pages', 'JPG ↔ PDF conversion', 'Files up to 25 MB', '100% private, in-browser'],
    freeMissing: ['Watermarks & page numbers', 'Password protection & e-signature', 'Batch processing'],
    proPlan: 'Pro', proNote: 'Cancel anytime', proCta: 'Get Pro', freeCta: 'Use free tools',
    proFeatures: ['Everything in Free', 'Watermark PDFs', 'Add page numbers', 'Password-protect PDFs', 'Sign PDFs', 'Batch processing', 'Files up to 1 GB', 'Priority email support'],
    taxNote: 'Prices in CAD. Applicable taxes are calculated at checkout. Secure payment by Stripe.',
    accountTitle: 'Your account',
  },
  fr: {
    tools: 'Outils', pricing: 'Tarifs', signin: 'Connexion', account: 'Compte', allTools: 'Tous les outils PDF',
    heroTitle: 'Tous vos outils PDF. <em>Sans rien téléverser.</em>',
    heroLead: 'Fusionnez, divisez, compressez, convertissez, signez et protégez vos PDF dans votre navigateur. Vos fichiers ne quittent jamais votre appareil.',
    trust: ['Aucun téléversement', 'Sans inscription pour les outils gratuits', 'Mobile et ordinateur', 'Bilingue FR/EN'],
    pick: 'Choisissez un outil', how: 'Comment ça marche', faq: 'Questions', related: 'Autres outils PDF',
    drop: 'Déposez vos fichiers ici', choose: 'Choisir des fichiers', orDrop: 'ou glissez-déposez',
    footerTag: 'Des outils PDF privés qui fonctionnent dans votre navigateur.', privacy: 'Confidentialité', terms: 'Conditions', contact: 'Contact',
    proBadge: 'Pro', freeBadge: 'Gratuit',
    pricingTitle: 'Des tarifs simples', pricingLead: 'L’essentiel est gratuit pour toujours. Passez à Pro quand vous en avez besoin.',
    monthly: 'Mensuel', yearly: 'Annuel', save: 'Économisez 35 %',
    freePlan: 'Gratuit', freePrice: '0 $', freeNote: 'Aucun compte requis',
    freeFeatures: ['Fusionner, diviser, compresser', 'Organiser, pivoter, supprimer et extraire', 'Conversion JPG ↔ PDF', 'Fichiers jusqu’à 25 Mo', '100 % privé, dans le navigateur'],
    freeMissing: ['Filigranes et numérotation', 'Mot de passe et signature', 'Traitement par lots'],
    proPlan: 'Pro', proNote: 'Annulable en tout temps', proCta: 'Passer à Pro', freeCta: 'Outils gratuits',
    proFeatures: ['Tout le forfait Gratuit', 'Filigranes', 'Numérotation des pages', 'Protection par mot de passe', 'Signature de PDF', 'Traitement par lots', 'Fichiers jusqu’à 1 Go', 'Soutien prioritaire par courriel'],
    taxNote: 'Prix en CAD. Les taxes applicables sont calculées au paiement. Paiement sécurisé par Stripe.',
    accountTitle: 'Votre compte',
  },
};

const prefix = (lang) => (lang === 'fr' ? '/fr' : '');
const toolUrl = (tool, lang) => `${prefix(lang)}/${tool.slug}/`;

function head({ lang, title, desc, canonicalPath, altPath, noindex, jsonld }) {
  const enPath = lang === 'en' ? canonicalPath : altPath;
  const frPath = lang === 'fr' ? canonicalPath : altPath;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${SITE}${canonicalPath}">
${altPath ? `<link rel="alternate" hreflang="en" href="${SITE}${enPath}">
<link rel="alternate" hreflang="fr" href="${SITE}${frPath}">
<link rel="alternate" hreflang="x-default" href="${SITE}${enPath}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${canonicalPath}">
<meta property="og:site_name" content="PDFly">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#e5484d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/app.css?v=${VERSION}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>`;
}

function header(lang, altPath) {
  const t = T[lang];
  const menu = TOOLS.map((tool) => {
    const c = tool[lang];
    return `<a href="${toolUrl(tool, lang)}"><span class="ico${tool.pro ? ' pro' : ''}">${ICONS[tool.icon]}</span>${esc(c.name)}${tool.pro ? ` <span class="badge">${t.proBadge}</span>` : ''}</a>`;
  }).join('');
  return `<header class="site-header"><div class="container">
<a class="logo" href="${prefix(lang) || '/'}${lang === 'fr' ? '/' : ''}" aria-label="PDFly home"><span class="logo-mark"></span>PDFly</a>
<nav class="nav">
<div class="nav-tools"><button class="link" type="button" data-menu-toggle aria-expanded="false">${t.tools} ▾</button><div class="menu hidden" data-menu>${menu}</div></div>
<a href="${prefix(lang)}/pricing/" class="hide-sm">${t.pricing}</a>
<a href="${altPath || (lang === 'fr' ? '/' : '/fr/')}" class="lang" hreflang="${lang === 'fr' ? 'en' : 'fr'}" data-lang-switch>${lang === 'fr' ? 'EN' : 'FR'}</a>
<a href="${prefix(lang)}/account/" class="btn btn-sm" data-account-link>${t.signin}</a>
</nav></div></header>`;
}

function footer(lang) {
  const t = T[lang];
  const links = TOOLS.map((tool) => `<a href="${toolUrl(tool, lang)}">${esc(tool[lang].name)}</a>`).join('');
  return `<footer class="site-footer"><div class="container">
<div><a class="logo" href="${lang === 'fr' ? '/fr/' : '/'}"><span class="logo-mark"></span>PDFly</a><p>${t.footerTag}</p>
<nav><a href="${prefix(lang)}/pricing/">${t.pricing}</a><a href="/privacy/">${t.privacy}</a><a href="/terms/">${t.terms}</a><a href="mailto:hello@pdfly.lol">${t.contact}</a></nav>
<p class="small">© ${new Date().getFullYear()} PDFly</p></div>
<nav style="max-width:560px">${links}</nav>
</div></footer>`;
}

function shell({ lang, title, desc, canonicalPath, altPath, body, bodyAttrs = '', noindex, jsonld }) {
  return `${head({ lang, title, desc, canonicalPath, altPath, noindex, jsonld })}
<body data-lang="${lang}" ${bodyAttrs}>
${header(lang, altPath)}
<main>${body}</main>
${footer(lang)}
<script type="module" src="/assets/app.js?v=${VERSION}"></script>
</body></html>`;
}

function toolCards(lang) {
  const t = T[lang];
  return TOOLS.map((tool) => {
    const c = tool[lang];
    return `<a class="tool-card" href="${toolUrl(tool, lang)}"><span class="ico${tool.pro ? ' pro' : ''}">${ICONS[tool.icon]}</span>${tool.pro ? `<span class="badge">${t.proBadge}</span>` : ''}<h3>${esc(c.name)}</h3><p>${esc(c.short)}</p></a>`;
  }).join('\n');
}

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const sitemap = [];

for (const lang of ['en', 'fr']) {
  const t = T[lang];
  const other = lang === 'en' ? 'fr' : 'en';

  // Home
  const homePath = lang === 'fr' ? '/fr/' : '/';
  write(`${lang === 'fr' ? 'fr/' : ''}index.html`, shell({
    lang,
    title: lang === 'fr' ? 'PDFly — Outils PDF gratuits et privés' : 'PDFly — Free, Private PDF Tools in Your Browser',
    desc: t.heroLead,
    canonicalPath: homePath,
    altPath: lang === 'fr' ? '/' : '/fr/',
    jsonld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'PDFly', url: SITE, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' } },
    body: `<section class="hero"><div class="container">
<h1>${t.heroTitle}</h1><p class="lead">${t.heroLead}</p>
<div class="trust">${t.trust.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
</div></section>
<section class="section"><div class="container"><h2 class="sr-only">${t.pick}</h2><div class="tool-grid">${toolCards(lang)}</div></div></section>
<section class="section"><div class="container content"><h2>${t.faq}</h2>${COMMON_FAQ[lang].map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`,
  }));
  sitemap.push(homePath);

  // Tools
  for (const tool of TOOLS) {
    const c = tool[lang];
    const p = toolUrl(tool, lang);
    const faqs = [...c.faq, ...COMMON_FAQ[lang]];
    const related = TOOLS.filter((x) => x.id !== tool.id).slice(0, 8);
    write(`${p.slice(1)}index.html`, shell({
      lang,
      title: c.title,
      desc: c.desc,
      canonicalPath: p,
      altPath: toolUrl(tool, other),
      bodyAttrs: `data-tool="${tool.id}" data-pro="${tool.pro ? 1 : 0}" data-batch="${tool.batch ? 1 : 0}"`,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      body: `<div class="container">
<div class="tool-head"><span class="ico${tool.pro ? ' pro' : ''}">${ICONS[tool.icon]}</span><h1>${esc(c.name)} ${tool.pro ? `<span class="badge">${t.proBadge}</span>` : ''}</h1><p>${esc(c.short)}</p></div>
<div class="workspace" id="workspace">
<div class="dropzone" id="dropzone" tabindex="0" role="button">
<strong>${t.drop}</strong>
<button class="btn btn-primary btn-lg" type="button">${t.choose}</button>
<div class="hint">${t.orDrop}</div>
</div>
<input type="file" id="file-input" class="hidden" accept="${tool.id === 'jpg2pdf' ? 'image/*' : 'application/pdf,.pdf'}"${tool.id === 'merge' || tool.id === 'jpg2pdf' || tool.batch ? ' multiple' : ''}>
<div id="tool-ui"></div>
</div>
<div class="content">
<h2>${t.how}</h2><ol class="steps">${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>${t.faq}</h2>${faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<h2>${t.related}</h2><div class="related">${related.map((x) => `<a href="${toolUrl(x, lang)}">${esc(x[lang].name)}</a>`).join('')}</div>
</div></div>`,
    }));
    sitemap.push(p);
  }

  // Pricing
  const priceP = `${prefix(lang)}/pricing/`;
  write(`${priceP.slice(1)}index.html`, shell({
    lang,
    title: lang === 'fr' ? 'Tarifs — PDFly Pro' : 'Pricing — PDFly Pro',
    desc: t.pricingLead,
    canonicalPath: priceP,
    altPath: `${prefix(other)}/pricing/`,
    bodyAttrs: 'data-page="pricing"',
    body: `<div class="container"><div class="tool-head"><h1>${t.pricingTitle}</h1><p>${t.pricingLead}</p></div>
<div style="text-align:center"><div class="toggle" role="tablist"><button type="button" data-interval="month">${t.monthly}</button><button type="button" class="on" data-interval="year">${t.yearly}<span class="save-tag" data-save-tag>${t.save}</span></button></div></div>
<div class="pricing">
<div class="plan"><h3>${t.freePlan}</h3><div class="price">${t.freePrice}</div><div class="note">${t.freeNote}</div>
<ul>${t.freeFeatures.map((f) => `<li>${esc(f)}</li>`).join('')}${t.freeMissing.map((f) => `<li class="no">${esc(f)}</li>`).join('')}</ul>
<a class="btn btn-block btn-lg" href="${lang === 'fr' ? '/fr/' : '/'}">${t.freeCta}</a></div>
<div class="plan featured"><h3>${t.proPlan} <span class="badge">★</span></h3><div class="price" data-price>—</div><div class="note" data-price-note>${t.proNote}</div>
<ul>${t.proFeatures.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<button class="btn btn-pro btn-block btn-lg" type="button" data-checkout>${t.proCta}</button></div>
</div>
<p class="muted small" style="text-align:center;margin:20px 0 56px">${t.taxNote}</p></div>`,
  }));
  sitemap.push(priceP);

  // Account
  const accP = `${prefix(lang)}/account/`;
  write(`${accP.slice(1)}index.html`, shell({
    lang,
    title: `${t.accountTitle} — PDFly`,
    desc: t.accountTitle,
    canonicalPath: accP,
    altPath: `${prefix(other)}/account/`,
    noindex: true,
    bodyAttrs: 'data-page="account"',
    body: `<div class="container"><div class="tool-head"><h1>${t.accountTitle}</h1></div><div class="account-grid" id="account-root" style="margin-bottom:64px"><div class="card muted">…</div></div></div>`,
  }));
}

// Login page (fallback for expired links)
write('login/index.html', shell({
  lang: 'en', title: 'Sign in — PDFly', desc: 'Sign in to PDFly', canonicalPath: '/login/', noindex: true, bodyAttrs: 'data-page="login"',
  body: `<div class="container"><div class="tool-head"><h1>Sign in</h1><p>We'll email you a 6-digit code. No password needed.</p></div><div style="max-width:420px;margin:0 auto 64px" id="login-root"></div></div>`,
}));

// Legal
const legal = {
  privacy: ['Privacy Policy', `<p><strong>Short version: your PDFs never leave your device.</strong> Every PDFly tool runs inside your web browser. We do not upload, store or see the files you process.</p>
<h2>What we collect</h2><ul><li><strong>Account email</strong>, if you sign in, so we can send sign-in codes and link your Pro subscription.</li><li><strong>Subscription status</strong> (plan, renewal date) synced from Stripe.</li><li><strong>Basic server logs</strong> (IP address, time) kept briefly by our hosting provider for security and rate limiting.</li></ul>
<h2>Payments</h2><p>Payments are handled by Stripe. We never see or store your card number. See <a href="https://stripe.com/privacy">Stripe's privacy policy</a>.</p>
<h2>Service providers</h2><p>Vercel (hosting), Upstash (account database), Resend (email), Stripe (payments).</p>
<h2>Your choices</h2><p>Email <a href="mailto:hello@pdfly.lol">hello@pdfly.lol</a> to access or delete your account data. Cancel your subscription anytime from your account page.</p>
<p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>`],
  terms: ['Terms of Service', `<p>By using PDFly you agree to these terms.</p>
<h2>The service</h2><p>PDFly provides PDF tools that run in your browser. Free tools are provided as-is. PDFly Pro is a paid subscription that unlocks additional tools and limits.</p>
<h2>Subscriptions</h2><ul><li>Pro renews automatically each month or year until cancelled.</li><li>You can cancel anytime from your account page; you keep Pro until the end of the period you paid for.</li><li>Prices are in Canadian dollars; applicable taxes are added at checkout.</li><li>If you are unhappy within 14 days of your first payment, email us for a full refund.</li></ul>
<h2>Your files</h2><p>You are responsible for the documents you process and must have the right to modify them. Because processing happens on your device, we cannot recover files or passwords.</p>
<h2>Liability</h2><p>PDFly is provided "as is" without warranties. To the extent permitted by law, our liability is limited to the amount you paid in the last 12 months.</p>
<h2>Contact</h2><p><a href="mailto:hello@pdfly.lol">hello@pdfly.lol</a></p>
<p class="muted">Last updated: ${new Date().toISOString().slice(0, 10)}</p>`],
};
for (const [slug, [title, body]] of Object.entries(legal)) {
  write(`${slug}/index.html`, shell({ lang: 'en', title: `${title} — PDFly`, desc: title, canonicalPath: `/${slug}/`, body: `<div class="container prose"><h1>${title}</h1>${body}</div>` }));
  sitemap.push(`/${slug}/`);
}

write('404.html', shell({ lang: 'en', title: 'Page not found — PDFly', desc: 'Not found', canonicalPath: '/404', noindex: true, body: `<div class="container"><div class="tool-head"><h1>Page not found</h1><p>Try one of our tools instead.</p></div><div class="tool-grid" style="margin-bottom:56px">${toolCards('en')}</div></div>` }));

write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M7 2h12l7 7v19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#e5484d"/><path d="M19 2v7h7" fill="#f7a8aa"/></svg>`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account/\nSitemap: ${SITE}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((p) => `<url><loc>${SITE}${p}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`Built ${sitemap.length} indexable pages (v=${VERSION})`);

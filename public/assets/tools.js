// ZoungPDF tool implementations. Everything runs locally in the browser.
import { PDFDocument, StandardFonts, rgb, degrees } from '/vendor/pdf-lib.esm.min.js';
import * as pdfjs from '/vendor/pdf.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';

const MB = 1024 * 1024;
const FREE_LIMIT = 25 * MB;
const PRO_LIMIT = 1024 * MB;

let ctx; // { lang, getMe, openUpgrade, toast, h, $, $$ }
let S; // strings
let h;

const STRINGS = {
  en: {
    addMore: 'Add more files', remove: 'Remove', pages: (n) => `${n} page${n === 1 ? '' : 's'}`, startOver: 'Start over',
    working: 'Working…', done: 'Done!', download: 'Download', downloadAgain: 'Download again', another: 'Process another file',
    tooBig: (n, lim) => `${n} is larger than ${lim}. ZoungPDF Pro handles files up to 1 GB.`, notPdf: (n) => `${n} isn’t a PDF.`, notImage: (n) => `${n} isn’t an image.`,
    encrypted: 'This PDF is password-protected. Remove the password first, then try again.', broken: 'We couldn’t read this PDF. It may be damaged.',
    proGate: 'This is a Pro tool. Try it out and preview the result; downloading needs ZoungPDF Pro.', batchGate: 'Processing several files at once is a Pro feature. Free users can process one file at a time.', unlock: 'Unlock Pro',
    merge: 'Merge PDFs', needTwo: 'Add at least two PDFs to merge.', dragHint: 'Drag to reorder',
    split: 'Split PDF', mode: 'Mode', everyPage: 'Every page', ranges: 'Ranges', chunks: 'Every N pages', rangesLabel: 'Page ranges', rangesPh: 'e.g. 1-3, 5, 8-10', chunkLabel: 'Pages per file', badRange: 'Check your ranges. Use page numbers between 1 and {n}, like 1-3, 5.',
    compress: 'Compress', level: 'Compression level', light: 'Light', recommended: 'Recommended', strong: 'Strong',
    levelHelp: { light: 'Lossless clean-up. Text stays selectable. Smaller savings.', recommended: 'Great balance for email and portals (150 DPI). Pages become images.', strong: 'Smallest file (96 DPI). Best for scans you only need to read.' },
    saved: (a, b, p) => `${a} → ${b} (${p}% smaller)`, noGain: 'This PDF is already well optimized, so we kept the original.',
    organize: 'Save PDF', rotateAllL: '⟲ Rotate all left', rotateAllR: '⟳ Rotate all right', rotate: 'Rotate', del: 'Delete', restore: 'Restore', clickRotate: 'Click a page to rotate it 90°.', clickDelete: 'Click the pages you want to remove.', clickExtract: 'Click the pages you want to keep.',
    selectAll: 'Select all', clear: 'Clear', separate: 'Save each page as a separate file', deleteN: (n) => `Delete ${n} page${n === 1 ? '' : 's'}`, extractN: (n) => `Extract ${n} page${n === 1 ? '' : 's'}`, allDeleted: 'You can’t delete every page.', noneSelected: 'Select at least one page.', dragPages: 'Drag pages to reorder. Use the buttons on each page to rotate or delete.',
    toPdf: 'Convert to PDF', pageSize: 'Page size', fit: 'Fit image', a4: 'A4', letter: 'Letter', orientation: 'Orientation', auto: 'Auto', portrait: 'Portrait', landscape: 'Landscape', margin: 'Margin', none: 'None', small: 'Small', large: 'Large',
    toImg: 'Convert to images', format: 'Format', quality: 'Quality', normal: 'Normal', high: 'High', max: 'Maximum',
    watermark: 'Add watermark', wmText: 'Watermark text', wmDefault: 'CONFIDENTIAL', size: 'Size', opacity: 'Opacity', angle: 'Angle', color: 'Colour', layout: 'Layout', center: 'Centre', tiled: 'Tiled', preview: 'Preview (page 1)',
    numbers: 'Add page numbers', position: 'Position', bl: 'Bottom left', bc: 'Bottom centre', br: 'Bottom right', tl: 'Top left', tc: 'Top centre', tr: 'Top right', startAt: 'Start at', skipFirst: 'Skip the first page (cover)',
    protect: 'Protect PDF', password: 'Password', confirm: 'Confirm password', allowPrint: 'Allow printing', allowCopy: 'Allow copying text', pwShort: 'Use at least 6 characters.', pwMismatch: 'Passwords don’t match.', pwNote: 'Write your password down. Nobody, including us, can recover it.',
    sign: 'Apply signature', signature: 'Your signature', draw: 'Draw', type: 'Type', clearPad: 'Clear', yourName: 'Your name', placeHint: 'Click on the page where the signature should go. Click again to add another.', undo: 'Undo last', sigSize: 'Signature size', prev: '‹ Prev', next: 'Next ›', pageOf: (a, b) => `Page ${a} of ${b}`, needSig: 'Draw or type your signature first.', needPlace: 'Click on the page to place your signature.', placed: (n) => `${n} placement${n === 1 ? '' : 's'}`,
    badChars: 'Some characters can’t be used with the built-in font. Try plain letters and numbers.',
  },
  fr: {
    addMore: 'Ajouter des fichiers', remove: 'Retirer', pages: (n) => `${n} page${n > 1 ? 's' : ''}`, startOver: 'Recommencer',
    working: 'Traitement…', done: 'Terminé !', download: 'Télécharger', downloadAgain: 'Télécharger à nouveau', another: 'Traiter un autre fichier',
    tooBig: (n, lim) => `${n} dépasse ${lim}. ZoungPDF Pro accepte jusqu’à 1 Go.`, notPdf: (n) => `${n} n’est pas un PDF.`, notImage: (n) => `${n} n’est pas une image.`,
    encrypted: 'Ce PDF est protégé par un mot de passe. Retirez-le puis réessayez.', broken: 'Impossible de lire ce PDF. Il est peut-être endommagé.',
    proGate: 'Outil Pro. Essayez-le et prévisualisez le résultat ; le téléchargement requiert ZoungPDF Pro.', batchGate: 'Le traitement de plusieurs fichiers à la fois est une fonction Pro. En gratuit, un fichier à la fois.', unlock: 'Débloquer Pro',
    merge: 'Fusionner', needTwo: 'Ajoutez au moins deux PDF.', dragHint: 'Glissez pour réordonner',
    split: 'Diviser', mode: 'Mode', everyPage: 'Chaque page', ranges: 'Plages', chunks: 'Toutes les N pages', rangesLabel: 'Plages de pages', rangesPh: 'ex. 1-3, 5, 8-10', chunkLabel: 'Pages par fichier', badRange: 'Vérifiez vos plages : pages entre 1 et {n}, comme 1-3, 5.',
    compress: 'Compresser', level: 'Niveau de compression', light: 'Léger', recommended: 'Recommandé', strong: 'Fort',
    levelHelp: { light: 'Nettoyage sans perte. Le texte reste sélectionnable.', recommended: 'Bon équilibre pour les courriels (150 PPP). Les pages deviennent des images.', strong: 'Fichier le plus léger (96 PPP). Idéal pour les numérisations.' },
    saved: (a, b, p) => `${a} → ${b} (${p} % plus léger)`, noGain: 'Ce PDF est déjà optimisé ; nous avons gardé l’original.',
    organize: 'Enregistrer le PDF', rotateAllL: '⟲ Tout pivoter à gauche', rotateAllR: '⟳ Tout pivoter à droite', rotate: 'Pivoter', del: 'Supprimer', restore: 'Restaurer', clickRotate: 'Cliquez sur une page pour la pivoter de 90°.', clickDelete: 'Cliquez sur les pages à retirer.', clickExtract: 'Cliquez sur les pages à garder.',
    selectAll: 'Tout sélectionner', clear: 'Effacer', separate: 'Enregistrer chaque page séparément', deleteN: (n) => `Supprimer ${n} page${n > 1 ? 's' : ''}`, extractN: (n) => `Extraire ${n} page${n > 1 ? 's' : ''}`, allDeleted: 'Impossible de supprimer toutes les pages.', noneSelected: 'Sélectionnez au moins une page.', dragPages: 'Glissez les pages pour les réordonner. Utilisez les boutons pour pivoter ou supprimer.',
    toPdf: 'Convertir en PDF', pageSize: 'Format', fit: 'Taille de l’image', a4: 'A4', letter: 'Lettre', orientation: 'Orientation', auto: 'Auto', portrait: 'Portrait', landscape: 'Paysage', margin: 'Marge', none: 'Aucune', small: 'Petite', large: 'Grande',
    toImg: 'Convertir en images', format: 'Format', quality: 'Qualité', normal: 'Normale', high: 'Haute', max: 'Maximale',
    watermark: 'Ajouter le filigrane', wmText: 'Texte du filigrane', wmDefault: 'CONFIDENTIEL', size: 'Taille', opacity: 'Opacité', angle: 'Angle', color: 'Couleur', layout: 'Disposition', center: 'Centré', tiled: 'Mosaïque', preview: 'Aperçu (page 1)',
    numbers: 'Numéroter', position: 'Position', bl: 'Bas gauche', bc: 'Bas centre', br: 'Bas droite', tl: 'Haut gauche', tc: 'Haut centre', tr: 'Haut droite', startAt: 'Commencer à', skipFirst: 'Ignorer la première page (couverture)',
    protect: 'Protéger le PDF', password: 'Mot de passe', confirm: 'Confirmer', allowPrint: 'Autoriser l’impression', allowCopy: 'Autoriser la copie du texte', pwShort: 'Au moins 6 caractères.', pwMismatch: 'Les mots de passe ne correspondent pas.', pwNote: 'Notez votre mot de passe. Personne, pas même nous, ne peut le récupérer.',
    sign: 'Appliquer la signature', signature: 'Votre signature', draw: 'Dessiner', type: 'Taper', clearPad: 'Effacer', yourName: 'Votre nom', placeHint: 'Cliquez sur la page à l’endroit voulu. Cliquez encore pour en ajouter.', undo: 'Annuler', sigSize: 'Taille de la signature', prev: '‹ Préc.', next: 'Suiv. ›', pageOf: (a, b) => `Page ${a} sur ${b}`, needSig: 'Dessinez ou tapez d’abord votre signature.', needPlace: 'Cliquez sur la page pour placer la signature.', placed: (n) => `${n} emplacement${n > 1 ? 's' : ''}`,
    badChars: 'Certains caractères ne sont pas pris en charge par la police intégrée.',
  },
};

// ---------- helpers ----------
const fmtSize = (b) => (b < 1024 ? `${b} B` : b < MB ? `${(b / 1024).toFixed(0)} KB` : `${(b / MB).toFixed(b < 10 * MB ? 1 : 0)} MB`);
const baseName = (name) => name.replace(/\.[^.]+$/, '');
const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const isImage = (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(f.name);

async function readBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

async function loadPdf(bytes) {
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    throw new Error(S.broken);
  }
  if (doc.isEncrypted) throw new Error(S.encrypted);
  return doc;
}

async function openPdfjs(bytes) {
  return pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
}

async function renderPage(pdf, num, { scale, maxW, canvas } = {}) {
  const page = await pdf.getPage(num);
  let vp = page.getViewport({ scale: 1 });
  const s = scale || (maxW ? Math.min(2, maxW / vp.width) : 1);
  vp = page.getViewport({ scale: s });
  const c = canvas || document.createElement('canvas');
  c.width = Math.floor(vp.width);
  c.height = Math.floor(vp.height);
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  page.cleanup();
  return c;
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
  return new Promise((res) => canvas.toBlob(res, type, quality));
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

let jszipLoading;
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  jszipLoading ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = '/vendor/jszip.min.js';
    s.onload = () => res(window.JSZip);
    s.onerror = rej;
    document.head.append(s);
  });
  return jszipLoading;
}

async function zipOutputs(outputs, zipName) {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const used = new Set();
  for (const o of outputs) {
    let n = o.name;
    let i = 2;
    while (used.has(n)) n = o.name.replace(/(\.[^.]+)$/, ` (${i++})$1`);
    used.add(n);
    zip.file(n, o.blob);
  }
  return { name: zipName, blob: await zip.generateAsync({ type: 'blob' }) };
}

const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' });

function parseRanges(text, n) {
  const out = [];
  for (const part of text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*(?:-|–|to|à)\s*(\d+|end|fin)?$/i) || part.match(/^(\d+)$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] === undefined ? (part.includes('-') ? n : a) : /end|fin/i.test(m[2]) ? n : Number(m[2]);
    if (!a || !b || a < 1 || b > n || a > b) return null;
    out.push([a, b]);
  }
  return out.length ? out : null;
}

function seg(options, value, onChange) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup' });
  const paint = () => [...wrap.children].forEach((b) => b.classList.toggle('on', b.dataset.v === value));
  for (const [v, label] of options) {
    wrap.append(h('button', { type: 'button', 'data-v': v, role: 'radio', onclick: () => { value = v; paint(); onChange(v); } }, label));
  }
  paint();
  return wrap;
}

const field = (label, control) => h('div', { class: 'field' }, h('span', { class: 'label' }, label), control);

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// ---------- Runner ----------
class Runner {
  constructor(tool) {
    this.tool = tool;
    this.files = [];
    this.me = { pro: false };
    this.root = ctx.$('#tool-ui');
    this.drop = ctx.$('#dropzone');
    this.input = ctx.$('#file-input');
    this.body = document.body;
    this.isProTool = this.body.dataset.pro === '1';
    this.batch = this.body.dataset.batch === '1';
  }

  get acceptsImages() { return this.tool.accept === 'image'; }
  get multiple() { return this.tool.multiple || this.batch; }

  async init() {
    this.input.accept = this.acceptsImages ? 'image/*' : 'application/pdf,.pdf';
    this.input.multiple = this.multiple;
    this.drop.addEventListener('click', () => this.input.click());
    this.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.input.click(); } });
    this.input.addEventListener('change', () => { this.add([...this.input.files]); this.input.value = ''; });
    const ws = ctx.$('#workspace');
    ['dragenter', 'dragover'].forEach((ev) => ws.addEventListener(ev, (e) => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); this.drop.classList.add('drag'); } }));
    ['dragleave', 'drop'].forEach((ev) => ws.addEventListener(ev, () => this.drop.classList.remove('drag')));
    ws.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); this.add([...e.dataTransfer.files]); } });
    this.me = await ctx.getMe();
  }

  error(msg) {
    let box = this.root.querySelector('.error-box[data-runner]');
    if (!box) {
      box = h('div', { class: 'error-box', 'data-runner': '' });
      this.root.prepend(box);
    }
    box.textContent = msg;
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async add(list) {
    const limit = this.me.pro ? PRO_LIMIT : FREE_LIMIT;
    const accepted = [];
    for (const f of list) {
      if (this.acceptsImages ? !isImage(f) : !isPdf(f)) { ctx.toast(this.acceptsImages ? S.notImage(f.name) : S.notPdf(f.name)); continue; }
      if (f.size > limit) {
        ctx.toast(S.tooBig(f.name, fmtSize(limit)), 5000);
        if (!this.me.pro) ctx.openUpgrade();
        continue;
      }
      accepted.push(f);
    }
    if (!accepted.length) return;
    if (!this.multiple) this.files = [accepted[0]];
    else this.files.push(...accepted);
    this.drop.classList.add('hidden');
    try {
      await this.tool.setup(this);
    } catch (e) {
      console.error(e);
      this.files = [];
      this.reset();
      this.error(e.message || S.broken);
    }
  }

  reset() {
    this.files = [];
    this.root.replaceChildren();
    this.drop.classList.remove('hidden');
  }

  // Standard layout: main area + side panel with options and the action button.
  layout({ main, options = [], actionLabel, onAction, extraActions = [] }) {
    this.root.replaceChildren();
    const gates = [];
    if (this.isProTool && !this.me.pro) gates.push(this.gate(S.proGate));
    else if (this.batch && this.files.length > 1 && !this.me.pro) gates.push(this.gate(S.batchGate));
    this.progressBar = h('div');
    this.statusEl = h('div', { class: 'status', 'aria-live': 'polite' });
    this.actionBtn = h('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button', onclick: () => this.run(onAction) }, actionLabel);
    const side = h('div', { class: 'panel' }, ...options, this.actionBtn, h('div', { class: 'progress hidden' }, this.progressBar), this.statusEl,
      h('div', { class: 'actions', style: 'justify-content:center' }, ...extraActions, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => this.reset() }, S.startOver)));
    this.root.append(...gates, h('div', { class: 'work' }, h('div', {}, main), side));
  }

  gate(text) {
    return h('div', { class: 'pro-gate' }, h('span', { class: 'badge' }, '★ Pro'), h('p', {}, text), h('button', { class: 'btn btn-pro btn-sm', type: 'button', onclick: () => ctx.openUpgrade() }, S.unlock));
  }

  progress(frac, text) {
    this.progressBar.parentElement.classList.remove('hidden');
    this.progressBar.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
    if (text) this.statusEl.textContent = text;
  }

  async run(fn) {
    if (this.isProTool && !this.me.pro) {
      this.me = await ctx.getMe(true);
      if (!this.me.pro) return ctx.openUpgrade();
    }
    if (this.batch && this.files.length > 1 && !this.me.pro) {
      this.me = await ctx.getMe(true);
      if (!this.me.pro) return ctx.openUpgrade();
    }
    this.root.querySelector('.error-box[data-runner]')?.remove();
    const label = this.actionBtn.textContent;
    this.actionBtn.disabled = true;
    this.actionBtn.textContent = S.working;
    this.progress(0.02, S.working);
    try {
      const result = await fn((f, t) => this.progress(f, t));
      if (result) this.showResult(result);
    } catch (e) {
      console.error(e);
      this.error(/WinAnsi|cannot encode/i.test(e.message) ? S.badChars : e.message || S.broken);
    } finally {
      if (this.actionBtn.isConnected) {
        this.actionBtn.disabled = false;
        this.actionBtn.textContent = label;
        this.progressBar.parentElement.classList.add('hidden');
        this.statusEl.textContent = '';
      }
    }
  }

  // result: { outputs: [{name, blob}], zipName?, stats? }
  async showResult({ outputs, zipName, stats }) {
    let file = outputs[0];
    if (outputs.length > 1) file = await zipOutputs(outputs, zipName || 'zoungpdf.zip');
    saveBlob(file.blob, file.name);
    const again = h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => saveBlob(file.blob, file.name) }, `${S.downloadAgain} (${fmtSize(file.blob.size)})`);
    this.root.replaceChildren(h('div', { class: 'result' },
      h('div', { class: 'done' }, '✓'),
      h('h2', {}, S.done),
      h('div', { class: 'stats' }, stats || file.name),
      h('div', { class: 'actions', style: 'justify-content:center' }, again, h('button', { class: 'btn btn-lg', type: 'button', onclick: () => this.reset() }, S.another))));
  }

  fileList({ reorder = true, onChange } = {}) {
    const list = h('div', { class: 'file-list' });
    const paint = () => {
      list.replaceChildren();
      this.files.forEach((f, i) => {
        const thumb = h('div', { class: 'thumb' }, isPdf(f) ? 'PDF' : 'IMG');
        const item = h('div', { class: 'file-item', draggable: reorder ? 'true' : null, 'data-i': i },
          thumb,
          h('div', { class: 'meta' }, h('div', { class: 'name', title: f.name }, f.name), h('div', { class: 'sub' }, fmtSize(f.size), f._pages ? ` · ${S.pages(f._pages)}` : '')),
          reorder && i > 0 ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', onclick: () => { [this.files[i - 1], this.files[i]] = [this.files[i], this.files[i - 1]]; paint(); onChange?.(); } }, '↑') : null,
          reorder && i < this.files.length - 1 ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move down', onclick: () => { [this.files[i + 1], this.files[i]] = [this.files[i], this.files[i + 1]]; paint(); onChange?.(); } }, '↓') : null,
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': S.remove, onclick: () => { this.files.splice(i, 1); if (!this.files.length) this.reset(); else { paint(); onChange?.(); } } }, '✕'));
        if (reorder) {
          item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/x-pdfly', String(i)); item.classList.add('dragging'); });
          item.addEventListener('dragend', () => item.classList.remove('dragging'));
          item.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/x-pdfly')) e.preventDefault(); });
          item.addEventListener('drop', (e) => {
            const from = Number(e.dataTransfer.getData('text/x-pdfly'));
            if (Number.isNaN(from) || e.dataTransfer.files.length) return;
            e.preventDefault(); e.stopPropagation();
            const [m] = this.files.splice(from, 1);
            this.files.splice(i, 0, m);
            paint(); onChange?.();
          });
        }
        list.append(item);
        this.thumbFor(f, thumb);
      });
    };
    paint();
    return { el: list, paint };
  }

  async thumbFor(f, el) {
    try {
      if (!f._thumb) {
        if (isPdf(f)) {
          const pdf = await openPdfjs(await readBytes(f));
          f._pages = pdf.numPages;
          f._thumb = (await renderPage(pdf, 1, { maxW: 88 })).toDataURL('image/jpeg', 0.7);
          pdf.destroy();
          const sub = el.parentElement?.querySelector('.sub');
          if (sub) sub.textContent = `${fmtSize(f.size)} · ${S.pages(f._pages)}`;
        } else {
          f._thumb = URL.createObjectURL(f);
        }
      }
      el.replaceChildren(h('img', { src: f._thumb, alt: '' }));
    } catch { /* thumbnail is cosmetic */ }
  }

  addMoreButton(onAdded) {
    return h('button', { class: 'btn', type: 'button', onclick: () => {
      const once = () => { this.input.removeEventListener('change', once); setTimeout(onAdded, 0); };
      this.input.addEventListener('change', once);
      this.input.click();
    } }, `+ ${S.addMore}`);
  }
}

// ---------- Page grid (organize / rotate / delete / extract) ----------
async function pageGrid(r, mode) {
  const file = r.files[0];
  const bytes = await readBytes(file);
  await loadPdf(bytes); // validate early
  const pdf = await openPdfjs(bytes);
  const n = pdf.numPages;
  // state per original page
  let order = Array.from({ length: n }, (_, i) => ({ src: i, rot: 0, del: false, sel: false }));
  const grid = h('div', { class: 'pages' });
  const canvases = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const src = Number(e.target.dataset.src);
      io.unobserve(e.target);
      renderPage(pdf, src + 1, { maxW: 150 }).then((c) => {
        canvases.set(src, c);
        const slot = grid.querySelector(`[data-src="${src}"] .cv`);
        if (slot) { slot.replaceChildren(c); paintRot(); }
      }).catch(() => {});
    }
  }, { rootMargin: '400px' });

  const counter = h('span', { class: 'muted small' });
  const paintRot = () => {
    for (const item of order) {
      const el = grid.querySelector(`[data-src="${item.src}"]`);
      const c = el?.querySelector('canvas');
      if (c) c.style.transform = `rotate(${item.rot}deg) scale(${item.rot % 180 ? 0.75 : 1})`;
    }
  };
  const update = () => {
    if (mode === 'delete') { const k = order.filter((o) => o.del).length; r.actionBtn.textContent = S.deleteN(k); r.actionBtn.disabled = k === 0; }
    if (mode === 'extract') { const k = order.filter((o) => o.sel).length; r.actionBtn.textContent = S.extractN(k); r.actionBtn.disabled = k === 0; }
    counter.textContent = S.pages(n);
  };
  let dragFrom = null;
  const paint = () => {
    grid.replaceChildren();
    order.forEach((item, idx) => {
      const cv = h('div', { class: 'cv', style: 'min-height:150px;display:grid;place-items:center' });
      const existing = canvases.get(item.src);
      if (existing) cv.append(existing);
      const tools = h('div', { class: 'tools' });
      if (mode === 'organize') {
        tools.append(
          h('button', { type: 'button', title: S.rotate, 'aria-label': S.rotate, onclick: (e) => { e.stopPropagation(); item.rot = (item.rot + 90) % 360; paintRot(); } }, '⟳'),
          h('button', { type: 'button', title: item.del ? S.restore : S.del, 'aria-label': item.del ? S.restore : S.del, onclick: (e) => { e.stopPropagation(); item.del = !item.del; paint(); } }, item.del ? '↺' : '✕'));
      }
      const el = h('div', {
        class: `page${item.del ? ' del' : ''}${item.sel ? ' sel' : ''}`, 'data-src': item.src, tabindex: 0, draggable: mode === 'organize' ? 'true' : null,
        onclick: () => {
          if (mode === 'rotate') { item.rot = (item.rot + 90) % 360; paintRot(); }
          if (mode === 'delete') { item.del = !item.del; el.classList.toggle('del', item.del); update(); }
          if (mode === 'extract') { item.sel = !item.sel; el.classList.toggle('sel', item.sel); update(); }
        },
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } },
      }, cv, tools, h('div', { class: 'pnum' }, String(item.src + 1)));
      if (mode === 'organize') {
        el.addEventListener('dragstart', () => { dragFrom = idx; el.classList.add('dragging'); });
        el.addEventListener('dragend', () => { el.classList.remove('dragging'); grid.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before')); });
        el.addEventListener('dragover', (e) => { if (dragFrom !== null) { e.preventDefault(); el.classList.add('drop-before'); } });
        el.addEventListener('dragleave', () => el.classList.remove('drop-before'));
        el.addEventListener('drop', (e) => {
          if (dragFrom === null) return;
          e.preventDefault(); e.stopPropagation();
          const [m] = order.splice(dragFrom, 1);
          order.splice(dragFrom < idx ? idx - 1 : idx, 0, m);
          dragFrom = null;
          paint();
        });
      }
      grid.append(el);
      if (!existing) io.observe(el);
    });
    paintRot();
    update();
  };

  const options = [];
  const hint = { organize: S.dragPages, rotate: S.clickRotate, delete: S.clickDelete, extract: S.clickExtract }[mode];
  let separate = false;
  if (mode === 'organize' || mode === 'rotate') {
    options.push(h('div', { class: 'field' },
      h('button', { class: 'btn btn-block', type: 'button', onclick: () => { order.forEach((o) => (o.rot = (o.rot + 270) % 360)); paintRot(); } }, S.rotateAllL),
      h('button', { class: 'btn btn-block', type: 'button', onclick: () => { order.forEach((o) => (o.rot = (o.rot + 90) % 360)); paintRot(); } }, S.rotateAllR)));
  }
  if (mode === 'extract' || mode === 'delete') {
    const key = mode === 'extract' ? 'sel' : 'del';
    options.push(h('div', { class: 'row', style: 'margin-bottom:14px' },
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { order.forEach((o) => (o[key] = true)); paint(); } }, S.selectAll),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { order.forEach((o) => (o[key] = false)); paint(); } }, S.clear)));
  }
  if (mode === 'extract') {
    const cb = h('input', { type: 'checkbox', onchange: () => (separate = cb.checked) });
    options.push(h('label', { class: 'check', style: 'margin-bottom:14px' }, cb, S.separate));
  }

  r.layout({
    main: h('div', {}, h('p', { class: 'muted small', style: 'margin-top:0' }, hint, ' · ', counter), grid),
    options,
    actionLabel: S.organize,
    onAction: async (progress) => {
      const src = await loadPdf(bytes);
      const name = baseName(file.name);
      const build = async (items) => {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, items.map((o) => o.src));
        pages.forEach((p, i) => {
          const rot = items[i].rot;
          if (rot) p.setRotation(degrees((p.getRotation().angle + rot) % 360));
          out.addPage(p);
        });
        return out.save();
      };
      if (mode === 'extract') {
        const chosen = order.filter((o) => o.sel);
        if (!chosen.length) throw new Error(S.noneSelected);
        if (separate) {
          const outputs = [];
          for (let i = 0; i < chosen.length; i++) {
            progress((i + 1) / chosen.length);
            outputs.push({ name: `${name}-page-${chosen[i].src + 1}.pdf`, blob: pdfBlob(await build([chosen[i]])) });
          }
          return { outputs, zipName: `${name}-pages.zip` };
        }
        return { outputs: [{ name: `${name}-extracted.pdf`, blob: pdfBlob(await build(chosen)) }] };
      }
      const kept = order.filter((o) => !o.del);
      if (!kept.length) throw new Error(S.allDeleted);
      const suffix = { organize: 'organized', rotate: 'rotated', delete: 'edited' }[mode];
      return { outputs: [{ name: `${name}-${suffix}.pdf`, blob: pdfBlob(await build(kept)) }], stats: `${file.name} · ${S.pages(kept.length)}` };
    },
  });
  paint();
}

// ---------- Tools ----------
const TOOLS = {
  merge: {
    multiple: true,
    async setup(r) {
      const list = r.fileList();
      r.layout({
        main: h('div', {}, h('p', { class: 'muted small', style: 'margin-top:0' }, S.dragHint), list.el, h('div', { class: 'actions' }, r.addMoreButton(() => list.paint()))),
        actionLabel: S.merge,
        onAction: async (progress) => {
          if (r.files.length < 2) throw new Error(S.needTwo);
          const out = await PDFDocument.create();
          for (let i = 0; i < r.files.length; i++) {
            progress(i / r.files.length, `${r.files[i].name}`);
            const src = await loadPdf(await readBytes(r.files[i]));
            const pages = await out.copyPages(src, src.getPageIndices());
            pages.forEach((p) => out.addPage(p));
          }
          progress(0.95);
          const bytes = await out.save();
          return { outputs: [{ name: 'merged.pdf', blob: pdfBlob(bytes) }], stats: `${r.files.length} files · ${S.pages(out.getPageCount())} · ${fmtSize(bytes.length)}` };
        },
      });
    },
  },

  split: {
    async setup(r) {
      const file = r.files[0];
      const bytes = await readBytes(file);
      const src = await loadPdf(bytes);
      const n = src.getPageCount();
      let mode = 'every';
      const rangeInput = h('input', { type: 'text', placeholder: S.rangesPh, value: n > 1 ? `1-${Math.ceil(n / 2)}, ${Math.ceil(n / 2) + 1}-${n}` : '1' });
      const chunkInput = h('input', { type: 'number', min: 1, max: n, value: Math.min(2, n) });
      const rangeField = field(S.rangesLabel, rangeInput);
      const chunkField = field(S.chunkLabel, chunkInput);
      const sync = () => { rangeField.classList.toggle('hidden', mode !== 'ranges'); chunkField.classList.toggle('hidden', mode !== 'chunks'); };
      const preview = h('div', { class: 'file-list' });
      const list = r.fileList({ reorder: false });
      preview.append(list.el);
      r.layout({
        main: h('div', {}, preview),
        options: [field(S.mode, seg([['every', S.everyPage], ['ranges', S.ranges], ['chunks', S.chunks]], mode, (v) => { mode = v; sync(); })), rangeField, chunkField],
        actionLabel: S.split,
        onAction: async (progress) => {
          let groups;
          if (mode === 'every') groups = Array.from({ length: n }, (_, i) => [i + 1, i + 1]);
          else if (mode === 'ranges') {
            groups = parseRanges(rangeInput.value, n);
            if (!groups) throw new Error(S.badRange.replace('{n}', n));
          } else {
            const k = Math.max(1, Math.min(n, Number(chunkInput.value) || 1));
            groups = [];
            for (let a = 1; a <= n; a += k) groups.push([a, Math.min(n, a + k - 1)]);
          }
          const name = baseName(file.name);
          const outputs = [];
          for (let i = 0; i < groups.length; i++) {
            const [a, b] = groups[i];
            progress((i + 1) / groups.length);
            const out = await PDFDocument.create();
            const pages = await out.copyPages(src, Array.from({ length: b - a + 1 }, (_, j) => a - 1 + j));
            pages.forEach((p) => out.addPage(p));
            outputs.push({ name: a === b ? `${name}-page-${a}.pdf` : `${name}-pages-${a}-${b}.pdf`, blob: pdfBlob(await out.save()) });
          }
          return { outputs, zipName: `${name}-split.zip`, stats: `${outputs.length} files` };
        },
      });
      sync();
    },
  },

  compress: {
    async setup(r) {
      let level = 'recommended';
      const help = h('p', { class: 'muted small', style: 'margin:-6px 0 14px' }, S.levelHelp[level]);
      const list = r.fileList({ reorder: false, onChange: () => r.tool.setup(r) });
      r.layout({
        main: h('div', {}, list.el, r.me.pro || r.files.length > 1 ? h('div', { class: 'actions' }, r.addMoreButton(() => r.tool.setup(r))) : null),
        options: [field(S.level, seg([['light', S.light], ['recommended', S.recommended], ['strong', S.strong]], level, (v) => { level = v; help.textContent = S.levelHelp[v]; })), help],
        actionLabel: S.compress,
        onAction: async (progress) => {
          const outputs = [];
          let before = 0;
          let after = 0;
          let kept = 0;
          for (let fi = 0; fi < r.files.length; fi++) {
            const f = r.files[fi];
            const bytes = await readBytes(f);
            const src = await loadPdf(bytes);
            let outBytes;
            if (level === 'light') {
              outBytes = await src.save({ useObjectStreams: true });
              progress((fi + 1) / r.files.length);
            } else {
              const dpi = level === 'strong' ? 96 : 150;
              const q = level === 'strong' ? 0.5 : 0.68;
              const pdf = await openPdfjs(bytes);
              const out = await PDFDocument.create();
              const canvas = document.createElement('canvas');
              for (let i = 1; i <= pdf.numPages; i++) {
                progress((fi + i / pdf.numPages) / r.files.length, `${f.name} · ${i}/${pdf.numPages}`);
                const page = await pdf.getPage(i);
                const vp1 = page.getViewport({ scale: 1 });
                await renderPage(pdf, i, { scale: dpi / 72, canvas });
                const jpg = await out.embedJpg(new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', q)).arrayBuffer()));
                const p = out.addPage([vp1.width, vp1.height]);
                p.drawImage(jpg, { x: 0, y: 0, width: vp1.width, height: vp1.height });
              }
              pdf.destroy();
              outBytes = await out.save({ useObjectStreams: true });
            }
            before += bytes.length;
            if (outBytes.length >= bytes.length) { outBytes = bytes; kept++; }
            after += outBytes.length;
            outputs.push({ name: `${baseName(f.name)}-compressed.pdf`, blob: pdfBlob(outBytes) });
          }
          const pct = Math.max(0, Math.round((1 - after / before) * 100));
          const stats = kept === r.files.length ? S.noGain : S.saved(fmtSize(before), fmtSize(after), pct);
          return { outputs, zipName: 'compressed-pdfs.zip', stats };
        },
      });
    },
  },

  organize: { setup: (r) => pageGrid(r, 'organize') },
  rotate: { setup: (r) => pageGrid(r, 'rotate') },
  delete: { setup: (r) => pageGrid(r, 'delete') },
  extract: { setup: (r) => pageGrid(r, 'extract') },

  jpg2pdf: {
    accept: 'image',
    multiple: true,
    async setup(r) {
      let size = 'fit';
      let orient = 'auto';
      let margin = 'none';
      const list = r.fileList();
      r.layout({
        main: h('div', {}, list.el, h('div', { class: 'actions' }, r.addMoreButton(() => list.paint()))),
        options: [
          field(S.pageSize, seg([['fit', S.fit], ['a4', S.a4], ['letter', S.letter]], size, (v) => (size = v))),
          field(S.orientation, seg([['auto', S.auto], ['portrait', S.portrait], ['landscape', S.landscape]], orient, (v) => (orient = v))),
          field(S.margin, seg([['none', S.none], ['small', S.small], ['large', S.large]], margin, (v) => (margin = v))),
        ],
        actionLabel: S.toPdf,
        onAction: async (progress) => {
          const out = await PDFDocument.create();
          const m = { none: 0, small: 18, large: 42 }[margin];
          for (let i = 0; i < r.files.length; i++) {
            progress(i / r.files.length, r.files[i].name);
            const f = r.files[i];
            let img;
            const raw = await readBytes(f);
            if (/jpe?g/i.test(f.type) || /\.jpe?g$/i.test(f.name)) img = await out.embedJpg(raw);
            else if (/png/i.test(f.type) || /\.png$/i.test(f.name)) img = await out.embedPng(raw);
            else {
              // Anything else the browser can decode → re-encode as JPEG
              const bmp = await createImageBitmap(f);
              const c = document.createElement('canvas');
              c.width = bmp.width; c.height = bmp.height;
              const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0);
              img = await out.embedJpg(new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', 0.92)).arrayBuffer()));
            }
            let pw;
            let ph;
            if (size === 'fit') { pw = img.width * 0.75 + m * 2; ph = img.height * 0.75 + m * 2; }
            else {
              [pw, ph] = size === 'a4' ? [595.28, 841.89] : [612, 792];
              const land = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
              if (land) [pw, ph] = [ph, pw];
            }
            const page = out.addPage([pw, ph]);
            const s = Math.min((pw - m * 2) / img.width, (ph - m * 2) / img.height);
            const w = img.width * s;
            const hh = img.height * s;
            page.drawImage(img, { x: (pw - w) / 2, y: (ph - hh) / 2, width: w, height: hh });
          }
          const bytes = await out.save();
          const name = r.files.length === 1 ? `${baseName(r.files[0].name)}.pdf` : 'images.pdf';
          return { outputs: [{ name, blob: pdfBlob(bytes) }], stats: `${S.pages(r.files.length)} · ${fmtSize(bytes.length)}` };
        },
      });
    },
  },

  pdf2jpg: {
    async setup(r) {
      const file = r.files[0];
      const bytes = await readBytes(file);
      let format = 'jpg';
      let quality = 'high';
      const list = r.fileList({ reorder: false });
      r.layout({
        main: list.el,
        options: [
          field(S.format, seg([['jpg', 'JPG'], ['png', 'PNG']], format, (v) => (format = v))),
          field(S.quality, seg([['normal', S.normal], ['high', S.high], ['max', S.max]], quality, (v) => (quality = v))),
        ],
        actionLabel: S.toImg,
        onAction: async (progress) => {
          const pdf = await openPdfjs(bytes);
          const scale = { normal: 1.5, high: 2.5, max: 4 }[quality];
          const outputs = [];
          const name = baseName(file.name);
          const canvas = document.createElement('canvas');
          for (let i = 1; i <= pdf.numPages; i++) {
            progress(i / pdf.numPages, `${i}/${pdf.numPages}`);
            await renderPage(pdf, i, { scale, canvas });
            const blob = await canvasToBlob(canvas, format === 'png' ? 'image/png' : 'image/jpeg', 0.92);
            outputs.push({ name: `${name}-${String(i).padStart(String(pdf.numPages).length, '0')}.${format}`, blob });
          }
          pdf.destroy();
          return { outputs, zipName: `${name}-images.zip`, stats: `${outputs.length} ${format.toUpperCase()}` };
        },
      });
    },
  },

  watermark: {
    async setup(r) {
      const opts = { text: S.wmDefault, size: 56, opacity: 0.18, angle: 45, color: '#e5484d', layout: 'center' };
      const first = r.files[0];
      const pdf = await openPdfjs(await readBytes(first));
      const base = await renderPage(pdf, 1, { maxW: 520 });
      const vp = (await pdf.getPage(1)).getViewport({ scale: 1 });
      const prev = h('canvas', { style: 'max-width:100%;box-shadow:var(--shadow);background:#fff' });
      const draw = () => {
        prev.width = base.width; prev.height = base.height;
        const g = prev.getContext('2d');
        g.drawImage(base, 0, 0);
        const k = base.width / vp.width;
        g.save();
        g.globalAlpha = opts.opacity;
        g.fillStyle = opts.color;
        g.font = `bold ${opts.size * k}px Helvetica, Arial, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const stamp = (x, y) => { g.save(); g.translate(x, y); g.rotate((-opts.angle * Math.PI) / 180); g.fillText(opts.text, 0, 0); g.restore(); };
        if (opts.layout === 'center') stamp(prev.width / 2, prev.height / 2);
        else {
          const stepX = Math.max(g.measureText(opts.text).width * 0.9, 80 * k) + 60 * k;
          const stepY = opts.size * k * 3;
          for (let y = -prev.height; y < prev.height * 2; y += stepY) for (let x = -prev.width; x < prev.width * 2; x += stepX) stamp(x + ((y / stepY) % 2) * stepX / 2, y);
        }
        g.restore();
      };
      const input = (type, key, attrs = {}, parse = (v) => v) => h('input', { type, value: opts[key], ...attrs, oninput: (e) => { opts[key] = parse(e.target.value); draw(); } });
      const list = r.fileList({ reorder: false });
      r.layout({
        main: h('div', {}, h('div', { class: 'field' }, h('span', { class: 'label' }, S.preview), prev), list.el, r.me.pro ? h('div', { class: 'actions' }, r.addMoreButton(() => list.paint())) : null),
        options: [
          field(S.wmText, input('text', 'text', { maxlength: 60 })),
          field(S.layout, seg([['center', S.center], ['tiled', S.tiled]], opts.layout, (v) => { opts.layout = v; draw(); })),
          field(S.size, input('range', 'size', { min: 12, max: 140 }, Number)),
          field(S.opacity, input('range', 'opacity', { min: 0.05, max: 1, step: 0.05 }, Number)),
          field(S.angle, input('range', 'angle', { min: -90, max: 90, step: 5 }, Number)),
          field(S.color, input('color', 'color')),
        ],
        actionLabel: S.watermark,
        onAction: async (progress) => {
          if (!opts.text.trim()) return null;
          const outputs = [];
          for (let fi = 0; fi < r.files.length; fi++) {
            const doc = await loadPdf(await readBytes(r.files[fi]));
            const font = await doc.embedFont(StandardFonts.HelveticaBold);
            const color = hexToRgb(opts.color);
            const tw = font.widthOfTextAtSize(opts.text, opts.size);
            const th = font.heightAtSize(opts.size);
            const rad = (opts.angle * Math.PI) / 180;
            const pages = doc.getPages();
            pages.forEach((page, pi) => {
              progress((fi + (pi + 1) / pages.length) / r.files.length);
              const { width, height } = page.getSize();
              const stamp = (cx, cy) => {
                // rotate around the text centre
                const x = cx - (tw / 2) * Math.cos(rad) + (th / 3) * Math.sin(rad);
                const y = cy - (tw / 2) * Math.sin(rad) - (th / 3) * Math.cos(rad);
                page.drawText(opts.text, { x, y, size: opts.size, font, color, opacity: opts.opacity, rotate: degrees(opts.angle) });
              };
              if (opts.layout === 'center') stamp(width / 2, height / 2);
              else {
                const stepX = Math.max(tw * 0.9, 80) + 60;
                const stepY = opts.size * 3;
                let row = 0;
                for (let y = -height; y < height * 2; y += stepY, row++) for (let x = -width; x < width * 2; x += stepX) stamp(x + (row % 2) * stepX / 2, y);
              }
            });
            outputs.push({ name: `${baseName(r.files[fi].name)}-watermarked.pdf`, blob: pdfBlob(await doc.save()) });
          }
          return { outputs, zipName: 'watermarked-pdfs.zip' };
        },
      });
      draw();
    },
  },

  numbers: {
    async setup(r) {
      const opts = { pos: 'bc', fmt: 'n', start: 1, size: 11, skipFirst: false };
      const list = r.fileList({ reorder: false });
      const fmtLabel = (f, i, n) => ({ n: `${i}`, page: `${S === STRINGS.fr ? 'Page' : 'Page'} ${i}`, of: `${i} / ${n}`, pageof: S === STRINGS.fr ? `Page ${i} sur ${n}` : `Page ${i} of ${n}` }[f]);
      const startInput = h('input', { type: 'number', min: 0, value: 1, oninput: (e) => (opts.start = Number(e.target.value) || 0) });
      const sizeInput = h('input', { type: 'range', min: 7, max: 24, value: 11, oninput: (e) => (opts.size = Number(e.target.value)) });
      const skip = h('input', { type: 'checkbox', onchange: (e) => (opts.skipFirst = e.target.checked) });
      r.layout({
        main: h('div', {}, list.el, r.me.pro ? h('div', { class: 'actions' }, r.addMoreButton(() => list.paint())) : null),
        options: [
          field(S.position, h('div', {}, seg([['tl', S.tl], ['tc', S.tc], ['tr', S.tr]], opts.pos, (v) => { opts.pos = v; refreshSeg(); }), h('div', { style: 'height:6px' }), seg([['bl', S.bl], ['bc', S.bc], ['br', S.br]], opts.pos, (v) => { opts.pos = v; refreshSeg(); }))),
          field(S.format, seg([['n', '1'], ['of', '1 / N'], ['pageof', S === STRINGS.fr ? 'Page 1 sur N' : 'Page 1 of N']], opts.fmt, (v) => (opts.fmt = v))),
          h('div', { class: 'row' }, field(S.startAt, startInput), field(S.size, sizeInput)),
          h('label', { class: 'check', style: 'margin-bottom:14px' }, skip, S.skipFirst),
        ],
        actionLabel: S.numbers,
        onAction: async (progress) => {
          const outputs = [];
          for (let fi = 0; fi < r.files.length; fi++) {
            const doc = await loadPdf(await readBytes(r.files[fi]));
            const font = await doc.embedFont(StandardFonts.Helvetica);
            const pages = doc.getPages();
            const offset = opts.skipFirst ? 1 : 0;
            const total = pages.length - offset + opts.start - 1;
            pages.forEach((page, i) => {
              progress((fi + (i + 1) / pages.length) / r.files.length);
              if (i < offset) return;
              const label = fmtLabel(opts.fmt, i - offset + opts.start, total);
              const { width, height } = page.getSize();
              const w = font.widthOfTextAtSize(label, opts.size);
              const pad = 28;
              const x = opts.pos[1] === 'l' ? pad : opts.pos[1] === 'r' ? width - pad - w : (width - w) / 2;
              const y = opts.pos[0] === 'b' ? pad - opts.size / 3 : height - pad - opts.size * 0.7;
              page.drawText(label, { x, y, size: opts.size, font, color: rgb(0.2, 0.2, 0.2) });
            });
            outputs.push({ name: `${baseName(r.files[fi].name)}-numbered.pdf`, blob: pdfBlob(await doc.save()) });
          }
          return { outputs, zipName: 'numbered-pdfs.zip' };
        },
      });
      // keep the two position rows mutually exclusive
      const refreshSeg = () => r.root.querySelectorAll('.seg [data-v]').forEach((b) => { if (['tl', 'tc', 'tr', 'bl', 'bc', 'br'].includes(b.dataset.v)) b.classList.toggle('on', b.dataset.v === opts.pos); });
    },
  },

  protect: {
    async setup(r) {
      const pw = h('input', { type: 'password', autocomplete: 'new-password' });
      const pw2 = h('input', { type: 'password', autocomplete: 'new-password' });
      const print = h('input', { type: 'checkbox', checked: true });
      const copy = h('input', { type: 'checkbox' });
      const list = r.fileList({ reorder: false });
      r.layout({
        main: h('div', {}, list.el, r.me.pro ? h('div', { class: 'actions' }, r.addMoreButton(() => list.paint())) : null),
        options: [
          field(S.password, pw), field(S.confirm, pw2),
          h('label', { class: 'check', style: 'margin-bottom:8px' }, print, S.allowPrint),
          h('label', { class: 'check', style: 'margin-bottom:14px' }, copy, S.allowCopy),
          h('p', { class: 'muted small', style: 'margin-top:0' }, S.pwNote),
        ],
        actionLabel: S.protect,
        onAction: async (progress) => {
          if (pw.value.length < 6) throw new Error(S.pwShort);
          if (pw.value !== pw2.value) throw new Error(S.pwMismatch);
          const outputs = [];
          for (let fi = 0; fi < r.files.length; fi++) {
            progress((fi + 0.5) / r.files.length);
            const doc = await loadPdf(await readBytes(r.files[fi]));
            const owner = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join('');
            await doc.encrypt({
              userPassword: pw.value,
              ownerPassword: owner,
              permissions: { printing: print.checked ? 'highResolution' : false, copying: copy.checked, modifying: false, annotating: false, fillingForms: true, contentAccessibility: true, documentAssembly: false },
            });
            outputs.push({ name: `${baseName(r.files[fi].name)}-protected.pdf`, blob: pdfBlob(await doc.save()) });
          }
          return { outputs, zipName: 'protected-pdfs.zip' };
        },
      });
    },
  },

  sign: {
    async setup(r) {
      const file = r.files[0];
      const bytes = await readBytes(file);
      await loadPdf(bytes);
      const pdf = await openPdfjs(bytes);
      const n = pdf.numPages;
      let pageNo = 1;
      let sigMode = 'draw';
      let sigWidth = 160; // points
      const placements = []; // { page, x, y } in PDF points (x,y = top-left of signature in page coords from top)
      let pageVp = null;

      // Signature pad
      const pad = h('canvas', { class: 'sig-pad' });
      let drawing = false;
      let hasInk = false;
      const padCtx = () => pad.getContext('2d');
      const fitPad = () => {
        const rect = pad.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        pad.width = Math.max(1, rect.width * ratio); pad.height = Math.max(1, rect.height * ratio);
        const g = padCtx(); g.scale(ratio, ratio); g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#111a4a';
        hasInk = false;
      };
      const pt = (e) => { const b = pad.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      pad.addEventListener('pointerdown', (e) => { drawing = true; pad.setPointerCapture(e.pointerId); const g = padCtx(); g.beginPath(); g.moveTo(...pt(e)); });
      pad.addEventListener('pointermove', (e) => { if (!drawing) return; const g = padCtx(); g.lineTo(...pt(e)); g.stroke(); hasInk = true; });
      pad.addEventListener('pointerup', () => { drawing = false; paintPlacements(); });
      const nameInput = h('input', { type: 'text', placeholder: S.yourName, oninput: () => paintPlacements() });
      const drawBox = h('div', {}, pad, h('button', { class: 'btn btn-sm', type: 'button', style: 'margin-top:8px', onclick: () => { fitPad(); paintPlacements(); } }, S.clearPad));
      const typeBox = h('div', { class: 'hidden' }, nameInput);

      // Produce a trimmed PNG of the signature
      const sigCanvas = () => {
        if (sigMode === 'type') {
          const text = nameInput.value.trim();
          if (!text) return null;
          const c = document.createElement('canvas');
          const g = c.getContext('2d');
          const font = 'italic 96px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive';
          g.font = font;
          c.width = Math.ceil(g.measureText(text).width + 40); c.height = 150;
          g.font = font; g.fillStyle = '#111a4a'; g.textBaseline = 'middle'; g.fillText(text, 20, 75);
          return c;
        }
        if (!hasInk) return null;
        const g = padCtx();
        const { width, height } = pad;
        const data = g.getImageData(0, 0, width, height).data;
        let minX = width, minY = height, maxX = 0, maxY = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 10) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        if (maxX <= minX) return null;
        const c = document.createElement('canvas');
        c.width = maxX - minX + 8; c.height = maxY - minY + 8;
        c.getContext('2d').drawImage(pad, minX - 4, minY - 4, c.width, c.height, 0, 0, c.width, c.height);
        return c;
      };

      // Page preview with placement
      const pageCanvas = h('canvas', { class: 'page-canvas' });
      const wrap = h('div', { class: 'place-wrap' }, pageCanvas);
      const pageLabel = h('span', { class: 'muted small' });
      const placedLabel = h('span', { class: 'muted small' });
      const showPage = async () => {
        const maxW = Math.min(720, r.root.clientWidth - 360 > 300 ? r.root.clientWidth - 360 : r.root.clientWidth - 40);
        await renderPage(pdf, pageNo, { maxW, canvas: pageCanvas });
        pageVp = (await pdf.getPage(pageNo)).getViewport({ scale: 1 });
        pageLabel.textContent = S.pageOf(pageNo, n);
        paintPlacements();
      };
      const paintPlacements = () => {
        wrap.querySelectorAll('.sig-ghost').forEach((x) => x.remove());
        placedLabel.textContent = placements.length ? S.placed(placements.length) : '';
        const sc = sigCanvas();
        if (!sc || !pageVp) return;
        const k = pageCanvas.clientWidth / pageVp.width;
        const url = sc.toDataURL();
        for (const p of placements.filter((q) => q.page === pageNo)) {
          const w = p.w * k;
          const hh = (sc.height / sc.width) * w;
          wrap.append(h('img', { class: 'sig-ghost', src: url, style: `left:${p.x * k}px;top:${p.y * k}px;width:${w}px;height:${hh}px` }));
        }
      };
      pageCanvas.addEventListener('click', (e) => {
        const sc = sigCanvas();
        if (!sc) return ctx.toast(S.needSig);
        const b = pageCanvas.getBoundingClientRect();
        const k = b.width / pageVp.width;
        const w = sigWidth;
        const hh = (sc.height / sc.width) * w;
        placements.push({ page: pageNo, x: (e.clientX - b.left) / k - w / 2, y: (e.clientY - b.top) / k - hh / 2, w });
        paintPlacements();
      });

      r.layout({
        main: h('div', {},
          h('div', { class: 'row', style: 'margin-bottom:10px;flex-wrap:wrap' },
            h('button', { class: 'btn btn-sm', type: 'button', style: 'flex:none', onclick: () => { if (pageNo > 1) { pageNo--; showPage(); } } }, S.prev),
            pageLabel,
            h('button', { class: 'btn btn-sm', type: 'button', style: 'flex:none', onclick: () => { if (pageNo < n) { pageNo++; showPage(); } } }, S.next)),
          h('p', { class: 'muted small', style: 'margin-top:0' }, S.placeHint),
          wrap),
        options: [
          field(S.signature, seg([['draw', S.draw], ['type', S.type]], sigMode, (v) => { sigMode = v; drawBox.classList.toggle('hidden', v !== 'draw'); typeBox.classList.toggle('hidden', v !== 'type'); paintPlacements(); })),
          h('div', { class: 'field' }, drawBox, typeBox),
          field(S.sigSize, h('input', { type: 'range', min: 60, max: 320, value: sigWidth, oninput: (e) => { sigWidth = Number(e.target.value); placements.forEach((p) => (p.w = sigWidth)); paintPlacements(); } })),
          h('div', { class: 'row', style: 'margin-bottom:14px' }, h('button', { class: 'btn btn-sm', type: 'button', style: 'flex:none', onclick: () => { placements.pop(); paintPlacements(); } }, S.undo), placedLabel),
        ],
        actionLabel: S.sign,
        onAction: async () => {
          const sc = sigCanvas();
          if (!sc) throw new Error(S.needSig);
          if (!placements.length) throw new Error(S.needPlace);
          const doc = await loadPdf(bytes);
          const png = await doc.embedPng(new Uint8Array(await (await canvasToBlob(sc, 'image/png')).arrayBuffer()));
          const pages = doc.getPages();
          for (const p of placements) {
            const page = pages[p.page - 1];
            const { height } = page.getSize();
            const w = p.w;
            const hh = (png.height / png.width) * w;
            // pdf.js viewport is top-left origin; PDF is bottom-left (ignoring page rotation for simplicity)
            const box = page.getCropBox ? page.getCropBox() : { x: 0, y: 0 };
            page.drawImage(png, { x: box.x + p.x, y: box.y + height - p.y - hh, width: w, height: hh });
          }
          return { outputs: [{ name: `${baseName(file.name)}-signed.pdf`, blob: pdfBlob(await doc.save()) }] };
        },
      });
      requestAnimationFrame(() => { fitPad(); showPage(); });
    },
  },
};

export async function initTool(c) {
  ctx = c;
  h = c.h;
  S = STRINGS[c.lang] || STRINGS.en;
  const id = document.body.dataset.tool;
  const tool = TOOLS[id];
  if (!tool) return;
  const r = new Runner(tool);
  await r.init();
  document.body.dataset.ready = '1';
}

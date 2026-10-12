// Tool catalogue: drives page generation, SEO copy and runtime config.
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  merge: svg('<path d="M8 3v6a4 4 0 0 0 4 4h0a4 4 0 0 1 4 4v4"/><path d="M16 3v6a4 4 0 0 1-4 4"/><path d="m13 18 3 3 3-3"/>'),
  split: svg('<path d="M12 3v18"/><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/>'),
  compress: svg('<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/>'),
  organize: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  rotate: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  delete: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>'),
  extract: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>'),
  jpg2pdf: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  pdf2jpg: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><circle cx="10" cy="13" r="1.5"/><path d="m20 17-3-3-7 7"/>'),
  watermark: svg('<path d="M12 2.7s7 7.3 7 12.3a7 7 0 0 1-14 0c0-5 7-12.3 7-12.3z"/>'),
  numbers: svg('<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>'),
  protect: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  sign: svg('<path d="M3 21c3-1 5-4 6-7 1 3 2 4 4 4s2-2 3-3c1 2 2 3 5 3"/><path d="m15 3 6 6-9 9H6v-6z"/>'),
};

export const TOOLS = [
  {
    id: 'merge', slug: 'merge-pdf', icon: 'merge', pro: false,
    en: {
      name: 'Merge PDF', short: 'Combine several PDFs into one file, in the order you want.',
      title: 'Merge PDF Files Online — Free & Private | PDFly',
      desc: 'Combine multiple PDF files into one in seconds. Drag to reorder. Files are processed in your browser and never uploaded.',
      steps: ['Add two or more PDF files.', 'Drag them into the order you want.', 'Click Merge and download your single PDF.'],
      faq: [['Is there a limit on how many PDFs I can merge?', 'No fixed limit. Free files can be up to 25 MB each; Pro raises that to 1 GB.'], ['Do my files get uploaded?', 'No. PDFly merges your files directly in your browser, so they never leave your device.']],
    },
    fr: {
      name: 'Fusionner PDF', short: 'Combinez plusieurs PDF en un seul fichier, dans l’ordre voulu.',
      title: 'Fusionner des PDF en ligne — Gratuit et privé | PDFly',
      desc: 'Combinez plusieurs fichiers PDF en un seul en quelques secondes. Glissez pour réordonner. Vos fichiers ne quittent jamais votre appareil.',
      steps: ['Ajoutez deux fichiers PDF ou plus.', 'Glissez-les dans l’ordre souhaité.', 'Cliquez sur Fusionner et téléchargez votre PDF.'],
      faq: [['Combien de PDF puis-je fusionner ?', 'Aucune limite fixe. En gratuit, chaque fichier peut faire jusqu’à 25 Mo ; Pro monte à 1 Go.'], ['Mes fichiers sont-ils téléversés ?', 'Non. PDFly les fusionne directement dans votre navigateur.']],
    },
  },
  {
    id: 'split', slug: 'split-pdf', icon: 'split', pro: false,
    en: {
      name: 'Split PDF', short: 'Split a PDF into separate files by page or by range.',
      title: 'Split PDF Online — Separate Pages for Free | PDFly',
      desc: 'Split a PDF into individual pages or custom page ranges. Fast, free and private: nothing is uploaded.',
      steps: ['Add your PDF.', 'Choose every page or custom ranges like 1-3, 5, 8-10.', 'Download the split files as a ZIP.'],
      faq: [['How do I write page ranges?', 'Separate ranges with commas, for example 1-3, 5, 8-10. Each range becomes its own PDF.']],
    },
    fr: {
      name: 'Diviser PDF', short: 'Séparez un PDF en plusieurs fichiers par page ou par plage.',
      title: 'Diviser un PDF en ligne — Gratuit | PDFly',
      desc: 'Divisez un PDF en pages individuelles ou en plages personnalisées. Rapide, gratuit et privé.',
      steps: ['Ajoutez votre PDF.', 'Choisissez chaque page ou des plages comme 1-3, 5, 8-10.', 'Téléchargez les fichiers dans un ZIP.'],
      faq: [['Comment écrire les plages ?', 'Séparez-les par des virgules, par exemple 1-3, 5, 8-10. Chaque plage devient un PDF.']],
    },
  },
  {
    id: 'compress', slug: 'compress-pdf', icon: 'compress', pro: false, batch: true,
    en: {
      name: 'Compress PDF', short: 'Shrink PDF file size for email and uploads.',
      title: 'Compress PDF — Reduce PDF File Size Free | PDFly',
      desc: 'Reduce PDF size for email, forms and job portals. Choose your compression level. Private: files stay on your device.',
      steps: ['Add your PDF.', 'Pick a compression level.', 'Download the smaller file. We show you how much you saved.'],
      faq: [['Which level should I choose?', 'Light keeps everything sharp and selectable. Recommended and Strong convert pages to optimized images, which shrinks scans and photo-heavy PDFs dramatically.'], ['Can I compress many PDFs at once?', 'Yes, batch compression is part of PDFly Pro.']],
    },
    fr: {
      name: 'Compresser PDF', short: 'Réduisez la taille d’un PDF pour l’envoyer par courriel.',
      title: 'Compresser un PDF — Réduire la taille gratuitement | PDFly',
      desc: 'Réduisez la taille de vos PDF pour les courriels et les formulaires en ligne. Vos fichiers restent sur votre appareil.',
      steps: ['Ajoutez votre PDF.', 'Choisissez un niveau de compression.', 'Téléchargez le fichier allégé.'],
      faq: [['Quel niveau choisir ?', 'Léger garde tout net et sélectionnable. Recommandé et Fort convertissent les pages en images optimisées, idéal pour les numérisations.'], ['Puis-je compresser plusieurs PDF ?', 'Oui, le traitement par lots fait partie de PDFly Pro.']],
    },
  },
  {
    id: 'organize', slug: 'organize-pdf', icon: 'organize', pro: false,
    en: {
      name: 'Organize PDF', short: 'Reorder, rotate and delete pages visually.',
      title: 'Organize PDF Pages — Reorder, Rotate, Delete | PDFly',
      desc: 'Rearrange PDF pages with drag and drop, rotate or remove pages, then save. Free and private.',
      steps: ['Add your PDF.', 'Drag pages to reorder; rotate or delete with the page buttons.', 'Save and download.'],
      faq: [['Can I undo a deletion?', 'Yes. Deleted pages stay greyed out until you save; click restore to bring one back.']],
    },
    fr: {
      name: 'Organiser PDF', short: 'Réordonnez, pivotez et supprimez des pages visuellement.',
      title: 'Organiser les pages d’un PDF | PDFly',
      desc: 'Réorganisez les pages d’un PDF par glisser-déposer, pivotez ou supprimez des pages. Gratuit et privé.',
      steps: ['Ajoutez votre PDF.', 'Glissez les pages pour les réordonner; pivotez ou supprimez-les.', 'Enregistrez et téléchargez.'],
      faq: [['Puis-je annuler une suppression ?', 'Oui. Les pages supprimées restent grisées jusqu’à l’enregistrement.']],
    },
  },
  {
    id: 'rotate', slug: 'rotate-pdf', icon: 'rotate', pro: false,
    en: {
      name: 'Rotate PDF', short: 'Rotate all pages or just the ones that are sideways.',
      title: 'Rotate PDF Pages Online — Free | PDFly',
      desc: 'Rotate PDF pages 90° or 180°, all at once or one by one, and save permanently. No upload needed.',
      steps: ['Add your PDF.', 'Rotate all pages, or click individual pages.', 'Download the fixed PDF.'],
      faq: [['Is the rotation permanent?', 'Yes. The saved PDF opens with the new orientation everywhere.']],
    },
    fr: {
      name: 'Pivoter PDF', short: 'Pivotez toutes les pages ou seulement celles de travers.',
      title: 'Pivoter les pages d’un PDF — Gratuit | PDFly',
      desc: 'Pivotez des pages PDF de 90° ou 180°, toutes ou une à la fois, de façon permanente.',
      steps: ['Ajoutez votre PDF.', 'Pivotez toutes les pages ou cliquez sur certaines.', 'Téléchargez le PDF corrigé.'],
      faq: [['La rotation est-elle permanente ?', 'Oui. Le PDF enregistré s’ouvre avec la nouvelle orientation partout.']],
    },
  },
  {
    id: 'delete', slug: 'delete-pdf-pages', icon: 'delete', pro: false,
    en: {
      name: 'Delete Pages', short: 'Remove unwanted pages from a PDF.',
      title: 'Delete Pages from PDF — Free Online | PDFly',
      desc: 'Remove blank or unwanted pages from a PDF in a few clicks. Private: files never leave your device.',
      steps: ['Add your PDF.', 'Click the pages you want to remove.', 'Download the cleaned-up PDF.'],
      faq: [],
    },
    fr: {
      name: 'Supprimer des pages', short: 'Retirez les pages inutiles d’un PDF.',
      title: 'Supprimer des pages d’un PDF — Gratuit | PDFly',
      desc: 'Retirez les pages vides ou inutiles d’un PDF en quelques clics.',
      steps: ['Ajoutez votre PDF.', 'Cliquez sur les pages à retirer.', 'Téléchargez le PDF.'],
      faq: [],
    },
  },
  {
    id: 'extract', slug: 'extract-pdf-pages', icon: 'extract', pro: false,
    en: {
      name: 'Extract Pages', short: 'Pull selected pages out into a new PDF.',
      title: 'Extract Pages from PDF — Free | PDFly',
      desc: 'Select the pages you need and save them as a new PDF. Fast, free and private.',
      steps: ['Add your PDF.', 'Click the pages to keep.', 'Download them as a new PDF.'],
      faq: [],
    },
    fr: {
      name: 'Extraire des pages', short: 'Enregistrez certaines pages dans un nouveau PDF.',
      title: 'Extraire des pages d’un PDF — Gratuit | PDFly',
      desc: 'Sélectionnez les pages voulues et enregistrez-les dans un nouveau PDF.',
      steps: ['Ajoutez votre PDF.', 'Cliquez sur les pages à garder.', 'Téléchargez le nouveau PDF.'],
      faq: [],
    },
  },
  {
    id: 'jpg2pdf', slug: 'jpg-to-pdf', icon: 'jpg2pdf', pro: false,
    en: {
      name: 'JPG to PDF', short: 'Turn photos and scans into a single PDF.',
      title: 'JPG to PDF Converter — Images to PDF Free | PDFly',
      desc: 'Convert JPG, PNG and WebP images into one PDF. Choose page size and margins. Works on phone and desktop.',
      steps: ['Add your images.', 'Reorder and choose page size.', 'Download your PDF.'],
      faq: [['Which image formats work?', 'JPG, PNG, WebP and most images your browser can open.']],
    },
    fr: {
      name: 'JPG en PDF', short: 'Transformez photos et numérisations en un PDF.',
      title: 'Convertir JPG en PDF — Images en PDF gratuit | PDFly',
      desc: 'Convertissez des images JPG, PNG et WebP en un seul PDF. Choisissez le format et les marges.',
      steps: ['Ajoutez vos images.', 'Réordonnez et choisissez le format.', 'Téléchargez votre PDF.'],
      faq: [['Quels formats d’image ?', 'JPG, PNG, WebP et la plupart des images lisibles par votre navigateur.']],
    },
  },
  {
    id: 'pdf2jpg', slug: 'pdf-to-jpg', icon: 'pdf2jpg', pro: false,
    en: {
      name: 'PDF to JPG', short: 'Save every PDF page as a high-quality image.',
      title: 'PDF to JPG Converter — Free, High Quality | PDFly',
      desc: 'Convert PDF pages to JPG or PNG images at the resolution you choose. Download as a ZIP.',
      steps: ['Add your PDF.', 'Pick JPG or PNG and the quality.', 'Download the images.'],
      faq: [],
    },
    fr: {
      name: 'PDF en JPG', short: 'Enregistrez chaque page en image haute qualité.',
      title: 'Convertir PDF en JPG — Gratuit | PDFly',
      desc: 'Convertissez les pages d’un PDF en images JPG ou PNG. Téléchargez un ZIP.',
      steps: ['Ajoutez votre PDF.', 'Choisissez JPG ou PNG et la qualité.', 'Téléchargez les images.'],
      faq: [],
    },
  },
  {
    id: 'watermark', slug: 'watermark-pdf', icon: 'watermark', pro: true, batch: true,
    en: {
      name: 'Watermark PDF', short: 'Stamp text like CONFIDENTIAL or DRAFT on every page.',
      title: 'Add Watermark to PDF — Text Watermark | PDFly',
      desc: 'Add a text watermark to every page of a PDF. Control size, angle, opacity, colour and tiling.',
      steps: ['Add your PDF.', 'Type your watermark and adjust the style.', 'Download the watermarked PDF.'],
      faq: [],
    },
    fr: {
      name: 'Filigrane PDF', short: 'Apposez un texte comme CONFIDENTIEL sur chaque page.',
      title: 'Ajouter un filigrane à un PDF | PDFly',
      desc: 'Ajoutez un filigrane texte sur chaque page d’un PDF : taille, angle, opacité, couleur.',
      steps: ['Ajoutez votre PDF.', 'Écrivez le filigrane et ajustez le style.', 'Téléchargez le PDF.'],
      faq: [],
    },
  },
  {
    id: 'numbers', slug: 'add-page-numbers', icon: 'numbers', pro: true, batch: true,
    en: {
      name: 'Page Numbers', short: 'Number your pages with the format and position you want.',
      title: 'Add Page Numbers to PDF | PDFly',
      desc: 'Add page numbers to a PDF: choose position, format (1, Page 1 of 10), starting number and size.',
      steps: ['Add your PDF.', 'Choose position and format.', 'Download the numbered PDF.'],
      faq: [],
    },
    fr: {
      name: 'Numéroter les pages', short: 'Numérotez vos pages avec le format et la position voulus.',
      title: 'Ajouter des numéros de page à un PDF | PDFly',
      desc: 'Numérotez les pages d’un PDF : position, format (1, Page 1 de 10), numéro de départ.',
      steps: ['Ajoutez votre PDF.', 'Choisissez position et format.', 'Téléchargez le PDF numéroté.'],
      faq: [],
    },
  },
  {
    id: 'protect', slug: 'protect-pdf', icon: 'protect', pro: true, batch: true,
    en: {
      name: 'Protect PDF', short: 'Lock a PDF with a password using AES encryption.',
      title: 'Password Protect PDF — Encrypt PDF | PDFly',
      desc: 'Add a password to a PDF so only people with the password can open it. Encryption happens in your browser.',
      steps: ['Add your PDF.', 'Choose a strong password.', 'Download the encrypted PDF.'],
      faq: [['Can you recover my password?', 'No. We never see your file or password, so keep it somewhere safe.']],
    },
    fr: {
      name: 'Protéger PDF', short: 'Verrouillez un PDF avec un mot de passe.',
      title: 'Protéger un PDF par mot de passe | PDFly',
      desc: 'Ajoutez un mot de passe à un PDF. Le chiffrement se fait dans votre navigateur.',
      steps: ['Ajoutez votre PDF.', 'Choisissez un mot de passe solide.', 'Téléchargez le PDF chiffré.'],
      faq: [['Pouvez-vous récupérer mon mot de passe ?', 'Non. Nous ne voyons jamais votre fichier ni votre mot de passe.']],
    },
  },
  {
    id: 'sign', slug: 'sign-pdf', icon: 'sign', pro: true,
    en: {
      name: 'Sign PDF', short: 'Draw or type your signature and place it on the page.',
      title: 'Sign PDF Online — Add Your Signature | PDFly',
      desc: 'Draw or type a signature and place it anywhere on a PDF. Your document never leaves your device.',
      steps: ['Add your PDF.', 'Draw or type your signature.', 'Click where it goes, then download.'],
      faq: [],
    },
    fr: {
      name: 'Signer PDF', short: 'Dessinez ou tapez votre signature et placez-la.',
      title: 'Signer un PDF en ligne | PDFly',
      desc: 'Dessinez ou tapez une signature et placez-la n’importe où sur un PDF.',
      steps: ['Ajoutez votre PDF.', 'Dessinez ou tapez votre signature.', 'Cliquez pour la placer, puis téléchargez.'],
      faq: [],
    },
  },
];

export const COMMON_FAQ = {
  en: [
    ['Is PDFly free?', 'Yes. Merge, split, compress, organize, rotate and convert are free. PDFly Pro unlocks watermarks, page numbers, password protection, signatures, batch processing and files up to 1 GB.'],
    ['Are my files safe?', 'Your files are processed entirely inside your browser. They are never uploaded to our servers, so nobody else can see them.'],
  ],
  fr: [
    ['PDFly est-il gratuit ?', 'Oui. Fusionner, diviser, compresser, organiser, pivoter et convertir sont gratuits. PDFly Pro débloque filigranes, numérotation, mot de passe, signature, traitement par lots et fichiers jusqu’à 1 Go.'],
    ['Mes fichiers sont-ils en sécurité ?', 'Vos fichiers sont traités entièrement dans votre navigateur. Ils ne sont jamais téléversés sur nos serveurs.'],
  ],
};

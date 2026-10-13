const fs = require('fs');
const path = require('path');
const { GUIDE_ARTICLES } = require('../src/data/guide-articles');

const projectRoot = path.resolve(__dirname, '..');
const publicDirectory = path.join(projectRoot, 'public');
const guideDirectory = path.join(publicDirectory, 'ram-towing-guides');
const buildDate = new Date().toISOString().slice(0, 10);
const reviewerName = 'Jonny Forseth';
const reviewerTitle = 'Internet Sales, Perkins Motors';

// Publish the exact source chart alongside its guide; no external URL guesswork.
fs.mkdirSync(path.join(publicDirectory, 'charts'), { recursive: true });
fs.copyFileSync(path.join(projectRoot, 'samples/2027-1500-chart.pdf'), path.join(publicDirectory, 'charts/2027-ram-1500.pdf'));

const inventoryUrls = {
  '1500': 'https://perkinsmotors.com/advanced-search?condition=new&make=Ram&model=1500&utm_source=ramtow.com&utm_medium=referral&utm_campaign=towing_guide',
  '2500': 'https://perkinsmotors.com/advanced-search?condition=new&make=Ram&model=2500&utm_source=ramtow.com&utm_medium=referral&utm_campaign=towing_guide',
  '3500': 'https://perkinsmotors.com/advanced-search?condition=new&make=Ram&model=3500&utm_source=ramtow.com&utm_medium=referral&utm_campaign=towing_guide',
  default: 'https://perkinsmotors.com/advanced-search?condition=new&make=Ram&utm_source=ramtow.com&utm_medium=referral&utm_campaign=towing_guide',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function relatedArticles(article) {
  const currentIndex = GUIDE_ARTICLES.indexOf(article);
  return [1, 2, 3].map((offset) => GUIDE_ARTICLES[(currentIndex + offset) % GUIDE_ARTICLES.length]);
}

function articleHtml(article) {
  const related = relatedArticles(article);
  const inventoryUrl = inventoryUrls[article.model] || inventoryUrls.default;
  const escapedTitle = escapeHtml(article.title);
  const escapedDescription = escapeHtml(article.description);
  const articleHeadline = article.headline
    ? `<aside class="article-headline-numbers"><p class="fit-eyebrow">Lineup capability</p><strong>${escapeHtml(article.headline)}</strong><span>Maximums shown are for properly equipped configurations. Use VIN Lookup for the individual truck.</span></aside>`
    : '';
  const postSections = [
    {
      id: 'why-it-matters',
      eyebrow: 'Why it matters',
      heading: 'What this means for your tow setup.',
      paragraphs: [article.why],
    },
    ...(article.sections || []).map((section, index) => ({
      id: `detail-${index + 1}`,
      heading: section.heading,
      paragraphs: section.paragraphs,
    })),
    {
      id: 'what-to-check-next',
      eyebrow: 'What to check next',
      heading: 'Use a simple, repeatable process.',
      paragraphs: [article.check],
    },
  ];
  const tableOfContents = [...postSections, { id: 'official-reference', heading: 'Official towing reference' }];
  const referenceLinks = article.referenceLinks || [{
    url: 'https://www.ramtrucks.com/towing/before-you-buy.html',
    label: "Read RAM's towing basics and terms",
  }];
  const postSectionsMarkup = postSections.map((section) => `
              <section class="article-post-section" id="${section.id}">
                ${section.eyebrow ? `<p class="fit-eyebrow">${escapeHtml(section.eyebrow)}</p>` : ''}
                <h2>${escapeHtml(section.heading)}</h2>
                ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
              </section>`).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapedTitle} | RAM Tow</title>
    <link rel="icon" type="image/png" href="/assets/ram-tow-favicon.png">
    <link rel="apple-touch-icon" href="/assets/ram-tow-favicon.png">
    <meta name="description" content="${escapedDescription}">
    <link rel="canonical" href="https://ramtow.com/ram-towing-guides/${article.slug}">
    <meta property="og:title" content="${escapedTitle} | RAM Tow">
    <meta property="og:description" content="${escapedDescription}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://ramtow.com/ram-towing-guides/${article.slug}">
    <meta name="twitter:card" content="summary">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css?v=__ASSET_VERSION__">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${escapedTitle}","description":"${escapedDescription}","mainEntityOfPage":"https://ramtow.com/ram-towing-guides/${article.slug}","dateModified":"${buildDate}","author":{"@type":"Person","name":"${reviewerName}","jobTitle":"Internet Sales","worksFor":{"@type":"Organization","name":"Perkins Motors","url":"https://perkinsmotors.com/"}},"publisher":{"@type":"Organization","name":"RAM Tow","url":"https://ramtow.com/"}}</script>
  </head>
  <body class="guide-page">
    <div class="page-shell guide-shell">
      <header class="guide-nav"><a class="guide-brand" href="/" aria-label="RAM Tow home"><img src="/assets/ram-tow-logo.png" alt="RAM Tow" width="2172" height="724"></a><div class="guide-nav-actions"><a href="/ram-towing-guides">All Guides</a><a href="/#vin-form">VIN Lookup</a><a href="/#trailer-fit">Match My Trailer</a></div></header>
      <main>
        <article class="article-guide">
          <header class="article-guide-hero"><p class="fit-eyebrow">RAM towing answers</p><p class="article-breadcrumb"><a href="/ram-towing-guides">Towing Guides</a> <span>/</span> ${escapedTitle}</p><h1>${escapedTitle}</h1><p>${escapeHtml(article.lead)}</p><p class="article-post-byline">Last reviewed ${buildDate} <span>•</span> Reviewed by Perkins RAM Experts</p></header>
          <div class="article-guide-content">
            <aside class="article-post-rail">
              <nav class="article-toc" aria-label="On this page"><p class="fit-eyebrow">In this guide</p><ol>${tableOfContents.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.heading)}</a></li>`).join('')}</ol></nav>
              <div class="article-rail-note"><strong>Need a truck-specific answer?</strong><p>Run the VIN to compare the available sticker details to the correct RAM chart.</p><a href="/#vin-form">Check a RAM VIN</a><p class="article-delivery-note">Free Colorado delivery and remote purchase are available through Perkins Motors. Paid continental U.S. delivery is available through <a href="https://runbuggy.com/" target="_blank" rel="noreferrer">RunBuggy</a>.</p></div>
            </aside>
            <div class="article-post-body">
              ${articleHeadline}
              <div class="article-review"><strong>Reviewed by Perkins RAM Experts</strong><p>Prepared by ${reviewerName}, ${reviewerTitle}. This guidance is based on the applicable RAM towing and payload charts. Confirm the exact truck before towing.</p><a href="/how-ramtow-calculates-towing-capacity">How RAM Tow calculates results</a></div>
              ${postSectionsMarkup}
              <aside class="article-guide-action"><strong>Ready to check a specific truck?</strong><p>VIN Lookup compares the available sticker details with the correct RAM tow chart. Trailer Match starts with the load you are pulling.</p><div><a class="button button-primary" href="/#vin-form">Check a RAM VIN</a><a class="button button-secondary" href="/#trailer-fit">Match My Trailer</a></div></aside>
              <section class="article-guide-source" id="official-reference"><p class="fit-eyebrow">Official reference</p><h2>Use the complete setup, not just one number.</h2><p>RAM Tow is a research tool. Review the applicable RAM towing chart, door labels, payload sticker, hitch instructions, and the truck and trailer owner materials before towing.</p>${referenceLinks.map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join('')}</section>
            </div>
          </div>
        </article>
        <section class="article-related"><p class="fit-eyebrow">Keep researching</p><h2>Continue with these towing questions.</h2><ul>${related.map((item) => `<li><a href="/ram-towing-guides/${item.slug}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.description)}</span></li>`).join('')}</ul><div class="guide-inline-actions"><a class="button button-secondary" href="/ram-towing-guides">See All Towing Guides</a><a class="button button-primary" href="${inventoryUrl}" target="_blank" rel="noreferrer">Browse RAM Inventory</a></div></section>
      </main>
      <footer class="site-footer"><a class="site-footer-brand" href="/" aria-label="RAM Tow home"><img src="/assets/ram-tow-logo.png" alt="RAM Tow" width="2172" height="724"></a><p>RAM Tow helps shoppers research chart-backed towing capacity, payload, and trailer fit.</p><nav class="footer-links" aria-label="Site resources"><a href="/">Calculator</a><a href="/ram-towing-guides">Towing Guides</a><a href="/disclaimer">Disclaimer</a><a href="/sitemap.xml">Sitemap</a></nav></footer>
    </div>
  </body>
</html>`;
}

function libraryHtml() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RAM Towing Questions and Answers | RAM Tow</title><meta name="description" content="Consumer-friendly answers to common RAM towing, payload, trailer weight, hitch, axle ratio, diesel, gas, fifth-wheel, and dually questions."><link rel="canonical" href="https://ramtow.com/ram-towing-questions"><link rel="icon" type="image/png" href="/assets/ram-tow-favicon.png"><link rel="apple-touch-icon" href="/assets/ram-tow-favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css?v=__ASSET_VERSION__"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"RAM Towing Questions and Answers","description":"Consumer-friendly answers to common RAM towing, payload, trailer weight, hitch, axle ratio, diesel, gas, fifth-wheel, and dually questions.","mainEntityOfPage":"https://ramtow.com/ram-towing-questions","dateModified":"${buildDate}","author":{"@type":"Organization","name":"RAM Tow","url":"https://ramtow.com/"},"publisher":{"@type":"Organization","name":"RAM Tow","url":"https://ramtow.com/"}}</script></head><body class="guide-page"><div class="page-shell guide-shell"><header class="guide-nav"><a class="guide-brand" href="/" aria-label="RAM Tow home"><img src="/assets/ram-tow-logo.png" alt="RAM Tow" width="2172" height="724"></a><div class="guide-nav-actions"><a href="/ram-towing-guides">Guide Home</a><a href="/#vin-form">VIN Lookup</a><a href="/#trailer-fit">Match My Trailer</a></div></header><main><section class="guide-hero"><p class="fit-eyebrow">RAM towing answers</p><h1>Common Towing Questions, Clearly Answered.</h1><p>Choose a question below, learn the practical answer, then check the exact truck or trailer combination in RAM Tow.</p><div class="guide-hero-actions"><a class="button button-primary" href="/#trailer-fit">Find My RAM</a><a class="button button-ghost" href="/#vin-form">Verify a VIN</a></div></section><section class="guide-more article-library"><p class="fit-eyebrow">Research before you buy</p><h2>RAM towing, payload, and trailer-fit guides.</h2><div class="content-grid resource-grid">${GUIDE_ARTICLES.map((article) => `<section><h3><a href="/ram-towing-guides/${article.slug}">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.description)}</p><a class="text-action" href="/ram-towing-guides/${article.slug}">Read the answer</a></section>`).join('')}</div></section></main><footer class="site-footer"><a class="site-footer-brand" href="/" aria-label="RAM Tow home"><img src="/assets/ram-tow-logo.png" alt="RAM Tow" width="2172" height="724"></a><p>RAM Tow helps shoppers research chart-backed towing capacity, payload, and trailer fit.</p><nav class="footer-links" aria-label="Site resources"><a href="/">Calculator</a><a href="/ram-towing-guides">Towing Guides</a><a href="/disclaimer">Disclaimer</a><a href="/sitemap.xml">Sitemap</a></nav></footer></div></body></html>`;
}

function sitemapXml() {
  const basePaths = [
    '/', '/ram-2500-towing-capacity', '/ram-3500-towing-capacity', '/can-a-ram-1500-tow-10000-lbs', '/disclaimer', '/privacy', '/how-ramtow-calculates-towing-capacity', '/trailer-fit', '/ram-towing-guides', '/ram-towing-questions', '/ram-1500-towing-capacity', '/ram-1500-hemi-vs-hurricane-towing', '/ram-2500-6-4-hemi-towing-capacity', '/ram-2500-cummins-towing-capacity', '/ram-3500-srw-vs-dually-towing', '/how-to-find-ram-axle-ratio-by-vin',
  ];
  const paths = [...basePaths, ...GUIDE_ARTICLES.map((article) => `/ram-towing-guides/${article.slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((item) => `  <url><loc>https://ramtow.com${item}</loc><lastmod>${buildDate}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

for (const article of GUIDE_ARTICLES) {
  const directory = path.join(guideDirectory, article.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), articleHtml(article));
}

const libraryDirectory = path.join(publicDirectory, 'ram-towing-questions');
fs.mkdirSync(libraryDirectory, { recursive: true });
fs.writeFileSync(path.join(libraryDirectory, 'index.html'), libraryHtml());
fs.writeFileSync(path.join(publicDirectory, 'sitemap.xml'), sitemapXml());

console.log(`Built ${GUIDE_ARTICLES.length} towing guide articles.`);

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDirectory = path.join(projectRoot, 'public');
const googleMeasurementId = 'G-FXRKJ81DXP';
const analyticsMarkup = `<!-- RAM TOW GA START -->
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${googleMeasurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleMeasurementId}', { anonymize_ip: true, send_page_view: false });
      gtag('event', 'page_view', {
        page_location: window.location.origin + window.location.pathname,
        page_title: document.title
      });
    </script>
    <!-- RAM TOW GA END -->
    `;

// A fresh deployment version prevents a browser or proxy from reusing an older asset.
const assetVersion = crypto
  .createHash('sha256')
  .update(`${Date.now()}-${Math.random()}-${process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || ''}`)
  .digest('hex')
  .slice(0, 12);
const navigationMarkup = `<!-- RAM TOW NAV START -->
    <script defer src="/site-nav.js?v=${assetVersion}"></script>
    <!-- RAM TOW NAV END -->
    `;
const siteIdentityMarkup = `<!-- RAM TOW SITE IDENTITY START -->
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://ramtow.com/#website","name":"RAM Tow","url":"https://ramtow.com/","description":"VIN-based RAM towing capacity, payload, and trailer-fit research using model-year RAM towing charts."},{"@type":"Organization","@id":"https://ramtow.com/#organization","name":"RAM Tow","url":"https://ramtow.com/","logo":"https://ramtow.com/assets/ram-tow-logo.png"}]}</script>
    <!-- RAM TOW SITE IDENTITY END -->
    `;
const staticArticlePaths = new Set([
  '/can-a-ram-1500-tow-10000-lbs',
  '/how-to-find-ram-axle-ratio-by-vin',
  '/ram-1500-hemi-vs-hurricane-towing',
  '/ram-1500-towing-capacity',
  '/ram-2500-6-4-hemi-towing-capacity',
  '/ram-2500-cummins-towing-capacity',
  '/ram-2500-towing-capacity',
  '/ram-3500-srw-vs-dually-towing',
  '/ram-3500-towing-capacity',
]);
const buildDate = new Date().toISOString().slice(0, 10);

function textFromHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function staticArticleMarkup(relativePath, html) {
  const pathname = `/${relativePath.replace(/\\/g, '/').replace(/\/index\.html$/, '')}`.replace(/\/index$/, '/');
  if (!staticArticlePaths.has(pathname)) {
    return '';
  }

  const title = textFromHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]) || 'RAM Tow Guide';
  const description = textFromHtml(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]) || 'RAM towing and payload research guidance.';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title.replace(/\s*\|\s*RAM Tow$/i, ''),
    description,
    mainEntityOfPage: `https://ramtow.com${pathname}`,
    dateModified: buildDate,
    author: { '@type': 'Organization', '@id': 'https://ramtow.com/#organization' },
    publisher: { '@id': 'https://ramtow.com/#organization' },
  };
  return `<!-- RAM TOW ARTICLE SCHEMA START -->\n    <script type="application/ld+json">${jsonForHtml(schema)}</script>\n    <!-- RAM TOW ARTICLE SCHEMA END -->\n    `;
}

function addPrivacyLink(html) {
  return html.replace(/(<nav class="footer-links"[^>]*>)([\s\S]*?)(<\/nav>)/gi, (match, opening, links, closing) => {
    if (links.includes('href="/privacy"')) {
      return match;
    }
    return `${opening}${links}<a href="/privacy">Privacy</a>${closing}`;
  });
}

function findHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findHtmlFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : [];
  });
}

let updatedFiles = 0;
for (const htmlPath of findHtmlFiles(publicDirectory)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const relativePath = path.relative(publicDirectory, htmlPath);
  const articleMarkup = staticArticleMarkup(relativePath, html);
  const updatedHtml = html
    .replace(/(\/styles\.css)(?:\?v=(?:__ASSET_VERSION__|[a-f0-9]{12}))?/g, `$1?v=${assetVersion}`)
    .replace(/(\/(?:app|trailer-fit-results|site-nav)\.js)(?:\?v=(?:__ASSET_VERSION__|[a-f0-9]{12}))?/g, `$1?v=${assetVersion}`)
    .replace(/<!-- RAM TOW NAV START -->[\s\S]*?<!-- RAM TOW NAV END -->\s*/g, '')
    .replace(/<!-- RAM TOW GA START -->[\s\S]*?<!-- RAM TOW GA END -->\s*/g, '')
    .replace(/<!-- RAM TOW SITE IDENTITY START -->[\s\S]*?<!-- RAM TOW SITE IDENTITY END -->\s*/g, '')
    .replace(/<!-- RAM TOW ARTICLE SCHEMA START -->[\s\S]*?<!-- RAM TOW ARTICLE SCHEMA END -->\s*/g, '')
    .replace(/<\/head>/i, `${articleMarkup}${siteIdentityMarkup}${navigationMarkup}${analyticsMarkup}</head>`);
  const htmlWithPrivacyLink = addPrivacyLink(updatedHtml);

  if (htmlWithPrivacyLink !== html) {
    fs.writeFileSync(htmlPath, htmlWithPrivacyLink);
    updatedFiles += 1;
  }
}

if (!updatedFiles) {
  throw new Error('Could not find browser assets to version in public HTML files.');
}

console.log(`Versioned browser assets in ${updatedFiles} HTML files: ${assetVersion}`);

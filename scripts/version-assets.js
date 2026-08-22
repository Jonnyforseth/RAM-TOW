const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDirectory = path.join(projectRoot, 'public');

// A fresh deployment version prevents a browser or proxy from reusing an older asset.
const assetVersion = crypto
  .createHash('sha256')
  .update(`${Date.now()}-${Math.random()}-${process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || ''}`)
  .digest('hex')
  .slice(0, 12);

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
  const updatedHtml = html
    .replace(/(\/styles\.css)(?:\?v=(?:__ASSET_VERSION__|[a-f0-9]{12}))?/g, `$1?v=${assetVersion}`)
    .replace(/(\/(?:app|trailer-fit-results)\.js)(?:\?v=(?:__ASSET_VERSION__|[a-f0-9]{12}))?/g, `$1?v=${assetVersion}`);

  if (updatedHtml !== html) {
    fs.writeFileSync(htmlPath, updatedHtml);
    updatedFiles += 1;
  }
}

if (!updatedFiles) {
  throw new Error('Could not find browser assets to version in public HTML files.');
}

console.log(`Versioned browser assets in ${updatedFiles} HTML files: ${assetVersion}`);

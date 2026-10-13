const test = require('node:test');
const assert = require('node:assert/strict');

const { GUIDE_ARTICLES } = require('../src/data/guide-articles');

test('includes substantive VIN and configuration guides for 2019 through 2022 RAM trucks', () => {
  const legacyArticles = GUIDE_ARTICLES.filter((article) => /^(2019|2020|2021|2022)-ram-/.test(article.slug) && !article.slug.endsWith('-guide'));
  const expectedYears = new Set(['2019', '2020', '2021', '2022']);

  assert.ok(legacyArticles.length >= 16, 'at least 16 older-model RAM guides are published');
  assert.equal(new Set(legacyArticles.map((article) => article.slug)).size, legacyArticles.length, 'legacy guide URLs are unique');
  assert.deepEqual(new Set(legacyArticles.map((article) => article.slug.slice(0, 4))), expectedYears, 'each supported older model year is covered');

  for (const article of legacyArticles) {
    assert.ok(article.title.endsWith('?'), `${article.slug} is a question-led article`);
    assert.ok(article.description.length >= 120, `${article.slug} has an SEO description`);
    assert.ok(article.lead.length >= 180, `${article.slug} has a substantive introduction`);
    assert.ok(article.sections.length >= 2, `${article.slug} explains more than one configuration factor`);
    assert.ok(article.check.length >= 100, `${article.slug} includes a VIN and payload verification step`);
  }
});

test('publishes a detailed model-year towing guide with official chart references for every supported year', () => {
  const { SUPPORTED_CHART_YEARS } = require('../src/data/chart-data');
  const yearGuides = GUIDE_ARTICLES.filter((article) => /^20\d{2}-ram-towing-capacity-guide$/.test(article.slug));

  assert.deepEqual(yearGuides.map(article => Number(article.slug.slice(0, 4))).sort(), SUPPORTED_CHART_YEARS, 'one year-overview guide exists for every supported chart year');

  for (const article of yearGuides) {
    const year = Number(article.slug.slice(0, 4));
    const expectedSources = year === 2027 ? 1 : year <= 2022 ? 4 : 2;

    assert.ok(article.headline.includes('RAM 1500'), `${article.slug} includes year-specific lineup headline numbers`);
    assert.ok(article.sections.length >= 3, `${article.slug} has a detailed answer`);
    assert.equal(article.referenceLinks.length, expectedSources, `${article.slug} includes the appropriate model-family chart sources`);
    assert.ok(article.referenceLinks.every((link) => (link.url.startsWith('https://www.ramtrucks.com/') || link.url === '/charts/2027-ram-1500.pdf') && link.url.endsWith('.pdf')), `${article.slug} links to RAM chart PDFs`);

    if (year <= 2022) {
      const labels = article.referenceLinks.map((link) => link.label).join(' ');
      assert.match(labels, /Classic DS/, `${article.slug} includes a distinct Classic DS chart source`);
      assert.match(labels, /2500/, `${article.slug} includes a RAM 2500 chart source`);
      assert.match(labels, /3500/, `${article.slug} includes a RAM 3500 chart source`);
    }
  }
});

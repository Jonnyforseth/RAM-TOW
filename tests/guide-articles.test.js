const test = require('node:test');
const assert = require('node:assert/strict');

const { GUIDE_ARTICLES } = require('../src/data/guide-articles');

test('includes substantive VIN and configuration guides for 2019 through 2022 RAM trucks', () => {
  const legacyArticles = GUIDE_ARTICLES.filter((article) => /^(2019|2020|2021|2022)-ram-/.test(article.slug));
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

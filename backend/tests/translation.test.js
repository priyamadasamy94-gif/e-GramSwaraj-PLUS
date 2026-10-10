const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../models');
const { localizeAssets, stripLanguageMarker, translateText } = require('../services/translationService');

const originalFetch = global.fetch;
const originalApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
const originalFindAll = M.TranslationCache.findAll;
const originalBulkCreate = M.TranslationCache.bulkCreate;
const originalWarn = console.warn;

test('translation marker is stripped only from the runtime value', () => {
  assert.equal(stripLanguageMarker('[TA] Community Hall'), 'Community Hall');
  assert.equal(stripLanguageMarker('[EN] Construction of a road'), 'Construction of a road');
  assert.equal(stripLanguageMarker('Community Hall'), 'Community Hall');
});

test('Google translation uses backend credentials and caches translated text', async () => {
  process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key';
  M.TranslationCache.findAll = async () => [];
  let savedRows = [];
  M.TranslationCache.bulkCreate = async (rows) => { savedRows = rows; };
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).searchParams.get('key'), 'test-key');
    assert.deepEqual(JSON.parse(options.body).q, ['Community Hall']);
    return { ok: true, json: async () => ({ data: { translations: [{ translatedText: 'சமுதாயக் கூடம்' }] } }) };
  };

  const translated = await translateText('[TA] Community Hall', 'en', 'ta');
  assert.equal(translated, 'சமுதாயக் கூடம்');
  assert.equal(savedRows.length, 1);
  assert.equal(savedRows[0].sourceText, 'Community Hall');
  assert.equal(savedRows[0].translatedText, 'சமுதாயக் கூடம்');
});

test('cached translation avoids another Google request', async () => {
  M.TranslationCache.findAll = async ({ where }) => {
    const hashes = where.sourceHash[Reflect.ownKeys(where.sourceHash)[0]];
    return hashes.map((sourceHash) => ({ sourceHash, translatedText: 'சமுதாயக் கூடம்' }));
  };
  global.fetch = async () => { throw new Error('Google should not be called for a cache hit'); };

  assert.equal(await translateText('Community Hall', 'en', 'ta'), 'சமுதாயக் கூடம்');
});

test('translation failure falls back to cleaned original text', async () => {
  process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key';
  M.TranslationCache.findAll = async () => [];
  global.fetch = async () => ({ ok: false, status: 503 });
  console.warn = () => {};

  assert.equal(await translateText('[TA] Community Hall', 'en', 'ta'), 'Community Hall');
});

test('asset localization does not mutate the source business record', async () => {
  const original = { _id: 'asset-id', name: '[TA] Community Hall', location: 'Ward 1', estimatedValue: 1000 };
  const localized = await localizeAssets(original, 'en');

  assert.equal(localized.name, 'Community Hall');
  assert.equal(original.name, '[TA] Community Hall');
  assert.equal(localized._id, original._id);
  assert.equal(localized.estimatedValue, original.estimatedValue);
});

test.after(() => {
  global.fetch = originalFetch;
  M.TranslationCache.findAll = originalFindAll;
  M.TranslationCache.bulkCreate = originalBulkCreate;
  console.warn = originalWarn;
  if (originalApiKey === undefined) delete process.env.GOOGLE_TRANSLATE_API_KEY;
  else process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey;
});
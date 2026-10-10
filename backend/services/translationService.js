const crypto = require('node:crypto');
const { Op } = require('sequelize');
const M = require('../models');
const { googleTranslateApiKey } = require('../config/env');

const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn'];
const LANGUAGE_MARKER = /^\s*\[(?:EN|HI|TA|TE|KN|ML|MR|BN)\]\s*/i;
const MAX_BATCH_SIZE = 100;
let missingKeyWarningLogged = false;

function normalizeLanguage(language) {
  const first = String(language || 'en').split(',')[0].split(';')[0].trim().toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(first) ? first : 'en';
}

function stripLanguageMarker(value) {
  return typeof value === 'string' ? value.replace(LANGUAGE_MARKER, '') : value;
}

function translationHash(sourceText, sourceLanguage, targetLanguage) {
  return crypto.createHash('sha256')
    .update(`${sourceLanguage}\0${targetLanguage}\0${sourceText}`)
    .digest('hex');
}

function safeWarning(message, status) {
  console.warn(`[translation] ${message}${status ? ` (HTTP ${status})` : ''}`);
}

function decodeGoogleText(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'");
}

async function callGoogleTranslate(texts, sourceLanguage, targetLanguage) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || googleTranslateApiKey;
  if (!apiKey) {
    if (!missingKeyWarningLogged) {
      safeWarning('GOOGLE_TRANSLATE_API_KEY is not configured; displaying source text.');
      missingKeyWarningLogged = true;
    }
    return null;
  }

  const endpoint = new URL('https://translation.googleapis.com/language/translate/v2');
  endpoint.searchParams.set('key', apiKey);
  const translated = [];

  for (let offset = 0; offset < texts.length; offset += MAX_BATCH_SIZE) {
    const batch = texts.slice(offset, offset + MAX_BATCH_SIZE);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: batch, source: sourceLanguage, target: targetLanguage, format: 'text' }),
      });
      if (!response.ok) {
        safeWarning('Google Cloud Translation request failed; displaying source text.', response.status);
        return null;
      }
      const payload = await response.json();
      const results = payload?.data?.translations;
      if (!Array.isArray(results) || results.length !== batch.length) {
        safeWarning('Google Cloud Translation returned an invalid response; displaying source text.');
        return null;
      }
      translated.push(...results.map((result) => decodeGoogleText(result.translatedText || '')));
    } catch {
      safeWarning('Google Cloud Translation is unavailable; displaying source text.');
      return null;
    }
  }

  return translated;
}

async function translateTexts(texts, sourceCode = 'en', targetCode = 'en') {
  const sourceLanguage = normalizeLanguage(sourceCode);
  const targetLanguage = normalizeLanguage(targetCode);
  const uniqueTexts = [...new Set(texts.map(stripLanguageMarker).filter((text) => typeof text === 'string' && text.length > 0))];
  const result = new Map(uniqueTexts.map((text) => [text, text]));
  if (!uniqueTexts.length || sourceLanguage === targetLanguage) return result;

  const keyedTexts = uniqueTexts.map((sourceText) => ({
    sourceText,
    sourceHash: translationHash(sourceText, sourceLanguage, targetLanguage),
  }));
  const cachedByHash = new Map();
  try {
    const cached = await M.TranslationCache.findAll({
      where: { sourceHash: { [Op.in]: keyedTexts.map(({ sourceHash }) => sourceHash) } },
      attributes: ['sourceHash', 'translatedText'],
      raw: true,
    });
    for (const entry of cached) cachedByHash.set(entry.sourceHash, entry.translatedText);
  } catch {
    safeWarning('Translation cache could not be read; using source text if translation is unavailable.');
  }

  const uncached = keyedTexts.filter(({ sourceHash }) => !cachedByHash.has(sourceHash));
  for (const { sourceText, sourceHash } of keyedTexts) {
    if (cachedByHash.has(sourceHash)) result.set(sourceText, cachedByHash.get(sourceHash));
  }
  if (!uncached.length) return result;

  const translated = await callGoogleTranslate(uncached.map(({ sourceText }) => sourceText), sourceLanguage, targetLanguage);
  if (!translated) return result;

  const cacheRows = uncached.map(({ sourceText, sourceHash }, index) => {
    result.set(sourceText, translated[index]);
    return { sourceHash, sourceText, sourceLanguage, targetLanguage, translatedText: translated[index] };
  });
  try {
    await M.TranslationCache.bulkCreate(cacheRows, { ignoreDuplicates: true });
  } catch {
    safeWarning('Translation cache could not be updated; translated text is still available for this request.');
  }
  return result;
}

async function translateText(text, sourceLanguage = 'en', targetLanguage = 'en') {
  if (typeof text !== 'string') return text;
  const cleanText = stripLanguageMarker(text);
  const translations = await translateTexts([cleanText], sourceLanguage, targetLanguage);
  return translations.get(cleanText) ?? cleanText;
}

function plainRecord(document) {
  return typeof document?.toJSON === 'function' ? document.toJSON() : { ...document };
}

async function localizeRecords(items, language, textFields) {
  if (!items) return items;
  const isArray = Array.isArray(items);
  const records = (isArray ? items : [items]).map(plainRecord);
  const targetLanguage = normalizeLanguage(language);
  const occurrences = [];
  const sourceTexts = [];

  records.forEach((record, recordIndex) => {
    for (const field of textFields) {
      const value = record[field];
      if (typeof value === 'string') {
        occurrences.push({ recordIndex, field, value: stripLanguageMarker(value) });
        sourceTexts.push(value);
      } else if (Array.isArray(value)) {
        record[field] = [...value];
        value.forEach((item, itemIndex) => {
          if (typeof item === 'string') {
            occurrences.push({ recordIndex, field, itemIndex, value: stripLanguageMarker(item) });
            sourceTexts.push(item);
          }
        });
      }
    }
  });

  const translatedByText = await translateTexts(sourceTexts, 'en', targetLanguage);
  for (const occurrence of occurrences) {
    const translatedText = translatedByText.get(occurrence.value) ?? occurrence.value;
    if (occurrence.itemIndex === undefined) records[occurrence.recordIndex][occurrence.field] = translatedText;
    else records[occurrence.recordIndex][occurrence.field][occurrence.itemIndex] = translatedText;
  }

  for (const record of records) {
    record.activeLanguage = targetLanguage;
    record.availableLanguages = [targetLanguage];
  }
  return isArray ? records : records[0];
}

const localizeAnnouncements = (items, language) => localizeRecords(items, language, ['title', 'description']);
const localizeServices = (items, language) => localizeRecords(items, language, ['name', 'department', 'description', 'eligibility', 'instructions', 'requiredDocuments']);
const localizeMeetings = (items, language) => localizeRecords(items, language, ['title', 'location', 'agenda', 'minutes', 'decisions']);
const localizeVillages = (items, language) => localizeRecords(items, language, ['name', 'panchayatName', 'block', 'taluk', 'district', 'state', 'description', 'attractions', 'dataNote']);
const localizeDevelopmentPlans = (items, language) => localizeRecords(items, language, ['title', 'description', 'category']);
const localizeWorks = (items, language) => localizeRecords(items, language, ['name', 'description', 'location', 'scheme', 'category']);
const localizeAssets = (items, language) => localizeRecords(items, language, ['name', 'location', 'notes', 'ownerDepartment', 'category', 'subCategory']);

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  stripLanguageMarker,
  translateText,
  localizeAnnouncements,
  localizeServices,
  localizeMeetings,
  localizeVillages,
  localizeDevelopmentPlans,
  localizeWorks,
  localizeAssets,
};
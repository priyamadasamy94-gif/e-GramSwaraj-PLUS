// Helpers that turn safe, whitelisted query-string params into database filters.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parsePagination(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

function parseSort(sortParam, allowed, fallback = '-createdAt') {
  const s = String(sortParam || fallback);
  const field = s.replace(/^-/, '');
  if (!allowed.includes(field)) return fallback;
  return s;
}

/**
 * Build a database filter from query params.
 * opts = { searchFields: [], filterFields: [], dateField: 'createdAt' }
 */
function buildFilter(q, opts = {}) {
  const filter = {};
  const { searchFields = [], filterFields = [], dateField } = opts;

  for (const f of filterFields) {
    const v = q[f];
    if (v === undefined || v === '' || v === 'ALL') continue;
    if (typeof v !== 'string') continue; // blocks {$gt:...} style injection
    if (f === 'location') {
      filter[f] = { $regex: escapeRegex(v.trim()), $options: 'i' };
    } else if (v.includes(',')) {
      filter[f] = { $in: v.split(',').map((x) => x.trim()) };
    } else {
      filter[f] = v;
    }
  }

  if (q.search && typeof q.search === 'string' && searchFields.length) {
    const rx = new RegExp(escapeRegex(q.search.trim().slice(0, 100)), 'i');
    filter.$or = searchFields.map((f) => ({ [f]: rx }));
  }

  if (dateField && (q.from || q.to)) {
    filter[dateField] = {};
    const from = q.from ? new Date(q.from) : null;
    const to = q.to ? new Date(q.to) : null;
    if (from && !isNaN(from)) filter[dateField].$gte = from;
    if (to && !isNaN(to)) { to.setHours(23, 59, 59, 999); filter[dateField].$lte = to; }
    if (!Object.keys(filter[dateField]).length) delete filter[dateField];
  }
  return filter;
}

/** Indian financial year label for a date, e.g. 2026-05-10 -> "2026-27" */
function financialYearOf(date = new Date()) {
  const d = new Date(date);
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

module.exports = { escapeRegex, parsePagination, parseSort, buildFilter, financialYearOf, pick };

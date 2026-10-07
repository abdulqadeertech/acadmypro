import { one } from './db.js';

export function makeNumber(prefix = 'AP') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

// Configurable grading from database
export function gradeFor(percent) {
  try {
    const rule = one(
      'SELECT grade FROM grade_rules WHERE ? >= min_percent AND ? <= max_percent ORDER BY min_percent DESC LIMIT 1',
      [percent, percent]
    );
    if (rule) return rule.grade;
  } catch {}
  // Fallback
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';
  return 'F';
}

export function gpaFor(percent) {
  try {
    const rule = one(
      'SELECT gpa FROM grade_rules WHERE ? >= min_percent AND ? <= max_percent ORDER BY min_percent DESC LIMIT 1',
      [percent, percent]
    );
    if (rule) return rule.gpa;
  } catch {}
  return 0;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function now() {
  return new Date().toISOString();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function paginate(queryStr, params, page = 1, limit = 50) {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  return { query: `${queryStr} LIMIT ? OFFSET ?`, params: [...params, Number(limit), offset] };
}

export function parseQuery(req) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const search = req.query.search || '';
  const sort = req.query.sort || 'id DESC';
  const from = req.query.from || '';
  const to = req.query.to || '';
  return { page, limit, search, sort, from, to };
}

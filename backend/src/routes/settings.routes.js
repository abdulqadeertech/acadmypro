import { Router } from 'express';
import { query, one, run } from '../db.js';
import { allowRoles, requirePermission, auditLog } from '../auth.js';

const router = Router();

// ===== SPECIFIC GET ROUTES (must be declared BEFORE /:category) =====

// Grade rules
router.get('/grades/rules', requirePermission('settings.view'), (req, res) => {
  const rules = query('SELECT * FROM grade_rules ORDER BY min_percent DESC');
  res.json(rules);
});

// Expense categories
router.get('/expense-categories', requirePermission('settings.view'), (req, res) => {
  res.json(query('SELECT * FROM expense_categories WHERE status="active" ORDER BY name'));
});

// Get all settings
router.get('/', requirePermission('settings.view'), (req, res) => {
  const settings = query('SELECT * FROM settings ORDER BY category, key');
  const grouped = {};
  for (const s of settings) {
    const cat = s.category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }
  res.json({ settings, grouped });
});

// Get settings by category (generic - keep LAST among GETs)
router.get('/:category', requirePermission('settings.view'), (req, res) => {
  const settings = query('SELECT * FROM settings WHERE category=? ORDER BY key', [req.params.category]);
  res.json(settings);
});

// ===== PUT ROUTES =====

// Batch update settings
router.put('/', requirePermission('settings.update'), (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object required' });
  }
  for (const [key, value] of Object.entries(settings)) {
    run(
      "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
      [key, String(value)]
    );
  }
  auditLog(req.user?.id, req.user?.name, 'SETTING_UPDATE', 'settings', null, 'Batch settings update');
  res.json({ message: 'Settings saved' });
});

// Grade rules
router.post('/grades/rules', requirePermission('settings.update'), (req, res) => {
  const { grade, min_percent, max_percent, gpa, description } = req.body;
  if (!grade || min_percent === undefined || max_percent === undefined) {
    return res.status(400).json({ message: 'Grade, min_percent, and max_percent required' });
  }
  run(
    'INSERT INTO grade_rules(grade,min_percent,max_percent,gpa,description) VALUES(?,?,?,?,?)',
    [grade, min_percent, max_percent, gpa || 0, description || null]
  );
  auditLog(req.user?.id, req.user?.name, 'GRADE_CREATE', 'grade_rules', null, `Grade rule "${grade}" created`);
  res.status(201).json({ message: 'Grade rule created' });
});

router.put('/grades/rules/:id', requirePermission('settings.update'), (req, res) => {
  const { grade, min_percent, max_percent, gpa, description } = req.body;
  run(
    'UPDATE grade_rules SET grade=?,min_percent=?,max_percent=?,gpa=?,description=? WHERE id=?',
    [grade, min_percent, max_percent, gpa || 0, description || null, req.params.id]
  );
  res.json({ message: 'Grade rule updated' });
});

router.delete('/grades/rules/:id', requirePermission('settings.update'), (req, res) => {
  run('DELETE FROM grade_rules WHERE id=?', [req.params.id]);
  res.json({ message: 'Grade rule deleted' });
});

router.post('/expense-categories', requirePermission('settings.update'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    run('INSERT INTO expense_categories(name) VALUES(?)', [name]);
    res.status(201).json({ message: 'Category created' });
  } catch (e) {
    res.status(400).json({ message: 'Category already exists' });
  }
});

// Update single setting (generic - keep LAST among PUTs)
router.put('/:key', requirePermission('settings.update'), (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ message: 'Value required' });
  run(
    "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
    [req.params.key, String(value)]
  );
  auditLog(req.user?.id, req.user?.name, 'SETTING_UPDATE', 'settings', null, `Setting "${req.params.key}" updated`);
  res.json({ message: 'Setting saved' });
});

export default router;

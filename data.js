// ============================================================
// data.js — จัดการข้อมูลผ่าน Google Sheets (JSONP, ไม่มี CORS)
// ============================================================

let _entriesCache = null;

async function getAllEntries() {
  if (_entriesCache !== null) return _entriesCache;
  const cfg = getConfig();
  if (!cfg.scriptUrl) return [];
  try {
    const data = await jsonp(cfg.scriptUrl + '?');
    if (data.success) {
      _entriesCache = (data.data || []).map(e => ({
        ...e,
        category: getCategoryIdByLabel(e.category) || e.category,
        date: normalizeDate(e.date)
      }));
      _entriesCache.sort((a, b) => b.id.localeCompare(a.id));
      return _entriesCache;
    }
  } catch (err) {
    console.warn('getAllEntries failed:', err.message);
  }
  return [];
}

function getCategoryIdByLabel(label) {
  for (const type of ['expense', 'income']) {
    const found = CATEGORIES[type].find(c => c.label === label);
    if (found) return found.id;
  }
  return null;
}

function normalizeDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

function clearCache() {
  _entriesCache = null;
}

async function addEntryData(entry) {
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  if (_entriesCache !== null) _entriesCache.unshift(entry);
  return entry;
}

async function deleteEntryData(id) {
  if (_entriesCache !== null) {
    _entriesCache = _entriesCache.filter(e => e.id !== id);
  }
}

async function getEntriesByMonth(year, month) {
  const entries = await getAllEntries();
  return entries.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

function calcStats(entries) {
  let income = 0, expense = 0;
  entries.forEach(e => {
    if (e.type === 'income') income += parseFloat(e.amount) || 0;
    else expense += parseFloat(e.amount) || 0;
  });
  return { income, expense, net: income - expense };
}

function groupByCategory(entries) {
  const map = {};
  entries.forEach(e => {
    if (!map[e.category]) map[e.category] = { count: 0, total: 0, type: e.type };
    map[e.category].count++;
    map[e.category].total += parseFloat(e.amount) || 0;
  });
  return Object.entries(map).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.total - a.total);
}

function fmt(n) {
  return '฿' + Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n) {
  if (n >= 1000000) return '฿' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '฿' + (n / 1000).toFixed(1) + 'K';
  return '฿' + Math.round(n);
}

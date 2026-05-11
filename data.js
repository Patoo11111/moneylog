// ============================================================
// data.js — จัดการข้อมูลผ่าน Google Sheets (ไม่ใช้ localStorage)
// ============================================================

let _entriesCache = null;

async function getAllEntries() {
  if (_entriesCache !== null) return _entriesCache;
  const cfg = getConfig();
  if (!cfg.scriptUrl) return [];
  try {
    const res = await fetch(cfg.scriptUrl, { method: 'GET' });
    const data = await res.json();
    if (data.success) {
      // แปลง category label กลับเป็น id
      _entriesCache = (data.data || []).map(e => ({
        ...e,
        category: getCategoryIdByLabel(e.category) || e.category,
        date: normalizeDate(e.date)
      }));
      // เรียงใหม่ล่าสุดก่อน
      _entriesCache.sort((a, b) => b.id.localeCompare(a.id));
      return _entriesCache;
    }
  } catch (err) {
    console.warn('fetchEntries failed:', err.message);
  }
  return [];
}

// แปลง category label → id เช่น "อาหาร & เครื่องดื่ม" → "food"
function getCategoryIdByLabel(label) {
  for (const type of ['expense', 'income']) {
    const found = CATEGORIES[type].find(c => c.label === label);
    if (found) return found.id;
  }
  return null;
}

// แปลงวันที่จาก Sheets ให้เป็น YYYY-MM-DD
function normalizeDate(raw) {
  if (!raw) return '';
  // ถ้าเป็น Date object string เช่น "Sun May 03 2026 00:00:00 GMT+0700"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return String(raw).slice(0, 10);
}

function clearCache() {
  _entriesCache = null;
}

async function addEntryData(entry) {
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  if (_entriesCache !== null) {
    _entriesCache.unshift(entry);
  }
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
  return Object.entries(map).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.total - a.total);
}

function fmt(n) {
  return '฿' + Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n) {
  if (n >= 1000000) return '฿' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '฿' + (n / 1000).toFixed(1) + 'K';
  return '฿' + Math.round(n);
}

// ============================================================
// data.js — จัดการข้อมูลผ่าน Google Sheets (ไม่ใช้ localStorage)
// ============================================================

// cache ข้อมูลใน memory ระหว่าง session
let _entriesCache = null;

async function getAllEntries() {
  if (_entriesCache !== null) return _entriesCache;
  return await fetchEntriesFromSheets();
}

async function fetchEntriesFromSheets() {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return [];
  try {
    const res = await fetch(cfg.scriptUrl, { method: 'GET' });
    const data = await res.json();
    if (data.success) {
      _entriesCache = data.data || [];
      return _entriesCache;
    }
  } catch (err) {
    console.warn('fetchEntries failed:', err.message);
  }
  return [];
}

function clearCache() {
  _entriesCache = null;
}

async function addEntryData(entry) {
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  // เพิ่มใน cache ก่อนทันที (optimistic update)
  if (_entriesCache !== null) {
    _entriesCache.unshift(entry);
  }
  return entry;
}

async function deleteEntryData(id) {
  // ลบจาก cache
  if (_entriesCache !== null) {
    _entriesCache = _entriesCache.filter(e => e.id !== id);
  }
  // ลบจาก Sheets
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const form = new FormData();
    form.append('action', 'deleteEntry');
    form.append('id', id);
    await fetch(cfg.scriptUrl, { method: 'POST', mode: 'no-cors', body: form });
  } catch (err) {
    console.warn('deleteEntry failed:', err.message);
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

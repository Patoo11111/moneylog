// ============================================================
// data.js — จัดการข้อมูลใน localStorage
// ============================================================

function getAllEntries() {
  try {
    return JSON.parse(localStorage.getItem('ml_entries') || '[]');
  } catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem('ml_entries', JSON.stringify(entries));
}

function addEntryData(entry) {
  const entries = getAllEntries();
  entry.id = Date.now().toString();
  entry.createdAt = new Date().toISOString();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

function deleteEntryData(id) {
  const entries = getAllEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

function getEntriesByMonth(year, month) {
  return getAllEntries().filter(e => {
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

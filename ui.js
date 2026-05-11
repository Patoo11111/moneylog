// ============================================================
// ui.js — ฟังก์ชัน UI ทั่วไป
// ============================================================

let currentPage = 'dashboard';

function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');
  currentPage = name;
  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
  if (name === 'report') renderReport();
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2500);
}

// ─── Entry type toggle ───
let currentType = 'expense';
function setType(type) {
  currentType = type;
  document.getElementById('btn-expense').className = 'toggle-btn' + (type === 'expense' ? ' active expense' : '');
  document.getElementById('btn-income').className = 'toggle-btn' + (type === 'income' ? ' active income' : '');
  populateCategorySelect('entry-category', type);
}

function populateCategorySelect(selectId, type) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">-- เลือกหมวดหมู่ --</option>';
  CATEGORIES[type].forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.icon + ' ' + c.label;
    sel.appendChild(o);
  });
}

function populateScanCategorySelect(type) {
  const sel = document.getElementById('scan-category');
  const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
  sel.innerHTML = '';
  allCats.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.icon + ' ' + c.label;
    sel.appendChild(o);
  });
}

// ─── Add entry from form ───
function addEntry() {
  const amount = parseFloat(document.getElementById('entry-amount').value);
  const category = document.getElementById('entry-category').value;
  const note = document.getElementById('entry-note').value.trim();
  const date = document.getElementById('entry-date').value;
  const time = document.getElementById('entry-time').value;

  if (!amount || amount <= 0) { showToast('กรุณากรอกจำนวนเงิน', 'error'); return; }
  if (!category) { showToast('กรุณาเลือกหมวดหมู่', 'error'); return; }
  if (!date) { showToast('กรุณาเลือกวันที่', 'error'); return; }

  const entry = { type: currentType, amount, category, note, date, time };
  const saved = addEntryData(entry);
  pushToSheets(saved);

  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  showToast('บันทึกรายการแล้ว ✅', 'success');
}

// ─── History filters ───
function applyFilters() {
  renderHistory();
}

function populateFilterCategory() {
  const sel = document.getElementById('filter-category');
  const cur = sel.value;
  sel.innerHTML = '<option value="">ทุกหมวด</option>';
  [...CATEGORIES.expense, ...CATEGORIES.income].forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.icon + ' ' + c.label;
    if (c.id === cur) o.selected = true;
    sel.appendChild(o);
  });
}

// ─── Dashboard ───
let currentDashMonth, currentDashYear;

function changeMonth(delta) {
  currentDashMonth += delta;
  if (currentDashMonth > 12) { currentDashMonth = 1; currentDashYear++; }
  if (currentDashMonth < 1) { currentDashMonth = 12; currentDashYear--; }
  renderDashboard();
}

function renderDashboard() {
  const label = new Date(currentDashYear, currentDashMonth - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
  document.getElementById('current-month-label').textContent = label;

  const entries = getEntriesByMonth(currentDashYear, currentDashMonth);
  const stats = calcStats(entries);

  document.getElementById('total-income').textContent = fmt(stats.income);
  document.getElementById('total-expense').textContent = fmt(stats.expense);
  document.getElementById('net-balance').textContent = fmt(stats.net);
  const inc = entries.filter(e => e.type === 'income');
  const exp = entries.filter(e => e.type === 'expense');
  document.getElementById('income-count').textContent = inc.length + ' รายการ';
  document.getElementById('expense-count').textContent = exp.length + ' รายการ';

  // Category bars
  const expEntries = entries.filter(e => e.type === 'expense');
  const cats = groupByCategory(expEntries);
  const maxAmt = cats.length ? cats[0].total : 1;
  const catEl = document.getElementById('category-chart');
  if (cats.length === 0) {
    catEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📂</div><p>ยังไม่มีรายการ</p></div>';
  } else {
    catEl.innerHTML = cats.slice(0, 6).map(c => {
      const info = getCategoryInfo(c.id);
      const pct = Math.round((c.total / maxAmt) * 100);
      return `<div class="cat-item">
        <div class="cat-row">
          <span class="cat-name">${info.icon} ${info.label}</span>
          <span class="cat-amount">${fmt(c.total)}</span>
        </div>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  // Recent
  const recentEl = document.getElementById('recent-list');
  const recent = entries.slice(0, 8);
  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>ยังไม่มีรายการเดือนนี้</p></div>';
  } else {
    recentEl.innerHTML = recent.map(e => entryRowHTML(e, true)).join('');
  }
}

function entryRowHTML(e, compact = false) {
  const info = getCategoryInfo(e.category);
  const d = new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const sign = e.type === 'income' ? '+' : '-';
  const del = compact ? '' : `<button class="entry-del" onclick="deleteEntry('${e.id}')">🗑️</button>`;
  return `<div class="entry-row">
    <div class="entry-left">
      <div class="entry-cat-icon ${e.type}">${info.icon}</div>
      <div>
        <div class="entry-note">${e.note || info.label}</div>
        <div class="entry-meta">${info.label} · ${d}</div>
      </div>
    </div>
    <span class="entry-amount ${e.type}">${sign}${fmt(e.amount)}</span>
    ${del}
  </div>`;
}

function deleteEntry(id) {
  if (!confirm('ลบรายการนี้?')) return;
  deleteEntryData(id);
  renderHistory();
  if (currentPage === 'dashboard') renderDashboard();
  showToast('ลบรายการแล้ว');
}

// ─── History ───
function renderHistory() {
  populateFilterCategory();
  const type = document.getElementById('filter-type').value;
  const cat = document.getElementById('filter-category').value;
  const month = document.getElementById('filter-month').value;

  let entries = getAllEntries();
  if (type) entries = entries.filter(e => e.type === type);
  if (cat) entries = entries.filter(e => e.category === cat);
  if (month) {
    const [y, m] = month.split('-').map(Number);
    entries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }

  const el = document.getElementById('history-list');
  if (entries.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>ไม่พบรายการ</p></div>';
  } else {
    el.innerHTML = entries.map(e => entryRowHTML(e, false)).join('');
  }
}

// ─── Export ───
function exportCSV() {
  const entries = getAllEntries();
  if (!entries.length) { showToast('ไม่มีข้อมูล', 'error'); return; }
  const header = 'วันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน\n';
  const rows = entries.map(e => {
    const info = getCategoryInfo(e.category);
    return [e.date, e.type === 'income' ? 'รายรับ' : 'รายจ่าย', info.label, e.note || '', e.amount].join(',');
  }).join('\n');
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'moneylog_export.csv'; a.click();
}

function exportJSON() {
  const entries = getAllEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'moneylog_export.json'; a.click();
}

function openGoogleSheet() {
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    showToast('กรุณาตั้งค่า Script URL ก่อน', 'error');
    return;
  }
  // เปิด Script URL — Apps Script จะ redirect ไป Sheet อัตโนมัติ
  window.open(cfg.scriptUrl, '_blank');
}

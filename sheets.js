// ============================================================
// sheets.js — ซิงค์ข้อมูลกับ Google Sheets ผ่าน Apps Script
// ============================================================

async function pushToSheets(entry) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const info = getCategoryInfo(entry.category);
    const form = new FormData();
    form.append('action', 'addEntry');
    form.append('id', entry.id || '');
    form.append('date', entry.date || '');
    form.append('time', entry.time || '');
    form.append('type', entry.type === 'income' ? 'รายรับ' : 'รายจ่าย');
    form.append('category', info.label || '');
    form.append('note', entry.note || '');
    form.append('amount', entry.amount || 0);
    form.append('createdAt', entry.createdAt || new Date().toISOString());
    await fetch(cfg.scriptUrl, { method: 'POST', mode: 'no-cors', body: form });
  } catch (err) {
    console.warn('pushToSheets failed:', err.message);
  }
}

async function deleteFromSheets(id) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const form = new FormData();
    form.append('action', 'deleteEntry');
    form.append('id', id);
    await fetch(cfg.scriptUrl, { method: 'POST', mode: 'no-cors', body: form });
  } catch (err) {
    console.warn('deleteFromSheets failed:', err.message);
  }
}

async function syncSheets() {
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    showToast('กรุณาตั้งค่า Script URL ก่อน', 'error');
    openConfig();
    return;
  }
  showToast('กำลังโหลดข้อมูล...');
  try {
    clearCache();
    const entries = await getAllEntries();
    // re-render ทุกหน้า
    renderDashboard();
    if (document.getElementById('page-history').classList.contains('active')) renderHistory();
    if (document.getElementById('page-report').classList.contains('active')) renderReport();
    showToast(`โหลดข้อมูล ${entries.length} รายการแล้ว ✅`, 'success');
  } catch (err) {
    showToast('โหลดข้อมูลล้มเหลว ❌', 'error');
  }
}

function openGoogleSheet() {
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    showToast('กรุณาตั้งค่า Script URL ก่อน', 'error');
    return;
  }
  window.open(cfg.scriptUrl, '_blank');
}

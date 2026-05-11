// ============================================================
// sheets.js — ซิงค์ข้อมูลกับ Google Sheets
// READ: fetch ปกติ (Apps Script รองรับ CORS อัตโนมัติ)
// WRITE/DELETE: GET + no-cors (ไม่ต้องการ response)
// ============================================================

async function pushToSheets(entry) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const info = getCategoryInfo(entry.category);
    const params = new URLSearchParams({
      action:    'addEntry',
      id:        entry.id || '',
      date:      entry.date || '',
      time:      entry.time || '',
      type:      entry.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      category:  info.label || '',
      note:      entry.note || '',
      amount:    String(entry.amount || 0),
      createdAt: entry.createdAt || new Date().toISOString()
    });
    // no-cors GET — ไม่ต้องการ response แค่ให้ Sheets บันทึก
    fetch(cfg.scriptUrl + '?' + params.toString(), {
      method: 'GET',
      mode: 'no-cors'
    });
  } catch (err) {
    console.warn('pushToSheets failed:', err.message);
  }
}

async function deleteFromSheets(id) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const params = new URLSearchParams({ action: 'deleteEntry', id });
    fetch(cfg.scriptUrl + '?' + params.toString(), {
      method: 'GET',
      mode: 'no-cors'
    });
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
    renderDashboard();
    if (document.getElementById('page-history').classList.contains('active')) renderHistory();
    if (document.getElementById('page-report').classList.contains('active')) renderReport();
    showToast(`โหลดข้อมูล ${entries.length} รายการแล้ว ✅`, 'success');
  } catch (err) {
    console.error(err);
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

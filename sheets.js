// ============================================================
// sheets.js — ซิงค์ข้อมูลกับ Google Sheets ผ่าน Apps Script
// ============================================================

async function pushToSheets(entry) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const info = getCategoryInfo(entry.category);

    // ใช้ FormData แทน JSON เพราะ no-cors ส่ง JSON body ไม่ได้
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

    await fetch(cfg.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: form
    });
  } catch (err) {
    console.warn('Sheets sync failed:', err.message);
  }
}

async function syncSheets() {
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    showToast('กรุณาตั้งค่า Script URL ก่อน', 'error');
    openConfig();
    return;
  }
  showToast('กำลังซิงค์...');
  const entries = getAllEntries();
  let success = 0;
  for (const entry of entries) {
    try {
      await pushToSheets(entry);
      success++;
    } catch {}
  }
  showToast(`ซิงค์ ${success}/${entries.length} รายการแล้ว ✅`, 'success');
}

function openGoogleSheet() {
  // เปิด Google Sheet ผ่าน Script URL (redirect ไปที่ sheet)
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    showToast('กรุณาตั้งค่า Script URL ก่อน', 'error');
    return;
  }
  window.open(cfg.scriptUrl, '_blank');
}

// ============================================================
// sheets.js — ซิงค์ข้อมูลกับ Google Sheets ผ่าน Apps Script
// ============================================================

async function pushToSheets(entry) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return; // ไม่ sync ถ้าไม่มี URL

  try {
    const info = getCategoryInfo(entry.category);
    const payload = {
      action: 'addEntry',
      id: entry.id,
      date: entry.date,
      time: entry.time || '',
      type: entry.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      category: info.label,
      note: entry.note || '',
      amount: entry.amount,
      createdAt: entry.createdAt
    };

    await fetch(cfg.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    // no-cors จะไม่ได้รับ response body — แต่ข้อมูลส่งไปแล้ว
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

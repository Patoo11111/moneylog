// ============================================================
// sheets.js — ใช้ JSONP (ไม่มี CORS) สำหรับ read/write
// ============================================================

// ── JSONP: ดึงข้อมูลจาก Sheets ──
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = '_jsonp_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, 10000);

    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    script.onerror = () => { cleanup(); reject(new Error('JSONP error')); };
    script.src = url + '&callback=' + cbName;
    document.head.appendChild(script);
  });
}

// ── Image pixel: write โดยไม่ต้องการ response ──
function fireAndForget(url) {
  const img = new Image();
  img.src = url;
}

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
    fireAndForget(cfg.scriptUrl + '?' + params.toString());
  } catch (err) {
    console.warn('pushToSheets failed:', err.message);
  }
}

async function deleteFromSheets(id) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const params = new URLSearchParams({ action: 'deleteEntry', id });
    fireAndForget(cfg.scriptUrl + '?' + params.toString());
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
    showToast('โหลดข้อมูล ' + entries.length + ' รายการแล้ว ✅', 'success');
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลล้มเหลว: ' + err.message + ' ❌', 'error');
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

// ============================================================
// sheets.js — ใช้ JSONP ทั้ง read และ write (ไม่มี CORS)
// ============================================================

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = '_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 15000);

    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    script.onerror = () => { cleanup(); reject(new Error('script error')); };
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    document.head.appendChild(script);
  });
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
    await jsonp(cfg.scriptUrl + '?' + params.toString());
    console.log('pushToSheets success:', entry.id);
  } catch (err) {
    console.warn('pushToSheets failed:', err.message);
  }
}

async function deleteFromSheets(id) {
  const cfg = getConfig();
  if (!cfg.scriptUrl) return;
  try {
    const params = new URLSearchParams({ action: 'deleteEntry', id });
    await jsonp(cfg.scriptUrl + '?' + params.toString());
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

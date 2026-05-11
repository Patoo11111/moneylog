// ============================================================
// app.js — Init หลัก
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    document.getElementById('config-modal').classList.remove('hidden');
  } else {
    document.getElementById('config-modal').classList.add('hidden');
    document.getElementById('app').style.display = 'flex';
    initApp();
  }
});

async function initApp() {
  const now = new Date();
  currentDashYear = now.getFullYear();
  currentDashMonth = now.getMonth() + 1;
  reportYear = now.getFullYear();
  reportMonth = now.getMonth() + 1;

  const today = now.toISOString().slice(0, 10);
  const timeNow = now.toTimeString().slice(0, 5);
  document.getElementById('entry-date').value = today;
  document.getElementById('entry-time').value = timeNow;
  document.getElementById('filter-month').value = today.slice(0, 7);

  setType('expense');
  populateFilterCategory();

  // โหลดข้อมูลจาก Sheets ก่อนแสดงผล
  showToast('กำลังโหลดข้อมูล...');
  await getAllEntries();
  showToast('');

  renderDashboard();
  showPage('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));
}

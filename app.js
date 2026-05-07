// ============================================================
// app.js — Init หลัก
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const cfg = getConfig();

  if (!cfg.scriptUrl || !cfg.apiKey) {
    // Show config modal first time
    document.getElementById('config-modal').classList.remove('hidden');
  } else {
    document.getElementById('config-modal').classList.add('hidden');
    document.getElementById('app').style.display = 'flex';
    initApp();
  }
});

function initApp() {
  const now = new Date();

  // Init months
  currentDashYear = now.getFullYear();
  currentDashMonth = now.getMonth() + 1;
  reportYear = now.getFullYear();
  reportMonth = now.getMonth() + 1;

  // Set default date/time on add form
  const today = now.toISOString().slice(0, 10);
  const timeNow = now.toTimeString().slice(0, 5);
  document.getElementById('entry-date').value = today;
  document.getElementById('entry-time').value = timeNow;
  document.getElementById('filter-month').value = today.slice(0, 7);

  // Populate categories
  setType('expense');
  populateFilterCategory();

  // Render dashboard
  renderDashboard();
  showPage('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));
}

// ============================================================
// charts.js — กราฟรายงาน (ใช้ Canvas API โดยตรง)
// ============================================================

let reportMonth, reportYear;

function changeReportMonth(delta) {
  reportMonth += delta;
  if (reportMonth > 12) { reportMonth = 1; reportYear++; }
  if (reportMonth < 1) { reportMonth = 12; reportYear--; }
  renderReport();
}

function renderReport() {
  const label = new Date(reportYear, reportMonth - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
  document.getElementById('report-month-label').textContent = label;

  const entries = getEntriesByMonth(reportYear, reportMonth);
  const stats = calcStats(entries);

  document.getElementById('rpt-income').textContent = fmt(stats.income);
  document.getElementById('rpt-expense').textContent = fmt(stats.expense);
  document.getElementById('rpt-net').textContent = fmt(stats.net);

  renderPieChart(entries);
  renderBarChart(entries);
  renderSummaryTable(entries);
}

function renderPieChart(entries) {
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const expEntries = entries.filter(e => e.type === 'expense');
  const cats = groupByCategory(expEntries).slice(0, 7);

  if (cats.length === 0) {
    ctx.fillStyle = '#9B9A94';
    ctx.font = '14px Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ไม่มีข้อมูลรายจ่าย', w / 2, h / 2);
    return;
  }

  const colors = ['#1D9E75','#E24B4A','#BA7517','#185FA5','#7F77DD','#D85A30','#9B9A94'];
  const total = cats.reduce((s, c) => s + c.total, 0);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 30;
  let startAngle = -Math.PI / 2;

  cats.forEach((c, i) => {
    const slice = (c.total / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    if (slice > 0.2) {
      const midAngle = startAngle + slice / 2;
      const lx = cx + (r * 0.65) * Math.cos(midAngle);
      const ly = cy + (r * 0.65) * Math.sin(midAngle);
      const pct = Math.round((c.total / total) * 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', lx, ly);
    }

    startAngle += slice;
  });

  // Legend
  const legendX = 10, legendY = h - cats.length * 18 - 10;
  cats.forEach((c, i) => {
    const info = getCategoryInfo(c.id);
    const y = legendY + i * 18;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(legendX, y, 10, 10);
    ctx.fillStyle = '#5F5E5A';
    ctx.font = '11px Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(info.label, legendX + 14, y);
  });
}

function renderBarChart(entries) {
  const canvas = document.getElementById('bar-chart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const expEntries = entries.filter(e => e.type === 'expense');
  if (expEntries.length === 0) {
    ctx.fillStyle = '#9B9A94';
    ctx.font = '14px Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ไม่มีข้อมูลรายจ่าย', w / 2, h / 2);
    return;
  }

  // Group by day
  const dayMap = {};
  expEntries.forEach(e => {
    const d = new Date(e.date).getDate();
    dayMap[d] = (dayMap[d] || 0) + parseFloat(e.amount);
  });

  const days = Object.keys(dayMap).map(Number).sort((a, b) => a - b);
  const maxVal = Math.max(...days.map(d => dayMap[d]));

  const pad = { left: 55, right: 10, top: 20, bottom: 30 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = Math.min(chartW / days.length - 4, 28);

  // Grid lines
  ctx.strokeStyle = '#E8E6E0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    const val = (maxVal * i / 4);
    ctx.fillStyle = '#9B9A94'; ctx.font = '10px IBM Plex Mono, monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(fmtShort(val), pad.left - 6, y);
  }

  // Bars
  days.forEach((d, i) => {
    const val = dayMap[d];
    const barH = (val / maxVal) * chartH;
    const x = pad.left + (i / days.length) * chartW + (chartW / days.length - barW) / 2;
    const y = pad.top + chartH - barH;

    ctx.fillStyle = '#E24B4A';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#5F5E5A'; ctx.font = '10px Sarabun, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(d, x + barW / 2, pad.top + chartH + 6);
  });
}

function renderSummaryTable(entries) {
  const expEntries = entries.filter(e => e.type === 'expense');
  const cats = groupByCategory(expEntries);
  const total = cats.reduce((s, c) => s + c.total, 0) || 1;
  const tbody = document.querySelector('#summary-table tbody');
  if (cats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:1.5rem">ไม่มีข้อมูล</td></tr>';
    return;
  }
  tbody.innerHTML = cats.map(c => {
    const info = getCategoryInfo(c.id);
    const pct = ((c.total / total) * 100).toFixed(1);
    return `<tr>
      <td>${info.icon} ${info.label}</td>
      <td>${c.count}</td>
      <td>${fmt(c.total)}</td>
      <td>${pct}%</td>
    </tr>`;
  }).join('');
}

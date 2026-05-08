// ============================================================
// config.js — การตั้งค่าแอป
// ============================================================
const CATEGORIES = {
  expense: [
    { id: 'food', label: 'อาหาร & เครื่องดื่ม', icon: '🍜' },
    { id: 'transport', label: 'ค่าเดินทาง', icon: '🚗' },
    { id: 'shopping', label: 'ช้อปปิ้ง', icon: '🛍️' },
    { id: 'housing', label: 'ที่พัก & ค่าเช่า', icon: '🏠' },
    { id: 'utilities', label: 'ค่าสาธารณูปโภค', icon: '💡' },
    { id: 'health', label: 'สุขภาพ & ยา', icon: '💊' },
    { id: 'entertainment', label: 'ความบันเทิง', icon: '🎬' },
    { id: 'education', label: 'การศึกษา', icon: '📚' },
    { id: 'beauty', label: 'ความงาม', icon: '💄' },
    { id: 'pet', label: 'สัตว์เลี้ยง', icon: '🐾' },
    { id: 'insurance', label: 'ประกัน', icon: '🛡️' },
    { id: 'other_exp', label: 'อื่นๆ (รายจ่าย)', icon: '📦' },
  ],
  income: [
    { id: 'salary', label: 'เงินเดือน', icon: '💼' },
    { id: 'freelance', label: 'ฟรีแลนซ์', icon: '💻' },
    { id: 'investment', label: 'ลงทุน & ดอกเบี้ย', icon: '📈' },
    { id: 'bonus', label: 'โบนัส', icon: '🎁' },
    { id: 'rental', label: 'ค่าเช่า', icon: '🏢' },
    { id: 'transfer', label: 'รับโอนเงิน', icon: '💸' },
    { id: 'other_inc', label: 'อื่นๆ (รายรับ)', icon: '✨' },
  ]
};

function getConfig() {
  return {
    scriptUrl: localStorage.getItem('ml_script_url') || '',
    ocrKey: localStorage.getItem('ml_ocr_key') || '',
  };
}

function saveConfig() {
  const url = document.getElementById('cfg-script-url').value.trim();
  const ocrKey = document.getElementById('cfg-ocr-key').value.trim();
  if (!url) { showToast('กรุณากรอก Script URL', 'error'); return; }
  localStorage.setItem('ml_script_url', url);
  localStorage.setItem('ml_ocr_key', ocrKey);
  document.getElementById('config-modal').classList.add('hidden');
  document.getElementById('app').style.display = 'flex';
  showToast('บันทึกการตั้งค่าแล้ว ✅', 'success');
  initApp();
}

function openConfig() {
  const cfg = getConfig();
  document.getElementById('cfg-script-url').value = cfg.scriptUrl;
  document.getElementById('cfg-ocr-key').value = cfg.ocrKey || '';
  document.getElementById('config-modal').classList.remove('hidden');
}

function getCategoryInfo(id) {
  for (const type of ['expense', 'income']) {
    const found = CATEGORIES[type].find(c => c.id === id);
    if (found) return found;
  }
  return { id, label: id, icon: '📦' };
}

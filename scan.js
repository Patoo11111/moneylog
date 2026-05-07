// ============================================================
// scan.js — สแกนสลีปด้วย OCR.space (ฟรี 100%) + Smart Parser
// ============================================================
// OCR.space: ฟรี 500 req/วัน ต่อ IP, ไม่ต้องสมัคร
// key "helloworld" = demo key สำหรับทดสอบ
// สมัครฟรีที่ ocr.space เพื่อรับ key ที่ใช้ได้มากกว่า
// ============================================================

let currentFile = null;

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').style.borderColor = 'var(--green)';
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) loadPreview(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadPreview(file);
}

function loadPreview(file) {
  if (!file.type.startsWith('image/')) {
    showToast('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG)', 'error');
    return;
  }
  currentFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('preview-img').src = ev.target.result;
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('preview-section').style.display = 'block';
    document.getElementById('scan-result').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function scanImage() {
  if (!currentFile) { showToast('กรุณาเลือกไฟล์ก่อน', 'error'); return; }

  document.getElementById('scan-loading').style.display = 'block';
  document.getElementById('preview-section').style.display = 'none';
  document.getElementById('scan-result').style.display = 'none';

  try {
    const ocrText = await runOCR(currentFile);
    if (!ocrText || ocrText.trim().length < 3) {
      throw new Error('ไม่สามารถอ่านข้อความจากรูปได้ กรุณาใช้รูปที่ชัดเจนกว่านี้');
    }

    const result = parseReceiptText(ocrText);

    document.getElementById('scan-type').value = result.type;
    document.getElementById('scan-amount').value = result.amount || '';
    document.getElementById('scan-date').value = result.date;
    document.getElementById('scan-note').value = result.note;

    populateScanCategorySelect(result.type);
    setTimeout(() => {
      document.getElementById('scan-category').value = result.category;
    }, 50);

    document.getElementById('scan-loading').style.display = 'none';
    document.getElementById('scan-result').style.display = 'block';

    const c = result.confidence;
    const msg = c >= 80 ? 'วิเคราะห์สำเร็จ (' + c + '%)' :
                c >= 50 ? 'วิเคราะห์ได้บางส่วน (' + c + '%) กรุณาตรวจสอบ' :
                          'อ่านได้ไม่ชัดเจน กรุณากรอกข้อมูลเพิ่มเติม';
    showToast(msg, c >= 50 ? 'success' : '');

  } catch (err) {
    document.getElementById('scan-loading').style.display = 'none';
    document.getElementById('preview-section').style.display = 'block';
    showToast('❌ ' + err.message, 'error');
  }
}

async function runOCR(file) {
  const cfg = getConfig();
  const ocrKey = cfg.ocrKey || 'helloworld';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('apikey', ocrKey);
  formData.append('language', 'tha');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('isTable', 'true');
  formData.append('OCREngine', '2');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('OCR API ไม่ตอบสนอง ลองใหม่อีกครั้ง');

  const data = await response.json();
  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR ล้มเหลว');
  }

  return data.ParsedResults?.[0]?.ParsedText || '';
}

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const ft = text.toLowerCase();
  let confidence = 0;

  const amount = extractAmount(ft);
  if (amount) confidence += 50;

  const date = extractDate(ft);
  if (date !== todayStr()) confidence += 20;

  const type = detectType(ft);
  confidence += 15;

  const category = detectCategory(ft, type);
  confidence += 15;

  const note = extractNote(lines, ft);

  return { amount, date, type, category, note, confidence: Math.min(confidence, 100) };
}

function extractAmount(ft) {
  const patterns = [
    /(?:จำนวนเงิน|ยอดโอน|ยอดรวม|total|amount|รวม(?:ทั้งสิ้น)?)[:\s]*([0-9,]+\.?[0-9]*)/i,
    /(?:thb|baht|บาท)\s*([0-9,]+\.?[0-9]*)/i,
    /([0-9,]+\.?[0-9]*)\s*(?:thb|baht|บาท)/i,
  ];
  for (const pat of patterns) {
    const m = ft.match(pat);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (n > 0 && n < 10000000) return n;
    }
  }
  // fallback: ตัวเลขทศนิยม 2 หลักที่ใหญ่ที่สุด
  const nums = [...ft.matchAll(/([0-9,]+\.[0-9]{2})/g)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(n => n > 0 && n < 10000000);
  return nums.length ? Math.max(...nums) : null;
}

function extractDate(ft) {
  const thaiMonths = {'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,
    'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12};

  const tm = ft.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/);
  if (tm) {
    let y = parseInt(tm[3]);
    if (y > 2400) y -= 543;
    if (y < 100) y += 2000;
    const mo = thaiMonths[tm[2]] || 1;
    return y + '-' + String(mo).padStart(2,'0') + '-' + String(parseInt(tm[1])).padStart(2,'0');
  }

  const dm = ft.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dm) {
    let y = parseInt(dm[3]);
    if (y > 2400) y -= 543;
    if (y < 100) y += 2000;
    const mo = parseInt(dm[2]), d = parseInt(dm[1]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return y + '-' + String(mo).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    }
  }
  return todayStr();
}

function detectType(ft) {
  if (/รับโอน|received|โอนเงินเข้า|เงินเข้า|รับเงิน|income|deposit|credit/.test(ft)) return 'income';
  return 'expense';
}

function detectCategory(ft, type) {
  if (type === 'income') {
    if (/เงินเดือน|salary|payroll/.test(ft)) return 'salary';
    return 'transfer';
  }
  if (/ร้านอาหาร|restaurant|coffee|cafe|กาแฟ|ข้าว|อาหาร|food|ก๋วยเตี๋ยว|สุกี้|ชาบู|pizza|burger|bakery/.test(ft)) return 'food';
  if (/grab|bolt|แท็กซี่|taxi|bts|mrt|รถ|bus|train|fuel|น้ำมัน|parking|ที่จอด/.test(ft)) return 'transport';
  if (/7-eleven|seven|lotus|big c|makro|tesco|โลตัส|ห้าง|mall|shop|store|lazada|shopee/.test(ft)) return 'shopping';
  if (/ค่าเช่า|rent|condo|หอพัก|apartment/.test(ft)) return 'housing';
  if (/ไฟฟ้า|น้ำประปา|internet|โทรศัพท์|ค่าน้ำ|electricity|water|phone|true|ais|dtac/.test(ft)) return 'utilities';
  if (/โรงพยาบาล|hospital|clinic|คลินิก|ยา|pharmacy|แพทย์|doctor|dental/.test(ft)) return 'health';
  if (/netflix|spotify|cinema|โรงหนัง|game|concert/.test(ft)) return 'entertainment';
  if (/โรงเรียน|มหาวิทยาลัย|university|school|course|อบรม/.test(ft)) return 'education';
  if (/salon|สปา|spa|เสริมสวย|ความงาม|beauty/.test(ft)) return 'beauty';
  if (/ประกัน|insurance|premium/.test(ft)) return 'insurance';
  return 'other_exp';
}

function extractNote(lines, ft) {
  const m = ft.match(/(?:ร้าน|to:|ผู้รับ|merchant|บริษัท)\s*([^\n\r]{3,30})/i);
  if (m) return m[1].trim().slice(0, 50);
  const first = lines.find(l => l.length >= 4 && l.length <= 40 && !/^\d+$/.test(l));
  return first ? first.slice(0, 50) : 'จากสลีป/บิล';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function saveScanEntry() {
  const amount = parseFloat(document.getElementById('scan-amount').value);
  const category = document.getElementById('scan-category').value;
  const note = document.getElementById('scan-note').value;
  const date = document.getElementById('scan-date').value;
  const type = document.getElementById('scan-type').value;

  if (!amount || amount <= 0) { showToast('กรุณากรอกจำนวนเงิน', 'error'); return; }
  if (!category) { showToast('กรุณาเลือกหมวดหมู่', 'error'); return; }

  const entry = { type, amount, category, note, date, time: '' };
  const saved = addEntryData(entry);
  pushToSheets(saved);

  document.getElementById('drop-zone').style.display = 'block';
  document.getElementById('preview-section').style.display = 'none';
  document.getElementById('scan-result').style.display = 'none';
  document.getElementById('scan-loading').style.display = 'none';
  document.getElementById('file-input').value = '';
  currentFile = null;

  showToast('บันทึกรายการจากสลีปแล้ว ✅', 'success');
}

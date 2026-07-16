# set up google sheet(database)

google sheet>>ส่วนขยาย>>apps script
วาง code
```
/**
 * Google Apps Script — MoneyLog Backend (v5)
 * ส่ง CORS header เพื่อให้ fetch จาก browser ทำงานได้
 */

const SHEET_NAME = 'รายการ';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['ID', 'วันที่', 'เวลา', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน', 'บันทึกเมื่อ'];
    sheet.appendRow(headers);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#1E293B');
    hr.setFontColor('#FFFFFF');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 80);
    sheet.setColumnWidth(5, 140);
    sheet.setColumnWidth(6, 220);
    sheet.setColumnWidth(7, 120);
    sheet.setColumnWidth(8, 160);
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action || '';
  let result;

  try {
    if (!action) {
      // ดึงข้อมูลทั้งหมด
      const sheet = getSheet();
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) {
        result = { success: true, data: [] };
      } else {
        const entries = rows.slice(1).map(row => ({
          id:        String(row[0] || ''),
          date:      formatDate(row[1]),
          time:      String(row[2] || ''),
          type:      row[3] === 'รายรับ' ? 'income' : 'expense',
          category:  String(row[4] || ''),
          note:      String(row[5] || ''),
          amount:    parseFloat(row[6]) || 0,
          createdAt: String(row[7] || '')
        })).filter(en => en.id);
        result = { success: true, data: entries };
      }
    }

    else if (action === 'addEntry') {
      const p = e.parameter;
      const sheet = getSheet();
      const ids = sheet.getDataRange().getValues().slice(1).map(r => String(r[0]));
      if (p.id && !ids.includes(p.id)) {
        sheet.appendRow([
          p.id, p.date || '', p.time || '', p.type || '',
          p.category || '', p.note || '',
          parseFloat(p.amount) || 0,
          p.createdAt || new Date().toISOString()
        ]);
      }
      result = { success: true };
    }

    else if (action === 'deleteEntry') {
      const sheet = getSheet();
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]) === String(e.parameter.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      result = { success: true };
    }

    else {
      result = { success: false, error: 'Unknown action' };
    }

  } catch (err) {
    result = { success: false, error: err.message };
  }

  // รองรับ JSONP callback
  const cb = e.parameter.callback;
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return doGet(e);
}    

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
```
  return String(val).slice(0, 10);
}



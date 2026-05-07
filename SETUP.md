# 📖 Setup Guide — MoneyLog

## ขั้นตอนการติดตั้ง

### 1. สร้าง Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
2. Copy **Sheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
   ```

---

### 2. ตั้งค่า Google Apps Script

1. ไปที่ [Google Apps Script](https://script.google.com) → **New Project**
2. ลบโค้ดเดิม แล้ววางเนื้อหาจากไฟล์ `google-apps-script.js`
3. แก้ไข `SHEET_ID` ให้ตรงกับ Sheet ของคุณ:
   ```javascript
   const SHEET_ID = 'YOUR_SHEET_ID_HERE';
   ```
4. กด **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. กด **Deploy** → Copy **Deployment URL**

---

### 3. OCR Key (ฟรี 100%)

**ใช้ได้เลยโดยไม่ต้องสมัคร:**
- ใน field "OCR.space API Key" ให้พิมพ์ `helloworld`
- รองรับ 500 requests/วัน ต่อ IP

**ต้องการใช้มากกว่านั้น (ยังฟรีอยู่):**
1. สมัครที่ [ocr.space/ocrapi](https://ocr.space/ocrapi) — ฟรี ไม่ต้องใส่บัตรเครดิต
2. รับ API Key ส่วนตัว
3. ใส่ key ใน config แทน `helloworld`

---

### 4. Deploy บน GitHub Pages

```bash
# 1. สร้าง repository ใหม่บน GitHub

# 2. Push โค้ด
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# 3. เปิด GitHub Pages
# Settings → Pages → Source: Deploy from branch → main → / (root) → Save
```

เว็บจะพร้อมใช้งานที่: `https://USERNAME.github.io/REPO`

---

### 5. เปิดแอปและตั้งค่า

1. เปิดเว็บ
2. กรอกข้อมูลใน modal ตั้งค่า:
   - **Google Apps Script URL**: URL จากขั้นตอน 2
   - **Anthropic API Key**: Key จากขั้นตอน 3
   - **Sheet ID**: ID จากขั้นตอน 1
3. กด **บันทึกและเริ่มใช้งาน**

---

## โครงสร้างไฟล์

```
expense-tracker/
├── index.html              # หน้าหลัก
├── css/
│   └── style.css           # สไตล์ทั้งหมด
├── js/
│   ├── config.js           # ตั้งค่า + หมวดหมู่
│   ├── data.js             # จัดการข้อมูล localStorage
│   ├── ui.js               # UI ทั่วไป
│   ├── scan.js             # สแกนสลีปด้วย AI
│   ├── sheets.js           # ซิงค์ Google Sheets
│   ├── charts.js           # กราฟรายงาน
│   └── app.js              # Init หลัก
├── google-apps-script.js   # โค้ดสำหรับ Apps Script
└── SETUP.md                # คู่มือนี้
```

## คุณสมบัติ

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 📊 ภาพรวม | สรุปรายรับ-รายจ่าย พร้อมกราฟหมวดหมู่ |
| ➕ เพิ่มรายการ | กรอกข้อมูลเองพร้อมเลือกหมวดหมู่ |
| 📷 สแกนสลีป | OCR.space (ฟรี) อ่านข้อความ + Smart Parser วิเคราะห์อัตโนมัติ |
| 📋 ประวัติ | กรอง/ค้นหาตาม ประเภท หมวด เดือน |
| 📈 รายงาน | Pie chart + Bar chart + ตารางสรุป |
| 📥 Export | ดาวน์โหลด CSV หรือ JSON |
| ☁️ Google Sheets | ซิงค์ข้อมูลอัตโนมัติทุกครั้งที่บันทึก |

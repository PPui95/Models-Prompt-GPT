# ย้ายเว็บ เฮงเฮงเฮง ดวงจีน จาก Netlify ไป Cloudflare Pages

โค้ดฟังก์ชันชำระเงินเวอร์ชัน Cloudflare อยู่ที่ `functions/api/checkout.js`, `functions/api/verify.js`, `functions/_lib/shared.js`
(ทดสอบด้วย `node tools/pages-test.mjs` ผ่าน 20/20 โดยจำลอง Stripe ยังไม่ได้ทดสอบบน Cloudflare จริง)
ไฟล์ Netlify เดิมยังอยู่ครบ ใช้ย้อนกลับได้ทุกเมื่อ

หมายเหตุ: ใช้ `TOKEN_SECRET` ค่าเดิม เพื่อให้สิทธิ์ที่ลูกค้าซื้อไปแล้วยังใช้ได้ (รูปแบบโทเคนเหมือนกันทั้งสองโฮสต์ ทดสอบแล้ว)

## ขั้นตอน
1. Cloudflare Dashboard > **Workers & Pages** > **Create** > แท็บ **Pages** > **Connect to Git**
2. เลือก GitHub โปรเจกต์ `Models-Prompt-GPT` และ **Production branch** = `ccr-7dc38352-fhv9p4`
3. Build settings
   - Framework preset: **None**
   - Build command: เว้นว่าง
   - Build output directory: `site`
   - (โฟลเดอร์ `functions/` ที่รากโปรเจกต์ Cloudflare อ่านเป็นฟังก์ชันให้เอง)
4. **Environment variables** (Settings > Variables and Secrets) ใส่ทั้ง Production และ Preview
   | ชื่อ | ประเภท | ค่า |
   |---|---|---|
   | `PRICE_YEAR_THB` | Plaintext | 299 |
   | `PRICE_FULL_THB` | Plaintext | 690 |
   | `PRICE_PAIR_THB` | Plaintext | 990 |
   | `TOKEN_SECRET` | **Secret** | ค่าเดิมจาก Netlify |
   | `ADMIN_CODES` | **Secret** | รหัสผู้ดูแลเดิม |
   | `STRIPE_SECRET_KEY` | **Secret** | ใส่ตอน Stripe พร้อม |
5. กด Deploy แล้วทดสอบที่ `https://<ชื่อโปรเจกต์>.pages.dev`
   - หน้าแรก/ดูดวง/คู่สมพงษ์ เปิดได้
   - ใส่รหัสผู้ดูแลในช่องรหัส แล้วปลดล็อกได้
   - พิมพ์ลิงก์ผิดแล้วขึ้นหน้า 404 ของเรา
6. ย้ายโดเมน `heng.rungseesomboon.com`
   1. Cloudflare > DNS > **ลบ** record CNAME `heng` เดิมที่ชี้ไป Netlify
   2. Pages โปรเจกต์ > **Custom domains** > **Set up a custom domain** > `heng.rungseesomboon.com`
   3. Cloudflare สร้าง DNS ให้เอง รอ 5–15 นาทีจนสถานะ Active (เว็บอาจเข้าไม่ได้ช่วงสั้นๆ ระหว่างสลับ)
7. เปิด https://heng.rungseesomboon.com ตรวจอีกรอบ (หน้าต่างไม่ระบุตัวตน)
8. เก็บ Netlify ไว้สำรอง 1 สัปดาห์ แล้วค่อยลบโดเมนออกจาก Netlify หรือหยุดโปรเจกต์

## ย้อนกลับ (ถ้ามีปัญหา)
ลบ custom domain ออกจาก Pages แล้วเพิ่ม CNAME `heng` ชี้ `heng-heng-heng.netlify.app` (DNS only) กลับไป

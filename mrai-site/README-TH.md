# หน้าขาย E-book Mr.AI (ร่าง)

- ไฟล์: `index.html` ใช้ได้เลยเป็นหน้าเดียว ไม่ต้อง build
- ช่องสีเหลือง `[...]` คือข้อมูลที่ต้องเติม: ชื่อเล่ม, บทต่างๆ, ราคา, เงื่อนไขคืนเงิน, ช่องทางติดต่อ
- ลิงก์ LINE OA ใส่แล้ว: https://line.me/R/ti/p/@113fdrol
- เมื่อเติมครบ ให้ลบบรรทัด `<meta name="robots" content="noindex">` ออก
- ใช้ปุ่มสั่งซื้อทาง LINE ก่อน เมื่อมี Stripe แล้วเปลี่ยนเป็น Stripe Payment Link

## วิธีเอาขึ้นเว็บ (โปรเจกต์ Netlify แยกจากเว็บดูดวง)
1. Netlify > Add new project > Import from Git > เลือกโปรเจกต์เดิม
2. Base directory: `mrai-site` Publish directory: เว้นว่างหรือ `.` Build command: เว้นว่าง
3. Domain management > เพิ่ม `mrai.rungseesomboon.com` แล้วตั้ง CNAME ใน Cloudflare (DNS only) เหมือนที่ทำกับ `heng`

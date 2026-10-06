import os, re, shutil, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS=os.path.join(ROOT,'site','assets')
NAV=[("index","หน้าแรก"),("daily","ดวงรายวัน"),("chart","ผูกดวงฉบับเต็ม"),("match","คู่สมพงษ์"),("fengshui","ฮวงจุ้ย")]
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;900&family=Noto+Serif+Thai:wght@500;700&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap">\n<link rel="stylesheet" href="assets/style.css">'
def top(page):
    cur=' aria-current="page"'
    links="".join(f'<a href="{p}.html"{cur if p==page else ""}>{t}</a>' for p,t in NAV)
    return f'''<header class="top">
    <a class="brand" href="index.html"><span class="seal sm" aria-hidden="true"><span>八</span><span>字</span><span>命</span><span>理</span></span>เฮงเฮงเฮง ดวงจีน</a>
    <nav class="main" aria-label="เมนูหลัก">{links}</nav>
  </header>'''
FOOT='''<footer class="sitefoot">
    <nav aria-label="ลิงก์ท้ายเว็บ"><a href="index.html">หน้าแรก</a><a href="daily.html">ดวงรายวัน</a><a href="chart.html">ผูกดวงฉบับเต็ม</a><a href="match.html">คู่สมพงษ์</a><a href="fengshui.html">ฮวงจุ้ย</a><a href="privacy.html">ความเป็นส่วนตัวและการคืนเงิน</a><a href="#" data-consent-open hidden>ตั้งค่าคุกกี้</a></nav>
    <p>คำนวณตามปฏิทินสุริยคติจีน (ปีใหม่เริ่มที่ลี่ชุน ประมาณ 4 ก.พ.) วันเปลี่ยนสารทใช้ค่าประมาณ อาจคลาด ±1 วันสำหรับคนเกิดตรงรอยต่อ ใช้เพื่อความบันเทิงและเป็นแนวทางทบทวนตนเอง ไม่ใช่คำทำนายที่แน่นอน และไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล</p>
    <p>ติดต่อ: <a href="https://line.me/R/ti/p/@113fdrol" rel="noopener">LINE @113fdrol</a> · <a href="https://www.facebook.com/profile.php?id=61594946229100" rel="noopener">Facebook เพจ</a></p>
  </footer>'''
FORM='''<form id="f">
    <label for="nm">ชื่อ (ใส่ในรายงาน)<input type="text" id="nm" maxlength="40" placeholder="เช่น คุณมาลี"></label>
    <label for="sex">เพศ<select id="sex"><option value="">เลือกเพศ</option><option value="f">หญิง</option><option value="m">ชาย</option></select></label>
    <fieldset class="dsel"><legend>วันเกิด (วัน / เดือน / ปี พ.ศ.)</legend><div class="dsel-row"><select id="bd-d" aria-label="วันที่เกิด"></select><select id="bd-m" aria-label="เดือนเกิด"></select><select id="bd-y" aria-label="ปีเกิด พ.ศ."></select></div></fieldset>
    <label for="bh">เวลาเกิด (ยามจีน)<select id="bh"></select></label>
    <button class="go" type="submit">{btn}</button>
  </form>
'''
def page(name,title,desc,body):
    return f'''<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
{FONTS}
</head>
<body data-page="{name}">
<div class="wrap">
  {top(name)}
{body}
  {FOOT}
</div>
<script src="assets/core.js"></script>
</body>
</html>
'''
PAGES={}
PAGES['index']=('เฮงเฮงเฮง ดวงจีน','ดูดวงจีนแปดอักษร (ปาจื้อ) ดวงรายวัน คู่สมพงษ์ และฮวงจุ้ยเลขกัว อ่านโดยผู้ศึกษาจิตวิทยาการปรึกษา','''  <section class="hero">
    <span class="kicker">ดวงจีนเชิงจิตวิทยา</span>
    <h1>รู้จักตัวเองผ่านดวงจีน 8 อักษร แล้ววางแผนชีวิตให้เข้ากับจังหวะของคุณ</h1>
    <p>ใส่วันเดือนปีและเวลาเกิด ดูธาตุประจำตัว ดวงรายวัน คู่สมพงษ์ และทิศมงคลได้ฟรี คำทำนายเขียนแบบให้ทางออก ไม่ขู่ให้กลัว</p>
    <div class="cta-row"><a class="go" href="daily.html">ดูดวงวันนี้ฟรี</a><a class="ghost" href="chart.html">ผูกดวงของฉัน</a></div>
  </section>
  <div class="feature-grid">
    <div class="card"><span class="kicker">ฟรีทุกวัน</span><h3><a href="daily.html">ดวงรายวัน</a></h3><p>ดวงวันนี้ พรุ่งนี้ และ 7 วันข้างหน้า แยกงาน เงิน ความรัก สุขภาพ พร้อมสีมงคลและช่วงเวลาดี เปลี่ยนทุกวันตามเสาวันจีน</p></div>
    <div class="card"><span class="kicker">ฟรี + ฉบับเต็ม</span><h3><a href="chart.html">ผูกดวงฉบับเต็ม</a></h3><p>สี่เสา เจ้าชะตา สมดุลห้าธาตุ ดาวพิเศษ วังคู่ครอง วัยจร 10 ปี ดวงปีและรายเดือน การเงินและอาชีพ พร้อมรายงาน PDF</p></div>
    <div class="card"><span class="kicker">ฟรี + ฉบับเต็ม</span><h3><a href="match.html">คู่สมพงษ์</a></h3><p>ดูว่าคู่นี้เหมาะเป็นคู่รัก หุ้นส่วนธุรกิจ ทีมงาน หัวหน้า–ลูกน้อง เพื่อน หรือครอบครัว และใครนำ ใครตาม</p></div>
    <div class="card"><span class="kicker">ฟรี + ฉบับเต็ม</span><h3><a href="fengshui.html">ฮวงจุ้ยเลขกัว</a></h3><p>ทิศดี 4 ทิศของคุณ วิธีหันโต๊ะทำงานและหัวเตียง และทิศพลังงานประจำปีนี้และปีหน้า</p></div>
  </div>
  <div class="grid2">
    <div class="card">
      <h2>เลือกแพ็กที่ใช่</h2>
      <div class="tblwrap"><table class="ptable">
        <thead><tr><th></th><th>แพ็กดวงปี<br><span class="price"><span data-cfg="priceYear"></span> บาท</span></th><th>แพ็กชีวิตฉบับสมบูรณ์<br><span class="price"><span data-cfg="priceFull"></span> บาท</span></th></tr></thead>
        <tbody>
          <tr><td>พื้นดวงเชิงลึก ดาวพิเศษ วังคู่ครอง สุขภาพตามธาตุ</td><td>✓</td><td>✓</td></tr>
          <tr><td>ดวง 12 เดือนข้างหน้า นับจากวันที่ซื้อ ข้ามปีจีนให้อัตโนมัติ</td><td>✓</td><td>✓</td></tr>
          <tr><td>ดวงปีตามนักษัตร ปีนี้และปีหน้า</td><td>✓</td><td>✓</td></tr>
          <tr><td>วัยจร 10 ปีทุกทศวรรษ</td><td>–</td><td>✓</td></tr>
          <tr><td>การเงิน อาชีพ และแผนการเงินตามช่วงวัย</td><td>–</td><td>✓</td></tr>
          <tr><td>ฮวงจุ้ยเลขกัวแบบละเอียด และทิศประจำปี</td><td>–</td><td>✓</td></tr>
          <tr><td>คู่สมพงษ์แบบละเอียด 6 ประเภทความสัมพันธ์</td><td>–</td><td>✓</td></tr>
          <tr><td>บันทึกรายงานเป็น PDF</td><td>✓</td><td>✓</td></tr>
        </tbody>
      </table></div>
      <p class="note">ซื้อแพ็กดวงปีไปแล้ว อัปเกรดเป็นฉบับสมบูรณ์ได้โดยจ่ายเฉพาะส่วนต่าง</p>
      <p class="note"><b>แพ็กคู่ <span data-cfg="pricePair"></span> บาท</b>: รายงานฉบับเต็มของ <u>2 คน</u> พร้อมวิเคราะห์คู่สมพงษ์ละเอียด (ซื้อแยกคนละฉบับ <span data-cfg="priceFullX2"></span> บาท) เหมาะกับคู่รัก พ่อแม่ลูก หรือซื้อเป็นของขวัญ ซื้อได้ที่<a href="match.html">หน้าคู่สมพงษ์</a><br>ถ้าซื้อฉบับเต็มของคุณคนเดียว ก็ดูวิเคราะห์คู่สมพงษ์ละเอียดกับใครก็ได้อยู่แล้ว แพ็กคู่เพิ่ม "รายงานฉบับเต็มของอีกคน" ให้</p>
      <div class="cta-row"><a class="go" href="chart.html">เริ่มผูกดวง</a></div>
    </div>
    <div class="card">
      <h2>ทำไมต่างจากเว็บดูดวงทั่วไป</h2>
      <ul class="list"><li><b>อ่านดวงด้วยมุมจิตวิทยา</b> เน้นความเข้าใจตัวเองและทางออกที่ทำได้จริง</li><li><b>คำนวณตามตำราปาจื้อ</b> ใช้ปฏิทินสุริยคติจีน ไม่ได้ดูแค่ปีนักษัตร</li><li><b>ละเอียดเป็นรายเดือนและรายวัน</b> ไม่ใช่คำทำนายกว้างๆ ทั้งปี</li><li><b>ข้อมูลอยู่ในเครื่องของคุณ</b> วันเกิดไม่ถูกเก็บบนเซิร์ฟเวอร์</li></ul>
    </div>
  </div>
  <div class="card prose">
    <h2>คำถามที่พบบ่อย</h2>
    <h3>ดูดวงวันนี้กับเดือนหน้าต่างกันไหม</h3><p>ดวงพื้นฐาน นิสัย และวัยจร มาจากวันเกิด จึงไม่เปลี่ยน ส่วนดวงรายวันเปลี่ยนทุกวัน และดวงรายเดือนเปลี่ยนตามเดือนจีน ซึ่งเริ่มตามวันเปลี่ยนสารท ไม่ใช่วันที่ 1</p>
    <h3>ไม่รู้เวลาเกิด ดูได้ไหม</h3><p>ได้ ระบบจะอ่านจาก 3 เสา (ปี เดือน วัน) ข้อมูลส่วนใหญ่ยังครบ แต่จะไม่มีส่วนที่บอกเรื่องลูกและบั้นปลาย</p>
    <h3>ทำไมปีนักษัตรของฉันไม่ตรงกับที่เคยรู้</h3><p>ดวงจีนเริ่มปีใหม่ที่ลี่ชุน ประมาณ 4 กุมภาพันธ์ คนที่เกิดเดือนมกราคมถึงต้นกุมภาพันธ์จะนับเป็นปีนักษัตรก่อนหน้า</p>
    <h3>ซื้อตอนปลายปีจะคุ้มไหม</h3><p>คุ้มเท่ากันทุกเดือน เพราะดวง 12 เดือนนับจากวันที่ซื้อ ไม่ได้ผูกกับปีปฏิทิน และปีจีนเปลี่ยนที่ลี่ชุน ประมาณ 4 กุมภาพันธ์ ระบบจะแสดงดวงทั้งปีนี้และปีหน้าให้เองเมื่อ 12 เดือนคร่อมสองปี</p>
    <h3>จ่ายเงินอย่างไร</h3><p>จ่ายผ่าน PromptPay หรือบัตร บนหน้าชำระเงินที่ปลอดภัยของ Stripe จ่ายครั้งเดียวต่อวันเกิด ดูเงื่อนไขการคืนเงินได้ที่ <a href="privacy.html">หน้านโยบาย</a></p>
  </div>''')
PAGES['daily']=('ดวงรายวัน | เฮงเฮงเฮง ดวงจีน','ดวงวันนี้ พรุ่งนี้ และ 7 วันข้างหน้าตามดวงจีนแปดอักษรของคุณ พร้อมสีมงคลและช่วงเวลาดี','''  <div class="pagehead"><h1>ดวงรายวัน</h1><p>ดวงแต่ละวันคำนวณจากเสาวันจีนของวันนั้น เทียบกับเจ้าชะตาของคุณ จึงเปลี่ยนทุกวันและต่างกันในแต่ละคน</p></div>
  '''+FORM.replace('{btn}','ดูดวง')+'''
  <div class="card dpick">
    <label for="dayPick">ดูวันไหน<select id="dayPick"><option value="today">วันนี้</option><option value="tomorrow">พรุ่งนี้</option><option value="pick">เลือกวันเอง</option></select></label>
    <fieldset class="dsel" id="ddWrap" hidden><legend>วันที่ต้องการดู</legend><div class="dsel-row"><select id="dd-d" aria-label="วันที่"></select><select id="dd-m" aria-label="เดือน"></select><select id="dd-y" aria-label="ปี พ.ศ."></select></div></fieldset>
  </div>
  <span class="note" id="status"></span>
  <section class="panel" id="p-daily"></section>
  <div class="card"><h3>อยากรู้ลึกกว่านี้</h3><p>ดวงรายวันบอกจังหวะของแต่ละวัน ถ้าอยากรู้นิสัยเชิงลึก วัยจร 10 ปี และดวงทั้งปี ดูได้ในหน้าผูกดวงฉบับเต็ม</p><div class="cta-row"><a class="go" href="chart.html">ผูกดวงฉบับเต็ม</a></div></div>''')
PAGES['chart']=('ผูกดวงฉบับเต็ม | เฮงเฮงเฮง ดวงจีน','ผูกดวงสี่เสา (ปาจื้อ) ธาตุประจำตัว วัยจร 10 ปี ดวงปีและดวง 12 เดือนข้างหน้า การเงิน ฮวงจุ้ย และคู่สมพงษ์','''  <div class="pagehead"><h1>ผูกดวงฉบับเต็ม</h1><p>สี่เสาแปดอักษร (ปาจื้อ 八字) อ่านดวงเชิงลึก วัยจร 10 ปี ดวงปีและรายเดือน การเงิน ฮวงจุ้ย และคู่สมพงษ์ในรายงานเดียว</p></div>
  '''+FORM.replace('{btn}','ผูกดวง')+'''
  <div class="print-head" id="printHead"></div>
  <div class="pillars" id="pillars" aria-label="สี่เสาดวงชะตา"></div>
  <div class="toolbar"><span class="note" id="status"></span><button class="ghost" type="button" id="pdfBtn" hidden>บันทึกรายงาน PDF</button></div>
  <div class="tabs" role="tablist">
    <button role="tab" id="t-read" aria-selected="true" aria-controls="p-read">พื้นดวง</button>
    <button role="tab" id="t-luck" aria-selected="false" aria-controls="p-luck">วัยจร 10 ปี<span class="lk">●</span></button>
    <button role="tab" id="t-month" aria-selected="false" aria-controls="p-month">ดวงปี & 12 เดือน<span class="lk">●</span></button>
    <button role="tab" id="t-money" aria-selected="false" aria-controls="p-money">การเงิน & อาชีพ<span class="lk">●</span></button>
    <button role="tab" id="t-fs" aria-selected="false" aria-controls="p-fs">ฮวงจุ้ย<span class="lk">●</span></button>
    <button role="tab" id="t-match" aria-selected="false" aria-controls="p-match">คู่สมพงษ์</button>
  </div>
  <section class="panel" id="p-read" role="tabpanel" aria-labelledby="t-read"></section>
  <section class="panel" id="p-luck" role="tabpanel" aria-labelledby="t-luck" hidden></section>
  <section class="panel" id="p-month" role="tabpanel" aria-labelledby="t-month" hidden></section>
  <section class="panel" id="p-money" role="tabpanel" aria-labelledby="t-money" hidden></section>
  <section class="panel" id="p-fs" role="tabpanel" aria-labelledby="t-fs" hidden></section>
  <section class="panel" id="p-match" role="tabpanel" aria-labelledby="t-match" hidden>
    <form id="f2">
      <label for="nm2">ชื่ออีกฝ่าย (ไม่ใส่ก็ได้)<input type="text" id="nm2" maxlength="40" placeholder="เช่น คุณเอ"></label>
      <fieldset class="dsel"><legend>วันเกิดของอีกฝ่าย (วัน / เดือน / ปี พ.ศ.)</legend><div class="dsel-row"><select id="bd2-d" aria-label="วันที่เกิดของอีกฝ่าย"></select><select id="bd2-m" aria-label="เดือนเกิดของอีกฝ่าย"></select><select id="bd2-y" aria-label="ปีเกิดของอีกฝ่าย พ.ศ."></select></div></fieldset>
      <label for="sex2">เพศของอีกฝ่าย<select id="sex2"><option value="">เลือกเพศ</option><option value="f">หญิง</option><option value="m">ชาย</option></select></label>
      <label for="bh2">เวลาเกิดของอีกฝ่าย<select id="bh2"></select></label>
      <button class="go" type="submit">ดูคู่สมพงษ์</button>
    </form>
    <div id="matchOut" class="grid2"></div>
  </section>''')
PAGES['match']=('คู่สมพงษ์ | เฮงเฮงเฮง ดวงจีน','ดูคู่สมพงษ์ตามดวงจีน คู่นี้เหมาะเป็นคู่รัก หุ้นส่วนธุรกิจ ทีมงาน หัวหน้า–ลูกน้อง เพื่อน หรือครอบครัว','''  <div class="pagehead"><h1>คู่สมพงษ์</h1><p>ดูจากนักษัตรปีเกิด ธาตุเจ้าชะตา และวังคู่ครองของทั้งสองคน แล้วบอกว่าคู่นี้เหมาะกับความสัมพันธ์แบบไหน</p></div>
  <h2>ข้อมูลของคุณ</h2>
  '''+FORM.replace('{btn}','บันทึกข้อมูลของฉัน')+'''
  <span class="note" id="status"></span>
  <h2>ข้อมูลของอีกฝ่าย</h2>
  <form id="f2">
    <label for="nm2">ชื่ออีกฝ่าย (ไม่ใส่ก็ได้)<input type="text" id="nm2" maxlength="40" placeholder="เช่น คุณเอ"></label>
    <fieldset class="dsel"><legend>วันเกิดของอีกฝ่าย (วัน / เดือน / ปี พ.ศ.)</legend><div class="dsel-row"><select id="bd2-d" aria-label="วันที่เกิดของอีกฝ่าย"></select><select id="bd2-m" aria-label="เดือนเกิดของอีกฝ่าย"></select><select id="bd2-y" aria-label="ปีเกิดของอีกฝ่าย พ.ศ."></select></div></fieldset>
      <label for="sex2">เพศของอีกฝ่าย<select id="sex2"><option value="">เลือกเพศ</option><option value="f">หญิง</option><option value="m">ชาย</option></select></label>
      <label for="bh2">เวลาเกิดของอีกฝ่าย<select id="bh2"></select></label>
    <button class="go" type="submit">ดูคู่สมพงษ์</button>
  </form>
  <div id="matchOut" class="grid2"></div>''')
PAGES['fengshui']=('ฮวงจุ้ยเลขกัว | เฮงเฮงเฮง ดวงจีน','หาเลขกัวและทิศมงคล 4 ทิศของคุณ วิธีหันโต๊ะทำงานและหัวเตียง และทิศพลังงานประจำปี','''  <div class="pagehead"><h1>ฮวงจุ้ยเลขกัว</h1><p>เลขกัวคำนวณจากปีเกิดและเพศ บอกทิศที่พลังงานส่งเสริมคุณ 4 ทิศ และทิศที่ควรเลี่ยง 4 ทิศ</p></div>
  '''+FORM.replace('{btn}','หาทิศมงคล')+'''
  <span class="note" id="status"></span>
  <section class="panel" id="p-fs"></section>''')
PAGES['privacy']=('ความเป็นส่วนตัวและการคืนเงิน | เฮงเฮงเฮง ดวงจีน','นโยบายความเป็นส่วนตัว เงื่อนไขการคืนเงิน และข้อจำกัดความรับผิดชอบ','''  <div class="card prose">
    <h1>ความเป็นส่วนตัวและการคืนเงิน</h1>
    <p class="note">ฉบับร่างสำหรับปรับใช้ ควรให้ผู้เชี่ยวชาญกฎหมายตรวจก่อนใช้งานจริง</p>
    <h2>ข้อมูลที่เราใช้</h2>
    <ul class="list"><li><b>ชื่อ วันเดือนปีเกิด เวลาเกิด และเพศ</b> ใช้คำนวณดวงในเบราว์เซอร์ของคุณ และบันทึกไว้ในเครื่องของคุณเท่านั้น เพื่อไม่ต้องกรอกใหม่ทุกหน้า</li><li><b>เมื่อชำระเงิน</b> ระบบส่งวันเกิด ชั่วโมงเกิด และเพศไปกับรายการชำระเงิน เพื่อผูกสิทธิ์รายงานกับดวงนั้น ชื่อของคุณไม่ถูกส่ง</li><li><b>ข้อมูลการชำระเงิน</b> เช่น เลขบัตร ดำเนินการโดย Stripe เราไม่เห็นและไม่เก็บข้อมูลบัตร</li></ul>
    <h2>คุกกี้และการวัดผลโฆษณา</h2>
    <ul class="list"><li>เว็บนี้อาจใช้ Meta Pixel และ TikTok Pixel เพื่อวัดผลโฆษณา เช่น จำนวนคนที่เข้าเว็บ ดูดวง กดชำระเงิน และซื้อสำเร็จ พร้อมยอดเงิน</li><li>เครื่องมือเหล่านี้ทำงานหลังจากคุณกด “ยอมรับ” เท่านั้น ถ้ากด “ไม่ยอมรับ” เว็บยังใช้งานได้ครบทุกอย่าง</li><li>เราไม่ส่งชื่อ วันเกิด เวลาเกิด หรือคำทำนายของคุณไปให้ Meta หรือ TikTok</li><li>เปลี่ยนการตั้งค่าได้ทุกเมื่อจากลิงก์ “ตั้งค่าคุกกี้” ด้านล่างของทุกหน้า</li></ul>
    <h2>สิทธิ์ของคุณ</h2>
    <p>คุณลบข้อมูลในเครื่องได้ทุกเมื่อด้วยการล้างข้อมูลเว็บไซต์ในเบราว์เซอร์ หากต้องการให้ลบหรือขอดูข้อมูลการชำระเงินที่เกี่ยวกับคุณ ติดต่อ <b data-cfg="contact"></b></p>
    <h2>การคืนเงิน</h2>
    <ul class="list"><li>ขอคืนเงินได้ภายใน 7 วันหลังชำระ หากเปิดรายงานฉบับเต็มไม่ได้และเราแก้ไขให้ไม่ได้</li><li>หากกรอกวันเกิดผิด แจ้งเราเพื่อเปิดรายงานของวันเกิดที่ถูกต้องให้แทน</li><li>แพ็กดวงปีใช้ได้ 12 เดือนนับจากวันที่ชำระ (เปิดดูต่อได้อีก 1 เดือน) แพ็กชีวิตฉบับสมบูรณ์เปิดดูได้นาน 10 ปี และอัปเกรดจากแพ็กดวงปีได้โดยจ่ายส่วนต่าง</li><li>รายงานเป็นสินค้าดิจิทัลที่เปิดดูได้ทันที จึงไม่คืนเงินเพราะไม่พอใจคำทำนาย</li></ul>
    <h2>ข้อจำกัดความรับผิดชอบ</h2>
    <p>คำทำนายใช้เพื่อความบันเทิงและเป็นแนวทางทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการลงทุนเฉพาะบุคคล การตัดสินใจสำคัญควรพิจารณาข้อมูลจริงและปรึกษาผู้เชี่ยวชาญ</p>
  </div>''')

def build(out, preview):
    """Write every page into `out`. Site mode writes into site/ and leaves site/assets untouched.
    Preview mode (for the Claude artifact preview) also copies the assets and enables the preview code."""
    os.makedirs(os.path.join(out,'assets'),exist_ok=True)
    if preview:
        shutil.copy(os.path.join(ASSETS,'style.css'),os.path.join(out,'assets','style.css'))
        core=open(os.path.join(ASSETS,'core.js'),encoding='utf8').read().replace('previewCode:""','previewCode:"PUEY2026"')
        open(os.path.join(out,'assets','core.js'),'w',encoding='utf8').write(core)
    NF='''<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>ไม่พบหน้านี้ | เฮงเฮงเฮง ดวงจีน</title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<main style="max-width:560px;margin:0 auto;padding:96px 16px;text-align:center">
<h1 style="margin:0 0 12px">ไม่พบหน้านี้</h1>
<p>ลิงก์อาจพิมพ์ผิดหรือหน้านี้ถูกย้ายแล้ว ลองกลับไปที่หน้าแรกนะคะ</p>
<p style="margin-top:24px"><a class="btn" href="/">กลับหน้าแรก เฮงเฮงเฮง ดวงจีน</a></p>
</main>
</body>
</html>
'''
    open(os.path.join(out,'404.html'),'w',encoding='utf8').write(NF)
    for name,(title,desc,body) in PAGES.items():
        html=page(name,title,desc,body)
        if preview and name=='index':
            # artifact main page: content only, the preview adds its own document skeleton
            html=re.sub(r'<!DOCTYPE html>\s*<html lang="th">\s*<head>\s*<meta charset="UTF-8">\s*<meta name="viewport"[^>]*>\s*','',html)
            html=html.replace('</head>\n<body data-page="index">','<script>document.body.dataset.page="index"</script>').replace('</body>\n</html>\n','')
        open(os.path.join(out,name+'.html'),'w',encoding='utf8').write(html)

if __name__=='__main__':
    # python3 tools/build_site.py            -> regenerate pages in site/
    # python3 tools/build_site.py preview DIR -> full copy for the Claude artifact preview
    if len(sys.argv)>2 and sys.argv[1]=='preview': build(sys.argv[2],True); print('preview built',sys.argv[2])
    else: build(os.path.join(ROOT,'site'),False); print('site pages built')

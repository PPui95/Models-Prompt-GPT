import http from "node:http"; import fs from "node:fs"; import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url"; import path from "node:path";
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
Object.assign(process.env,{STRIPE_SECRET_KEY:"sk_test_x",TOKEN_SECRET:"s3cret",ADMIN_CODES:"PUEY-ADMIN-77",PRICE_YEAR_THB:"299",PRICE_FULL_THB:"690",URL:"http://localhost:8788"});
const sessions={}, created=[]; const realFetch=globalThis.fetch;
globalThis.fetch=async(url,opt={})=>{
  if(!String(url).startsWith("https://api.stripe.com/")) return realFetch(url,opt);
  if(opt.method==="POST"){const f=new URLSearchParams(opt.body.toString());const id="cs_test_"+created.length;
    const md={};for(const [k,v] of f) {const m=k.match(/^metadata\[(.+)\]$/); if(m) md[m[1]]=v;}
    const s={id,payment_status:"paid",metadata:md,created:Math.floor(Date.now()/1000),amount:+f.get("line_items[0][price_data][unit_amount]"),amount_total:+f.get("line_items[0][price_data][unit_amount]"),name:f.get("line_items[0][price_data][product_data][name]")};
    sessions[id]=s; created.push(s);
    return new Response(JSON.stringify({id,url:f.get("success_url").replace("{CHECKOUT_SESSION_ID}",id)}),{status:200});}
  const s=sessions[String(url).split("/").pop()];
  return new Response(JSON.stringify(s||{error:{message:"no"}}),{status:s?200:404});
};
const checkout=(await import(REPO+"/netlify/functions/checkout.mjs")).default;
const verify=(await import(REPO+"/netlify/functions/verify.mjs")).default;
const srv=http.createServer(async(req,res)=>{
  const u=new URL(req.url,"http://localhost:8788");
  if(u.pathname.startsWith("/api/")){let body="";for await(const c of req)body+=c;
    const out=await (u.pathname==="/api/checkout"?checkout:verify)(new Request(u,{method:req.method,headers:{"content-type":"application/json"},body:req.method==="POST"?body:undefined}));
    res.writeHead(out.status,{"content-type":"application/json"});res.end(await out.text());return;}
  const f=u.pathname==="/"?"/index.html":u.pathname, fp=REPO+"/site"+f;
  if(!fs.existsSync(fp)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":f.endsWith(".css")?"text/css":f.endsWith(".js")?"text/javascript":"text/html; charset=utf-8"});res.end(fs.readFileSync(fp));
});
await new Promise(r=>srv.listen(8788,r));
const {chromium}=(await import(execSync("npm root -g").toString().trim()+"/playwright/index.js")).default;
const b=await chromium.launch();
let pass=0, fail=0; const ok=(name,cond,extra="")=>{cond?pass++:fail++;console.log(`${cond?"PASS":"FAIL"}  ${name}${extra?"  | "+extra:""}`);};
const errs=[];
async function newPage(clock){const ctx=await b.newContext({viewport:{width:400,height:900}});const p=await ctx.newPage();
  if(clock) await p.clock.setFixedTime(new Date(clock));
  p.on("pageerror",e=>errs.push(e.message));return p;}
const paid=async p=>p.waitForFunction(()=>!location.search&&document.getElementById("status")?.textContent.includes("ชำระเงินสำเร็จ"));
async function pay(p,sel){await p.evaluate(()=>{document.getElementById("status").textContent="";});await p.click(sel);await paid(p);}
async function fill(p,y,m,d,sex,h){await p.selectOption("#bd-y",String(y));await p.selectOption("#bd-m",String(m));await p.selectOption("#bd-d",String(d));await p.selectOption("#sex",sex);await p.selectOption("#bh",h);await p.click("#f .go");}
const txt=async(p,sel)=>(await p.textContent(sel)).replace(/\s+/g," ");
const locks=async(p,sel)=>p.locator(sel+" .lock").count();

// ---------- A. free → year pack ----------
let p=await newPage("2026-10-01T10:00:00");
await p.goto("http://localhost:8788/chart.html"); await fill(p,1990,2,3,"m","9");
ok("free: read tab shows both pack buttons",await p.locator('#p-read .pay[data-tier="year"]').count()===1&&await p.locator('#p-read .pay[data-tier="full"]').count()===1);
ok("free: luck tab offers full pack only",await p.locator('#p-luck .pay[data-tier="full"]').count()===1&&await p.locator('#p-luck .pay[data-tier="year"]').count()===0);
await pay(p,'#p-read .pay[data-tier="year"]');
let s0=created.at(-1);
ok("year pack charges 299 THB",s0.amount===29900,`amount=${s0.amount} tier=${s0.metadata.tier}`);
ok("status shows year pack",(await txt(p,"#status")).includes("แพ็กดวงปี"));
ok("year pack unlocks deep reading",await locks(p,"#p-read")===0);
await p.click("#t-month");
ok("year pack unlocks 12-month tab",await locks(p,"#p-month")===0);
const yearCards=await p.locator("#p-month h2").allTextContents();
ok("12-month window spans two Chinese years (2569 + 2570)",yearCards.some(t=>t.includes("2569"))&&yearCards.some(t=>t.includes("2570")),yearCards.filter(t=>t.includes("ในปี")).join(" / "));
ok("monthly table has 12 rows, current month highlighted",await p.locator("#p-month tbody tr").count()===12&&await p.locator("#p-month tr.me").count()===1);
await p.click("#t-luck");
ok("luck tab offers upgrade for 391 THB",(await txt(p,'#p-luck .pay[data-tier="upgrade"]')).includes("391"));
ok("PDF button visible with year pack",await p.locator("#pdfBtn").isVisible());

// ---------- B. upgrade ----------
await pay(p,'#p-luck .pay[data-tier="upgrade"]');
let s1=created.at(-1);
ok("upgrade charges 391 THB and keeps purchase date",s1.amount===39100&&s1.metadata.tier==="full"&&Math.abs(+s1.metadata.p-s0.created*1000)<1000,`amount=${s1.amount} p=${s1.metadata.p}`);
ok("status shows full pack",(await txt(p,"#status")).includes("แพ็กชีวิตฉบับสมบูรณ์"));
for(const t of ["luck","money","fs","month"]){await p.click("#t-"+t);}
ok("full pack unlocks luck, money, feng shui",await locks(p,"#p-luck")+await locks(p,"#p-money")+await locks(p,"#p-fs")===0);
await p.click("#t-match"); await p.click("#f2 .go");
ok("full pack unlocks compatibility detail",await locks(p,"#matchOut")===0&&await p.locator("#matchOut .rtype").count()===6);
await p.click("#t-fs");
const fsTitles=await p.locator("#p-fs h3").allTextContents();
ok("feng shui shows annual stars for 2569 and 2570",fsTitles.some(t=>t.includes("ทิศพลังงานประจำปี")&&t.includes("2569"))&&fsTitles.some(t=>t.includes("ทิศพลังงานประจำปี")&&t.includes("2570")));

// ---------- C. server-side guards ----------
const call=async(fn,body)=>{const r=await fn(new Request("http://x/api",{method:"POST",body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
let r=await call(checkout,{key:"1990-02-03|09|m",tier:"upgrade",token:"forged.token"});
ok("upgrade with forged token rejected",r.status===400,JSON.stringify(r.data));
const yearTok=(await call(verify,{session_id:s0.id})).data.token;
r=await call(checkout,{key:"1991-01-01||f",tier:"upgrade",token:yearTok});
ok("upgrade token for another person rejected",r.status===400);
const fullTok=(await call(verify,{session_id:s1.id})).data.token;
r=await call(checkout,{key:"1990-02-03|09|m",tier:"upgrade",token:fullTok});
ok("upgrade from full token rejected",r.status===400);
r=await call(verify,{token:yearTok}); ok("year token verifies as year",r.status===200&&r.data.t==="year");
r=await call(verify,{token:"abc.def"}); ok("forged token rejected",r.status===401);

// ---------- D. direct full purchase for someone else ----------
await fill(p,1985,8,15,"f","10");
ok("different person is locked again",(await txt(p,"#status")).includes("ฉบับฟรี"));
await p.click("#t-luck"); await pay(p,'#p-luck .pay[data-tier="full"]');
ok("full pack charges 690 THB",created.at(-1).amount===69000);
ok("full pack bought directly unlocks month tab too",(await p.click("#t-month"),await locks(p,"#p-month"))===0);

// ---------- E. admin code ----------
let q=await newPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/chart.html"); await fill(q,1975,11,11,"f","");
await q.fill("#p-read .unlock input","puey-admin-77"); await q.click("#p-read .unlock button"); await q.waitForTimeout(400);
ok("admin code unlocks full pack",(await txt(q,"#status")).includes("แพ็กชีวิตฉบับสมบูรณ์ · โหมดผู้ดูแล"));

// ---------- F. old single-purchase format migrates to full ----------
const oldTok=(await call(verify,{session_id:s1.id})).data.token;
q=await newPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/chart.html");
await q.evaluate(t=>{localStorage.setItem("bazi_access",JSON.stringify({k:"1990-02-03|09|m",exp:Date.now()+1e10,token:t}));},oldTok);
await q.reload(); await q.waitForTimeout(500);
ok("old saved purchase migrates and reopens as full pack",(await txt(q,"#status")).includes("แพ็กชีวิตฉบับสมบูรณ์")&&(await q.evaluate(()=>getDate("bd")))==="1990-02-03");

// ---------- G. year pack after 12 months → renewal ----------
q=await newPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/chart.html");
await q.evaluate(()=>{localStorage.setItem("bazi_acc2",JSON.stringify([{k:"1990-02-03|09|m",t:"year",p:Date.now()-370*864e5,exp:Date.now()+20*864e5}]));});
await q.reload(); await q.waitForTimeout(300); await q.click("#t-month");
ok("expired 12-month window offers renewal (year pack only)",await q.locator('#p-month .pay[data-tier="year"]').count()===1&&await q.locator('#p-month .pay[data-tier="full"]').count()===0);

// ---------- H. automatic year switch at Lichun 2570 ----------
q=await newPage("2027-03-01T10:00:00");
await q.goto("http://localhost:8788/chart.html"); await fill(q,1985,8,15,"f","10");
const freeYear=await txt(q,"#p-read");
ok("after Lichun 2570 the free card shows the Goat year",freeYear.includes("丁未")&&freeYear.includes("2570"));
await q.goto("http://localhost:8788/daily.html"); await q.waitForTimeout(300);
ok("daily page on 1 Mar 2570 shows that date",(await txt(q,"#p-daily")).includes("1 มีนาคม 2570"));
q=await newPage("2027-01-20T10:00:00");
await q.goto("http://localhost:8788/chart.html"); await fill(q,1985,8,15,"f","10");
ok("before Lichun (20 Jan 2570) it is still the Horse year 2569",(await txt(q,"#p-read")).includes("丙午"));


// ---------- J. Pixel + cookie consent ----------
async function pixelPage(clock){const p2=await newPage(clock);
  await p2.route("**/assets/core.js",async r=>{const res=await r.fetch();const body=(await res.text()).replace('metaPixelId:""','metaPixelId:"111122223333444"').replace('tiktokPixelId:""','tiktokPixelId:"CTEST123"');await r.fulfill({response:res,body});});
  await p2.route(/connect\.facebook\.net|analytics\.tiktok\.com/,r=>r.abort());
  return p2;}
const tlog=async q=>q.evaluate(()=>JSON.parse(sessionStorage.getItem("bazi_tlog")||"[]"));
q=await newPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/chart.html"); await q.waitForTimeout(200);
ok("no pixel IDs: no banner, no cookie link",await q.locator("#consentBar").count()===0&&await q.locator("[data-consent-open]").isHidden());
q=await pixelPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/chart.html"); await q.waitForTimeout(300);
ok("with pixel IDs: banner shows on first visit",await q.locator("#consentBar").isVisible());
ok("nothing loads before consent",await q.evaluate(()=>typeof window.fbq==="undefined"&&typeof window.ttq==="undefined"));
await fill(q,1992,6,10,"f","8");
ok("no events tracked before consent",(await tlog(q)).length===0);
await q.click('[data-consent="yes"]');
const fbq0=await q.evaluate(()=>window.fbq.queue.map(a=>[a[0],a[1]]));
ok("after accept: Meta init + PageView queued",JSON.stringify(fbq0).includes('"init","111122223333444"')&&JSON.stringify(fbq0).includes('"track","PageView"'),JSON.stringify(fbq0));
ok("after accept: TikTok loaded + page",await q.evaluate(()=>Array.isArray(window.ttq)&&window.ttq.some(x=>x[0]==="page")));
await q.click("#f .go");
ok("reading fires ViewContent",(await tlog(q)).some(e=>e[0]==="ViewContent"));
await q.evaluate(()=>{document.getElementById("status").textContent="";});
await q.click('#p-read .pay[data-tier="year"]'); await q.waitForFunction(()=>!location.search&&document.getElementById("status")?.textContent.includes("ชำระเงินสำเร็จ"));
let L=await tlog(q);
ok("checkout fires InitiateCheckout 299",L.some(e=>e[0]==="InitiateCheckout"&&e[1]===299),JSON.stringify(L));
const pur=L.filter(e=>e[0]==="Purchase");
ok("purchase fires once with real amount and session id",pur.length===1&&pur[0][1]===299&&String(pur[0][2]).startsWith("cs_test_"),JSON.stringify(pur));
ok("Meta Purchase carries eventID for de-duplication",await q.evaluate(()=>window.fbq.queue.some(a=>a[1]==="Purchase"&&a[3]&&a[3].eventID)));
ok("TikTok uses CompletePayment",await q.evaluate(()=>window.ttq.some(a=>a[0]==="track"&&a[1]==="CompletePayment")));
await q.reload(); await q.waitForTimeout(400);
ok("reload does not repeat Purchase",(await tlog(q)).filter(e=>e[0]==="Purchase").length===1);
ok("consent remembered (no banner after reload)",await q.locator("#consentBar").count()===0);
q=await pixelPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/daily.html"); await q.waitForTimeout(300);
await q.click('[data-consent="no"]'); await q.reload(); await q.waitForTimeout(300);
ok("decline: no pixels, banner stays closed",await q.evaluate(()=>typeof window.fbq==="undefined")&&await q.locator("#consentBar").count()===0);
await q.click("[data-consent-open]");
ok("cookie settings link reopens banner",await q.locator("#consentBar").isVisible());



// ---------- K. pair pack ----------
q=await newPage("2026-10-01T10:00:00");
await q.goto("http://localhost:8788/match.html"); await fill(q,1988,3,3,"f","14");
await q.selectOption("#bd2-y","1986");await q.selectOption("#bd2-m","7");await q.selectOption("#bd2-d","20");await q.selectOption("#sex2","m");await q.selectOption("#bh2","6");
await q.fill("#nm2","คุณบี"); await q.click("#f2 .go");
ok("match page offers pair pack",await q.locator('#matchOut .pay[data-tier="pair"]').count()===1);
await q.evaluate(()=>{document.getElementById("status").textContent="";});
await q.click('#matchOut .pay[data-tier="pair"]'); await q.waitForFunction(()=>!location.search&&document.getElementById("status")?.textContent.includes("ชำระเงินสำเร็จ"));
const sp=created.at(-1);
ok("pair pack charges 990 THB with both birth keys",sp.amount===99000&&sp.metadata.tier==="pair"&&sp.metadata.key==="1988-03-03|14|f"&&sp.metadata.key2==="1986-07-20|06|m",JSON.stringify(sp.metadata));
ok("buyer gets full pack and compatibility detail",(await txt(q,"#status")).includes("แพ็กชีวิตฉบับสมบูรณ์")&&await q.locator("#matchOut .lock").count()===0);
ok("partner form restored after payment",(await q.evaluate(()=>getDate("bd2")))==="1986-07-20"&&await q.inputValue("#nm2")==="คุณบี"&&await q.inputValue("#sex2")==="m");
await q.goto("http://localhost:8788/chart.html"); await fill(q,1986,7,20,"m","6");
ok("partner's own report is unlocked too",(await txt(q,"#status")).includes("แพ็กชีวิตฉบับสมบูรณ์")&&await locks(q,"#p-luck")===0);
r=await call(checkout,{key:"1988-03-03|14|f",key2:"1988-03-03|14|f",tier:"pair"});
ok("pair pack with the same person twice is rejected",r.status===400);
r=await call(checkout,{key:"1988-03-03|14|f",tier:"pair"});
ok("pair pack without partner is rejected",r.status===400);
// share card
await q.click("#t-read"); await q.click("#shareBtn"); await q.waitForSelector("#shareModal img");
ok("share card renders an image",(await q.getAttribute("#shareModal img","src")).startsWith("data:image/png"));

// ---------- I. layout ----------
q=await newPage("2026-10-01T10:00:00");
for(const pg of ["index","daily","chart","match","fengshui","privacy"]){await q.goto("http://localhost:8788/"+pg+".html");await q.waitForTimeout(150);const w=await q.evaluate(()=>document.documentElement.scrollWidth);if(w>400){fail++;console.log("FAIL  overflow",pg,w);}}
await q.goto("http://localhost:8788/");
ok("landing shows both prices",(await txt(q,".ptable thead")).includes("299")&&(await txt(q,".ptable thead")).includes("690"));



ok("no page errors",errs.length===0,errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close(); srv.close();
process.exit(fail?1:0);

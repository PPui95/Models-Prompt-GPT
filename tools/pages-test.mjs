// Unit tests for the Cloudflare Pages Functions port (mocked Stripe). Run: node tools/pages-test.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkout = (await import(REPO + "/functions/api/checkout.js")).onRequest;
const verify = (await import(REPO + "/functions/api/verify.js")).onRequest;
const P = await import(REPO + "/functions/_lib/shared.js");
const N = await import(REPO + "/netlify/lib/shared.mjs");

const E = { STRIPE_SECRET_KEY: "sk_test_x", TOKEN_SECRET: "s3cret", ADMIN_CODES: "PUEY-ADMIN-77,SECOND-CODE-1", PRICE_YEAR_THB: "299", PRICE_FULL_THB: "690", PRICE_PAIR_THB: "990" };
let fail = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log("FAIL ", m); } else console.log("PASS ", m); };
const post = (fn, body, env = E) => fn({ request: new Request("https://heng.example/api/x", { method: "POST", body: JSON.stringify(body) }), env });

const realFetch = globalThis.fetch;
let lastForm = null, session = null;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("checkout/sessions") && init?.method === "POST") {
    lastForm = Object.fromEntries(new URLSearchParams(init.body));
    return new Response(JSON.stringify({ url: "https://checkout.stripe.test/s/1", id: "cs_test_1" }), { status: 200 });
  }
  if (String(url).includes("checkout/sessions/cs_")) return new Response(JSON.stringify(session), { status: 200 });
  return realFetch(url, init);
};

const KEY = "1990-02-03|09|m", KEY2 = "1988-03-03|14|f";

// checkout
let r = await post(checkout, { key: KEY, tier: "year", page: "chart" });
ok(r.status === 200 && (await r.json()).url.startsWith("https://checkout.stripe.test"), "checkout year returns url");
ok(lastForm["line_items[0][price_data][unit_amount]"] === "29900" && lastForm.success_url.startsWith("https://heng.example/chart.html?session_id="), "year amount and success url");
r = await post(checkout, { key: KEY, key2: KEY2, tier: "pair", page: "match" });
ok(r.status === 200 && lastForm["line_items[0][price_data][unit_amount]"] === "99000" && lastForm["metadata[key2]"] === KEY2, "pair amount and partner metadata");
r = await post(checkout, { key: "bad", tier: "year" });
ok(r.status === 400, "invalid key rejected");
r = await post(checkout, { key: KEY, key2: KEY, tier: "pair" });
ok(r.status === 400, "pair with same partner rejected");
r = await post(checkout, { key: KEY, tier: "upgrade", token: "nope" });
ok(r.status === 400, "upgrade without token rejected");
const yearTok = await P.signToken({ k: KEY, t: "year", p: Date.now() - 864e5, exp: Date.now() + 864e6 }, E.TOKEN_SECRET);
r = await post(checkout, { key: KEY, tier: "upgrade", token: yearTok });
ok(r.status === 200 && lastForm["line_items[0][price_data][unit_amount]"] === "39100", "upgrade price is full minus year (391)");
r = await checkout({ request: new Request("https://heng.example/api/x"), env: E });
ok(r.status === 405, "GET not allowed");

// verify: admin code
r = await post(verify, { code: "puey-admin-77" });
let j = await r.json();
ok(r.status === 200 && j.key === "*" && j.t === "full" && j.token, "admin code accepted (case-insensitive)");
r = await post(verify, { code: "wrong" });
ok(r.status === 401, "bad code rejected");
r = await post(verify, { code: "" });
ok(r.status === 400 || r.status === 401 || r.status === 200 ? true : false, "empty code does not crash");
r = await post(verify, { code: "x" }, { ...E, ADMIN_CODES: "" });
ok(r.status === 401, "no ADMIN_CODES configured rejects all");

// verify: token round trip and cross-host compatibility
r = await post(verify, { token: j.token });
ok((await r.json()).ok === true, "pages token verifies on pages");
const nTok = N.signToken({ k: KEY, t: "full", p: Date.now(), exp: Date.now() + 864e6 }, E.TOKEN_SECRET);
r = await post(verify, { token: nTok });
ok((await r.json()).ok === true, "netlify-signed token verifies on pages");
const pTok = await P.signToken({ k: KEY, t: "full", p: Date.now(), exp: Date.now() + 864e6 }, E.TOKEN_SECRET);
ok(N.verifyToken(pTok, E.TOKEN_SECRET)?.k === KEY, "pages-signed token verifies on netlify");
r = await post(verify, { token: nTok.slice(0, -2) + "xx" });
ok(r.status === 401, "tampered token rejected");
const expTok = await P.signToken({ k: KEY, t: "full", p: 1, exp: Date.now() - 1000 }, E.TOKEN_SECRET);
r = await post(verify, { token: expTok });
ok(r.status === 401, "expired token rejected");

// verify: stripe session
session = { payment_status: "paid", created: 1790000000, amount_total: 99000, metadata: { key: KEY, tier: "pair", key2: KEY2 } };
r = await post(verify, { session_id: "cs_test_1" });
j = await r.json();
ok(j.ok && j.t === "full" && j.amount === 990 && j.extra.length === 1 && j.extra[0].key === KEY2, "paid pair session unlocks both people");
session = { payment_status: "unpaid", metadata: { key: KEY, tier: "year" } };
r = await post(verify, { session_id: "cs_test_1" });
ok(r.status === 202, "unpaid session pending");
r = await post(verify, { session_id: "../etc" });
ok(r.status === 400, "malformed session id rejected");

globalThis.fetch = realFetch;
console.log(`\n${n - fail} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

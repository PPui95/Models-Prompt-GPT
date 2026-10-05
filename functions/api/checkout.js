import { KEY_RE, env, json, stripe, verifyToken } from "../_lib/shared.js";

// Prices in THB; keep in sync with CONFIG.priceYear / priceFull / pricePair in site/assets/core.js
const prices = (e) => {
  const year = parseInt(e.PRICE_YEAR_THB || "299", 10);
  const full = parseInt(e.PRICE_FULL_THB || "690", 10);
  const pair = parseInt(e.PRICE_PAIR_THB || "990", 10);
  return { year, full, upgrade: full - year, pair };
};

const NAMES = {
  year: "แพ็กดวงปี: พื้นดวงเชิงลึก + ดวง 12 เดือนข้างหน้า",
  full: "แพ็กชีวิตฉบับสมบูรณ์: รายงานดวงจีนทุกหมวด",
  upgrade: "อัปเกรดเป็นแพ็กชีวิตฉบับสมบูรณ์",
  pair: "แพ็กคู่: แพ็กชีวิตฉบับสมบูรณ์ 2 ดวง",
};

// POST { key, key2?, page, tier: "year"|"full"|"upgrade"|"pair", token? } -> { url }
export async function onRequest({ request, env: e }) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const key = body?.key;
  if (!KEY_RE.test(key || "")) return json({ error: "invalid_key" }, 400);
  const tier = ["year", "full", "upgrade", "pair"].includes(body?.tier) ? body.tier : "year";
  if (tier === "pair" && (!KEY_RE.test(body?.key2 || "") || body.key2 === key)) return json({ error: "invalid_partner" }, 400);

  try {
    const metadata = { key, tier: tier === "upgrade" ? "full" : tier };
    if (tier === "pair") metadata.key2 = body.key2;
    if (tier === "upgrade") {
      // upgrade only from a valid year-pack token for the same birth data; keep its purchase date
      const p = await verifyToken(body?.token, env(e, "TOKEN_SECRET"));
      if (!p || p.t !== "year" || p.k !== key) return json({ error: "upgrade_not_allowed" }, 400);
      metadata.p = String(p.p);
    }
    const amount = prices(e)[tier];
    if (!(amount > 0)) return json({ error: "bad_price" }, 500);

    const origin = e.SITE_URL || new URL(request.url).origin;
    // page the buyer returns to after paying (only pages that can show the full report)
    const page = ["chart", "match", "fengshui"].includes(body?.page) ? body.page : "chart";
    const form = {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "thb",
      "line_items[0][price_data][unit_amount]": String(amount * 100),
      "line_items[0][price_data][product_data][name]": NAMES[tier],
      success_url: `${origin}/${page}.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${page}.html?canceled=1`,
    };
    for (const [k, v] of Object.entries(metadata)) form[`metadata[${k}]`] = v;
    const { ok, data } = await stripe(e, "checkout/sessions", { method: "POST", form });
    if (!ok) { console.error("stripe checkout error", data?.error?.message); return json({ error: "payment_provider" }, 502); }
    return json({ url: data.url });
  } catch (err) {
    console.error(err);
    return json({ error: "server" }, 500);
  }
}

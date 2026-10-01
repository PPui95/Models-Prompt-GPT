import { KEY_RE, env, json, stripe, verifyToken } from "../lib/shared.mjs";

// Prices in THB; keep in sync with CONFIG.priceYear / CONFIG.priceFull in site/assets/core.js
const prices = () => {
  const year = parseInt(process.env.PRICE_YEAR_THB || "299", 10);
  const full = parseInt(process.env.PRICE_FULL_THB || "690", 10);
  return { year, full, upgrade: full - year };
};

const NAMES = {
  year: "แพ็กดวงปี: พื้นดวงเชิงลึก + ดวง 12 เดือนข้างหน้า",
  full: "แพ็กชีวิตฉบับสมบูรณ์: รายงานดวงจีนทุกหมวด",
  upgrade: "อัปเกรดเป็นแพ็กชีวิตฉบับสมบูรณ์",
};

// POST { key, page, tier: "year"|"full"|"upgrade", token? } -> { url }
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const key = body?.key;
  if (!KEY_RE.test(key || "")) return json({ error: "invalid_key" }, 400);
  const tier = ["year", "full", "upgrade"].includes(body?.tier) ? body.tier : "year";

  try {
    const metadata = { key, tier: tier === "upgrade" ? "full" : tier };
    if (tier === "upgrade") {
      // upgrade only from a valid year-pack token for the same birth data; keep its purchase date
      const p = verifyToken(body?.token, env("TOKEN_SECRET"));
      if (!p || p.t !== "year" || p.k !== key) return json({ error: "upgrade_not_allowed" }, 400);
      metadata.p = String(p.p);
    }
    const amount = prices()[tier];
    if (!(amount > 0)) return json({ error: "bad_price" }, 500);

    const origin = process.env.SITE_URL || process.env.URL || new URL(req.url).origin;
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
    const { ok, data } = await stripe("checkout/sessions", { method: "POST", form });
    if (!ok) { console.error("stripe checkout error", data?.error?.message); return json({ error: "payment_provider" }, 502); }
    return json({ url: data.url });
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
};

export const config = { path: "/api/checkout" };

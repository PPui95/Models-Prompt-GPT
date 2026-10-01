import { KEY_RE, json, stripe } from "../lib/shared.mjs";

// POST { key } -> { url } : creates a Stripe Checkout page for one report
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const key = body?.key;
  if (!KEY_RE.test(key || "")) return json({ error: "invalid_key" }, 400);

  const origin = process.env.SITE_URL || process.env.URL || new URL(req.url).origin;
  // page the buyer returns to after paying (only pages that can show the full report)
  const page = ["chart", "match", "fengshui"].includes(body?.page) ? body.page : "chart";
  const price = parseInt(process.env.PRICE_THB || "199", 10);
  try {
    const { ok, data } = await stripe("checkout/sessions", {
      method: "POST",
      form: {
        mode: "payment",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "thb",
        "line_items[0][price_data][unit_amount]": String(price * 100),
        "line_items[0][price_data][product_data][name]": process.env.PRODUCT_NAME || "รายงานดวงจีนแปดอักษร ฉบับเต็ม",
        "metadata[key]": key,
        success_url: `${origin}/${page}.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${page}.html?canceled=1`,
      },
    });
    if (!ok) { console.error("stripe checkout error", data?.error?.message); return json({ error: "payment_provider" }, 502); }
    return json({ url: data.url });
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
};

export const config = { path: "/api/checkout" };

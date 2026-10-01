import { env, json, signToken, verifyToken, codeMatches, stripe } from "../lib/shared.mjs";

const DAY = 864e5;
const EXP = { year: 396 * DAY, full: 3650 * DAY }; // year pack: 12-month window + 1 month grace // year pack: 12-month window + 1 month grace

// POST { session_id } | { code } | { token } -> { ok, key, t, p, exp, token? }
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  try {
    const secret = env("TOKEN_SECRET");

    if (body?.token) {
      const p = verifyToken(body.token, secret);
      // tokens issued before tiers existed were full reports
      return p ? json({ ok: true, key: p.k, t: p.t || "full", p: p.p || p.exp - 365 * DAY, exp: p.exp })
               : json({ ok: false, error: "invalid_token" }, 401);
    }

    if (body?.code) {
      const codes = (process.env.ADMIN_CODES || "").split(",").filter((s) => s.trim());
      if (!codeMatches(body.code, codes)) return json({ ok: false, error: "bad_code" }, 401);
      const now = Date.now(), exp = now + 30 * DAY;
      return json({ ok: true, key: "*", t: "full", p: now, exp, token: signToken({ k: "*", t: "full", p: now, exp }, secret) });
    }

    const sid = String(body?.session_id || "");
    if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return json({ error: "bad_request" }, 400);
    const { ok, data } = await stripe(`checkout/sessions/${sid}`);
    if (!ok) return json({ ok: false, error: "not_found" }, 404);
    if (data.payment_status !== "paid") return json({ ok: false, pending: true }, 202);
    const key = data.metadata?.key;
    const t = ["full", "pair"].includes(data.metadata?.tier) ? "full" : "year"; // a pair pack is a full pack for two people
    const p = Number(data.metadata?.p) || (data.created ? data.created * 1000 : Date.now());
    const exp = p + EXP[t];
    const amount = typeof data.amount_total === "number" ? data.amount_total / 100 : undefined; // THB, for ad conversion value
    const extra = [];
    const key2 = data.metadata?.key2;
    if (data.metadata?.tier === "pair" && key2) {
      extra.push({ key: key2, t: "full", p, exp, token: signToken({ k: key2, t: "full", p, exp, sid }, secret) });
    }
    return json({ ok: true, key, t, p, exp, amount, extra, token: signToken({ k: key, t, p, exp, sid }, secret) });
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
};

export const config = { path: "/api/verify" };

import { env, json, signToken, verifyToken, codeMatches, stripe } from "../lib/shared.mjs";

const DAY = 864e5;

// POST { session_id } | { code } | { token } -> { ok, key, exp, token? }
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  try {
    const secret = env("TOKEN_SECRET");

    if (body?.token) {
      const p = verifyToken(body.token, secret);
      return p ? json({ ok: true, key: p.k, exp: p.exp }) : json({ ok: false, error: "invalid_token" }, 401);
    }

    if (body?.code) {
      const codes = (process.env.ADMIN_CODES || "").split(",").filter((s) => s.trim());
      if (!codeMatches(body.code, codes)) return json({ ok: false, error: "bad_code" }, 401);
      const exp = Date.now() + 30 * DAY;
      return json({ ok: true, key: "*", exp, token: signToken({ k: "*", exp }, secret) });
    }

    const sid = String(body?.session_id || "");
    if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return json({ error: "bad_request" }, 400);
    const { ok, data } = await stripe(`checkout/sessions/${sid}`);
    if (!ok) return json({ ok: false, error: "not_found" }, 404);
    if (data.payment_status !== "paid") return json({ ok: false, pending: true }, 202);
    const key = data.metadata?.key;
    const exp = Date.now() + 365 * DAY;
    return json({ ok: true, key, exp, token: signToken({ k: key, exp, sid }, secret) });
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
};

export const config = { path: "/api/verify" };

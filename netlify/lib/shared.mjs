import crypto from "node:crypto";

// Report key = birth date | birth hour (2 digits, empty if unknown) | sex
export const KEY_RE = /^\d{4}-\d{2}-\d{2}\|(\d{2})?\|[mf]$/;

export function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const hmac = (body, secret) => crypto.createHmac("sha256", secret).update(body).digest("base64url");

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret)}`;
}

export function verifyToken(token, secret) {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(hmac(body, secret));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export function codeMatches(input, list) {
  const c = Buffer.from(String(input || "").trim().toUpperCase());
  if (!c.length) return false;
  return list.some((x) => {
    const b = Buffer.from(x.trim().toUpperCase());
    return b.length === c.length && crypto.timingSafeEqual(b, c);
  });
}

export async function stripe(path, { method = "GET", form } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form) : undefined,
  });
  return { ok: res.ok, data: await res.json() };
}

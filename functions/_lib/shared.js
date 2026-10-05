// Shared helpers for Cloudflare Pages Functions (Web APIs only, no Node built-ins).
// Token format is identical to netlify/lib/shared.mjs, so tokens signed by either host verify on the other
// as long as TOKEN_SECRET is the same.

// Report key = birth date | birth hour (2 digits, empty if unknown) | sex
export const KEY_RE = /^\d{4}-\d{2}-\d{2}\|(\d{2})?\|[mf]$/;

export function env(e, name) {
  const v = e && e[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const hmacKey = (secret, usages) =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);

export async function signToken(payload, secret) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret, ["sign"]), enc.encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(token, secret) {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret, ["verify"]), b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(dec.decode(b64urlDecode(body)));
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

// constant-time comparison of two byte arrays of equal length
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export function codeMatches(input, list) {
  const c = enc.encode(String(input || "").trim().toUpperCase());
  if (!c.length) return false;
  let found = false;
  for (const x of list) if (sameBytes(enc.encode(x.trim().toUpperCase()), c)) found = true;
  return found;
}

export async function stripe(e, path, { method = "GET", form } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env(e, "STRIPE_SECRET_KEY")}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form) : undefined,
  });
  return { ok: res.ok, data: await res.json() };
}

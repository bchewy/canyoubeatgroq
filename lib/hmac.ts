import { createHmac, timingSafeEqual } from "node:crypto";
import { StartTokenPayload } from "@/lib/types";

function getSecret(): string {
  const s = process.env.START_TOKEN_SECRET;
  return s && s.length > 0 ? s : "dev-secret-change-me";
}

function toBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(str: string): Buffer {
  const pad = 4 - (str.length % 4);
  const s = (str + (pad < 4 ? "=".repeat(pad) : ""))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Buffer.from(s, "base64");
}

export function signStartToken(payload: StartTokenPayload): string {
  const secret = getSecret();
  const body = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(body).digest();
  return `v1.${toBase64Url(Buffer.from(body))}.${toBase64Url(sig)}`;
}

export function verifyStartToken(token: string): StartTokenPayload | null {
  try {
    const [v, bodyB64, sigB64] = token.split(".");
    if (v !== "v1" || !bodyB64 || !sigB64) return null;
    const body = fromBase64Url(bodyB64);
    const expected = createHmac("sha256", getSecret()).update(body).digest();
    const provided = fromBase64Url(sigB64);
    if (expected.length !== provided.length) return null;
    if (!timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(body.toString("utf8")) as StartTokenPayload;
    if (payload.v !== "v1") return null;
    return payload;
  } catch {
    return null;
  }
}



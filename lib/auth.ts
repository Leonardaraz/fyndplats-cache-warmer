// Skyddar interna endpoints. Browser-tillägget skickar samma hemliga token
// i x-fyndplats-token-headern. Använd timing-säker jämförelse.
import { timingSafeEqual } from "node:crypto";

export function isAuthorized(req: Request): boolean {
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!expected) return false; // ingen token konfigurerad => neka allt
  const provided = req.headers.get("x-fyndplats-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// lib/image-scoring.ts  (SERVER ONLY)
//
// Runtime-scorern bakom /admin/rerun-image-scores. Samma rubrik och flagg-
// vokabulär som scripts/score-images.mjs (offline-pipelinen) — hålls i synk.
//
// VIKTIGT om räckvidd: detta skriver bara till Wix Data (FyndplatsImageScores).
// Storefrontens SORTERING läser den committade data/image-scores.json — den
// uppdateras bara av offline-scriptet (som committar filen). Admin-rerun är till
// för att uppdatera/inspektera poäng i Wix Data (t.ex. efter en bild bytts) och
// för enstaka produkter; en full omsortering kräver en ny körning av scriptet.

import Anthropic from "@anthropic-ai/sdk";
import { getProducts } from "./products";
import { upsertScoreRecord } from "./image-scores";

const VISION_MODEL = process.env.CLAUDE_VISION_MODEL || "claude-haiku-4-5-20251001";
const BUDGET = parseFloat(process.env.ANTHROPIC_DAILY_BUDGET_USD || "2");
const BATCH = 5;
const PRICE_IN = 1.0;
const PRICE_OUT = 5.0;

const SYSTEM = `You are a strict e-commerce image QA reviewer for a Swedish webshop.
Score each product HERO image 0-100 for use as prime store placement.

Scoring rubric (start at 100, subtract):
- Background not clean white/transparent (busy/cluttered): -15 to -35
- Any baked-in text, watermark, supplier badge, price/measurement overlay: -20 to -45
- Chinese (or other non-Swedish) text visible in the image: -25 to -45
- Visible typo in on-image text (e.g. "Silent Cack"): -30
- Blurry / pixelated / poor lighting: -15 to -35
- Collage / multiple unrelated products in one frame: -25 to -45
- Amateur snapshot vs professional product photography: -10 to -25

A clean, sharp, single-product photo on white = 90-100.

Use ONLY these flag tokens (omit if none apply):
watermark, badge, chinese_text, baked_text, typo, collage, busy_background, blurry, amateur

Return ONLY a JSON array, one object per image in the order given:
[{"i":0,"score":<0-100 int>,"flags":["..."],"reason":"<=70 chars English"}]
No prose, no markdown fences.`;

function smallImage(url: string): string {
  if (!url) return url;
  return url.replace(/\/v1\/(fit|fill|crop)\/[^/]+\//, "/v1/fit/w_384,h_384,al_c,q_80,enc_auto/");
}

function parseJsonArray(text: string): { i: number; score: number; flags: string[]; reason: string }[] {
  const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no JSON array");
  return JSON.parse(cleaned.slice(start, end + 1).replace(/,(\s*[\]}])/g, "$1"));
}

export type RerunResult = {
  scored: number;
  costUsd: number;
  stoppedByBudget: boolean;
  distribution: { high: number; mid: number; low: number };
};

/**
 * Poängsätt produkternas huvudbilder och skriv till Wix Data. `limit` begränsar
 * antalet (default alla). Respekterar ANTHROPIC_DAILY_BUDGET_USD.
 */
export async function rerunImageScores(opts: { limit?: number; slug?: string } = {}): Promise<RerunResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas i miljön.");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let products = (await getProducts()).filter((p) => p.img);
  if (opts.slug) products = products.filter((p) => p.slug === opts.slug);
  if (opts.limit && opts.limit > 0) products = products.slice(0, opts.limit);

  let spent = 0;
  let high = 0, mid = 0, low = 0, scored = 0;
  let stoppedByBudget = false;
  const now = new Date().toISOString();

  for (let i = 0; i < products.length; i += BATCH) {
    if (spent >= BUDGET) { stoppedByBudget = true; break; }
    const batch = products.slice(i, i + BATCH);
    const content: Anthropic.ContentBlockParam[] = [];
    batch.forEach((p, idx) => {
      content.push({ type: "text", text: `Image ${idx} — product: ${p.name}` });
      content.push({ type: "image", source: { type: "url", url: smallImage(p.img) } });
    });
    content.push({ type: "text", text: `Score all ${batch.length} images. Return the JSON array now.` });

    let parsed: { i: number; score: number; flags: string[]; reason: string }[] = [];
    try {
      const msg = await anthropic.messages.create({ model: VISION_MODEL, max_tokens: 500, system: SYSTEM, messages: [{ role: "user", content }] });
      const u = msg.usage || { input_tokens: 0, output_tokens: 0 };
      spent += (u.input_tokens * PRICE_IN + u.output_tokens * PRICE_OUT) / 1_000_000;
      const text = (msg.content || []).filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      parsed = parseJsonArray(text);
    } catch {
      // fail-open: neutral 60, ingen flagga
      parsed = batch.map((_, idx) => ({ i: idx, score: 60, flags: [], reason: "scoring-fel" }));
    }
    const byI = new Map(parsed.map((r) => [r.i, r]));
    for (let idx = 0; idx < batch.length; idx++) {
      const p = batch[idx];
      const r = byI.get(idx) || { score: 60, flags: [], reason: "" };
      const score = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));
      await upsertScoreRecord({
        productId: p.id, slug: p.slug, name: p.name,
        mainImageScore: score, allImageScores: [score],
        flags: Array.isArray(r.flags) ? r.flags : [], reason: String(r.reason || "").slice(0, 120),
        analyzedAt: now,
      });
      scored++;
      if (score > 75) high++; else if (score >= 50) mid++; else low++;
    }
  }

  return { scored, costUsd: Number(spent.toFixed(4)), stoppedByBudget, distribution: { high, mid, low } };
}

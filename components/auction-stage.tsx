"use client";
// Fyndauktionens SCEN: äger dagsdramaturgin på klientklockan.
//
//   • Färgtemperatur: CSS-variabler (--a-*) interpoleras 07→18 (grädde → bärnsten),
//     sista timmen 18–19 slår om till ember-läget (mörkt, glöd).
//   • Canvas: stigande glödpartiklar (mer ju hetare), gnistexplosion + blixtar
//     vid tändningen 18:00, en blixt vid varje timslag när priset faller.
//   • Hjärtslag: en knappt märkbar puls på innehållet vid varje timslag.
//
// Allt är rent kosmetiskt — priserna ägs av servern (Wix är källan till
// sanning), så en klient med fel klocka ser bara fel färg, aldrig fel pris.
// prefers-reduced-motion ⇒ ingen canvas, inga pulser; färgläget sätts statiskt.

import { useEffect, useRef } from "react";
import { dayHeat, isFinalHour, hourIndex } from "../lib/auction-day";

// Färgstopp för dagen (ljust läge) + ember-läget för sista timmen.
const LIGHT = [
  { t: 0, bg1: "#FFF9F3", bg2: "#FCEFE0", ink: "#241c16", soft: "#6b6157", accent: "#C2410C", card: "#ffffff", cardink: "#241c16", line: "#EFE7DE", glow: 0 },
  { t: 0.5, bg1: "#FDEAD3", bg2: "#F6D6AE", ink: "#241206", soft: "#7a5c44", accent: "#E5560F", card: "#fffdfb", cardink: "#241206", line: "#F0D8BC", glow: 0.3 },
  { t: 1, bg1: "#F7C888", bg2: "#E89A3C", ink: "#2a1305", soft: "#7c4a1f", accent: "#C93E08", card: "#fff7ee", cardink: "#2a1305", line: "#E9BE86", glow: 0.62 },
];
const EMBER = { bg1: "#26100a", bg2: "#4a1c0a", ink: "#fff3e6", soft: "#e0ab7c", accent: "#FF7A2F", card: "#2a1109", cardink: "#ffe9d6", line: "#5f2c14", glow: 1 };

const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function mix(a: string, b: string, t: number): string {
  const A = hx(a), B = hx(b);
  return "#" + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0")).join("");
}
type Palette = typeof EMBER;
function paletteAt(p: number): Palette {
  let a = LIGHT[0], b = LIGHT[LIGHT.length - 1];
  for (let i = 0; i < LIGHT.length - 1; i++) if (p >= LIGHT[i].t && p <= LIGHT[i + 1].t) { a = LIGHT[i]; b = LIGHT[i + 1]; break; }
  const t = (p - a.t) / (b.t - a.t || 1);
  const out = {} as Record<string, string | number>;
  (["bg1", "bg2", "ink", "soft", "accent", "card", "cardink", "line"] as const).forEach((k) => (out[k] = mix(a[k], b[k], t)));
  out.glow = a.glow + (b.glow - a.glow) * t;
  return out as Palette;
}

type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; burst?: boolean };
type Bolt = { pts: [number, number][]; life: number };

export function AuctionStage({ startAt, children }: { startAt: string | null; children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current, flash = flashRef.current;
    if (!stage || !canvas || !flash) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startMs = startAt ? Date.parse(startAt) : null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let parts: Particle[] = [];
    let bolts: Bolt[] = [];
    let lastIdx: number | null = null;
    let wasFinal = false;
    let raf = 0;
    let disposed = false;

    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;
    const resize = () => { W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr; };
    resize();
    addEventListener("resize", resize);

    function burstAt(el: Element | null, n: number) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bx = (r.left + r.width / 2) * dpr, by = (r.top + r.height * 0.45) * dpr;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, sp = (1.8 + Math.random() * 8) * dpr;
        parts.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2 * dpr, r: (1 + Math.random() * 2.6) * dpr, life: 1, burst: true });
      }
    }
    function zap(n: number, withFlash = true) {
      const hero = stage!.querySelector(".a-hero-card") ?? stage!.querySelector(".a-grid");
      const hr = (hero ?? stage!).getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        const x1 = (hr.left + (0.15 + Math.random() * 0.7) * hr.width) * dpr;
        const y1 = Math.max(120 * dpr, (hr.top + hr.height * 0.12) * dpr);
        const x0 = x1 + (Math.random() - 0.5) * 420 * dpr;
        const pts: [number, number][] = [[x0, 0]];
        for (let s = 1; s <= 12; s++) {
          const t = s / 12;
          pts.push([x0 + (x1 - x0) * t + (Math.random() - 0.5) * 80 * dpr * (1 - t * 0.5), y1 * t]);
        }
        bolts.push({ pts, life: 1 });
        if (Math.random() < 0.75) {
          const st = pts[3 + Math.floor(Math.random() * 5)];
          const bp: [number, number][] = [[st[0], st[1]]];
          for (let s = 1; s <= 5; s++) bp.push([st[0] + (Math.random() - 0.5) * 200 * dpr, st[1] + s * 36 * dpr]);
          bolts.push({ pts: bp, life: 0.75 });
        }
      }
      if (withFlash) { flash!.classList.remove("go", "zapf"); void flash!.offsetWidth; flash!.classList.add("zapf"); }
    }
    function ignite() {
      zap(3, false);
      flash!.classList.remove("go", "zapf"); void flash!.offsetWidth; flash!.classList.add("go");
      burstAt(stage!.querySelector(".a-hero-card"), 130);
      stage!.querySelectorAll(".a-card").forEach((el) => burstAt(el, 14));
    }

    function applyTheme(now: number) {
      const heat = dayHeat(startMs, now);
      const final = isFinalHour(startMs, now);
      const c = final ? EMBER : paletteAt(heat);
      const s = stage!.style;
      s.setProperty("--a-bg1", c.bg1); s.setProperty("--a-bg2", c.bg2);
      s.setProperty("--a-ink", c.ink); s.setProperty("--a-soft", c.soft);
      s.setProperty("--a-accent", c.accent); s.setProperty("--a-card", c.card);
      s.setProperty("--a-cardink", c.cardink); s.setProperty("--a-line", c.line);
      s.setProperty("--a-heat", String(final ? 1 : heat));
      stage!.classList.toggle("a-final", final);

      if (!reduce) {
        const justIgnited = final && !wasFinal && lastIdx !== null;
        if (justIgnited) ignite();
        const idx = hourIndex(startMs, now);
        if (lastIdx !== null && idx > lastIdx) {
          if (!justIgnited) zap(final ? 2 : 1);
          const inner = stage!.querySelector(".a-flow");
          if (inner) { inner.classList.remove("beat"); void (inner as HTMLElement).offsetWidth; inner.classList.add("beat"); }
        }
        lastIdx = idx;
      }
      wasFinal = final;
    }

    applyTheme(Date.now());
    const themeTimer = setInterval(() => applyTheme(Date.now()), 1000);

    function tick() {
      if (disposed || !ctx) return;
      const heat = parseFloat(getComputedStyle(stage!).getPropertyValue("--a-heat")) || 0;
      ctx.clearRect(0, 0, W, H);
      // Mobiltrimmat: färre partiklar på små skärmar (svaga GPU:er) — samma känsla,
      // bråkdelen av arbetet. Caps längre ner skalas likadant.
      const mobile = innerWidth < 600;
      const spawn = heat * heat * (mobile ? 1.6 : 3);
      for (let k = 0; k < spawn; k++)
        if (Math.random() < heat)
          parts.push({ x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 0.6 * dpr, vy: -(0.6 + Math.random() * 1.6) * dpr * (0.6 + heat), r: (1 + Math.random() * 2.4) * dpr, life: 1 });
      parts = parts.filter((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.burst) { p.vy += 0.12 * dpr; p.vx *= 0.985; p.life -= 0.014; }
        else p.life -= 0.006 + 0.004 * heat;
        if (p.life <= 0 || p.y < -30 || p.y > H + 40) return false;
        const a = p.life * (p.burst ? 0.9 : 0.35 + 0.5 * heat);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `rgba(255,${Math.round(150 + 80 * heat)},60,${a})`);
        g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 7); ctx.fill();
        return true;
      });
      const cap = mobile ? 240 : 500;
      if (parts.length > cap) parts = parts.slice(-cap);
      if (bolts.length) {
        ctx.lineJoin = "round";
        bolts.forEach((b) => {
          const a = Math.max(0, b.life);
          ctx.shadowColor = `rgba(255,120,30,${a})`; ctx.shadowBlur = 22 * dpr;
          ctx.strokeStyle = `rgba(255,150,60,${a * 0.85})`; ctx.lineWidth = 4 * dpr;
          ctx.beginPath(); ctx.moveTo(b.pts[0][0], b.pts[0][1]);
          for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
          ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,248,230,${a})`; ctx.lineWidth = 1.6 * dpr; ctx.stroke();
        });
        bolts = bolts.filter((b) => (b.life -= 0.07) > 0);
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    }
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearInterval(themeTimer);
      removeEventListener("resize", resize);
    };
  }, [startAt]);

  return (
    <div ref={stageRef} className="a-stage" suppressHydrationWarning>
      <div className="a-blob a-b1" aria-hidden="true" />
      <div className="a-blob a-b2" aria-hidden="true" />
      <canvas ref={canvasRef} className="a-embers" aria-hidden="true" />
      <div className="a-vignette" aria-hidden="true" />
      <div ref={flashRef} className="a-flash" aria-hidden="true" />
      <div className="a-flow">{children}</div>
    </div>
  );
}

// lib/hero-vagg.ts
//
// Startsidans varuvägg på dator: väggens vinkel räknad om till en platt
// 2D-matris per bricka (Leonard 2026-11-26: "jag vill ha allt med samma
// utseende premium deluxe men bara bilderna skarpare").
//
// Varför: en vägg i 3D (perspective + rotateY + rotateX) ritas först som en
// bild och skalas sedan om av grafikkortet, och på en vanlig skärm och i 125 %
// ritar Chrome den dessutom i för låg upplösning. Bilderna och priserna blev
// mjuka (mätt på www: rak vägg var 1,9–3,0 gånger skarpare i 1x och 5,9–9,7 i
// 2x). En 2D-matris ritas i stället direkt med bilden ur filen, i full skärpa,
// så länge brickan står still. Under en övergång (hover, muspekaren) är den en
// egen yta en stund, som förut.
//
// Formen: varje bricka får den 2D-matris som bäst följer väggens riktiga
// projektion (minsta kvadrat över hörn, kantmitter och mitt), kring väggens
// vridpunkt. En 2D-matris kan inte göra en bricka till ett trapets, så den
// stora brickans vänsterkant är inte 12 px kortare än högerkanten som i 3D;
// hörnen hamnar som mest 3,7 px fel (de små brickorna 1,5 px).
//
// CSS:en i app/startsida.css ("Studion", datorn) är utskriven ur den här filen:
//   node --experimental-strip-types lib/hero-vagg.ts
// lib/hero-vagg.test.ts fäller om den och matematiken går isär.

/** Väggens lutning, som den stod i CSS:en: perspective(1500px) rotateY(-8deg + hx·3deg) rotateX(2deg − hy·2deg), vridpunkt 50 % 55 %. */
export const VAGG = { P: 1500, ay: -8, ax: 2, ayPerHx: 3, axPerHy: -2, vridX: 0.5, vridY: 0.55, gap: 14 } as const;

/** Väggens mått från 1 265 px fönsterbredd (höjden når sitt tak, 468 px, och rutnätet sin bredd). */
export const VAGG_STOR = { W: 511, H: 468 } as const;

export type Bricka = { namn: "stor" | "uppe" | "nere"; vanster: number; topp: number; bredd: number; hojd: number };

/** Brickornas platser i väggen: kolumnerna 1.3fr och 1fr, raderna 1fr och 1fr, mellanrum 14 px. Den stora tar båda raderna. */
export function brickor(W: number, H: number, gap: number = VAGG.gap): Bricka[] {
  const w1 = ((W - gap) * 1.3) / 2.3;
  const w2 = (W - gap) / 2.3;
  const h2 = (H - gap) / 2;
  return [
    { namn: "stor", vanster: 0, topp: 0, bredd: w1, hojd: H },
    { namn: "uppe", vanster: w1 + gap, topp: 0, bredd: w2, hojd: h2 },
    { namn: "nere", vanster: w1 + gap, topp: h2 + gap, bredd: w2, hojd: h2 },
  ];
}

const rad = (g: number) => (g * Math.PI) / 180;

/** En punkt i väggen (px) projicerad som CSS gör: perspective(P) rotateY(ay) rotateX(ax) kring vridpunkten (ox, oy). */
export function projicera(x: number, y: number, ox: number, oy: number, ayGrader: number, axGrader: number, P: number = VAGG.P): [number, number] {
  let X = x - ox;
  let Y = y - oy;
  let Z = 0;
  // rotateX verkar först på punkten (den står sist i CSS-listan), sedan rotateY, sedan perspektivet.
  const ax = rad(axGrader);
  const Y1 = Y * Math.cos(ax) - Z * Math.sin(ax);
  const Z1 = Y * Math.sin(ax) + Z * Math.cos(ax);
  Y = Y1;
  Z = Z1;
  const ay = rad(ayGrader);
  const X2 = X * Math.cos(ay) + Z * Math.sin(ay);
  const Z2 = -X * Math.sin(ay) + Z * Math.cos(ay);
  X = X2;
  Z = Z2;
  const w = 1 - Z / P;
  return [X / w + ox, Y / w + oy];
}

export type Matris = { a: number; b: number; c: number; d: number; e: number; f: number };

/** Löser 3×3-systemet M·x = v (Cramers regel; systemen här är små och välkonditionerade). */
function los3(M: number[][], v: number[]): number[] {
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M);
  return [0, 1, 2].map((k) => det(M.map((r, i) => r.map((x, j) => (j === k ? v[i] : x)))) / D);
}

/**
 * Brickans 2D-matris kring väggens vridpunkt: q − O ≈ [a c; b d]·(p − O) + (e, f), där O är vridpunkten.
 * Anpassad med minsta kvadrat över brickans hörn, kantmitter och mitt. `vx` och `vy` är vridpunkten i
 * brickans egna procent (CSS: transform-origin), `fel` den största avvikelsen från 3D-projektionen i px.
 */
export function brickansMatris(b: Bricka, W: number, H: number, ayGrader: number = VAGG.ay, axGrader: number = VAGG.ax): Matris & { vx: number; vy: number; fel: number } {
  const ox = W * VAGG.vridX;
  const oy = H * VAGG.vridY;
  const par: Array<[[number, number], [number, number]]> = [];
  for (const fx of [0, 0.5, 1]) {
    for (const fy of [0, 0.5, 1]) {
      const x = b.vanster + fx * b.bredd;
      const y = b.topp + fy * b.hojd;
      par.push([[x - ox, y - oy], projicera(x, y, ox, oy, ayGrader, axGrader).map((v, i) => v - (i === 0 ? ox : oy)) as [number, number]]);
    }
  }
  const XtX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const Xtu = [0, 0, 0];
  const Xtv = [0, 0, 0];
  for (const [[px, py], [qx, qy]] of par) {
    const r = [px, py, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) XtX[i][j] += r[i] * r[j];
      Xtu[i] += r[i] * qx;
      Xtv[i] += r[i] * qy;
    }
  }
  const [a, c, e] = los3(XtX, Xtu);
  const [bb, d, f] = los3(XtX, Xtv);
  let fel = 0;
  for (const [[px, py], [qx, qy]] of par) fel = Math.max(fel, Math.hypot(a * px + c * py + e - qx, bb * px + d * py + f - qy));
  return { a, b: bb, c, d, e, f, vx: ((ox - b.vanster) / b.bredd) * 100, vy: ((oy - b.topp) / b.hojd) * 100, fel };
}

const tal = (v: number, d: number) => {
  const s = v.toFixed(d).replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
};

/** Ett tal i matrisen som CSS: värdet i vila plus muspekarens del (--hx och --hy från components/hero-lutning.tsx). */
function led(v0: number, dhx: number, dhy: number, d: number): string {
  const delar = [tal(v0, d)];
  if (Math.abs(dhx) >= 0.5 * 10 ** -d) delar.push(`${dhx < 0 ? "-" : "+"} ${tal(Math.abs(dhx), d)}*var(--hx,0)`);
  if (Math.abs(dhy) >= 0.5 * 10 ** -d) delar.push(`${dhy < 0 ? "-" : "+"} ${tal(Math.abs(dhy), d)}*var(--hy,0)`);
  return delar.length === 1 ? delar[0] : `calc(${delar.join(" ")})`;
}

/**
 * CSS för en bricka: vridpunkten och matrisen, där muspekarens lutning ingår linjärt (hx och hy är −1 till 1,
 * alltså ±3 grader runt Y och ±2 runt X). Linjäriseringen avviker under en pixel från den exakta anpassningen.
 */
export function brickansCss(b: Bricka, W: number, H: number): { vx: string; vy: string; m: string } {
  const m0 = brickansMatris(b, W, H, VAGG.ay, VAGG.ax);
  const hxP = brickansMatris(b, W, H, VAGG.ay + VAGG.ayPerHx, VAGG.ax);
  const hxM = brickansMatris(b, W, H, VAGG.ay - VAGG.ayPerHx, VAGG.ax);
  const hyP = brickansMatris(b, W, H, VAGG.ay, VAGG.ax + VAGG.axPerHy);
  const hyM = brickansMatris(b, W, H, VAGG.ay, VAGG.ax - VAGG.axPerHy);
  const k = (n: keyof Matris, d: number) => led(m0[n], (hxP[n] - hxM[n]) / 2, (hyP[n] - hyM[n]) / 2, d);
  return {
    vx: `${tal(m0.vx, 2)}%`,
    vy: `${tal(m0.vy, 2)}%`,
    m: `matrix(${k("a", 4)},${k("b", 4)},${k("c", 4)},${k("d", 4)},${k("e", 2)},${k("f", 2)})`,
  };
}

/** De tre brickornas CSS för väggens stora mått, som de står i app/startsida.css. */
export function vaggensCss(): Record<Bricka["namn"], { vx: string; vy: string; m: string }> {
  const { W, H } = VAGG_STOR;
  const ut = {} as Record<Bricka["namn"], { vx: string; vy: string; m: string }>;
  for (const b of brickor(W, H)) ut[b.namn] = brickansCss(b, W, H);
  return ut;
}

// Körd direkt: skriv ut CSS:en och hörnfelen.
if (import.meta.url === `file://${process.argv[1]}`) {
  const css = vaggensCss();
  const valjare: Record<Bricka["namn"], string> = {
    stor: ".hem2 .hero .herotile-stor",
    uppe: ".hem2 .hero .mcol:first-child .herotile:nth-child(2)",
    nere: ".hem2 .hero .mcol-offset .herotile:first-child",
  };
  for (const n of ["stor", "uppe", "nere"] as const) console.log(`  ${valjare[n]}{--vx:${css[n].vx};--vy:${css[n].vy};--m:${css[n].m}}`);
  for (const [W, H] of [[511, 468], [440, 430], [367, 400]]) {
    console.log(`väggen ${W}×${H}: största hörnfel ` + brickor(W, H).map((b) => `${b.namn} ${brickansMatris(b, W, H).fel.toFixed(2)} px`).join(", "));
  }
}

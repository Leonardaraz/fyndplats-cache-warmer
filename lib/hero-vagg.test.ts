// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Startsidans varuvägg på dator: vinkeln som en 2D-matris per bricka
// (lib/hero-vagg.ts, Leonard 2026-11-26: "samma utseende premium deluxe men
// bara bilderna skarpare"). Matematiken och CSS:en i app/startsida.css får inte
// gå isär.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VAGG, VAGG_STOR, brickor, brickansMatris, brickansCss, projicera, vaggensCss } from "./hero-vagg.ts";

const start = readFileSync(new URL("../app/startsida.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("väggens geometri", () => {
  it("brickorna fyller väggen: 1.3fr och 1fr, två rader, 14 px mellanrum", () => {
    const [stor, uppe, nere] = brickor(511, 468);
    assert.equal(Math.round(stor.bredd), 281);
    assert.equal(Math.round(uppe.bredd), 216);
    assert.equal(Math.round(uppe.hojd), 227);
    assert.equal(Math.round(uppe.vanster + uppe.bredd), 511);
    assert.equal(Math.round(nere.topp + nere.hojd), 468);
  });

  it("projektionen är CSS:ens: vridpunkten står still och höger sida kommer närmare (större)", () => {
    const ox = 511 * VAGG.vridX, oy = 468 * VAGG.vridY;
    const [px, py] = projicera(ox, oy, ox, oy, VAGG.ay, VAGG.ax);
    assert.ok(Math.abs(px - ox) < 1e-9 && Math.abs(py - oy) < 1e-9);
    const hojd = (x: number) => projicera(x, 468, ox, oy, VAGG.ay, VAGG.ax)[1] - projicera(x, 0, ox, oy, VAGG.ay, VAGG.ax)[1];
    assert.ok(hojd(511) > hojd(0), "höger kant ska vara högre än vänster");
  });
});

describe("2D-matrisen följer 3D-väggen", () => {
  it("hörnen avviker högst 3,7 px på den stora brickan och 1,5 px på de små, i alla datorbredder", () => {
    for (const [W, H] of [[511, 468], [440, 430], [367, 400]]) {
      for (const b of brickor(W, H)) {
        const { fel } = brickansMatris(b, W, H);
        assert.ok(fel < (b.namn === "stor" ? 3.7 : 1.5), `${b.namn} ${W}×${H}: ${fel.toFixed(2)} px`);
      }
    }
  });

  it("muspekarens lutning i talen avviker under en pixel från den exakta matrisen, också i hörnen", () => {
    const { W, H } = VAGG_STOR;
    for (const b of brickor(W, H)) {
      const css = brickansCss(b, W, H);
      for (const hx of [-1, 0, 1]) {
        for (const hy of [-1, 0, 1]) {
          // matrix(a,b,c,d,e,f): dela vid kommatecken på yttersta nivån (calc och var har egna parenteser)
          const inne = css.m.slice("matrix(".length, -1);
          const delar: string[] = [];
          let djup = 0, start2 = 0;
          for (let i = 0; i < inne.length; i++) {
            if (inne[i] === "(") djup++;
            else if (inne[i] === ")") djup--;
            else if (inne[i] === "," && djup === 0) { delar.push(inne.slice(start2, i)); start2 = i + 1; }
          }
          delar.push(inne.slice(start2));
          const tal = delar.map((del) => {
            const uttryck = del.replaceAll("var(--hx,0)", `(${hx})`).replaceAll("var(--hy,0)", `(${hy})`).replace(/^calc/, "");
            return Function(`"use strict"; return (${uttryck});`)() as number;
          });
          assert.equal(tal.length, 6);
          const [a, bb, c, d, e, f] = tal;
          const exakt = brickansMatris(b, W, H, VAGG.ay + VAGG.ayPerHx * hx, VAGG.ax + VAGG.axPerHy * hy);
          const ox = W * VAGG.vridX, oy = H * VAGG.vridY;
          for (const fx of [0, 1]) {
            for (const fy of [0, 1]) {
              const x = b.vanster + fx * b.bredd - ox, y = b.topp + fy * b.hojd - oy;
              const lin = [a * x + c * y + e, bb * x + d * y + f];
              const ex = [exakt.a * x + exakt.c * y + exakt.e, exakt.b * x + exakt.d * y + exakt.f];
              assert.ok(Math.hypot(lin[0] - ex[0], lin[1] - ex[1]) < 1, `${b.namn} hx ${hx} hy ${hy}`);
            }
          }
        }
      }
    }
  });
});

describe("CSS:en är utskriven ur matematiken", () => {
  const valjare = {
    stor: ".hem2 .hero .herotile-stor",
    uppe: ".hem2 .hero .mcol:first-child .herotile:nth-child(2)",
    nere: ".hem2 .hero .mcol-offset .herotile:first-child",
  } as const;
  it("varje bricka har vridpunkten och matrisen som lib/hero-vagg.ts räknar fram", () => {
    const css = vaggensCss();
    for (const n of ["stor", "uppe", "nere"] as const) {
      assert.ok(start.includes(`${valjare[n]}{--vx:${css[n].vx};--vy:${css[n].vy};--m:${css[n].m}}`), `${n}: kör node --experimental-strip-types lib/hero-vagg.ts och klistra in`);
    }
  });
  it("vridpunkten är väggens (50 % 55 %) i brickans egna procent", () => {
    const css = vaggensCss();
    assert.equal(css.stor.vy, "55%");
    assert.ok(Number.parseFloat(css.stor.vx) > 90 && Number.parseFloat(css.stor.vx) < 92);
    assert.ok(Number.parseFloat(css.uppe.vx) < 0 && Number.parseFloat(css.uppe.vy) > 100);
  });
});

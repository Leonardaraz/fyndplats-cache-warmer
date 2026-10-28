// app/api/admin/neon-till-wix/route.ts
//
// Butikens tabeller ur Neon till Wix CMS (lib/neon-till-wix.ts, lib/wix-lager.ts).
// Startas från motorns workflow "Migrering — flytta drift-datan tillbaka till
// Wix" (läget butik), som når hit via motorns /api/admin/butik-neon-till-wix med
// ADMIN_SECRET som kakan fp_admin. proxy.ts släpper bara igenom /api/admin/* på den.
//
//   ?lage=plan                  radantal i Neon och Wix, och växelns läge
//   ?lage=kopiera&dryRun=false  skriver det som saknas eller skiljer sig
//   ?lage=verifiera             jämför rad för rad åt båda hållen
//   ?lage=delta&vaxling=…&kopieradSedan=…&dryRun=false  efter växlingen
//
// ☠️ Svaret är publikt (en Actions-logg): inga radinnehåll, id bara som hash,
// fel bara som status och WDE-kod, och markören förseglad med ADMIN_SECRET.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { forsegla, godkand, kortFel, oppna, redigerad, synka, type Kalla, type KallRad, type Lage, type WixPost, type WixSida } from "@/lib/neon-till-wix";
import { K, TABELLER, VAXEL_ID, datalager, fraga, hamta, rakna, sparaManga, taBortManga, type Tabell } from "@/lib/wix-lager";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Rad = Record<string, unknown>;

/** Saknad tabell (42P01) är noll rader: flera tabeller skapas först vid första användningen. */
async function fragaNeon(text: string, varden: unknown[] = []): Promise<Rad[]> {
  try {
    return (await sql.query(text, varden)).rows as Rad[];
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") return [];
    throw e;
  }
}

function kalla(t: Tabell): Kalla {
  const valj = `${t.kolumner ?? "*"}, ${t.ordning.map((u, i) => `${u} AS _k${i}`).join(", ")}`;
  const ordning = t.ordning.join(", ");
  return {
    namn: t.tabell,
    kollektion: t.kollektion,
    async lasNeon(efter, antal) {
      const nycklar = efter ? (JSON.parse(efter) as unknown[]) : null;
      const rader = nycklar
        ? await fragaNeon(
            `SELECT ${valj} FROM ${t.tabell}
              WHERE (${ordning}) > (${t.ordning.map((_, i) => `$${i + 1}`).join(", ")})
              ORDER BY ${ordning} LIMIT $${t.ordning.length + 1}`,
            [...nycklar, antal],
          )
        : await fragaNeon(`SELECT ${valj} FROM ${t.tabell} ORDER BY ${ordning} LIMIT $1`, [antal]);
      const sista = rader[rader.length - 1];
      return {
        rader: rader.map((r): KallRad => {
          const w = t.franPostgres(r);
          return { id: w.id, data: w.data, andrad: t.andrad(r) };
        }),
        nasta: sista ? JSON.stringify(t.ordning.map((_, i) => sista[`_k${i}`])) : null,
      };
    },
    async raknaNeon() {
      const r = await fragaNeon(`SELECT count(*)::int AS n FROM ${t.tabell}`);
      return Number((r[0] as { n?: number } | undefined)?.n ?? 0);
    },
    async allaIdn() {
      const rader = await fragaNeon(`SELECT ${t.kolumner ?? "*"} FROM ${t.tabell}`);
      return new Set(rader.map((r) => t.franPostgres(r).id));
    },
  };
}

const wixSida: WixSida = {
  async hamtaIdn(kollektion, idn) {
    const ut: WixPost[] = [];
    for (let i = 0; i < idn.length; i += 100) {
      const rader = await fraga(kollektion, { filter: { _id: { $in: idn.slice(i, i + 100) } }, limit: 1000 }, { medSystemfalt: true });
      ut.push(...(rader as WixPost[]));
    }
    return ut;
  },
  async sidaEfter(kollektion, efter, antal) {
    return (await fraga(
      kollektion,
      { filter: efter ? { _id: { $gt: efter } } : {}, sort: [{ fieldName: "_id", order: "ASC" }], limit: Math.min(antal, 1000) },
      { medSystemfalt: true },
    )) as WixPost[];
  },
  rakna: (kollektion) => rakna(kollektion),
  async spara(kollektion, rader) {
    return sparaManga(kollektion, rader.map((r) => ({ id: r.id, data: r.data })));
  },
  async taBort(kollektion, idn) {
    return taBortManga(kollektion, idn);
  },
};

const LAGEN = new Set(["plan", "kopiera", "verifiera", "delta"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lage = url.searchParams.get("lage") ?? "plan";
  if (!LAGEN.has(lage)) return NextResponse.json({ ok: false, error: `okänt läge ${lage}` }, { status: 400 });
  const hemlighet = process.env.ADMIN_SECRET;
  if (!hemlighet) return NextResponse.json({ ok: false, error: "ADMIN_SECRET saknas" }, { status: 503 });
  const bara = (url.searchParams.get("tabeller") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const tabeller = TABELLER.filter((t) => !bara.length || bara.includes(t.tabell));
  const lager = await datalager();

  try {
    if (lage === "plan") {
      const rader = [];
      for (const t of tabeller) {
        const neon = await kalla(t).raknaNeon();
        let wix: number | string;
        try {
          wix = await rakna(t.kollektion);
        } catch (e) {
          wix = /WDE0025/.test(String(e)) ? "kollektionen saknas" : "läsfel";
        }
        rader.push({ tabell: t.tabell, kollektion: t.kollektion, neon, wix });
      }
      // Tabeller i butikens databas som kopian inte känner till: de hade blivit kvar i Neon.
      const kanda = new Set(TABELLER.map((t) => t.tabell));
      const alla = await fragaNeon(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
      const andraTabeller = alla
        .map((r) => String(r.table_name))
        .filter((n) => !kanda.has(n))
        .sort()
        .map((n) => ({ tabell: n, rader: "?" }));
      const vaxel = await hamta(K.installningar, VAXEL_ID).catch(() => null);
      return NextResponse.json({
        ok: true,
        lager: { drift: lager, recensioner: "-", auktioner: "-", driftenIWix: lager === "wix", vaxelRad: vaxel ? String(vaxel.lager ?? "") : "saknas" },
        tabeller: rader,
        andraTabeller,
      });
    }

    const dryRun = url.searchParams.get("dryRun") !== "false";
    if (lage === "kopiera" && !dryRun && lager === "wix") {
      // Efter växlingen hade kopian skrivit gamla Neon-rader över levande Wix-data.
      return NextResponse.json({ ok: false, error: "butiken kör redan på Wix — använd delta" }, { status: 409 });
    }
    const summering = await synka(tabeller.map(kalla), wixSida, {
      lage: lage as Lage,
      dryRun,
      vaxling: url.searchParams.get("vaxling"),
      kopieradSedan: url.searchParams.get("kopieradSedan"),
      efter: oppna(url.searchParams.get("after"), hemlighet),
    });
    return NextResponse.json({
      ok: true,
      summering: redigerad(summering),
      godkand: godkand(summering),
      markor: forsegla(summering.markor, hemlighet),
      markorTabell: summering.markor?.tabell ?? null,
    });
  } catch (e) {
    const meddelande = e instanceof Error ? e.message : String(e);
    console.error("[neon-till-wix]", meddelande);
    // Bara status och WDE-kod: ett Postgres- eller Wix-fel kan eka radens innehåll.
    return NextResponse.json({ ok: false, error: kortFel(meddelande) }, { status: 500 });
  }
}

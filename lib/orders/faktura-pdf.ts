// Fakturan och kvittot som PDF, i A4.
//
// Ritas med pdf-lib och standardtypsnittet Helvetica, så ingen typsnittsfil
// behöver följa med. Helvetica bär WinAnsi, som täcker å, ä, ö, °, × och –.
// Ett tecken utanför den byts mot ett frågetecken i stället för att fälla hela
// PDF:en (`rentTecken`).
//
// Rubrikraden har samma mörka botten som kundmejlen, med loggan om den gick
// att hämta. Loggan är vit text på mörk botten och ser bara rätt ut där
// (lib/email/kundmejl.ts).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import { SALJARE, VALUTA, kronor, type Faktura } from "./faktura";

const A4 = { w: 595.28, h: 841.89 };
const MARG = 48;
const MORK = rgb(0x22 / 255, 0x20 / 255, 0x18 / 255);
const ORANGE = rgb(0xf4 / 255, 0x7a / 255, 0x35 / 255);
const GRA = rgb(0x6b / 255, 0x6b / 255, 0x6b / 255);
const LINJE = rgb(0xe7 / 255, 0xe2 / 255, 0xda / 255);
const VARM = rgb(0xff / 255, 0xf6 / 255, 0xef / 255);
const SVART = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255);

export interface PdfVal {
  /** "faktura" eller "kvitto". Kvittot säger att beloppet är betalt. */
  typ: "faktura" | "kvitto";
  /** Betalningsdatum, bara för kvittot. */
  betaldDatum?: string;
  /** Loggan som PNG, om den gick att hämta. */
  logoPng?: Uint8Array;
}

/** Byter tecken som Helvetica inte kan rita. Hårt mellanslag blir vanligt. */
export function rentTecken(text: string, font: PDFFont): string {
  let ut = "";
  for (const t of text.replace(/ /g, " ").replace(/−/g, "-")) {
    try {
      font.encodeText(t);
      ut += t;
    } catch {
      ut += "?";
    }
  }
  return ut;
}

/**
 * Fakturauppgifterna i högerspalten, i ordning. Valutakoden står med på både
 * fakturan och kvittot (`VALUTA` i faktura.ts).
 */
export function metaRader(f: Faktura, val: Pick<PdfVal, "typ" | "betaldDatum">): [string, string][] {
  return [
    ["Fakturanummer", f.nummer],
    ["Fakturadatum", f.fakturadatum],
    ...(val.typ === "kvitto"
      ? ([["Betalningsdatum", val.betaldDatum ?? f.fakturadatum]] as [string, string][])
      : ([["Förfallodatum", f.forfallodatum], ["Betalningsvillkor", `${f.betalning.dagar} dagar netto`]] as [string, string][])),
    ["Valuta", VALUTA],
    ["Orderdatum", f.orderdatum],
    ...(f.kund.orgnr ? ([["Ert org.nr", f.kund.orgnr]] as [string, string][]) : []),
    ...(f.kund.referens ? ([["Er referens", f.kund.referens]] as [string, string][]) : []),
    ["Vår referens", SALJARE.namn],
  ];
}

/** Delar ett ord som ensamt är bredare än raden, mellan två tecken. */
function delaOrd(ord: string, font: PDFFont, storlek: number, bredd: number): string[] {
  if (font.widthOfTextAtSize(ord, storlek) <= bredd) return [ord];
  const delar: string[] = [];
  let del = "";
  for (const t of ord) {
    if (del && font.widthOfTextAtSize(del + t, storlek) > bredd) {
      delar.push(del);
      del = t;
    } else del += t;
  }
  if (del) delar.push(del);
  return delar;
}

/**
 * Delar en text i rader som ryms i bredden. Texten ska redan ha gått genom
 * `rentTecken`. Ett ord som ensamt är för brett, till exempel en e-postadress,
 * delas mellan två tecken.
 */
export function radbryt(text: string, font: PDFFont, storlek: number, bredd: number): string[] {
  const ord = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((o) => delaOrd(o, font, storlek, bredd));
  const rader: string[] = [];
  let rad = "";
  for (const o of ord) {
    const prov = rad ? `${rad} ${o}` : o;
    if (font.widthOfTextAtSize(prov, storlek) <= bredd || !rad) rad = prov;
    else {
      rader.push(rad);
      rad = o;
    }
  }
  if (rad) rader.push(rad);
  return rader;
}

/** Fakturauppgifternas etiketter står här. Kundens spalt slutar en bit före. */
const X_ETIKETT = A4.w / 2 + 20;
const KUNDSPALT = X_ETIKETT - MARG - 16;
/** Avståndet mellan en etikett och den längsta raden i dess värde. */
const META_LUCKA = 12;
export const STORLEK = { kund: 11, etikett: 9, varde: 10, leverans: 10 } as const;

export interface Spaltrad {
  text: string;
  fet: boolean;
}

export interface Huvudlayout {
  /** Kundens spalt till vänster. Företagsnamnet är fetstilt. */
  kund: { rader: Spaltrad[]; bredd: number };
  /** Fakturauppgifterna. Värdet radbryts mellan sin etikett och marginalen. */
  meta: { etikett: string; rader: string[]; bredd: number }[];
  leverans: { rader: string[]; bredd: number };
}

/**
 * Fakturans huvud, rad för rad. Värdena kommer ur ordern, och referensen och
 * kundens namn är fritext som skrivs för hand när en fakturaorder läggs upp.
 * Varje värde radbryts därför i sin egen spalt. Före 2026-10-14 ritades
 * värdena utan att bredden kontrollerades, och en referens på cirka 46 tecken
 * hamnade ovanpå sin etikett.
 */
export function huvudLayout(
  f: Faktura,
  val: Pick<PdfVal, "typ" | "betaldDatum">,
  vanlig: PDFFont,
  fet: PDFFont,
): Huvudlayout {
  const kundrader = [
    f.kund.foretag,
    f.kund.foretag ? (f.kund.namn ? `Att: ${f.kund.namn}` : undefined) : f.kund.namn,
    ...f.kund.adressrader,
  ].filter((s): s is string => Boolean(s));
  const kund = kundrader.flatMap((r, i) => {
    const font = i === 0 ? fet : vanlig;
    return radbryt(rentTecken(r, font), font, STORLEK.kund, KUNDSPALT).map((text) => ({ text, fet: i === 0 }));
  });

  const meta = metaRader(f, val).map(([etikett, varde]) => {
    const etikettBredd = vanlig.widthOfTextAtSize(rentTecken(etikett, vanlig), STORLEK.etikett);
    const bredd = A4.w - MARG - (X_ETIKETT + etikettBredd + META_LUCKA);
    return { etikett, rader: radbryt(rentTecken(varde, fet), fet, STORLEK.varde, bredd), bredd };
  });

  const leveransBredd = A4.w - 2 * MARG;
  const leverans = f.leveransrader.length
    ? radbryt(rentTecken(f.leveransrader.join(", "), vanlig), vanlig, STORLEK.leverans, leveransBredd)
    : [];

  return {
    kund: { rader: kund, bredd: KUNDSPALT },
    meta,
    leverans: { rader: leverans, bredd: leveransBredd },
  };
}

export async function fakturaPdf(f: Faktura, val: PdfVal): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const titel = val.typ === "kvitto" ? `Kvitto faktura ${f.nummer}` : `Faktura ${f.nummer}`;
  doc.setTitle(titel);
  doc.setAuthor(SALJARE.namn);
  doc.setCreator(SALJARE.namn);
  doc.setProducer(SALJARE.namn);
  const vanlig = await doc.embedFont(StandardFonts.Helvetica);
  const fet = await doc.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | undefined;
  if (val.logoPng) {
    try {
      logo = await doc.embedPng(val.logoPng);
    } catch {
      logo = undefined;
    }
  }

  let sida = doc.addPage([A4.w, A4.h]);
  let y = A4.h;

  const skriv = (
    p: PDFPage,
    text: string,
    x: number,
    yy: number,
    opt: { font?: PDFFont; storlek?: number; farg?: ReturnType<typeof rgb>; hoger?: boolean } = {},
  ) => {
    const font = opt.font ?? vanlig;
    const storlek = opt.storlek ?? 10;
    const t = rentTecken(text, font);
    const xx = opt.hoger ? x - font.widthOfTextAtSize(t, storlek) : x;
    p.drawText(t, { x: xx, y: yy, size: storlek, font, color: opt.farg ?? SVART });
  };

  // Rubrikraden.
  const rubrikHojd = 74;
  sida.drawRectangle({ x: 0, y: A4.h - rubrikHojd, width: A4.w, height: rubrikHojd, color: MORK });
  sida.drawRectangle({ x: 0, y: A4.h - rubrikHojd - 5, width: A4.w, height: 5, color: ORANGE });
  if (logo) {
    const h = 34;
    const w = (logo.width / logo.height) * h;
    sida.drawImage(logo, { x: MARG, y: A4.h - rubrikHojd / 2 - h / 2, width: w, height: h });
  } else {
    skriv(sida, SALJARE.namn, MARG, A4.h - 46, { font: fet, storlek: 22, farg: rgb(1, 1, 1) });
  }
  skriv(sida, val.typ === "kvitto" ? "KVITTO" : "FAKTURA", A4.w - MARG, A4.h - 46, {
    font: fet,
    storlek: 20,
    farg: rgb(1, 1, 1),
    hoger: true,
  });
  y = A4.h - rubrikHojd - 34;

  // Kund till vänster, fakturauppgifter till höger. Varje värde radbryts i sin
  // egen spalt (`huvudLayout`).
  const huvud = huvudLayout(f, val, vanlig, fet);
  skriv(sida, val.typ === "kvitto" ? "Kund" : "Faktureras till", MARG, y, { font: fet, storlek: 9, farg: GRA });
  let yv = y - 15;
  for (const r of huvud.kund.rader) {
    skriv(sida, r.text, MARG, yv, { storlek: STORLEK.kund, font: r.fet ? fet : vanlig });
    yv -= 15;
  }

  let yh = y;
  for (const { etikett, rader } of huvud.meta) {
    skriv(sida, etikett, X_ETIKETT, yh, { storlek: STORLEK.etikett, farg: GRA });
    rader.forEach((rad, i) => {
      skriv(sida, rad, A4.w - MARG, yh - i * 12, { storlek: STORLEK.varde, font: fet, hoger: true });
    });
    yh -= 15 + (rader.length - 1) * 12;
  }
  y = Math.min(yv, yh) - 10;

  if (huvud.leverans.rader.length) {
    skriv(sida, "Leveransadress", MARG, y, { font: fet, storlek: 9, farg: GRA });
    y -= 14;
    for (const rad of huvud.leverans.rader) {
      skriv(sida, rad, MARG, y, { storlek: STORLEK.leverans });
      y -= 13;
    }
    y -= 11;
  }

  // Raderna.
  const kol = {
    benamning: MARG,
    antal: A4.w - MARG - 250,
    apris: A4.w - MARG - 165,
    moms: A4.w - MARG - 90,
    belopp: A4.w - MARG,
  };
  const tabellhuvud = (p: PDFPage, yy: number) => {
    p.drawRectangle({ x: MARG - 6, y: yy - 6, width: A4.w - 2 * MARG + 12, height: 20, color: VARM });
    skriv(p, "Benämning", kol.benamning, yy, { font: fet, storlek: 9 });
    skriv(p, "Antal", kol.antal, yy, { font: fet, storlek: 9, hoger: true });
    skriv(p, "À-pris inkl. moms", kol.apris + 40, yy, { font: fet, storlek: 9, hoger: true });
    skriv(p, "Moms", kol.moms, yy, { font: fet, storlek: 9, hoger: true });
    skriv(p, "Belopp", kol.belopp, yy, { font: fet, storlek: 9, hoger: true });
  };
  tabellhuvud(sida, y);
  y -= 24;

  const bredd = kol.antal - kol.benamning - 30;
  const radlista: { text: string[]; sub: string[]; antal: string; apris: string; moms: string; belopp: string }[] = [
    ...f.rader.map((r) => ({
      text: radbryt(rentTecken(r.benamning, vanlig), vanlig, 10, bredd),
      sub: [...r.detaljer, ...(r.sku ? [`Art.nr ${r.sku}`] : [])],
      antal: String(r.antal),
      apris: kronor(r.aPrisOre),
      moms: `${r.momsProcent} %`,
      belopp: kronor(r.beloppOre),
    })),
    {
      text: [f.frakt.namn],
      sub: [],
      antal: "1",
      apris: kronor(f.frakt.ore),
      moms: `${Math.max(...f.rader.map((r) => r.momsProcent))} %`,
      belopp: kronor(f.frakt.ore),
    },
    ...(f.rabattOre > 0
      ? [{ text: ["Rabatt"], sub: [], antal: "", apris: "", moms: "", belopp: kronor(-f.rabattOre) }]
      : []),
  ];

  for (const r of radlista) {
    const hojd = r.text.length * 13 + r.sub.length * 11 + 12;
    if (y - hojd < 220) {
      sida = doc.addPage([A4.w, A4.h]);
      y = A4.h - MARG;
      tabellhuvud(sida, y);
      y -= 24;
    }
    skriv(sida, r.antal, kol.antal, y, { hoger: true });
    skriv(sida, r.apris, kol.apris + 40, y, { hoger: true });
    skriv(sida, r.moms, kol.moms, y, { hoger: true });
    skriv(sida, r.belopp, kol.belopp, y, { hoger: true, font: fet });
    for (const t of r.text) {
      skriv(sida, t, kol.benamning, y);
      y -= 13;
    }
    for (const s of r.sub) {
      skriv(sida, s, kol.benamning, y, { storlek: 8.5, farg: GRA });
      y -= 11;
    }
    y -= 4;
    sida.drawLine({ start: { x: MARG - 6, y: y + 2 }, end: { x: A4.w - MARG + 6, y: y + 2 }, thickness: 0.6, color: LINJE });
    y -= 10;
  }

  // Summor.
  const summor: [string, string, boolean][] = [
    ["Summa exkl. moms", kronor(f.nettoOre), false],
    ...f.moms.map((m) => [`Moms ${m.procent} %`, kronor(m.ore), false] as [string, string, boolean]),
    [val.typ === "kvitto" ? "Betalt" : "Att betala", kronor(f.totalOre), true],
  ];
  y -= 4;
  for (const [etikett, varde, stor] of summor) {
    skriv(sida, etikett, kol.apris - 20, y, { storlek: stor ? 12 : 10, font: stor ? fet : vanlig });
    skriv(sida, varde, kol.belopp, y, { storlek: stor ? 13 : 10, font: fet, hoger: true });
    y -= stor ? 22 : 15;
  }

  // Betalningsrutan eller beskedet om att fakturan är betald.
  y -= 6;
  const rutaHojd = 58;
  sida.drawRectangle({
    x: MARG - 6,
    y: y - rutaHojd + 14,
    width: A4.w - 2 * MARG + 12,
    height: rutaHojd,
    color: VARM,
    borderColor: ORANGE,
    borderWidth: 1,
  });
  if (val.typ === "kvitto") {
    skriv(sida, `Betald ${val.betaldDatum ?? ""}. Tack!`, MARG + 6, y - 4, { font: fet, storlek: 12 });
    skriv(sida, `Fakturan ${f.nummer} är betald i sin helhet.`, MARG + 6, y - 24, { storlek: 10 });
  } else {
    skriv(sida, `Betala till: ${f.betalning.betalaTill}`, MARG + 6, y - 4, { font: fet, storlek: 12 });
    skriv(
      sida,
      `Skriv ${f.nummer} i meddelandet till mottagaren när du betalar. Förfallodatum ${f.forfallodatum}.`,
      MARG + 6,
      y - 24,
      { storlek: 10 },
    );
  }

  // Sidfoten på varje sida.
  const fot = [
    `${SALJARE.namn} · ${SALJARE.adress.join(", ")}`,
    `Org.nr ${SALJARE.orgnr} · Momsreg.nr ${SALJARE.momsnr}${f.betalning.fSkatt ? " · Godkänd för F-skatt" : ""}`,
    `${SALJARE.epost} · ${SALJARE.telefon} · ${SALJARE.webb}`,
  ];
  for (const p of doc.getPages()) {
    p.drawLine({ start: { x: MARG, y: 70 }, end: { x: A4.w - MARG, y: 70 }, thickness: 0.6, color: LINJE });
    fot.forEach((rad, i) => {
      const t = rentTecken(rad, vanlig);
      const w = vanlig.widthOfTextAtSize(t, 8.5);
      p.drawText(t, { x: (A4.w - w) / 2, y: 56 - i * 12, size: 8.5, font: vanlig, color: GRA });
    });
  }

  return doc.save();
}

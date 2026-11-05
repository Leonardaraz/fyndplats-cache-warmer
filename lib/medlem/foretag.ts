// lib/medlem/foretag.ts
//
// Företagsprofilen (E3): ansökan från Mina sidor, villkorsversionen och
// profilens läge. Ett företag läggs till på ett befintligt konto, inte som ett
// eget konto (specen, "Registrering och inloggning"), och ett konto har i E3
// högst ett företag. Fler användare per företag kommer i E5.
//
// Verifieringen (E3-1, E3-3): numret prövas med Luhn medan kunden skriver
// (orgnr.ts) och igen på servern. Bolagsverkets uppslag kräver nycklar från
// Bolagsverkets kundanmälan, som Leonard gör (svar 3.1). Tills de finns går
// varje ansökan till kön i motorns admin (/admin/medlemmar), där numret
// kontrolleras för hand. Ett godkännande där aktiverar profilen, och butikens
// timjobb mejlar kunden.
//
// Enskilda firmor får vara med (F4, Leonard 2026-11-04). Numret är då ägarens
// personnummer: det sparas för granskningen, visas maskerat för kunden och
// skrivs aldrig i en logg.
//
// E3-12: villkoren för företagskonto måste godkännas, och versionen sparas.
// En profil med en äldre version prissätts inte som företag förrän den nya
// versionen har godkänts på Mina sidor.
//
// Ren modul: provet av numret skickas in, så att filen går att pröva med
// `node --test` utan lokala imports.

import type { Orgform, Orgnrsfel, Orgnrsprov } from "./orgnr";

/** Villkoren för företagskonto (docs/medlemskap-foretagsvillkor-utkast.md). */
export const VILLKOR_FORETAG_VERSION = "1";

export type Foretagsstatus = "granskas" | "aktiv" | "nekad";

export interface Adress {
  gata: string;
  /** Fem siffror, utan mellanslag. */
  postnr: string;
  ort: string;
}

export interface Foretagsansokan {
  namn: string;
  /** "NNNNNN-NNNN". För en enskild firma ägarens personnummer. */
  orgnr: string;
  /** Det som får visas för kunden: maskerat för en enskild firma. */
  orgnrVisas: string;
  form: Orgform;
  faktura: Adress;
  /** Saknas: varorna levereras till fakturaadressen. */
  leverans?: Adress;
  villkorVersion: string;
}

export interface Foretagsprofil extends Foretagsansokan {
  medlemsId: string;
  status: Foretagsstatus;
  ansokt: string;
  villkorGodkant: string;
  beslutad?: string;
  godkandMejlad?: string;
}

export type Falt = "namn" | "orgnr" | "gata" | "postnr" | "ort" | "lgata" | "lpostnr" | "lort" | "naring" | "villkor";
export type Faltfel = Partial<Record<Falt, string>>;

export type Ansokningsprov = { ok: true; ansokan: Foretagsansokan } | { ok: false; fel: Faltfel };

export interface Orgnrsprovare {
  prova(text: string): Orgnrsprov;
  feltext(fel: Orgnrsfel): string;
}

export function foretagsprofilId(medlemsId: string): string {
  return `${medlemsId}__foretag`;
}

/** Mellanslag ihop, kontrolltecken och vinkelparenteser bort. */
function rensa(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max + 1);
}

function provaAdress(
  gata: unknown,
  postnr: unknown,
  ort: unknown,
  f: { gata: Falt; postnr: Falt; ort: Falt },
  fel: Faltfel,
): Adress | null {
  const g = rensa(gata, 100);
  const p = String(postnr ?? "").replace(/\s/g, "");
  const o = rensa(ort, 60);
  if (g.length < 3 || g.length > 100) fel[f.gata] = "Skriv gatuadressen.";
  if (!/^[1-9]\d{4}$/.test(p)) fel[f.postnr] = "Postnumret har fem siffror, till exempel 123 45.";
  if (o.length < 2 || o.length > 60 || !/^[\p{L}][\p{L} .'-]*$/u.test(o)) fel[f.ort] = "Skriv orten.";
  return fel[f.gata] || fel[f.postnr] || fel[f.ort] ? null : { gata: g, postnr: p, ort: o };
}

/**
 * Prövar formuläret från Mina sidor. Fälten heter som i formuläret:
 * namn, orgnr, gata, postnr, ort, annanLeverans ("1"), lgata, lpostnr, lort,
 * naring ("1") och villkor (versionen som godkändes).
 */
export function provaForetagsansokan(falt: Record<string, unknown>, orgnr: Orgnrsprovare): Ansokningsprov {
  const fel: Faltfel = {};
  const namn = rensa(falt.namn, 100);
  if (namn.length < 2 || namn.length > 100 || !/\p{L}/u.test(namn)) fel.namn = "Skriv företagets namn som det står hos Bolagsverket.";

  const prov = orgnr.prova(String(falt.orgnr ?? ""));
  if (!prov.ok) fel.orgnr = orgnr.feltext(prov.fel);

  const faktura = provaAdress(falt.gata, falt.postnr, falt.ort, { gata: "gata", postnr: "postnr", ort: "ort" }, fel);
  const annan = falt.annanLeverans === "1" || falt.annanLeverans === "on" || falt.annanLeverans === true;
  const leverans = annan
    ? provaAdress(falt.lgata, falt.lpostnr, falt.lort, { gata: "lgata", postnr: "lpostnr", ort: "lort" }, fel)
    : undefined;

  if (!(falt.naring === "1" || falt.naring === "on" || falt.naring === true)) {
    fel.naring = "Företagskontot gäller köp i näringsverksamhet. Kryssa i rutan för att fortsätta.";
  }
  if (falt.villkor !== VILLKOR_FORETAG_VERSION) fel.villkor = "Godkänn villkoren för företagskonto för att fortsätta.";

  if (Object.keys(fel).length > 0 || !prov.ok || !faktura || leverans === null) return { ok: false, fel };
  return {
    ok: true,
    ansokan: {
      namn,
      orgnr: prov.nummer,
      orgnrVisas: prov.visas,
      form: prov.form,
      faktura,
      ...(leverans ? { leverans } : {}),
      villkorVersion: VILLKOR_FORETAG_VERSION,
    },
  };
}

const text = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

function adressUr(v: unknown): Adress | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  const gata = text(a.gata);
  const postnr = text(a.postnr);
  const ort = text(a.ort);
  return gata && postnr && ort ? { gata, postnr, ort } : null;
}

/** Profilen ur en rad i `FyndplatsMedlemsprofiler`, eller null om raden inte är ett företag. */
export function foretagsprofilUrRad(d: Record<string, unknown> | null | undefined): Foretagsprofil | null {
  if (!d || d.typ !== "foretag") return null;
  const status = d.status === "aktiv" || d.status === "nekad" ? d.status : d.status === "granskas" ? "granskas" : null;
  const medlemsId = text(d.medlemsId);
  const namn = text(d.namn);
  const orgnr = text(d.orgnr);
  const orgnrVisas = text(d.orgnrVisas);
  const form = d.form === "enskild" ? "enskild" : d.form === "juridisk" ? "juridisk" : null;
  const faktura = adressUr(d.faktura);
  if (!status || !medlemsId || !namn || !orgnr || !orgnrVisas || !form || !faktura) return null;
  const leverans = adressUr(d.leverans);
  return {
    medlemsId,
    status,
    namn,
    orgnr,
    orgnrVisas,
    form,
    faktura,
    ...(leverans ? { leverans } : {}),
    villkorVersion: text(d.villkorVersion) ?? "",
    villkorGodkant: text(d.villkorGodkant) ?? "",
    ansokt: text(d.ansokt) ?? "",
    ...(text(d.beslutad) ? { beslutad: text(d.beslutad) } : {}),
    ...(text(d.godkandMejlad) ? { godkandMejlad: text(d.godkandMejlad) } : {}),
  };
}

/** Får kontot handla som företaget? Godkänt, och den gällande villkorsversionen godkänd (E3-12). */
export function kanHandlaSomForetag(p: Foretagsprofil | null | undefined): p is Foretagsprofil {
  return Boolean(p && p.status === "aktiv" && p.villkorVersion === VILLKOR_FORETAG_VERSION);
}

/** Postnumret som det skrivs: "123 45". */
export function postnrText(p: string): string {
  return /^\d{5}$/.test(p) ? `${p.slice(0, 3)} ${p.slice(3)}` : p;
}

/** En kort rad om var ansökan står, för Mina sidor. */
export function foretagsstatusText(p: Foretagsprofil): string {
  if (p.status === "granskas") return "Vi kontrollerar uppgifterna mot Bolagsverket. Du får ett mejl när det är klart, oftast inom en arbetsdag.";
  if (p.status === "nekad") return "Vi kunde inte godkänna företaget. Mejla info@fyndplats.com om du tror att det är fel.";
  if (p.villkorVersion !== VILLKOR_FORETAG_VERSION) return "Villkoren för företagskonto har ändrats. Godkänn den nya versionen för att handla som företaget.";
  return "Godkänt. Du väljer själv om du handlar privat eller som företaget.";
}

"use server";

// /admin/medlemmar: de manuella ändringarna. E1-11: varje ändring kräver en
// orsakskod och en text och skrivs till FyndplatsMedlemslogg med före- och
// efterläge (lib/medlem/admin.ts).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LAGEN,
  beslutaForetag,
  lasManuellNiva,
  lasOrsak,
  sattLage,
  sattManuellNiva,
  sattSparr,
  taBortKonto,
  type Lage,
} from "@/lib/medlem/admin";
import { avbojOffert, prissattOffert } from "@/lib/medlem/offert-admin";
import { lasProduktId, sattEjMedlemspris } from "@/lib/medlem/ej-medlemspris";

function tillbaka(q: string, meddelande: string): never {
  const sok = new URLSearchParams();
  if (q) sok.set("q", q);
  sok.set("m", meddelande);
  redirect(`/admin/medlemmar?${sok.toString()}`);
}

const falt = (f: FormData, n: string) => String(f.get(n) ?? "");

export async function manuellNivaAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const idag = new Date().toISOString().slice(0, 10);
  const niva = lasManuellNiva(falt(f, "niva"), falt(f, "till"), idag);
  if (typeof niva === "string") tillbaka(q, niva);
  const u = await sattManuellNiva(falt(f, "id"), niva, orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka(q, u === "ok" ? (niva.niva ? `Nivån satt till ${niva.niva}.` : "Den manuella nivån är borttagen.") : u);
}

export async function sparrAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const sparrad = falt(f, "sparrad") === "1";
  const u = await sattSparr(falt(f, "id"), sparrad, orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka(q, u === "ok" ? (sparrad ? "Kontot är spärrat." : "Kontot är aktivt igen.") : u);
}

export async function taBortAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  if (falt(f, "bekrafta") !== "TA BORT") tillbaka(q, "Skriv TA BORT för att bekräfta.");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const u = await taBortKonto(falt(f, "id"), orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka("", u === "ok" ? "Kontot är borttaget. Ordrarna står kvar i orderliggaren." : u);
}

export async function lageAction(f: FormData): Promise<void> {
  const lage = falt(f, "lage") as Lage;
  if (!(LAGEN as readonly string[]).includes(lage)) tillbaka("", "Okänt läge.");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka("", orsak);
  await sattLage(lage, orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka("", `Medlemskapet är nu i läget ${lage}. Butiken läser växeln inom en minut.`);
}

/** E3: godkänn eller neka ett företag, eller återkalla ett godkännande. */
export async function foretagAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  const beslut = falt(f, "beslut");
  if (beslut !== "aktiv" && beslut !== "nekad") tillbaka(q, "Okänt beslut.");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const u = await beslutaForetag(falt(f, "id"), beslut, orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka(
    q,
    u === "ok"
      ? beslut === "aktiv"
        ? "Företaget är godkänt. Kunden får ett mejl inom en timme (butikens timjobb kl :41)."
        : "Företaget är nekat. Kontot prissätts som privatperson."
      : u,
  );
}

/** E3: offertens styckpriser, eller avböj. Priserna prövas mot golvet och listpriset. */
export async function offertAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const id = falt(f, "id");
  const beslut = falt(f, "beslut");
  const u =
    beslut === "avboj"
      ? await avbojOffert(id, orsak)
      : await prissattOffert(id, Object.fromEntries([...f.entries()].filter(([k]) => k.startsWith("pris_")).map(([k, v]) => [k, String(v)])), orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka(
    q,
    u === "ok"
      ? beslut === "avboj"
        ? "Offerten är avböjd. Kunden ser det på Mina sidor."
        : "Offerten är prissatt och gäller i 14 dagar. Kunden får mejlet inom en timme (butikens timjobb kl :41)."
      : u,
  );
}

/** E2: flaggan "ej medlemspris" på en produkt (lib/medlem/ej-medlemspris.ts). */
export async function ejMedlemsprisAction(f: FormData): Promise<void> {
  const q = falt(f, "q");
  const id = lasProduktId(falt(f, "produkt"));
  if (!id) tillbaka(q, "Klistra in produktens id från Wix (36 tecken med bindestreck), eller adressen till produkten i Wix-panelen.");
  const orsak = lasOrsak(falt(f, "orsakKod"), falt(f, "orsakText"));
  if (typeof orsak === "string") tillbaka(q, orsak);
  const ej = falt(f, "ej") === "1";
  const u = await sattEjMedlemspris(id, ej, orsak);
  revalidatePath("/admin/medlemmar");
  tillbaka(q, u === "ok" ? (ej ? "Produkten får inte medlemspris längre." : "Produkten kan få medlemspris igen.") : u);
}

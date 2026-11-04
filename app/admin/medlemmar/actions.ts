"use server";

// /admin/medlemmar: de manuella ändringarna. E1-11: varje ändring kräver en
// orsakskod och en text och skrivs till FyndplatsMedlemslogg med före- och
// efterläge (lib/medlem/admin.ts).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LAGEN,
  lasManuellNiva,
  lasOrsak,
  sattLage,
  sattManuellNiva,
  sattSparr,
  taBortKonto,
  type Lage,
} from "@/lib/medlem/admin";

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

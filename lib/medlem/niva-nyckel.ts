// lib/medlem/niva-nyckel.ts
//
// Nivåns nyckel för färgerna i [data-niva]. Medlemskortet på Mina sidor och
// rutan med medlemspriset på produktsidan bär samma nyckel, så att guld är
// guld och silver silver överallt (Leonard 2026-11-04). En okänd nivå (nya
// regler) får bronsens färg.
//
// Ren modul utan imports: produktsidan ska inte dra med sig kontosidans CSS.

const NYCKLAR: Readonly<Record<string, string>> = {
  Brons: "brons",
  Silver: "silver",
  Guld: "guld",
  Platina: "platina",
  Diamant: "diamant",
  VIP: "vip",
};

export function nivaNyckel(namn: string): string {
  return Object.hasOwn(NYCKLAR, namn) ? NYCKLAR[namn] : "brons";
}

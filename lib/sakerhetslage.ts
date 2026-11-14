// Får en saknad säkerhetsinställning betyda "öppet"? Bara lokalt och i prov.
//
// ☠️ VARFÖR (2026-11-14). Tre skydd i motorn var skrivna som tillval: saknades
// inställningen släppte de igenom i stället för att neka.
//
//   - `/admin`: utan ADMIN_BASIC_USER och ADMIN_BASIC_PASS var sidorna öppna.
//   - Orderwebhookens vidarebefordran: utan WEBHOOK_FORWARD_SECRET räckte
//     rubriken `X-Forwarded-From`, som vem som helst kan skriva.
//   - Orderwebhookens signatur: utan WIX_WEBHOOK_PUBLIC_KEY togs en osignerad
//     kropp emot som den var.
//
// I produktionen var alla tre inställda när det mättes (2026-11-14: `/admin`
// svarade 401, en osignerad webhook 401 med och utan rubriken). Men ett skydd
// som försvinner tyst när en variabel tappas vid en flytt, ett nytt projekt
// eller en rensning i Vercel är en spärr man måste komma ihåg, och en sådan
// glöms bort. Nu är det tvärtom: en driftsatt motor NEKAR när inställningen
// saknas, och säger vilken variabel det gäller (aldrig dess värde).
//
// Öppet läge finns kvar där det behövs: `next dev` (NODE_ENV "development")
// och proven (NODE_ENV "test"). Allt annat är stängt, också förhandsbyggen:
// de läser samma butik som produktionen, och ett okänt eller tomt NODE_ENV
// räknas som stängt.
//
// Kantsäker: inga Node-moduler, så att `middleware.ts` kan använda den.

const OPPNA_LAGEN = new Set(["development", "test"]);

/**
 * Sant bara i lokal utveckling och i prov. Då, och bara då, får en saknad
 * säkerhetsinställning betyda att skyddet är avstängt.
 */
export function oppetUtanKonfiguration(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return OPPNA_LAGEN.has(nodeEnv ?? "");
}

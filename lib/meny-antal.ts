// Menyns produktantal hämtas i webbläsaren, inte i sidans HTML.
//
// VARFÖR (2026-10-01). Mega-menyn och mobilmenyn ligger på VARJE sida, och
// siffrorna i dem ("Se alla 1 170 produkter", "Matbord 141") ändras så fort en
// produkt publiceras, döljs eller tar slut — flera gånger om dagen. En sida som
// byggs om med en ny siffra är en ny sida för Vercel: en ISR-skrivning till för
// var och en av ~3 700 produktsidor, fast inget på produkten ändrats (mätt
// 2026-09-30: en omrenderad produktsida skilde sig från den förra i just
// menysiffrorna). Nu skickar servern trädet utan siffror, och menyn fyller i dem
// från /api/meny-antal — en liten, delad och CDN-cachad fil. Länkarna ligger kvar
// i server-HTML:en (lib/meganav-ssr.test.ts), och menyn ser likadan ut: panelerna
// är dolda tills man hovrar, och då har siffrorna redan kommit.
//
// LÖVMODUL, testad i lib/meny-antal.test.ts.

type Nod = { slug: string; count: number; subs: { slug: string; count: number }[] };

/** slug → antal, för huvudkategorier och underkategorier. */
export function menyAntal(trad: readonly Nod[]): Record<string, number> {
  const ut: Record<string, number> = {};
  for (const m of trad) {
    ut[m.slug] = m.count;
    for (const s of m.subs) ut[s.slug] = s.count;
  }
  return ut;
}

/** Samma träd med alla antal nollade — det som skickas med sidan. */
export function utanAntal<T extends Nod>(trad: readonly T[]): T[] {
  return trad.map((m) => ({ ...m, count: 0, subs: m.subs.map((s) => ({ ...s, count: 0 })) }));
}

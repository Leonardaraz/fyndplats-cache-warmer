// lib/pdp-val-bild.ts
//
// Bilden som produktsidan visar när adressen pekar på ett annat val än förvalet.
//
// MÄTT 2026-11-20 mot www (mobil, 4 Mbit/s, 100 ms, processor ÷4): en landning
// med ?variant= på ett annat val än förvalet ritade sidan efter 0,5–0,9 s med
// bilden dold, och rätt bild började hämtas först när sidan hydrerat, 1,8–2,3 s
// in. Den syntes efter 2,4–2,9 s, mot 0,8 s för en landning på förvalet. Så
// kommer varje klick från Google Shopping in (flödet länkar varje färg med sin
// variant), och varje kort i en färgfiltrerad lista (?farg=). Det är det
// Leonard beskrev: "huvudbilden laddas och syns långsamt ibland".
//
// Servern vet vilken bild varje val visar. Den här modulen räknar fram det med
// SAMMA regler som väljaren (components/productview.tsx, valjId och valjFarg),
// och sidans tidiga skript (app/produkt/[slug]/page.tsx) hämtar bilden direkt
// och visar den i bildrutan tills väljaren tagit över.
//
// ☠️ REGLERNA MÅSTE FÖLJA VÄLJAREN. Visar skriptet en annan bild än den som
// väljaren sedan väljer blinkar fel färg förbi, och det är sämre än en dold
// ruta. Ett val utan egen bild får därför ingen bild här: då står rutan dold
// tills väljaren valt, som förut. lib/pdp-val-bild.test.ts låser reglerna.
//
// LÖVMODUL: färgnycklarna och bildregeln skickas in, så att node --test kan
// ladda den utan katalogens data.

type Val = { label: string; image?: string; variantId?: string; inStock?: boolean };
type Rad = { choices: Record<string, string>; variantId?: string; inStock: boolean; image?: string };

export type ValBilder = {
  /** Unika bilder, i den ordning de först förekommer. */
  bilder: string[];
  /** Variant-id (?variant=) → plats i `bilder`. */
  variant: Record<string, number>;
  /** Färgnyckel (?farg=) → plats i `bilder`. */
  farg: Record<string, number>;
};

export function valBilder(
  p: { options?: { choices: Val[] } | null; variantAxes?: readonly unknown[]; variantTable?: readonly Rad[] },
  fargnycklar: (text: string) => Iterable<string>,
  flestaHarBild: (val: Val[]) => boolean,
): ValBilder {
  const ut: ValBilder = { bilder: [], variant: {}, farg: {} };
  const plats = (bild: string | undefined): number | null => {
    if (!bild) return null;
    const finns = ut.bilder.indexOf(bild);
    return finns >= 0 ? finns : ut.bilder.push(bild) - 1;
  };
  const harFarg = (text: string | undefined, nyckel: string) => !!text && new Set(fargnycklar(text)).has(nyckel);
  const allaNycklar = (texter: Iterable<string>) => {
    const nycklar = new Set<string>();
    for (const t of texter) for (const k of fargnycklar(t || "")) nycklar.add(k);
    return nycklar;
  };

  // Flera axlar (Färg × Storlek): varje rad i tabellen bär sin bild.
  const tabell = p.variantTable ?? [];
  if ((p.variantAxes?.length ?? 0) >= 2 && tabell.length >= 1) {
    for (const rad of tabell) {
      const i = plats(rad.image);
      if (i !== null && rad.variantId) ut.variant[rad.variantId] = i;
    }
    // ?farg=: första raden i lager som bär färgen, annars den första (valjFarg).
    for (const nyckel of allaNycklar(tabell.flatMap((t) => Object.values(t.choices)))) {
      const med = tabell.filter((t) => Object.values(t.choices).some((l) => harFarg(l, nyckel)));
      const i = plats((med.find((t) => t.inStock) ?? med[0])?.image);
      if (i !== null) ut.farg[nyckel] = i;
    }
    return ut;
  }

  // En axel: galleriet hoppar bara till valets bild när (nästan) alla val har en.
  const val = p.options?.choices ?? [];
  if (val.length < 2 || !flestaHarBild(val)) return ut;
  for (const c of val) {
    const i = plats(c.image);
    if (i !== null && c.variantId) ut.variant[c.variantId] = i;
  }
  // ?farg=: ett val i lager vinner över ett slutsålt med samma färg (valjFarg).
  for (const nyckel of allaNycklar(val.map((c) => c.label))) {
    const kandidater = val.filter((c) => harFarg(c.label, nyckel));
    const i = plats((kandidater.find((c) => c.inStock !== false) ?? kandidater[0])?.image);
    if (i !== null) ut.farg[nyckel] = i;
  }
  return ut;
}

/**
 * Tillägget till sidans tidiga skript: hämta valets bild och visa den i
 * bildrutan. Körs inne i skriptets gren för "adressen pekar på ett annat val",
 * där `v` och `f` är adressens variant och färg.
 *
 * `kandidater` är [src, srcset] per bild, byggda med galleriets egen laddare
 * (lib/hjaltebild-varm.ts), så att webbläsaren väljer samma fil som galleriet
 * sedan begär. Bilden visas som bakgrund i .gmain medan sidans egna bilder är
 * dolda, och galleriet tar bort den när dess eget lager visas.
 */
export function valBildSkript(vb: ValBilder, kandidater: ReadonlyArray<readonly [string, string]>, sizes: string): string {
  if (vb.bilder.length === 0) return "";
  const j = (x: unknown) => JSON.stringify(x).replace(/</g, "\\u003c");
  return (
    `var B=${j(kandidater)},i=v?${j(vb.variant)}[v]:${j(vb.farg)}[f],b=typeof i==='number'?B[i]:null;` +
    "if(b){var im=new Image();" +
    `im.sizes=${j(sizes)};if(b[1])im.srcset=b[1];` +
    "im.onload=function(){if(!document.getElementById('pdp-val-vantar'))return;" +
    "var t=document.createElement('style');t.id='pdp-val-bild';" +
    "t.textContent='.pdp .gallery .gmain{background-image:url(\"'+(im.currentSrc||im.src)+'\");background-size:cover;background-position:center}.pdp .gallery .gmain .ghero-spin{display:none}';" +
    "document.head.appendChild(t);setTimeout(function(){t.remove()},8000)};" +
    "im.src=b[0]}"
  );
}

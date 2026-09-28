// Vilka mediafiler använder en produkt?
//
// ☠️ EN DEFINITION, TVÅ LÄSARE. Bildstädningen (lib/aosom/media-cleanup.ts)
// avgör med den vilka filer som är i bruk, och raderingen av pensionerade
// utkast (lib/aosom/pensionerade.ts) avgör med den vilka av en produkts filer
// som också sitter på en annan produkt. Två egna tolkningar hade glidit isär —
// och glider de isär åt fel håll raderar städningen en fil som raderingen
// trodde var skyddad.

/** Wix media-URL:er kan bära query-parametrar; nyckeln är filens id-del. */
export function mediaNyckel(url: string): string {
  const utanQuery = (url || "").split("?")[0];
  return utanQuery.split("/").pop() ?? utanQuery;
}

export interface MediaRef {
  id?: string;
  url?: string;
  image?: { id?: string; url?: string };
}

/** De delar av en V3-produkt (sökprojektionen med MEDIA_ITEMS_INFO) som bär media. */
export interface ProduktMedia {
  media?: {
    main?: MediaRef;
    itemsInfo?: { items?: MediaRef[] };
  };
  options?: Array<{
    choicesSettings?: { choices?: Array<{ linkedMedia?: MediaRef[] }> };
  }>;
}

/**
 * Nycklarna (filernas id-del) för varje fil produkten använder: huvudbilden,
 * galleriet och varje vals kopplade bild. Utan dubbletter.
 *
 * Både id och URL läses när båda finns. I dag är de samma sträng (uppmätt
 * 2026-09-28 på en sammanslagen sida: galleriets `id` är filnamnet i URL:en),
 * men för en spärr är en nyckel för mycket ofarlig och en för lite dyr.
 *
 * `linkedMedia` tillför i dag ingenting: Wix kräver att en kopplad bild också
 * ligger i galleriet (lib/wix/media-audit.ts). Den läses ändå, så att skyddet
 * inte hänger på att den invarianten fortsätter gälla.
 */
export function produktensMedianycklar(p: ProduktMedia): string[] {
  const ut = new Set<string>();
  const lagg = (m?: MediaRef) => {
    if (!m) return;
    const url = m.image?.url ?? m.url;
    if (url) ut.add(mediaNyckel(url));
    const id = m.image?.id ?? m.id;
    if (id) ut.add(mediaNyckel(id));
  };
  lagg(p.media?.main);
  for (const it of p.media?.itemsInfo?.items ?? []) lagg(it);
  for (const o of p.options ?? []) {
    for (const c of o.choicesSettings?.choices ?? []) {
      for (const m of c.linkedMedia ?? []) lagg(m);
    }
  }
  return [...ut];
}

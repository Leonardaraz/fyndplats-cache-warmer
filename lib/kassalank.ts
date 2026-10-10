// lib/kassalank.ts
// Kassans adress förbereds medan varukorgen är öppen, så att "Till kassan"
// kan gå direkt i stället för att vänta på två anrop till Wix (2–4 s i
// mätningen 2026-10-09, från tryck till att adressen bytts).
//
// Det går för att adressen bara beror på vagnen: i Cart v2 är vagnens id
// kassans id, och adressen bär inget tidsbegränsat värde. Uppmätt samma dag:
// parametrarna är appSectionParams, origin, headlessExternalUrls,
// hideLoginLogoutBar och headlessClientId, ingen nyckel och ingen JWT. Kassan
// läser vagnens innehåll när den öppnas, så en ändrad mängd i lådan efter
// förberedelsen syns ändå i kassan.
//
// Minnet håller EN vagn. Ett misslyckat bygge sparas aldrig, så nästa försök
// bygger om, och trycket på knappen bygger alltid själv om inget färdigt finns.

export type Kassalank = { target: string; vag: string };

type Post = { nyckel: string; lofte: Promise<Kassalank>; skapad: number };

export type KassalankMinne = {
  /** Startar bygget om det inte redan finns ett färskt för samma vagn. */
  forbered(nyckel: string, bygg: () => Promise<Kassalank>): Promise<Kassalank>;
  /** Det färdiga eller pågående bygget för vagnen, annars null. */
  hamta(nyckel: string): Promise<Kassalank> | null;
  glom(): void;
};

/** 30 minuter: adressen åldras inte, men en flik som stått öppen länge ska
 *  inte lita på något som byggdes i en annan session. */
export const KASSALANK_MAX_ALDER_MS = 30 * 60 * 1000;

export function skapaKassalankMinne(opts: { maxAlderMs?: number; nu?: () => number } = {}): KassalankMinne {
  const maxAlder = opts.maxAlderMs ?? KASSALANK_MAX_ALDER_MS;
  const nu = opts.nu ?? Date.now;
  let post: Post | null = null;

  const farsk = (nyckel: string): Post | null =>
    post && nyckel && post.nyckel === nyckel && nu() - post.skapad < maxAlder ? post : null;

  return {
    forbered(nyckel, bygg) {
      const f = farsk(nyckel);
      if (f) return f.lofte;
      const lofte = bygg();
      const ny: Post = { nyckel, lofte, skapad: nu() };
      post = ny;
      lofte.catch(() => {
        if (post === ny) post = null;
      });
      return lofte;
    },
    hamta(nyckel) {
      return farsk(nyckel)?.lofte ?? null;
    },
    glom() {
      post = null;
    },
  };
}

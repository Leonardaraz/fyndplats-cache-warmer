// Wix Categories API ger högst 100 kategorier per sida. Butiken läste bara
// första sidan, och 2026-09-24 passerade katalogen 100 kategorier: först föll en
// (Golvlampor, högst id), sedan nio när åtta nya kategorier skapades, bland dem
// Skönhet & Hälsa. De som föll bort försvann ur menyn och gav 404 på
// kategorisidan, eftersom sidan skiljer "okänd slug" från "känd men tom" med
// samma lista. Golvlampor svarade 404 i produktion innan felet hittades.
//
// Sidorna hämtas nu tills Wix säger att det inte finns fler. SDK:ts next()
// skickar bara markören, aldrig filtret. Wix svarar 400 INVALID_CURSOR på
// filter + markör, så det får inte läggas till för hand.
//
// Taket kastar i stället för att kapa: en avkortad kategorilista ser frisk ut
// och ger ändå 404 på riktiga sidor.

export type Kategorisida<T> = {
  items?: T[];
  hasNext?: () => boolean;
  next?: () => Promise<Kategorisida<T>>;
};

export const KATEGORI_SIDTAK = 20; // 2 000 kategorier; katalogen har drygt 100

export async function hamtaAllaKategorier<T>(
  forstaSidan: () => Promise<Kategorisida<T>>,
  sidtak: number = KATEGORI_SIDTAK,
): Promise<T[]> {
  let sida = await forstaSidan();
  const alla: T[] = [...(sida.items || [])];
  let antalSidor = 1;
  while (sida.hasNext && sida.hasNext()) {
    if (antalSidor >= sidtak) {
      throw new Error(
        `kategorifrågan har fler än ${sidtak} sidor (${alla.length} kategorier hittills) — avbryter hellre än kapar listan`,
      );
    }
    if (!sida.next) throw new Error("kategorisidan säger hasNext() men saknar next()");
    sida = await sida.next();
    alla.push(...(sida.items || []));
    antalSidor++;
  }
  return alla;
}

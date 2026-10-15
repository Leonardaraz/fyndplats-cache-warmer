// Landet på en adress i kundens mejl.
//
// Wix anger landet som kod ("SE"), och orderbekräftelsen skrev koden rakt av:
// en svensk leveransadress slutade med raden "SE". Svenska adresser får nu
// "Sverige". Andra länder visas som förut.

const SVENSKA_LANDNAMN: Record<string, string> = { SE: "Sverige" };

export function landnamn(kod?: string, fullnamn?: string): string | undefined {
  const k = (kod ?? "").trim();
  const svenskt = SVENSKA_LANDNAMN[k.toUpperCase()];
  if (svenskt) return svenskt;
  return k || (fullnamn ?? "").trim() || undefined;
}

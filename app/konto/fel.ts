// Felkoderna från /api/konto/* som text för kunden.

export const FELTEXT: Record<string, string> = {
  epost: "Skriv en giltig e-postadress.",
  "fel-kod": "Koden stämmer inte. Kontrollera siffrorna och försök igen.",
  utgangen: "Koden eller länken har gått ut. Be om en ny kod.",
  anvand: "Koden eller länken är redan använd. Be om en ny kod.",
  "for-manga-forsok": "För många felaktiga försök. Be om en ny kod, eller vänta till i morgon.",
  "for-tatt": "Vänta en halv minut innan du ber om en ny kod.",
  "for-manga": "Du har bett om många koder på kort tid. Vänta en stund och försök igen.",
  mejl: "Mejlet kunde inte skickas just nu. Försök igen om en stund.",
  stangd: "Inloggningen är inte öppen just nu.",
  sparrad: "Kontot är spärrat. Kontakta kundtjänst så hjälper vi dig.",
  lank: "Länken var trasig. Be om en ny kod.",
  tillfalligt: "Något gick fel hos oss. Försök igen om en stund.",
};

export function feltext(kod: string | undefined | null): string | null {
  if (!kod) return null;
  return FELTEXT[kod] ?? FELTEXT.tillfalligt;
}

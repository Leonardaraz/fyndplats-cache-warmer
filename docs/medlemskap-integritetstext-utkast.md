# Utkast: integritetstext för medlemskontot (J4)

✅ **Godkänd av Leonard 2026-11-05 och publicerad** i `app/sekretesspolicy/page.tsx`
under rubriken Medlemskonto. Sidan är det som gäller; den här filen är
utkastet som godkändes. Två ändringar gjordes vid publiceringen för att texten
ska stämma med koden:

- "en krypterad kontrollsumma" blev "en kontrollsumma": koden och IP-adressen
  sparas som HMAC, som inte är kryptering.
- "De mejlen hör till kontot och är inte marknadsföring" blev att mejlen om
  nivån går att sluta få, med länken i mejlet eller på Mina sidor. De uppmanar
  till köp och har därför avregistrering (List-Unsubscribe).

Ett utkast till ett nytt avsnitt i /sekretesspolicy, för Leonards godkännande.
Det ska vara publicerat innan medlemskapet slås på för alla (läget `pa`).
Texten beskriver bara det som E1 gör; medlemspriser (E2) och företag (E3)
kräver ett tillägg.

Två saker att ta ställning till står sist.

---

## Medlemskonto

Du kan skapa ett konto hos oss för att se din medlemsnivå, dina köp och dina
ordrar. Du loggar in med en kod eller länk som vi mejlar till dig; vi har
inga lösenord.

**Vad vi sparar**

- Din e-postadress, när kontot skapades och när du senast loggade in.
- Dina köp hos oss: ordernummer, datum, vad du betalade för varorna och vad
  du har fått tillbaka. Vi räknar köp med samma e-postadress, också köp du
  gjorde innan du skapade kontot.
- Din medlemsnivå och när den har ändrats.
- För inloggningen: när du bad om en kod, och en krypterad kontrollsumma av
  koden och av din IP-adress. Koden och IP-adressen sparas inte i klartext.

**Varför**

- För att ge dig kontot och räkna din medlemsnivå. Det är en del av avtalet
  om medlemskapet (GDPR artikel 6.1 b).
- För att skydda kontot mot intrång och missbruk, till exempel att någon
  försöker gissa koder. Det är vårt berättigade intresse (artikel 6.1 f).

**Mejl**

Vi mejlar dig när kontot skapas, när du når en ny nivå och två veckor innan
din nivå sjunker. De mejlen hör till kontot och är inte marknadsföring.

**Kakor**

När du är inloggad sparar vi kakan `fp_medlem` i din webbläsare i högst 90
dagar. Den behövs för att du ska förbli inloggad och kräver inget samtycke.
Kakan `fp_medlem_lank` finns i högst 15 minuter, medan du loggar in med
länken.

**Hur länge**

- Kontot sparas tills du ber oss ta bort det.
- Köpen räknas i nivån i 365 dagar. Uppgifterna om köpen sparas så länge
  bokföringslagen kräver för ordern.
- Inloggningsförsök sparas i 30 dagar.

**Ta bort kontot**

Mejla info@fyndplats.com så tar vi bort kontot. Dina ordrar finns kvar, som
bokföringslagen kräver.

---

## Att ta ställning till

1. **30 dagar för inloggningsförsöken.** Nattjobbet tar bort äldre försök
   varje natt (`gallraInloggningar`). Kortare går bra; försöken behövs bara
   för spärrarna, som räknar den senaste timmen och det senaste dygnet.
2. **Borttagning av ett konto** görs för hand i E1 (via motorns admin). En
   knapp "Ta bort mitt konto" på Mina sidor kan byggas i E2 om du vill.

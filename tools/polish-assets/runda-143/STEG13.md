# Runda 143 — Steg 12 + 13: läst som kund, och sjutton sidor LIVE

## Steg 12 — den halva ingen grind klarar

**Mekaniska halvan**, 267 fält över 17 produkter (html, namn, titel, meta,
slug, sökord och samtliga 97 alt-texter):

| kontroll | utfall |
|---|---:|
| osynliga tecken (U+00AD, U+00A0, U+200B, U+200C, U+200D, U+2060, U+FEFF) | **0** |
| defensiv ton (`leverantören anger`, `kontrollera själv`, `var ärlig` …) | **0** |

Osynliga tecken passerar varje annan grind — lintet ser ett giltigt ord,
längdkontrollen ser ett giltigt tecken, och Wix normaliserar dem inte bort.
Det är fyra tecken och en regex, och de går inte att se i efterhand.

**Läsningen.** Sidorna lästes som en kund, inte som en kontrollant. Det som
ska stå med står med som ett positivt villkor, inte som en varning —
`b6c4c619`s avsnitt heter *"Underlaget avgör, inte fästet"*, säger rakt ut att
en gipsskiva inte håller en säck som får en spark, och erbjuder sedan två
fristående alternativ i stället för att lämna kunden med ett nej.

## Steg 13 — publicerade

Alla sjutton står `visible: true`, varianten är synlig, och SKU:n är
oförändrad. Kvitterat med en återläsning per produkt, inte ur PATCH-svaret.

### ☠️ Publiceringen AVVISADES först — och det var rätt av den

Runbokens Steg 13 säger att den avslutande PATCH:en ska bära `visible: true`
på BÅDE produkt och variant. En variant-PATCH skrevs därför med
`variantsInfo.variants`, och Wix svarade **400 på alla sjutton**:

```
variants [at index 0] is invalid: price must not be empty
```

`variantsInfo` ERSÄTTER varianten i sin helhet, så priset måste skickas med.
☠️ **Och priset rör poleringen aldrig.** Att echo:a tillbaka det lästa priset
hade varit en prisskrivning i allt utom avsikt — och en felläst fältform hade
blivit ett fel pris till kund.

✅ **Frågan var fel ställd: varianterna VAR redan synliga.** Steg 8:s
variantsInfo-PATCH satte `visible: true` på varje variant, och en läsning
bekräftade det på alla sjutton. Den avslutande skrivningen behövde alltså
bara produktens fält, och `variantsInfo` utelämnades helt — då finns inget
pris i kroppen att skriva fel.

**Regeln: läs vad som redan står innan du skriver om det.** Runbokens krav är
att BÅDA leden ska vara `true` när sidan går live, inte att båda måste
skrivas i samma anrop. Att de 400:orna kom är dessutom det goda utfallet —
skrivningen föll rent i stället för att gå igenom halvt.

Priset kontrollerades ändå, som mätning och inte som antagande: varje produkts
variantpris hashades före och efter publiceringen. **17 av 17 orörda.**

### Flikstrukturen före publicering

Butikens `splitFlikar` känner exakt fyra rubriker, och lägger allt EFTER en
matchande rubrik i den fliken. Ett block mellan två flikrubriker hamnar alltså
i den föregående. Kontrollerat mekaniskt på alla sjutton: tre obligatoriska
rubriker, exakt en gång var, i rätt ordning, och **noll block efter den
första** — korslänkarna (`Vill du ha säcken på köpet?`, `Ingen vägg som
duger?`) ligger före spec-tabellen.

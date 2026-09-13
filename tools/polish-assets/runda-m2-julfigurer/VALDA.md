# Runda M2 — åtta uppblåsbara julfigurer

Åtta tyska Aosom-utkast ur julsortimentet, valda efter ett medvetet BRETT
familjesvep: namnfiltret hade missat familjemedlemmar två gånger tidigare
(M1 tappade både `321bdedf`, som börjar "Lebkuchenmann" och aldrig säger
"Weihnacht", och `7bc7805a`, som säger "Rentier").

| kort | vad det är | höjd | lager |
| :-- | :-- | --: | --: |
| `321bdedf` | pepparkaksgubbe med polkagriskäpp och tre paket | 245 cm | 184 |
| `80e1a550` | tomte med grön julklappssäck | 240 cm | 131 |
| `2f881d00` | tomte i släde med ren **och hund** | 122 cm | 197 |
| `032b728d` | tomte med julgran | 243 cm | 197 |
| `46dd0605` | tomte med polkagriskäpp, **gröna** vantar | 243 cm | 197 |
| `7bc7805a` | uppblåsbar ren | 180 cm | 119 |
| `d6413671` | tomte med polkagriskäpp, **svarta** vantar | 240 cm | 197 |
| `32bc0d95` | vinkande tomte | 184 cm | 93 |

## Urvalsgrindar

**Lager:** alla åtta har kvantitetsspårning och saldo 93–197. Kollen ligger i
urvalet sedan #173 — en sida för en vara ingen kan köpa är slöseri i båda ändar.

**Dubblettskärm på huvudbildens hash** (#243), noll nedladdningar: åtta unika
huvudbilder, ingen delad. De åtta är alltså inte varandras dubbletter.

☠️ **Men skärmen räcker inte mot planschen.** Se `FOTOFYND.md`: hash-svepet gav
tre produkter med reklamplansch, ögonen gav fem. Planschen finns i minst två
byte-varianter och under två husmärken.

## Vad fotona ändrade

`FOTOFYND.md` i sin helhet. Kort:

1. ☠️ `d6413671`s källa säger `Gehstock` (promenadkäpp); fotot visar en
   **polkagriskäpp**. Källan motsäger sig själv — dess egna alt-texter säger
   `Zuckerstange`. Ingen grind kunde ha sett det.
2. ☠️ Fem produkter bar reklamplansch, inte tre. Hashen grupperar; den
   klassificerar inte.
3. `2f881d00` har en **hund i tomteluva** i en grön klappsäck som inget ord i
   källan nämner. Den är nu första styckets bästa detalj.
4. `032b728d`s ritning säger 240 cm där specen, namnet och den svenska
   spec-raden säger 243. Tiebreaker: den spec-rad kunden ser.

## Grindarna

Alla rena, noll varningar: `gate.py` (siffror mot `kallor.json`), `gate-axel.py`,
`gate-alt.py`, `gate-seo.py`, `gate-sku.py`, `gate-superlativ.py`,
`gate-lankar.py`. `gate-fragment.py` gäller inte en full text — den är byggd för
tilläggsfragment och ger samma tio fynd på M1, som publicerades korrekt.

☠️ **Axelgrinden var DÖD och är lagad.** Se commit-meddelandet och
`polish-gates/bygg-axelfacit.py`. M1 publicerades på ett kvitto som inte kunde
falla; alla fem rundor med facit är omkörda och rena, så hålet var latent.

⚠️ **Två kyrilliska homoglyfer fångades av eget svep** före grindningen —
`bredd`+`е` (U+0435) och `hylla`+`а` (U+0430). Samma defekt som batch 65, och
det svepet körs nu före varje skrivning.

## Skrivningen: tre PATCH, och ordningen är inte valfri

☠️ **SKU:n måste skrivas SIST och ENSAM.** Uppmätt: en kombinerad PATCH med
`name` + `slug` + `plainDescription` + `seoData` + `visible` + `variantsInfo`,
följd av en media-PATCH, skrev allt UTOM variantens SKU — på tre av fyra
produkter. Svaret sa 200, `bulkActionMetadata` fanns inte att läsa, och den
gamla tyska SKU:n stod kvar. Skriven i ett eget efterföljande anrop tog den på
alla åtta.

☠️ **Och en omedelbar återläsning är inte heller ett kvitto.** Den första
batchens verifiering läste tillbaka `321bdedf` och `80e1a550` direkt efter
skrivningen och rapporterade att INGENTING hade skrivits: gammal text, gammal
slug, `visible: false`, fem seo-taggar. En läsning en stund senare visade
`revision 4`, ny text, ny slug och `visible: true` — skrivningen hade tagit hela
tiden. Läsprojektionen släpar alltså efter skrivningen även på PRODUKTEN, inte
bara på kategorier.

**Regeln blir därför tvådelad:** ett svar utan fel är inget kvitto (#253), och
en återläsning i samma andetag är inte heller ett. Verifiera i ett SEPARAT
anrop, och läs om innan du kallar en skrivning misslyckad — annars skriver man
om något som redan stämmer.

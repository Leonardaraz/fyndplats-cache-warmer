# Samordning av #647 och #651 (2026-09-24)

Två butiks-PR:er bygger på samma `headless-site` (`1779e155`) och går inte
att merga båda utan handpåläggning:

| PR | innehåll | mergas |
|---|---|---|
| #647 | sökordskategorierna S6–S14, brödsmulan, menyn, fyra butiksfel | triggern 2026-09-25 06:30 UTC |
| #651 | leveranslöftet 3–7 → 3–6 arbetsdagar, EU-raden bort ur produktsidans trygghetslista (en annan session) | när Leonard säger till (föreslaget 03:00) |

Den som mergas sist får konflikten. Uppmätt genom att slå ihop `02f123f9`
och `1b0cc5d0`:

- **Sex block, i två filer:** `lib/category-seo.ts` (1) och
  `lib/category-content.ts` (5). Blogginlägget, produktsidan och CSS:en slås
  ihop av sig själva, och resultatet är #647:s ändringar ovanpå #651:s.
- **Alla sex gäller de fem sidor som #647 skriver om:** Belysning,
  Förvaring & Organisering, Kropp & Välbefinnande, Massage & Återhämtning och
  Träning & Gym. #651 byter bara 3–7 mot 3–6 i de gamla texterna, och #647:s
  nya texter nämner ingen leveranstid. **#647:s sida är alltså rätt i alla
  sex block, i båda ordningarna.**
- **Inga av #647:s 63 nya sidor nämner någon leveranstid.** Diffen visar 15
  rader med "3–7" som tillagda, men de är gamla texter som diffen tror har
  flyttats när nya sidor lagts in mellan dem.

☠️ **Två block ser felplacerade ut.** Konstväxter står mot Kropp &
Välbefinnande och Speglar mot Träning & Gym, eftersom #647 lägger nya sidor
mellan de gamla. Tar man den andra sidan där försvinner Konstväxters och
Speglars nya text. Seo-blocket bär dessutom tre nya sidor (Badrumsspeglar,
Barbord, Barnmöbler) utöver Belysning.

☠️ **Använd inte `git checkout --ours` eller `--theirs` på filerna.** De tar
hela filen från ena sidan och tappar #651:s 3–6 i de 54 poster som bara #651
har rört.

## Så här

**#651 mergas först.** Kör i #647-grenen (`claude/sasongskategorier-s6-bz3j9l`):

```
git merge origin/headless-site      # konflikt i exakt de två filerna, annars: stanna och titta
python3 <denna katalog>/ta-647-sidan.py --sida var lib/category-seo.ts lib/category-content.ts
python3 <denna katalog>/trevagskoll.py . $(git merge-base HEAD MERGE_HEAD) HEAD MERGE_HEAD
```

**#647 mergas först.** Kör i #651-grenen:

```
git merge origin/headless-site
python3 <denna katalog>/ta-647-sidan.py --sida deras lib/category-seo.ts lib/category-content.ts
python3 <denna katalog>/trevagskoll.py . $(git merge-base HEAD MERGE_HEAD) MERGE_HEAD HEAD
```

Kontrollen körs innan sammanslagningen committas, medan `MERGE_HEAD` finns.
Argumenten är alltid `<bas> <#647> <#651>`, därför byter `HEAD` och
`MERGE_HEAD` plats mellan de två fallen.

`trevagskoll.py` läser kategoritexterna ur basen, ur båda PR:erna och ur den
sammanslagna koden, och prövar varje slug. Om #647 har lagt till eller ändrat
en slug ska resultatet vara #647:s version. Annars ska det vara #651:s om #651
har ändrat den, och basens om ingen har det. En slug som båda har ändrat
godtas bara om #651:s ändring är en ren 3–7 → 3–6.

## Utfall 2026-09-24

| lösning | seo | content | "3–7" kvar |
|---|--:|--:|--:|
| `ta-647-sidan.py`, #651 först | **122 av 122** | **122 av 122** | 0 |
| `ta-647-sidan.py`, #647 först | **122 av 122** | **122 av 122** | 0 |
| fel sida i blocken | 117 av 122 | 117 av 122 | 0 |
| `git checkout --ours` | 105 av 122 | 85 av 122 | 66 |

De två sista raderna visar att kontrollen kan fälla.

På den korrekta sammanslagningen gav butikens tester 816 av 816,
`jamfor.mts` i S6–S14 noll avvikelser på 69 källfiler, och `tsc` noll fel
utanför testfilerna (81 i `.test.ts`, samma som #647 ensam).

## Utfört 2026-09-24

#651 mergades 15:41 UTC med ett huvud till, `f03f6eab`, som lade till ett
PriceRunner-flöde (tre nya filer och åtta rader i `lib/shipping.ts`). Det
rörde inga filer som #647 rör, och konflikten blev exakt den uppmätta: två
filer, sex block. Receptet kördes i #647-grenen, och sammanslagningen är
`f06de05c`:

| kontroll | utfall |
|---|---|
| `trevagskoll.py` | 122 av 122 för både seo och content, inget 3–7 kvar |
| butikens tester | 824 av 824 (816 plus #651:s åtta för PriceRunner-flödet) |
| `jamfor.mts` i S6–S14 | 0 avvikelser på 69 källfiler |
| `tsc` | 0 fel utanför testfilerna |

Förhandsbygget `dpl_AZSB493P7R2U8PEvuL3Y5nqS1i5x` (READY efter drygt tre
minuter):

| kontroll | utfall |
|---|---|
| kategorisidorna S6–S14 mot källfilerna | 69 av 69, sitemapen 120 kategoriadresser |
| `lackkoll.py` | inga fel |
| `menykoll.py` mot produktion | 10 dolda paneler och 114 underkategorier på varje sida, mot 0 på startsidan i produktion |
| #651 i samma bygge | 3–6 på produktsidan, inget 3–7, `transitTime` 6 dagar, `/feed/pricerunner.xml` 200 med 4 007 produkter |

S4:s sexton sidor gav OK i produktion efter #651.

⚠️ **Rättelse: S4:s facit ska INTE ändras.** Första versionen av den här
README:n sa att `runda-s4-sokordskategorier/sandlador-text.json` bär 3–7 och
skulle bytas till 3–6. Strängen är barnens **ålder** i belägget ("3–7 år"),
inte leveranstiden, och Sandlådor-sidan nämner ingen leveranstid alls. Ett
blint sök-och-ersätt på "3–7" hade gjort facit fel.

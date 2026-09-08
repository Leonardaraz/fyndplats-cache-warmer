# Runda 103 — LIVE

Tre sidor publicerade, stämplade och live-grindade. En fjärde kandidat föll på
måttritningen och en femte togs av den andra sessionen mitt i rundan.

| id8 | färg | pris | slug | SKU |
|---|---|--:|---|---|
| `c396356f` | ljusgrå | 4 579 | `massagefatolj-ljusgra-vippfunktion-landvarme` | `FP-massagefatolj-ljusgra-vippfunktion` |
| `a7f029bf` | mörkbrun | 4 619 | `massagefatolj-morkbrun-vippfunktion-landvarme` | `FP-massagefatolj-morkbrun-vippfunktion` |
| `7e84e482` | cremevit | 4 819 | `massagefatolj-cremevit-vippfunktion-landvarme` | `FP-massagefatolj-cremevit-vippfunktion` |

Publicerat syskon, skrivet av den ANDRA sessionen 15:22: `297d8979`, svart,
4 979 kr. Familjen är därmed komplett i fyra färger.

## Steg 3 — prisgrinden grön på alla fyra

| id8 | artikelnummer | landat | förväntat | i Wix |
|---|---|--:|--:|--:|
| `c396356f` | `700-050V94GY` | 3 813,71 | 4 579 | 4 579 ✅ |
| `a7f029bf` | `700-050V94DR` | 3 845,42 | 4 619 | 4 619 ✅ |
| `7e84e482` | `700-050V94CW` | 4 009,60 | 4 819 | 4 819 ✅ |
| `a0760ed1` | `700-050V94LR` | 3 681,72 | 4 419 | 4 419 ✅ |

Alla ×1,2 med `charm99`. Fraktandel 0,29–0,32 — långt under 0,5.

## Steg 4 — måttritningen fällde `a0760ed1`

Se `STEG4.md`. Kort: dess tyska spec-block är BYTE-IDENTISKT med modell A:s,
men ritningen säger `85 × 94 × 104`, `150°` och `150 kg`. Leverantören har
kopierat texten mellan två olika stolar. ☠️ Artikelnumrets bas `700-050V94` är
identisk på båda, så runda 61:s mekaniska syskongrind svarade "samma modell" på
två olika varor.

Bilderna i övrigt rena: fyra huvudbilder, fyra måttritningar, noll logotyper,
noll tysk text i pixlarna.

## Steg 9 — bildtexterna

Alla femton bilder fick svensk alt-text, skriven efter att bilden GRANSKATS,
inte gissad ur syskonets. `7e84e482` hade **inga** alt-texter alls.

⚠️ Positionerna 4 och 5 visar båda fåtöljen med fotstödet UTFÄLLT — de skiljs
åt av miljön (krukväxt respektive bokhylla), inte av läget.

## Steg 13 — stämplarna

Tre `stampla`-körningar, alla `success` (2122, 2123, 2124).
`needsAiPolish:false`, `draftStatus:published`, egen SKU per variant.

☠️ **SKU-krocken (#272) är löst för de tre.** Före rundan bar `c396356f`,
`a7f029bf` OCH `7e84e482` alla samma SKU `FP-massagesessel-mit-wipp` — importen
härleder den ur det tyska namnet, som är identiskt för alla färger.

## Steg 14 — live-grinden grön

88 meningar prövade ORDAGRANT mot den grindade filen över tre sidor, **noll
saknade**. Noll aktörsord, artikelnummer, husmärken, tyska ord, landnamn eller
osynliga tecken — mätt mot en kontrollsida vars egna träffar dras bort.

⚠️ ISR: de tre nya sidorna var uppe efter **två varv** (16:28 → 2/3, 16:29 →
3/3), inte de ~15 minuter runda 102 mätte.

## ✅ Det publicerade syskonet fick sin syskonlista

`297d8979` korslänkade bara till en ANNAN modell. Nu när tre färgsyskon finns
bär den alla tre — det är #295 fångad i samma runda den uppstod i, i stället
för som en efterhandsstädning. Bara det stycket rördes; revision 6 → 7.

## Två grindfel jag själv byggde, och båda gav FALSKLARM

1. **Stavningsgrinden läste href.** Slugarna är avsiktligt av-accenterade
   (`…-landvarme`), och grinden läste dem som felstavat "ländvärme" — tre
   falsklarm på tre korrekta sidor. Stavning granskas nu på SYNLIG text.
2. ☠️ **Live-grinden strök taggar utan mellanslag.** `135 kg.</p><h3>Åtta` blev
   `135 kg.Åtta` — en mening som aldrig funnits, och grinden fällde **14 av 29
   korrekta stycken per sida**. Med mellanslag: 0 saknade.

Husets egen regel gäller grinden själv: **ett falsklarm som alltid fyrar är
lika illa som ett fel ingen ser.** Båda är lagade i `grind.py` och
`livegrind.py`, med kommentar om varför.

## Kvar efter rundan

- **`a0760ed1`** — egen omgång, ritningens tal (#366).
- **`5439026e`** (modell B blå) — uppskjuten tills den andra sessionens `505eb413`
  går att korslänka mot (#295-klassen).
- **Dubblettsvepet mot publicerade sidor** — se `dubblettsvep.py`. Den andra
  sessionen mätte samma dag att en koll mot enbart `Mått:`-raden ger 0 träffar
  där en koll mot varje trippel ger 8.

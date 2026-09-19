# Runda A — barnfåtöljer (`^Kindersessel`), åtta produkter

Familjen tilldelad i `tools/polish-assets/FORDELNING.md` (grenen
`claude/seo-polering-runbook-review-bz3j9l`). Polerad 2026-09-05.

## Steg 1: dubblettkollen, på MÅTT

Ingen av de åtta är dubblett av `barnfatolj-teddyfleece-bjornoron` (1 029) eller
`barnfatolj-med-fotpall` (1 379). Närmast är `31710969` (59 × 41,5 × 49 cm) mot
den publicerade fotpallsfåtöljen (58 × 40,5 × 49) — men 1,5–3 år mot från 3 år,
45 mot 50 kg, och ingen fotpall. Egen produkt.

⚠️ **FORDELNING.md gissade två färgsyskonpar. Måtten gav ett.**

| par | gissning | måtten |
|---|---|---|
| `8f150623` / `b24ce3da` | syskon | **JA** — 3–15 år, 80 kg, 7 kg, 71,5 × 35 × 22,5 cm, identiskt |
| `4e92e841` / `37d254ee` | syskon | **NEJ** — 65 vs 45 kg, 3–5 vs 3–8 år, 6,5 vs 4,8 kg, 50×46×39 vs 43×36×24 |

Det är runbokens egen regel som betalar sig: jämför på mått, aldrig på namn.

## Steg 2-grinden: åldern är ett påstående

Tre av åtta bär en ålder måtten inte bär upp.

| id | påstått | måtten | vad som skrevs |
|---|---|---|---|
| `37d254ee` | "3–8 Jahre" OCH "Zugelassenes Alter: 18 Monate+" | sits 25 cm, 45 kg | ☠️ motsäger sig själv — vi anger **från tre år**, den högre undre gränsen |
| `8f150623` | 3–15 år | sits 26 cm, ryggstöd **25 cm** | **från tre år**, övre gräns utelämnad |
| `b24ce3da` | 3–15 år | identiskt | samma |

Riktningen är medveten: när två undre gränser strider gäller den högre, för det
är den undre gränsen som är säkerhetsrelevant. Ingen EN-norm skrevs ut — källan
nämner ingen.

## SKU-fällan var här

Sex av åtta delade SKU före poleringen: `FP-kindersessel-kindersofa` satt på
FYRA produkter och `FP-kindersessel-mit` på två. Alla åtta har nu var sin.

## Filerna

- `<id>.html` — den svenska brödtexten, det som skrevs till Wix
- `kalla/<id>.txt` — källans tekniska data, underlag för siffergrinden
- `meta.json` — namn, slug, SKU, SEO och alt-texter
- `../gate-runda-a.py` — grinden

Grinden har två halvor, och den andra är den som biter: mönstergrinden letar
husmärken, artikelnummer, fraktland, leverantörsomnämnanden, tyska rester och
homoglyfer — **siffergrinden kräver att varje tal i den svenska texten finns i
källan**. Den behöver inte veta vilka fel någon råkat tänka på i förväg. Verifierad
genom att plantera fyra fel (påhittat mått, husmärke, fraktland, kyrilliskt `а`):
alla fyra fälls, den rena texten går igenom.

## Vad som mättes i drift

- Texten i Wix är **teckenidentisk med källfilerna** för alla åtta (längd +
  checksumma), efter att radbrytningar mellan blockelement räknats bort — Wix
  strippar dem, exakt 16 tecken per fil.
- 40 alt-texter, noll tomma. `4791575c` bar tyska alt-texter före.
- Priserna orörda: 1 399 / 1 159 / 1 129 / 1 119 / 1 099 / 1 079 / 1 079 / 999.

## ☠️ En läsfördröjning som ser ut som ett fel

Återläsningen direkt efter en `variantsInfo`-PATCH gav på `b24ce3da` det GAMLA
värdet — SKU:n oförändrad, `visible:false` — trots att skrivningen gått igenom.
Nästa läsning visade rätt tillstånd på revision 5.

V3:s läsning efter skrivning är alltså inte omedelbart konsistent. Riktningen är
ofarlig: en gammal kopia kan bara ge falskt LARM, aldrig falskt godkänt. Men
drar man slutsatsen "skrivningen tog inte" av en enda läsning skriver man om i
onödan — läs om innan du kör om.

## ☠️ Wix normaliserar ankare — 15 tecken

En länk skriven som

    <a href="https://www.fyndplats.se/produkt/...">grått</a>

lagras av Wix som

    <a href="https://www.fyndplats.se/produkt/..." target="_self">grått</a>

`target="_self"` är exakt 15 tecken, och det räckte för att checksummegrinden
skulle rapportera avvikelse på färgsyskonen. Det är en normalisering, inte en
trasig skrivning — men jämförelsen fil mot butik går bara ihop om källfilen bär
attributet. Den gör den nu.

## ⚠️ Och jag gick i husets egen cache-fälla

Live-grinden rapporterade fem fel på vardera färgsyskon efter att korslänkarna
lagts in: `ORDDIFF + grått.` och `KORSLANK SAKNAS`. Ingenting var fel. Jag hade
väntat 90 sekunder mot ett `x-nextjs-stale-time: 300`, så sidorna jag hämtade var
den version som låg ute FÖRE länken.

CLAUDE.md varnar ordagrant för det här, och varningen är värd att skärpa: det
räcker inte att hämta två gånger. Fönstret måste ha PASSERAT sedan den senaste
renderingen — och min egen tidigare hämtning hade just renderat om sidorna, så
klockan startade om. Efter drygt 300 sekunder: 8/8 rena, noll orddiffar.

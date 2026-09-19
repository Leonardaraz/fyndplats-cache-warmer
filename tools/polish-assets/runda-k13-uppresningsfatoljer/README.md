# Runda K13 — åtta uppresnings- och tv-fåtöljer, 5 169–7 229 kr (2026-09-08)

Katalogvärde **48 973 kr** — rundornas dyraste hittills. Alla åtta var tyska
Aosom-utkast (`visible:false`), alla i lager (39–156 st).

| id | pris | slug |
|---|---:|---|
| `bf2447a6` | 7 229 | `uppresningsfatolj-gra-frotte-60-grader` |
| `501a52e1` | 6 629 | `reclinerfatolj-sammet-morkgra-135-grader` |
| `a3a8d261` | 6 079 | `uppresningsfatolj-hydraulisk-ljusgra-linnelook` |
| `485cf3e8` | 5 999 | `uppresningsfatolj-svart-konstlader-45-grader` |
| `4635adcb` | 5 669 | `uppresningsfatolj-brun-manchester-150-grader` |
| `d3ee8cea` | 5 599 | `uppresningsfatolj-gra-oronlapp-dubbelmotor` |
| `fcac3d22` | 5 599 | `uppresningsfatolj-chenille-nio-massageprogram` |
| `8151ce59` | 5 169 | `uppresningsfatolj-ljusgra-manchester-153-cm` |

Fynden ur källor och kontaktark står i `FYND.md`. Det här är vad RUNDAN
lärde huset.

## ☠️ Urvalet gjordes om — den gamla dubblettkollen såg 0 där 8 låg

Rundans första kandidatlista föll på #219: den strikta kollen mot
`Mått:`-raden gav **0 träffar**, den vida trippelkollen **8** på exakt samma
kandidater. Två av dem var samma stol i samma FÄRG som en sida som redan
ligger ute.

Mätningen står i `../../polish-gates/DUBBLETTMATNING.md`. Urvalet gjordes om
med den vida kollen: 177 fåtöljutkast i lager med mått → 121 kluster →
40 kollisioner avvisade → 81 rena, och de åtta dyraste av dem är den här
rundan.

⚠️ **Och den vida kollen är i sin tur ett golv.** 29 % av de publicerade
sidorna bär ingen trippel alls, alltså kan de aldrig ge en träff. Täckningen
skrivs ut bredvid antalet träffar, annars går en nolla inte att läsa.

## ☠️ `8151ce59`:s spec-flik bär SYSKONETS mått — och det är beviset för trippeln

Källans tyska block säger `79B × 97T × 103H`; den svenska `Mått:`-raden
importen byggde säger `83 × 93 × 110`, vilket är `4635adcb`:s mått.

Hade dubblettkollen läst etiketten hade de två sett identiska ut och den ena
hade pensionerats som färgsyskon. De är två olika stolar och fälls till 153
respektive 158 cm. **Etiketten ljög; texten gjorde det inte.**

## ☠️ Sex av åtta delade TRE tyska SKU:er — femte gången (#199/#200)

Importen härleder variant-SKU:n ur den tyska titelns första ord:

```
FP-fernsehsessel             485cf3e8  OCH  d3ee8cea
FP-fernsehsessel-mit         4635adcb  OCH  8151ce59
FP-elektrischer-relaxsessel  501a52e1  OCH  a3a8d261
```

Tre kollisioner i en enda batch — värre än K12:s två. Alla åtta har nu en
egen svensk SKU på BÅDA sidorna, längst 36 tecken mot Wix tak på 40.

## ⚠️ Fyra självfångade fel i mina EGNA texter, före första grinden

Alla fyra skrevs av mig och fångades av mig vid genomläsningen mot facit:

| fel | vad som var fel |
|---|---|
| *"den brantaste lyften i sortimentet"* | superlativ över en katalog jag inte mätt |
| *"det enklaste i sortimentet att hålla rent"* | samma sak, med räckviddsmarkör |
| *"30 grader från vågrätt"* | 30 är RÄKNAT (150 − 120), inte hämtat ur facit |
| `135` i `d3ee8cea`:s text | talet finns i facit för fyra ANDRA produkter |

De två första är exakt vad `gate-superlativ.py` byggdes för (#213) — och
grinden fällde dem inte, för dess ordlista saknade `brantast` och `enklast`.
Listan är utökad från 19 till 36 ord i `gatelib.py`, och orden får bara
LÄGGAS TILL, aldrig bytas ut (#154).

☠️ Det fjärde är #217 i klartext: siffergrinden kontrollerar att ett tal finns
i RUNDANS facit, inte att det finns i den enskilda produktens. `135` är sant
om fyra av åtta stolar och falskt om `d3ee8cea`, som klarar 120 kg.

## ⚠️ `501a52e1` är sjunde sidan i rad med för få bilder

2 av 5 bilder kvar efter att tre tyska grafiker strukits, och **ingen
måttritning** — på rundans näst dyraste sida. Sällskap: `522103fd` (#216),
`46f475c4` (#212), `7cdc167c` (#166). Fyra sidor väntar nu på egna spec-kort;
det är inte längre ett undantag utan en post i backloggen.

## Kvittona

| steg | resultat |
|---|---|
| Filgrindar | `gate` · `gate-superlativ` · `gate-lager` · `gate-alt` · `gate-seo` · `gate-sku` · `gate-lankar` — alla REN |
| Förbjudna formuleringar | 0 träffar |
| Bildgrind | 19 publicerade × 32 kandidater, lägsta 18,14 (tröskel 1,0); internt inget under 6,0 |
| Hash före/efter skrivning | **8/8 LIKA** (FNV-1a över normaliserad text) |
| Publicering | 8/8 `visible:true`, variant synlig 8/8, 2 SEO-taggar, 0 nyckelord |
| Bilder | 40 → **32**, alt 32/32 verifierade |
| Kategorier | Hem & Inredning 8/8 + Massage & Återhämtning 6/6 |
| Prisgrind | **8/8 `stammer: true`**, regel ×1,20 charm99 |
| Stämpling | 8/8 `needsAiPolish, draftStatus, variantSkus` |
| Oberoende omläsning | Wix: SKU 8/8 rätt, synlig 8/8 · mappning: 8/8 |
| Live | **8/8 REN**, orddiff **0** på alla åtta |
| Live, brett svep | brödsmula 8/8 kategori · flikar 24/24 · `InStock` 8/8, inget `OutOfStock` |

`485cf3e8` och `d3ee8cea` saknar massage och ligger därför bara i
Hem & Inredning — 6 av 8 fick massagekategorin, inte 8.

## Live-grinden är verifierad ÅT BÅDA HÅLLEN

En nolla från en grind mäter grinden, inte verkligheten (#—, SEO-backfillen
2026-09-07). Tre fel planterades därför i `live/bf2447a6.html` efter den rena
körningen:

```
alt="Kunststoff Rückenlehne …"                    -> ALT-svepet
"Artikelnummer: 713-…V90GY" i brödtexten        -> sid-svepet + orddiffen
<title>Fernsehsessel mit Aufstehhilfe Gewicht</…> -> SEO-svepet mot seo.tsv
```

Grinden gav **12 fynd på exakt den sidan** — orddiff, sid-svep, alt-svep och
SEO-svep alla tre — och lämnade de sju andra REN. Filen återställdes och
körningen gav 0 igen.

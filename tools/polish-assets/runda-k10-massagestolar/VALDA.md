# Runda K10 — åtta kontorsstolar med massage, 1 799–2 519 kr

Åtta tyska Aosom-utkast polerade till svenska produktsidor. Alla åtta är
kontorsstolar med vibrationsmassage; sju av dem har dessutom fotstöd och sex
har värme.

| kort | pris | färg | mått (cm) | saldo | särdrag |
|---|--:|---|---|--:|---|
| `924a6f45` | 2 519 | grå mikrofiber | 64 × 69 × 112–120 | 82 | 15 cm stoppning, 135°, sitthöjd 51–59 |
| `d48decb1` | 2 369 | grå linnelook | 66 × 76 × 112–120 | 197 | 155°, avtagbar nackkudde, värme |
| `31cbadae` | 2 249 | grå mikrofiber | 62 × 67 × 113–120 | 79 | smalast i gruppen, värme i midjan |
| `aef1b477` | 2 219 | ljusgrå mikrofiber | 65 × 74 × 111–119 | 80 | 155°, blir 156 cm djup, 19,9 kg |
| `09ae62db` | 2 159 | svart konstläder | 67 × 79 × 111–121 | 197 | **sju** massagepunkter, 90–155° |
| `3829477a` | 2 079 | svart konstläder | 67 × 72 × 111–119 | 91 | 14 cm sits, kromad kryssfot |
| `94979299` | 2 019 | mörkgrå mikrofiber | 66 × 74 × 114–121,5 | 83 | sitthöjd 56–64, 17 cm rygg |
| `820d5370` | 1 799 | mörkbrun konstläder | 64 × 74 × 112–120 | 61 | justerbar gungfunktion, kontrastsöm |

## Urvalet: 21 kandidater → 8

De 21 kvarvarande massagestols-utkasten mättes på mått, färg och saldo INNAN
en enda text skrevs. Tre färgkluster föll bort som grupp:

- **Kluster A — 68 × 72 × 110–120 cm, FEM produkter** i tre grå nyanser inom
  350 kr: `170f0257` 2 329 · `6e810d9c` 2 249 · `bff8e42d` 2 219 ·
  `54f2ba88` 1 999 · `ceb363a0` 1 979. Samma fråga som #184/#156/#197, men
  större — **Leonards beslut**, ska inte bli fem sidor utan hans ja.
- **Kluster B — 65 × 160 × 104 cm, TVÅ:** `1a1c8f5d` 2 249 Grau ·
  `5e092d0c` 2 199 Cremeweiß.
- **Kluster C — 62 × 68 × 111–121 cm, TVÅ:** `534f1b1d` 1 999 Creme ·
  `9276f63e` 1 879 Braun.

Två föll på saldo i urvalssteget, inte i grinden efteråt: `01d9c85f` (3) och
`b3d4ce5f` (1), båda under `gate-lager.py`:s `TUNT = 5`.

☠️ **`9deed3c1` och `820d5370` är SAMMA stol i två färger.** Identiska
spec-tal rakt igenom — sits 53,5 × 50, höjdinställning 48–56, armstöd 63–71,
rygg 54 × 71, kabel 1,2 m, samma punktlista ord för ord. Bara `820d5370`
(brun, 1 799, saldo 61) publiceras; den svarta `9deed3c1` (1 839, saldo 49)
lämnas åt Leonard. Det är #184-mönstret, hittat på källtexten och inte på
bilden.

`46f475c4` (1 829, svart) är en ÄKTA egen stol — 130° lutning, sits
55,5 × 56,5, bädd 156 cm — men den låg för nära `3829477a` i kundens ögon för
att publiceras samma dag. Skjuten till K11, inte till Leonard.

⚠️ **Två par bar identiska tyska NAMN utan att vara samma stol.**
`94979299` och `aef1b477` heter båda "Bürostuhl mit Massagefunktion &
Heizfunktion, Fußstütze, bis 120 kg" — men har olika sitthöjd (56–64 mot
46–53,5), olika rygg (53 × 64 mot 52 × 72) och olika bäddjup (120 mot 156).
Samma sak för `3829477a`/`46f475c4`. **Namnet är alltså inget dubblettbevis
åt någotdera hållet** — bara måtten är det.

## Bilderna först (J1-regeln), och den gav utdelning

Kontaktarken lästes FÖRE brödtexten. Två fynd som ingen siffergrind kunde ha
tagit:

1. **`aef1b477` är LJUSGRÅ, inte grå.** Källans tekniska block säger "Grau";
   den svenska spec-raden säger "Hellgrau" och fotona visar en nästan
   off-white klädsel. Sidan säger ljusgrå.
2. **`d48decb1`:s måttritning säger 112–120 cm**, alltså samma som det tyska
   tekniska blocket — medan produktens svenska spec-rad säger 116–124 cm. Det
   höga talet är skrivet ingenstans i texten. Källans egen punktlista är
   dessutom fel på ett tredje sätt ("112-120 cm verstellbare Sitzhöhe" är
   TOTALHÖJDEN, inte sitthöjden, som är 47–55) — den påstådda sitthöjden
   upprepades inte.

Tre bilder ströks (`bilder-bort.tsv`): två tyska golvgrafiker
(`924a6f45` #4, `3829477a` #4) och en ENGELSK featuregrafik (`94979299` #4).
⚠️ #185 förutsade tre gånger så många tyska grafiker i den här familjen som i
andra; utfallet blev 3 av 40 (7,5 %), alltså LÄGRE än hundkojerundornas.
Talet i #185 gällde en annan delmängd av massagestolarna.

## SKU-kollisionen: sex av åtta

`FP-burostuhl-mit` satt på sex av de åtta produkterna — `924a6f45`,
`d48decb1`, `31cbadae`, `aef1b477`, `94979299` och `820d5370`. Näst värsta
kollisionen efter K8:s sju av åtta (#200). Alla åtta fick egna svenska
SKU:er på båda sidorna, längsta 34 av 40 tecken (#199).

## Grindar

Alla sju gröna före första skrivningen: `gate.py` 0 fynd i 8 filer,
`gate-alt.py` 8 produkter / 37 alt-texter, `gate-seo.py` 0 fynd,
`gate-lager.py` 0 fynd (lägsta saldo 61), `gate-sku.py` 0 fynd (längsta 34),
`gate-lankar.py` 0 fynd, `hasha.py` 8 hashar.

## Live-verifierat 2026-09-08: 8/8 REN, orddiff 0 i första svepet

513–544 ord per sida, noll avvikelser i den publicerade texten. Alla åtta
hämtades med `age` 99–100, alltså renderingar som den varma träffen utlöste.
Sid-, alt-, SEO- och homoglyfsvepen rena, de tre flikarna på plats på alla
åtta, JSON-LD `InStock` på alla åtta, noll artikelnummer och noll husmärken.

## ☠️ TVÅ TOPPKATEGORIER GÖR BRÖDSMULAN OFÖRUTSÄGBAR (nytt, 2026-09-08)

Kategorierna sattes först till `Hem & Inredning` + `Skönhet & Hälsa` +
`Massage & Återhämtning` — en spegling av runda 101, som mätte fram den
uppsättningen för massageFÅTÖLJER. Bulk-svaret sa `8 lyckade, 0 misslyckade`
per kategori, alltså rätt enligt varje kvitto vi hade.

Den publicerade brödsmulan sa något annat:

| brödsmulans nivå 2 | produkter |
| :-- | --: |
| `Skönhet & Hälsa` | **7** |
| `Hem & Inredning` | **1** |

☠️ **Samma kategoriuppsättning gav alltså olika brödsmula på olika produkter.**
Butiken renderar tre nivåer — `Hem / <toppkategori> / produkt` — och plockar
EN toppkategori. Med två toppkategorier kopplade är valet inte stabilt, och
lövet (`Massage & Återhämtning`) visas aldrig.

Följden är inte kosmetisk: sju kontorsstolar låg under `Skönhet & Hälsa` i
Googles brödsmula, och den åttonde under `Hem & Inredning` — i samma runda,
för åtta produkter av samma slag.

`Skönhet & Hälsa` togs bort som DIREKT kategori
(`bulk/categories/{id}/remove-items`, 8 lyckade, 0 misslyckade). Efteråt:
**8 av 8 brödsmulor visar `Hem & Inredning`**, och `Massage & Återhämtning`
sitter kvar så stolarna är sökbara i massagelistningen. Det speglar också de
två redan publicerade massagekontorsstolarna, som båda ligger under
`Hem & Inredning`.

**Regeln: koppla EN toppkategori och så många löv du vill.** Ett löv ärver
sin toppkategori i navigationen utan att konkurrera om brödsmulan.

⚠️ Och ISR-fällan slog till i mätningen av lagningen, som den gjorde i #149:
`924a6f45` kom tillbaka med `age 446` i omsvepet — en rendering ÄLDRE än
kategoriändringen — och visade därför fortfarande `Skönhet & Hälsa`. En
enskild omhämtning av just den sidan gav `age 21` och rätt brödsmula. **Ett
svep är ett stickprov med tidsberoende; läs `age` innan du kallar en sida
trasig.**

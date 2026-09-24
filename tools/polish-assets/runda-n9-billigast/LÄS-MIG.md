# Runda N9 — nio produkter 1 049–1 059 kr

Nionde rundan i urvalet *billigast uppåt bland de produkter där vi är billigare
än dealproffsen*. Alla nio är Aosom-utkast som publicerats, och alla nio har
fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris |
| :-- | :-- | --: |
| `26642cff` | Gunghäst i plysch med ljud, 18–36 månader | 1 049 kr |
| `2a4b9c68` | Pollarlampa 90 cm med 28 lysdioder, IP65 | 1 049 kr |
| `49463fd8` | Badminton- och volleybollnät 400 cm med bärväska | 1 049 kr |
| `67d8d559` | Gungdjur dinosaurie i plysch med ljud | 1 049 kr |
| `9e1942fc` | Slangvagn med 45 m slang och munstycke | 1 049 kr |
| `3cadee08` | Rumsavdelare med sex odlingslådor, 116 cm | 1 059 kr |
| `57c7e4f4` | Basketställ flyttbart, korghöjd 156–210 cm | 1 059 kr |
| `8cd456f9` | Klätterbåge i trä, 2 i 1 med vippa | 1 059 kr |
| `a1d3b9bc` | Bokhylla fem plan i metall, 161 cm | 1 059 kr |

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna hämtade ordagrant | 9 av 9 byte-exakta (`kvitto-kalla.json`) |
| Kontaktark FÖRE brödtext | 45 bilder granskade, sex fynd ingen siffergrind kan se |
| `gate.py` | 0 fynd, 0 varningar |
| `gate-seo.py` · `gate-alt.py` · `gate-axel.py` | 0 · 0 i 42 · 0 axelfel |
| `gate-superlativ.py` · `gate-lankar.py` · `gate-sku.py` | 0 · 0 · 0 (längst 32 av 40) |
| `gate-kort.py` | 0 fynd i 9 |
| Kortens md5 i BÅDA ändarna | 9 av 9 byte-identiska (`kort-md5.txt`) |
| Steg 1 — text/namn/slug/SEO/synlighet | 9 av 9 skrivna, kontrollsumman passerade |
| Steg 2 — media ENSAMT, kortet sist | 9 av 9 skrivna, alt-textgrinden passerade |
| Steg 3 — kategorier | 18 av 18 kopplingar |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 9 av 9, alla tyska SKU:er utbytta |
| Stämpling via `polish-mapping.yml` | 9 av 9 gröna, körda med uttryckligt `ref` |
| Separat återläsning en stund senare | **9 av 9 LIKA** mot filens FNV-facit |
| Mottagarsidan för korten | kortet sist 9/9, foto först 9/9, 51 bilder, **0 utan alt-text** |
| `livegrind.py` på de publicerade sidorna | **9 av 9 REN**, orddiff 0 på alla nio |

## Två saker den här rundan lagade i verktygen

### Mediaskrivningen har en generator nu

Steg 1 har haft `bygg-skrivning.py` sedan H3. Steg 2 har INTE haft något —
mediaskrivningen har transkriberats för hand i chatten varje runda. Det är
exakt den asymmetri H3 mätte upp: det som gick via fil kom fram (0 av 8 drev
isär), det som skrevs av gjorde det inte (5 av 5).

Alt-texter är lika transkriberade som brödtext. Runda J2 publicerade åtta
lampor med **fyrtio tyska alt-texter** och varje API-svar sa framgång.

`bygg-medieskrivning.py` emitterar `steg2.js` sedan den här rundan. Spärren
räknar på `id + "|" + altText` per rad, sammanfogat med radbrytning — alltså
BÅDE bildernas ordning och alt-texternas ord — och avbryter HELA batchen.

### `kort-filer.tsv` var off-contract

Filen bar md5-raderna överst. Builderns `kort, sort, f = rad.split("\t")`
kastar `ValueError` på dem, så `bygg-medieskrivning.py` kunde inte köras alls.
Proofen bor i `kort-md5.txt` nu; `kort-filer.tsv` följer kontraktet
`<kort>\tkort\t<fil-id>`.

Samma klass som #281 (H1:s `bilder.tsv`): en rundas fil som avviker från
kontraktet gör grinden omöjlig att köra, och då räknas den ändå som gjord.

## Kategoriuppslaget grindas på NAMNET

`kategori.tsv` bär åtta teckens prefix, inte hela UUID:t. Uppslaget sker mot
butikens egen kategorilista i samma anrop som skrivningen — men ett prefix som
råkar peka fel hade kopplat rätt produkt till fel kategori utan ett enda fel i
svaret. Planen bär därför det FÖRVÄNTADE namnet, och hela batchen avbryts om
uppslaget ger något annat.

Samma hållning som transkriberingsspärren: en kontroll som inte KAN fälla
räknas ändå som gjord.

## Dubbletten som pensionerades

`DUBBLETT-TRAPPKARRA.md` har hela mätningen. Kort: `8aa0bb6c` (1 039 kr) och
`59c3b5d6` (1 539 kr) var samma trappkärra — Aosoms EGEN feed-dubblett, alltså
var ommappningen en no-op. Leonard valde att behålla den billiga. `59c3b5d6`
är avpublicerad, stämplad `rejected`, och en 301 pekar om den.

⚠️ Säljbart djup sjönk på köpet: sidan vi behöll har saldo 28, den vi
pensionerade hade 98.

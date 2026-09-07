# 344 publicerade sidor saknar `Användning och skötsel` — Leonards beslut 2026-09-07

Fliken är obligatorisk **sedan 2026-08-30**. Katalogsvepet 2026-09-07 mätte hur
många publicerade sidor som saknar den, och varifrån de kommer.

| | |
|---|---:|
| Publicerade sidor (56 sidor à 100, hela katalogen) | **2 250** |
| Bär `Användning och skötsel` | 1 906 |
| **Saknar den** | **344** |

## Varifrån de kommer

Ingen av dem hör till de namngivna rundorna (`runda-a` … `runda-j2`,
`barstol-83a-358`). De rundorna är genomgångna och gröna sedan 2026-09-06
(57 av 57) respektive 2026-09-07 (30 av 30).

| ursprung | antal |
|---|---:|
| Ingen poleringskatalog alls — batch 1–18 och den ursprungliga AE-katalogen | **333** |
| Har en `tools/polish-assets/<id>/`-katalog med ett spec-kort | **11** |

De sista 18 av de 333 är rena AE-varor som aldrig gått genom en poleringsrunda
(solpanel, svarvstål, destillationssats, keps, babyvakt).

☠️ **Kataloger under `tools/polish-assets/<id>/` daterar KORTET, inte poleringen.**
Alla 376 sådana kataloger innehåller exakt `k1.jpg` och kommer ur commits som
heter *"Spec-kort for …"*. Ett kort ritat 2026-09-04 kan sitta på en produkt som
polerades i augusti — datumet är alltså ingen polerings­stämpel, och den som vill
datera en polering får inte använda det som facit. De elva ovan har kort daterade
**2026-08-30 07:33 och 07:51**, alltså samma morgon som regeln skrevs ned; deras
texter är skrivna dessförinnan (halloweenfigurer ur batch 23–25 och sex möbler).

## Beslutet

Leonard 2026-09-07: *"Om det är produkter innan 30 augusti som saknar skötsel
biten kan du skita i dom och fortsätt"*.

Alla 344 är polerade före regeln. De lämnas som de är. Nya rundor bär fliken
sedan 2026-08-30 och grindas av `livegrind.py`.

⚠️ **Talet är inte noll, och det ska inte tyst bli det.** Vill man senare stänga
luckan är det ett eget pass i samma form som `reparation-flikar-skotsel/`:
skötseltext per materialgrupp, `gate-fragment.py` före skrivningen, återläsning
diffad mot filen. En mall hade gått fortare och sagt fel om merparten.

# Runda 142 — Steg 8: båda halvorna, och en krock som redan fanns

Steget har **två halvor**, och bara den ena går via workflowen (#388).

## Halva 1 — Wix egen variant-SKU: 11 av 11, verifierad på STRÄNGEN

`variantsInfo`-PATCH, matchad på `wixVariantId`, med `visible` explicit i
**båda leden**. Kvittot jämför den återlästa strängen mot den förväntade —
inte mot "finns en SKU", som var precis det runda 108 mätte upp att man inte
får nöja sig med.

| pid | FÖRE (importens tyska) | EFTER | `ratt` |
|---|---|---|:--:|
| `56cca82a` | `FP-punchingball-set` ☠️ | `FP-punchingboll-125-145-cm` | ✅ |
| `ce8813ce` | `FP-punchingball-set` ☠️ | `FP-punchingboll-133-151-cm` | ✅ |
| `93073695` | `FP-boxsack-mit-standfu-125` | `FP-punchingboll-viktsack` | ✅ |
| `4fe5959f` | `FP-punchingball-set-box` | `FP-punchingboll-136-154-cm` | ✅ |
| `136a4671` | `FP-punchingball` | `FP-punchingboll-147-165-cm` | ✅ |
| `2730de6f` | `FP-punchingball-boxstander` | `FP-punchingboll-145-180-cm` | ✅ |
| `2a13cbbe` | `FP-punchingball-mit` | `FP-punchingboll-reflexstang` | ✅ |
| `95f6280b` | `FP-boxsack-freistehend-135` | `FP-boxningssack-135-cm` | ✅ |
| `c8f6b93f` | `FP-boxsack-stehend-155` | `FP-boxningssack-rod-155-205` | ✅ |
| `a8daef42` | `FP-boxsack-stehend-mit` | `FP-boxningssack-svart-155` | ✅ |
| `f0430bc5` | `FP-boxstand-standbox` | `FP-boxningsstation-160-230` | ✅ |

☠️ **KROCKEN FANNS REDAN.** `56cca82a` och `ce8813ce` bar båda
`FP-punchingball-set` — två produkter, en sträng. Det är #388:s mätning från
runda 108 igen, och den bekräftar att Steg 8:s andra halva inte är en
formalitet: mappningsstämplingen ensam hade lämnat krocken kvar.

**Efter steget: 11 distinkta av 11.**

### Tre saker som gjorde patchen säker

1. ☠️ **Matchad på `wixVariantId`, aldrig på position.** Två fält heter `sku`
   och betyder olika saker; positionsmatchning är exakt den förväxling som lät
   prissynken skriva till ingenting i en månad. Koden fäller om antalet
   träffar på id:t inte är precis ett.
2. ☠️ **`visible: false` på produkten MÅSTE med.** En `variantsInfo`-PATCH utan
   den publicerar utkastet — Wix behandlar en variantskrivning som en
   publicering, och fältmasken skyddar inte synligheten. Uppmätt efteråt: alla
   elva står kvar på `visible:false`.
3. **`visible: true` på varianten, explicit.** Produktens `false` speglas annars
   ner. Uppmätt efteråt: alla elva variantrader står på `true`.

## Halva 2 — mappningsraden

`polish-mapping.yml`, läge `stampla`, en körning per produkt med bara
`variant_skus`.

☠️ **`needs_ai_polish` och `draft_status` lämnas TOMMA.** Det är inte slarv utan
regeln från 2026-09-02: GitHub ersätter ett tomt input med dess `default`, och
när de defaulterna var `false`/`published` PUBLICERADE en stämpling som bara
ville skriva SKU:er produkten. Defaulterna är tomma sedan dess — och rundan
skickar tomt, för publiceringen hör hemma i Steg 13, inte här.

## Ordningen: Steg 8 FÖRE Steg 9

☠️ **Varje `variantsInfo`-PATCH raderar variantens media** (#501) — även en som
inte skickar media. Bildarbetet i Steg 9 måste därför komma EFTER SKU-patchen,
vilket också är runbokens ordning. Det är värt att säga rakt ut, för de två
stegen ser oberoende ut.

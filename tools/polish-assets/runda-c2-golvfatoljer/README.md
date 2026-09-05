# Runda C2 — sju golvfåtöljer

Fyra golvfåtöljer med vridfot och tre bäddbara golvsoffor på 180 cm. Andra
halvan av familj C; C1 var de fyra hängfåtöljerna.

| id | slug | pris |
|---|---|---:|
| `666ce96b` | golvfatolj-chenille-fjarilsform | 2 419 kr |
| `90529d40` | golvfatolj-vridfot-beige | 1 319 kr |
| `db34f7d5` | golvfatolj-vridfot-gron | 1 299 kr |
| `87717be0` | golvfatolj-vridfot-morkgra | 1 299 kr |
| `724cc4b5` | golvsoffa-baddbar-180-cm-morkgra | 1 559 kr |
| `a8d37d72` | golvsoffa-baddbar-180-cm-himmelsbla | 1 539 kr |
| `9c71885a` | golvsoffa-baddbar-180-cm-gra | 1 499 kr |

Inga priser rörda.

## Dubblettkollen — tre frågor, alla avgjorda på MÅTT

Regeln som gäller hela uppdraget: **jämför på mått, aldrig på namn.** Här
avgjorde den tre frågor, och den första åt andra hållet än ett namn hade svarat.

**1. De tre vridfotsstolarna mot publicerade `golvfatolj-360-grader-fem-lagen`.**
Yttermått och vikt är IDENTISKA — samma stol i grunden. Två tal skiljer ändå:
stoppningen är **17 cm mot den publicerades 15**, och sitthöjden **40 cm mot 37**.
Det är inte samma artikel, och skillnaden är dessutom det enda kunden känner av
när hen sätter sig. Den står därför utskriven i korslänken i alla tre texterna.

**2. De tre golvsofforna mot varandra.** Samma artikel i tre färger — mörkgrå,
himmelsblå, grå. Behandlade som en färgfamilj: samma mått, samma text, egna
färgord.

**3. `666ce96b` (chenille, fjärilsform) mot resten.** Egen konstruktion: 14,5 kg
mot vridfotsstolarnas 11, paketmått 32 × 32 × 95 mot 66 × 62 × 28, två
sidofickor. Ingen dubblett.

## Steg 2 — två fynd i underlaget

**`5-fach` mot `Drei Neigungswinkel`.** De tre vridfotsstolarnas underlag
påstår båda: fem lägen i en rad, tre lutningsvinklar i en annan. En text som
lovar fem lägen på en stol som har tre är ett kundlöfte vi inte kan hålla.
Skrivet konservativt som **tre lutningslägen** — det lägre talet är det som går
att stå för.

**`666ce96b`: "verlässliche Zertifizierungen".** Underlaget nämner
certifieringar utan att namnge en enda. En EN-standard får inte skrivas ut utan
källa, och en oöversatt "certifierad"-formulering är ett tomt löfte. Inte
vidarefört.

## SKU:er — sex av sju delade

Importen härleder variant-SKU:n ur den tyska titelns första ord, så produkter
vars titlar börjar likadant får samma sträng. Här:

- tre på `FP-bodensessel-mit-5-fach`
- tre på `FP-bodensessel`

Alla sju har nu en egen svensk SKU, skriven på BÅDA sidorna (Wix-variantens
`sku` och mappningsradens).

## ☠️ Checksumman kolliderade — en summa är permutationsblind

`a8d37d72` och `9c71885a` gav **identisk längd OCH identisk teckenkodsumma**
trots olika text. Orsaken är att de är färgsyskon: bytet `himmelsblå` →
`grå` i brödtexten och motsvarande byte i sluggen tar ut varandra i en summa
som inte bryr sig om ordning.

Kontrollen bet ändå, för den görs **per produkt** — fil mot Wix för samma id,
aldrig fil mot fil. Men lärdomen står: en summa av teckenkoder är blind för
omkastningar, och två texter kan mötas på den utan att vara lika. En
positionsviktad checksumma hade skilt dem åt. Verifierat att filerna faktiskt
skiljer sig.

## Grindarna

| grind | utfall |
|---|---|
| Filgrind (mönster + tal) | 0 fynd |
| Prisgrind (workflow, sju körningar) | stämmer |
| Checksumma fil mot Wix | 7/7 identiska |
| Alt-texter | 35 st, ingen tom |
| Live-grind | se nedan |

Filgrindens talgrind fällde först tre `15 cm` i vridfotstexterna — talet kommer
ur den PUBLICERADE ljusgrå stolens sida, inte ur den här produktens underlag.
Jämförelsen är den mest användbara raden i texten, så den behölls och källan
skrevs i stället ut i `kalla/`-filerna med var den kommer ifrån. En grind som
tvingar fram dokumentation av en korsreferens gör sitt jobb.

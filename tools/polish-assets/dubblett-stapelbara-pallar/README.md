# Dubbletten stapelbara pallar (2026-10-06)

Leonard bad att den bruna pallartikeln i hans länk skulle mappas om till
`/produkt/stapelbara-pallar`. Den artikeln säljs redan, som färgen Brun på en
annan sida.

## Två sidor, samma vara

| | `4c97bd93` | `17c747cb` |
|---|---|---|
| adress | `stapelbara-pallar` | `stapelbara-pallar-4-pack-gra-sits` |
| mappad mot | AliExpress | Aosom, en artikel per färg |
| färger | brun | grå, cremevit, brun, khaki |
| pris | 1 239 kr | 1 039 kr |
| bilder | 6 | 15 |
| Google 2026-09-24 | **2:a på *stapelbara pallar*** (260 sökningar i månaden) | rankar inte |

Rankningen står i `seo-granskning-2026-09-24/rankande-adresser.tsv` och i
`runda-s1-semrush/README.md`.

Varför det är samma vara:

- **Måtten och materialet är desamma.** Ø40 × 45 cm, sits Ø32 cm med 4 cm dyna,
  120 kg per pall, ben i böjd björkplywood och sits i linneliknande polyester.
- **Fotona är desamma.** Huvudbilden på `4c97bd93` är färgen Brun på
  `17c747cb` (dHash-avstånd 3 av 64), och måttbilden är också densamma.
  Kontaktarket ligger i scratchpad, eftersom leverantörens bilder inte hör hemma
  i det publika repot.
- Färgen Brun kom till `17c747cb` i B42 (publicerade syskon).

Ommappningsverktyget vägrar en artikel som redan sitter på en annan sida
(hinder 3 i CLAUDE.md), och två sidor för samma vara är den dubblett Google
straffar.

## Därför ingen vanlig 301 från `stapelbara-pallar`

Trädgårdsskåpet (2026-10-01) löstes med en 301 från dubbletten till sidan med
alla färger. Här är det dubbletten som rankar. En 301 flyttar det mesta av
värdet, men placeringen sitter på adressen, så sidan med alla fyra färgerna
flyttar i stället till adressen som rankar.

## Planen

Steg 2 och 3 kräver Wix-kopplingen, som behövde ny inloggning 2026-10-06.

1. **Omdirigeringar först** (`redirect-add`, batch, `force`):
   `stapelbara-pallar-4-pack-gra-sits` och `stapelbara-pallar-brun-ae` →
   `/produkt/stapelbara-pallar`. Butiken läser dem först när en adress svarar
   404, så de gör ingenting innan sluggarna byts. Ingen av de 200 rader som
   listan visar pekar i dag på `stapelbara-pallar`.
2. `4c97bd93` får slugen `stapelbara-pallar-brun-ae` och döljs
   (`visible: false`), så att adressen blir ledig.
3. `17c747cb` får slugen `stapelbara-pallar`.
4. Kategorierna behöver inte röras. Båda sidorna ligger i samma fyra
   (läst med butikens besökarnyckel 2026-10-06).
5. Mappningsraden för `4c97bd93` pensioneras (`polish-mapping`, `stampla`:
   `draftStatus: rejected`, `needsAiPolish: false`). Beställningen läser inte
   `draftStatus`, så en eventuell öppen order på den går som förut.
6. **Före en butiksdeploy.** Butiken håller katalogen i minnet, och en dold
   produkt försvann därifrån först när servrarna startade om (trädgårdsskåpet).

Inget pris rörs. Sidan på `stapelbara-pallar` kostar efteråt 1 039 kr, alltså
`17c747cb`:s pris.

## Kontroll efteråt

- `/produkt/stapelbara-pallar` visar fyra färger och 1 039 kr.
- `/produkt/stapelbara-pallar-4-pack-gra-sits` svarar 308 till den.
- Google-flödet har `17c747cb`:s fyra varianter och inte `4c97bd93`.
- Omätning av *stapelbara pallar* i Semrush, när kontot har API-enheter igen.

## Utfört 2026-10-06, kl. 21.41–21.48 svensk tid

Leonard loggade in Wix-kopplingen igen, och flytten gjordes samma kväll i
stället för precis före nattens deploy. Ordningen spelar bara roll mot
deployen, och den kommer efteråt.

| steg | utfall |
|---|---|
| omdirigeringarna | `redirect-add`, HTTP 200, båda raderna skrivna |
| `4c97bd93` | slug `stapelbara-pallar-brun-ae`, `visible: false` (revision 23 → 24) |
| `17c747cb` | slug `stapelbara-pallar`, synlig, fyra synliga varianter, priserna oförändrade 1 039–1 119 kr (revision 20 → 21) |
| mappningen för `4c97bd93` | `needsAiPolish: false`, `draftStatus: rejected` (`polish-mapping`, `stampla`) |
| butikens cache | tömd två gånger med `restock-prov`, läget `sidan`, status 200 |

**Live efteråt:**

- `/produkt/stapelbara-pallar` visar fyra färger, 1 039 kr och i lager. Den
  kanoniska adressen är `/produkt/stapelbara-pallar`.
- `/produkt/stapelbara-pallar-brun-ae` svarar 308 till `/produkt/stapelbara-pallar`.
- `/produkt/stapelbara-pallar-4-pack-gra-sits` visar fortfarande sidan ur
  butikens minne. Den ska svara 308 efter nattens deploy, när servrarna startar
  om. Trädgårdsskåpet betedde sig likadant.

**Också rättat:** två alt-texter på khakifärgens bilder var tyska, rester från
B42. De är nu svenska (revision 21 → 22), och den publicerade sidan bär noll
tyska alt-texter. Anropet läste galleriet och bytte bara de två texterna. Alla
15 bilder och de andra 13 texterna är orörda, och färgvalen har kvar sina
bilder (4, 4, 3 och 3).

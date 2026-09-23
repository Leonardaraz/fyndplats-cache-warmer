# Runda 145 — Steg 7–13: text, SKU, kategori, publicering

## ☠️ Landminan från runda 144 reconfirmerad — hanterad rätt den här gången

Samma mekanism som runda 144 dokumenterar: ett RÅTT anrop mot
`PATCH /stores/v3/products/{id}` som bara rör `options` + `variantsInfo`
(Steg 8:s SKU-byte) publicerar produkten, trots att `visible` aldrig fanns
med i anropet. Verifierat oberoende (ny `GET`, inte PATCH-svarets eko) på
alla nio denna runda: samtliga gick till `visible:true` på produktnivå och
`variantsInfo.variants[0].visible:true` omedelbart efter SKU-skrivningen.

Regeln från runda 144 följdes till punkt och pricka: Steg 10 (kategori)
kördes OMEDELBART efter Steg 8, med noll medveten fördröjning. Skadan blev
återigen bara ORDNINGEN — några minuters fönster med rätt text men fel/ingen
kategori, aldrig felaktig eller ofärdig text till kund.

## Steg 7 — text, slug, seoData (alla nio)

Skrivet via `plainDescription` (samma bekräftade skrivbara HTML-fält som
runda 144; `description`-fältet rörs aldrig). `seoData` byggd i samma form
som källans tyska.

| pid | ny slug | ny SKU | pris |
|---|---|---|--:|
| 0fc3c252 | foliehus-hyllor-rullbar-dorr-198x275x191-cm | FP-foliehus-hyllor-rullbar | 1 519 |
| 97f5f728 | pop-up-foliehus-sadeltak-295x200x270-cm | FP-pop-up-foliehus-sadeltak | 1 699 |
| 9cdca665 | gangtunnel-stor-genomskinlig-297x395x199-cm | FP-gangtunnel-stor | 2 299 |
| f5f02f8a | xl-tunnelvaxthus-solskyddsnat-600x300x198-cm | FP-xl-tunnelvaxthus | 3 169 |
| 601ae5f5 | portabelt-minivaxthus-180x180x200-cm | FP-portabelt-minivaxthus | 1 019 |
| dd97fbc9 | drivbanksskap-tra-hyllplan-70x42x132-cm | FP-drivbanksskap-tra | 1 769 |
| 62d2071e | foliehus-tre-tradhyllor-300x150x213-cm | FP-foliehus-tre-tradhyllor | 1 249 |
| a7d1a29b | gangtunnel-klar-fixeringsklammer-300x200x195-cm | FP-gangtunnel-klar | 1 819 |
| 2da078c9 | vaggvaxthus-plast-ograsduk-300x80x157-cm | FP-vaggvaxthus-plast | 1 019 |

Alla nio PATCH-svar gav `ok:true` med stigande `revision` och rätt `slug`/
`urlPath` — verifierat i samma svar. Texterna grep-verifierades i filen
(`texter-utkast.md`) mot kända felmönster (leverantörsnamn, glas, Aosom-
artikelnummer, tidigare stavfel, tyska kvarlevor) INNAN någon skrivning,
enligt "skriv i fil först"-regeln (batch 64: 9 fel inline mot 0 via fil).

## Steg 8 — SKU, byggd med kodens egen algoritm, en nästan-kollision fångad i förväg

`lib/import/sku.ts`s algoritm applicerades för hand (redan inläst tidigare
i sessionen). Under handberäkningen upptäcktes att `9cdca665` och
`a7d1a29b` — båda stora genomskinliga gångtunnlar med 40 clips — skulle ha
kapats till IDENTISK bas-SKU (`FP-gangtunnel-genomskinlig`) med naiva
slugs, eftersom `buildVariantSkus`s unikhetskontroll bara ser en produkts
EGNA variantlista, aldrig andra produkter i samma batch. Löst genom att
differentiera slugens första två tokens (`gangtunnel-stor-…` mot
`gangtunnel-klar-…`) innan något skrevs — ingen kollision nådde Wix.

Varje variants FULLSTÄNDIGA tillstånd (`price`, `inventoryStatus`,
`choices`, `visible`, `media` där det fanns) lästes och ekades tillbaka
oförändrat i samma anrop som satte den nya SKU:n, av samma skäl som runda
144: `variantsInfo`-PATCH ersätter hela variantobjektet.

Tre av nio (`0fc3c252`, `97f5f728`, `9cdca665`) saknade `media` på
variantnivå vid förhandsläsningen men rapporterade ändå `hasMedia:true` i
PATCH-svaret — ingen dataförlust observerades (pris/synlighet/val/SKU alla
korrekta på alla nio), och riktningen är den säkra (media finns kvar), inte
den farliga. Inte vidare utrett.

Alla nio PATCH-svar bekräftade rätt SKU och `hasMedia:true`.

## Steg 10 — kategori (parent + leaf), samma par som runda 144

Samma par som redan fastställdes i runda 144 via en publicerad släkting
(`5f7566a1`), återanvänt utan ny uppslagning:

- **Trädgård & Utemöbler** (`653ab052-6952-4ce7-842d-ad691cd8206d`, förälder)
- **Växthus & Odling** (`8bcfeb20-1100-437a-9ad3-6c03919126b2`, löv)

Skrivet med `POST /categories/v1/bulk/categories/add-item` (ett item, två
kategori-id:n per anrop). Alla nio gav `totalSuccesses:2, totalFailures:0`.
Verifierat med `list-categories-for-items` (den korrekta läsmetoden, inte
GET): alla nio bär nu förälder + All Products + löv.

## Steg 12 — läs-som-kund

Kategoriverifieringen fungerade dubbelt igen: bekräftade både att Steg 10
landade och att sidorna är fullständiga (namn, slug, SKU, kategori) innan
rundan stängs.

## Steg 13 — publicering

Skedde de facto redan i Steg 8 (landminan ovan), bekräftat oberoende genom
en fristående `GET` på alla nio. Ingen ytterligare publiceringsåtgärd
gjordes eller behövdes.

## Mappningen stämplad (Steg 8:s andra halva) — och en ny landmina löst på vägen

Alla nio första `stampla`-försök hade föregåtts av samma `las`-mode-fel som
STEG1-2.md dokumenterar (8-teckensprefixet accepteras inte av
`/api/admin/mapping`). Med fulla UUID:n gick samtliga nio `stampla`-körningar
igenom rent på första försöket:

| pid | job | conclusion | mappningens kvittorad |
|---|---:|---|---|
| 0fc3c252 | 105632302089 | success | `OK: 0fc3c252-… uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| 97f5f728 | 105632313244 | success | samma form |
| 9cdca665 | 105632325573 | success | samma form |
| f5f02f8a | 105632344186 | success | samma form |
| 601ae5f5 | 105632354026 | success | samma form |
| dd97fbc9 | 105632370152 | success | samma form |
| 62d2071e | 105632387159 | success | samma form |
| a7d1a29b | 105632396653 | success | samma form |
| 2da078c9 | 105632410266 | success | samma form |

`needs_ai_polish: false`, `draft_status: published`,
`variant_skus: {"<wixVariantId>":"<ny SKU>"}` — kontraktet ur
workflow-filens egen `description`-text, inte gissat. Alla nio: `conclusion:
success`, bekräftade via `get_job_logs`, inte bara den köade 204:an.

## ✅ Runda 145 LIVE — nio växthus i sex-sju konstruktioner, 9 av 9 gröna

| pid | namn | pris | konstruktion |
|---|---|--:|---|
| 0fc3c252 | Foliehus med hyllor och rullbar dörr | 1 519 | hyllförsett foliehus, rullbar dörr, PE+stål |
| 97f5f728 | Pop-up-foliehus med sadeltak | 1 699 | pop-up, sadeltak, två dragkedjedörrar |
| 9cdca665 | Gångtunnelväxthus, genomskinligt, 40 klämmor (stor) | 2 299 | stor tunnel, 297×395 cm, vindklass 5 |
| f5f02f8a | XL-tunnelväxthus med solskyddsnät | 3 169 | XL-tunnel, rullbara sidoväggar, solskyddsnät |
| 601ae5f5 | Portabelt miniväxthus | 1 019 | litet portabelt växthus, 9,4 kg |
| dd97fbc9 | Drivbänksskåp i trä med tre hyllplan | 1 769 | 3-plans skåp, trä/PC, två låsbara dörrar |
| 62d2071e | Foliehus med tre trådhyllor | 1 249 | budget-foliehus, 3 plan trådhyllor |
| a7d1a29b | Gångtunnelväxthus, genomskinligt, 40 fixeringsklammer | 1 819 | mindre tunnel, 300×200 cm, vindklass 5 |
| 2da078c9 | Väggväxthus med ogräsduk | 1 019 | väggmonterat lutande växthus, plast/stål |

Två nya fynd denna runda, utöver de redan stämplade i STEG1-2.md:

- ☠️ **`/api/admin/mapping` kräver fullt UUID** — dokumenterat, fixat, och
  regeln gäller från och med nu för varje framtida `polish-mapping.yml`-anrop.
- ☠️ **`f5f02f8a` bild 5 bär "Outsunny"-logotypen** — flaggat till Leonard,
  media orört (poleringen skriver aldrig media).

De resterande ~64 kärnväxthusen (STEG1-2.md, minus `b5ba12b8` som väntar på
lager) tas i kommande rundor.

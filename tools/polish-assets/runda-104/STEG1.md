# Runda 104 Steg 1 — elva eldrivna barnfordon

Vald för att den ANDRA sessionen äger massagefåtöljfamiljen (de publicerade
`297d8979` mitt i runda 103). Den här familjen ligger långt ifrån deras arbete.

Alla elva är `visible:false`, alla ligger i samma kategori, priser 1 759–3 079 kr.

| id8 | tyskt namn (förkortat) | pris |
|---|---|--:|
| `ed84746c` | 12V Elektrisches Geländefahrzeug | 2 099 |
| `60ab2042` | 12V Elektrisches Geländefahrzeug | 1 999 |
| `3b992525` | 12V Elektrisches Geländefahrzeug | 2 019 |
| `f15febb2` | 12V Elektroauto, Gurt, Hupe | 2 229 |
| `3d9dff8a` | 12V Elektroauto, Gurt, Hupe | 2 069 |
| `2f6ff71c` | 12V Elektroauto, Gurt, Hupe | 2 159 |
| `9308a7dc` | 12V Polisbil med siren | 2 079 |
| `c0abfddd` | 12V Kinder-Elektroauto | 1 879 |
| `5e9cc2d2` | 12V Kinder-Motorrad | 1 759 |
| `1e27f7e0` | 12V Kinder-Motorrad | 1 799 |
| `883db249` | 12V Kinder-Quad | 3 079 |

⚠️ **`60ab2042` är `OUT_OF_STOCK`** — de övriga tio är `IN_STOCK`.

## ☠️ Steg 2 är den tyngsta på länge: VARUMÄRKEN i källtexten

Redan SEO-beskrivningarna avslöjar tre licenspåståenden:

| utkast | vad källan säger |
|---|---|
| `ed84746c`, `60ab2042`, `3b992525` | *"Der **KAWASAKI TERYX KRX 1000** Kinder-Elektro-UTV"* |
| `5e9cc2d2`, `1e27f7e0` | *"Das von **Aprilia** autorisierte Elektromotorrad"* |
| `c0abfddd` | *"Dieses konzipierte, **lizenzierte** Kinder-Elektroauto von [BRAND NAME]"* |

Det är runda 59:s Vespa-fråga igen (#59), men på tre varumärken samtidigt. Och
frågan är genuint tvåsidig: är licensen äkta får varumärket nämnas och är
värdefullt för kunden; går den inte att verifiera är det en varumärkesrisk.

Klassen är dessutom "el till barnkropp": leksaksdirektivet, EN 71-1/-2/-3,
EN 62115, CE, åldersmärkning, batteri och GPSR.

## Underlaget körs som ett workflow

Elva produktagenter (källtext + måttritning + logotypkoll per utkast), tre
oberoende juridiska genomgångar, två adversariella granskare av dem, och en
syntes. Agenterna är LÄSANDE — all skrivning till Wix gör jag själv.

## ☠️ Och workflowet hade en egen bugg som var värd att stoppa för

Första körningen: två agenter (taket är `min(16, kärnor−2)` och maskinen har
fyra kärnor) laddade ner sina bilder till **samma** katalog med **samma**
filnamn — `scratchpad/bilder/bild1.jpg` … `bild5.jpg`.

De hade skrivit över varandras bilder, och nästa `Read` hade visat FEL
produkts måttritning. Ingenting hade kastat, och utfallet hade sett ut som en
korrekt avläsning.

Det är exakt runda 103:s fynd en nivå upp: **måttritningen är det enda som bär
egen information, så en tyst förväxling av just den bilden är det dyraste som
kan hända i den här rundan.** Körningen stoppades och skriptet ger nu varje
agent en katalog döpt efter dess produkt-id.

**Regeln: parallella agenter delar filsystem. Varje agent som skriver filer
måste skriva i en katalog som bär dess egen identitet.**

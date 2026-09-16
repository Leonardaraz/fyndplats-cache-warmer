# Runda N4 — nio produkter 899–939 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879 kr, den här
899–939 kr.

| kort | pris | produkt |
|---|---:|---|
| bbf1bb80 | 899 | Katthåla 50 cm i flätat rep |
| f4136218 | 899 | Hundgrind 183 cm, fristående, fyra paneler |
| a1d3d26c | 899 | Väggspegel 90 × 60 cm, nio fält |
| d2bde085 | 899 | Sågbockar 2-pack, 100 kg |
| df3a97c6 | 899 | Rullpall med ryggstöd, 51–67 cm sitthöjd |
| b7b5b37e | 929 | Satsbord i glas 2-pack |
| 6b8cd35b | 929 | Valphage 91 cm |
| 84b40fbc | 929 | Kökshylla 125 cm, fyra plan |
| 5ef660d3 | 939 | Nattduksbord i stål 40 cm |

## Skärmarna fällde tio kandidater innan en rad text skrevs

**Sex på dubblettskärmen** — delade måtttripplar med en PUBLICERAD sida:

| utkast | krockar med | delade tripplar |
|---|---|---|
| c909254e kattlåda 43 cm | `72ac915f` | **3 av 4**, inkl. kartongen |
| 5cd447de kattlåda rostfri | `5df0b431` | **4 av 4**, inkl. kartongen |
| e20d0bbd soptunna 42 L | `7846d05f` | **2 av 2** |
| 087000f1 golvlampa m. hyllor | `93af619c` | 41 × 29,5 × 163,5 exakt |
| 0ac59601 golvlampa 156 cm | `b18ec555` | 26 × 26 × 156 **och** 26 × 26 × 39 |
| 9d3d3634 dörrgrind | `56c77eac` | 80 × 75,5 × 7,5 ~ 81 × 76 × 7,5 |

`0015497b` (kattlåda med lock) delar EN triss med `1abd6c48` — sandtråget
59,5 × 39,5 × 15. En delad komponent är inte samma produkt, men
kattlådefamiljen har 22 publicerade sidor och tre av fyra kandidater föll,
så hela familjen lämnas till ett eget dubblettpass.

**Fyra på säsong** — växthusöverdrag, två odlingslådor, komposttunna och ett
campingtält. Mitten av september är fel tid; en utegrupp som poleras nu får
sin första besökare om sju månader.

⚠️ **Valphagen prövades särskilt.** 8 paneler × 61 cm = 488 cm, och det finns
en publicerad *"Hundhage 488 cm med åtta paneler och grind"*. Panelhöjden
avgjorde: de publicerade är 61 × 76 cm och 75 cm, den här är 61 × **91**.
Äkta ny storlek.

## Bildhashen gav ett ÄKTA negativt

Varje kandidats alla bilder jämfördes på bytestorlek + pixelmått mot
huvudbilden på **2 799 publicerade produkter**, svepet klart: **noll träffar**.
Den byte-identiska klassen finns alltså inte här — och det är just därför
måttkollen ovan behövdes, precis som huset redan mätt (#194).

## Bilderna

☠️ **Kontaktarket byggdes FÖRE brödtexten** (runbookens regel sedan runda J1).

- `f4136218` bär ett **PawHut-märke fysiskt på grindens överlist**. Leonards
  regel 2026-08-06: ett märke som sitter på varan rörs aldrig. Bilden står
  oförändrad och alt-texten nämner inte märket. Andra gången regeln tillämpas
  efter rättelsen i N3 (`c164e459`).
- `bbf1bb80-3` beskuren: den tyska rutan *"Produktinformation / Rasse /
  Gewicht"* var ett band nedtill, kapat vid y=1478. Ritningen är orörd —
  kontrollerat genom att titta på den beskurna filens underkant.
- `df3a97c6-4` borttagen: ett marknadskollage med fyra tyska etiketter
  (`Tattoo-Studio`, `Schönheitssalon`, `Nageldesigner`,
  `Arbeitsbereich zu Hause`) spridda över alla fyra kvadranter — ingen
  beskärning tar bort dem. Mittenbilden upprepar position 1, så inget går
  förlorat. Vårt eget kort tar platsen.

## Vad källorna motsäger sig om

- **`bbf1bb80`**: Technische Daten säger `Maximale Belastbarkeit: 10 kg`, men
  beskrivningen säger TVÅ gånger *"für Katzen unter 5 kg"*. Texten skriver
  5 kg — den lägre siffran är den säkra, och den står två gånger mot en.
  Spec-fliken påstår dessutom färgen `Violett`; fotona och Technische Daten
  säger antracit. Texten följer fotot.
- **`d2bde085`**: måttritningen säger 60 cm benbredd, texten 49. Spec-raden
  följer källans text (49) och brödtexten påstår ingen bredd.
- **`a1d3d26c`**: tyska blocket säger `90B x 2T x 60H` men ritningen sätter 90
  på HÖJDEN, och källan säger själv att spegeln hängs åt båda hållen.
  ☠️ `gate-axel` fällde mitt första utkast som band 90 till höjd. Rätt svar
  är att inte binda talen alls: *"Spegelytan är 90 × 60 cm, och vilken sida
  som blir höjden avgörs av hur du hänger den."*

## Kvittokedjan

| steg | utfall |
|---|---|
| Källorna hämtade server-side, kontrollsumma per produkt | **9 av 9 bevisat ordagranna** |
| Artikelnummer i källfilerna (#257) | **0** |
| Lagergrind | 9 av 9 har saldo (27–197) |
| `gate.py` · `gate-axel` · `gate-alt` · `gate-seo` · `gate-superlativ` · `gate-lankar` · `gate-sku` | **REN** |
| `gate-kort.py` — kördes FÖRE renderingen | **0 fynd i 9 kort** |

`gate-fragment.py` kördes inte: den är till för TILLÄGGSfragment och fäller
med flit på en hel text. Den bekräftade dock oberoende `200`-fyndet.

## Gränsen i urvalet

Prisjämförelsen mot dealproffsen kördes om (2 635 produkter där vi är
billigare), men rutten rapporterar per produkt bara till Vercels PRIVATA logg
— med flit, eftersom artikelnumret annars nådde en publik Actions-logg.
Urvalet vilar därför på filen från 2026-09-15. Fyra av de nio har ett gap på
10–30 kr, alltså tunt nog att ha rört sig sedan dess: `5ef660d3` (10 kr),
`bbf1bb80` (20), `f4136218` (20), `a1d3d26c` (30). Våra EGNA priser är
däremot färskt lästa ur butiken.

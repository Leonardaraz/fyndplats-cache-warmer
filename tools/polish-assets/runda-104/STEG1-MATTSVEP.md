# Måttsvep: rundans utkast mot varje publicerad barnfordonssida

Byggt efter att polisbilen visade sig vara en dubblett (`STEG1-DUBBLETT.md`).
Frågan är enkel och kunde inte besvaras ur kön: **säljer vi redan den här
varan?**

## Metoden

Varje `a × b × c cm`-trippel i HELA texten, inte bara på `Mått:`-raden — det är
runda 103:s regel, och den gav där 71 % täckning mot 19 %. Nyckeln är
**sorterad**: leverantören kastar om L/B/H mellan sidor, så `96 × 60 × 45` och
`45 × 60 × 96` är samma låda.

Sidorna läses **live**, inte ur Wix. `plainDescription` går inte att filtrera på
(`400 "not declared as filterable"`) och fritextsökningen tokeniserar tal och
svarar med orelaterade utkast. Den renderade sidan är enda vägen.

## ☠️ Två fel som hade gett ett falskt "allt rent"

Första körningen svarade **noll träffar** — och det var fel av två skäl
samtidigt:

1. **Fem av 51 sidor hade inte laddats ner.** Hämtningsloopen hoppade över dem
   utan att säga något.
2. ☠️ **Sitemapen SLÄPAR.** Rundans egna tre sidor publicerades två timmar
   tidigare och stod ännu inte i `sitemap.xml`. Ett sitemap-baserat svep är
   alltså strukturellt blint för det som publicerats senast — vilket är precis
   det som mest sannolikt kolliderar med det man håller på att skriva.

Båda hittades av **kontrollmätningen**, inte av ett felmeddelande: rundans tre
publicerade sidor ska matcha sig själva, och gjorde det inte. Utan den kontrollen
hade svepet rapporterat noll träffar och sett friskt ut.

**Regeln: ett svep utan en känd träff i sig är inget svep.** Nionde gången
huset lär sig samma familj — ett svar utan fel är inget kvitto.

## Utfallet, efter lagningen

| | |
|---|--:|
| Publicerade barnfordonssidor lästa | **54** |
| Med minst en måttrippel | 53 |
| ⚠️ Utan trippel (osynliga för svepet) | 1 — `gravmaskin-akbil-barn` |
| Utkast svepta | 7 |
| **Träffar** | **0** |

Två kontroller som gör nollan meningsfull:

- **Positiv kontroll:** polisbilens `96 × 60 × 45` matas in och träffar
  `elbil-barn-polisbil-12v-fjarrkontroll`. Metoden hittar en känd dubblett.
- **Självkontroll:** rundans tre publicerade sidor matchar sig själva och
  varandra — de ÄR färgsyskon, alltså rätt svar.

## De sju utkasten, med sina mått

| id8 | yttermått | paketmått | träff |
|---|---|---|---|
| `ed84746c` | 100 × 64 × 56 | 91 × 51 × 28 | nej |
| `60ab2042` | 100 × 64 × 56 | 91 × 51 × 28 | nej |
| `3b992525` | 100 × 64 × 56 | 91 × 51 × 28 | nej |
| `c0abfddd` | 98 × 59 × 43 | 101,5 × 52 × 26,5 | nej |
| `5e9cc2d2` | 106,5 × 56 × 80 | 82 × 37 × 47 | nej |
| `1e27f7e0` | 106,5 × 56 × 80 | 82 × 37 × 47 | nej |
| `883db249` | 100 × 65 × 73 | 112 × 64 × 37 | nej |

⚠️ **`c0abfddd` är därmed AVFÖRD som Maserati-dubblett.** Steg 2-anteckningen
misstänkte den mot publicerade `maserati-elbil-barn-tvasitsig` på grund av
namnet. Måtten skiljer sig, och namnet var aldrig ett bevis — det var samma fel
som runda 103:s Steg 1 gjorde när den klustrade på namnsträngen.

## ⚠️ Vad svepet INTE svarar på

Nollan är ett **golv**, inte ett bevis:

- En sida utan måttrippel kan inte matchas (1 av 54).
- Urvalet är SLUG-baserat — en publicerad barnbil som inte heter något av
  orden i filtret ingår inte.
- Två olika modeller kan dela yttermått; en träff är ett indicium som ska
  bekräftas med bilderna, precis som polisbilen bekräftades.

Verktyget ligger i sessionens scratchpad (`mattsvep.py`); körningen är
reproducerbar ur den här filen.

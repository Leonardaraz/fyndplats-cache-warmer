# Runda M1 — julfigurer och lyktor, 559–1 249 kr

Åtta utkast ur julfamiljen. Säsongen är skälet till prioriteringen: sidorna
behöver ligga ute i god tid före december, och familjen har legat orörd sedan
rundorna 21–22.

| kort | vad | höjd | pris | saldo |
| :-- | :-- | --: | --: | --: |
| `5a14cc4d` | isbjörnar 2-delat, 140 vita LED, vattentät | — | 1 249 | 82 |
| `4fc04535` | julykta med bär, kottar och rosett, LED | — | 829 | 135 |
| `d0aeb070` | uppblåsbar pepparkaksgubbe med presentask | 250 | 799 | 197 |
| `be4a760b` | uppblåsbar pepparkaksgubbe | 200 | 739 | 131 |
| `69331178` | uppblåsbar pingvin | 250 | 679 | 178 |
| `ef75aa9a` | uppblåsbar pepparkaksgubbe med rosett, 3 LED | 183 | 639 | 178 |
| `7278ea50` | snögubbe med LED | 180 | 629 | 181 |
| `3225c539` | snögubbe utomhus | — | 559 | 87 |

## Varför just de åtta — dubblettrisken styrde urvalet

Julfamiljen har **61 tyska utkast**, men den är inte ett fritt urval: rundorna
21 och 22 publicerade redan trettiotre granar, och en dubblettskärm mot dem är
obligatorisk. Kartläggningen 2026-09-13 gav:

| | |
|---|---:|
| Tyska juluttkast | **61** |
| Publicerade julsidor | **47** |
| — därav konstgjorda granar | 33 |
| — därav uppblåsbara tomtar | 8 |

☠️ **Trettioen av de 61 utkasten är granar.** De publicerade granarna täcker
redan 120, 150, 180, 183 och 210 cm i en mängd utföranden (snöad, smal,
pelarform, talljulgran, med LED, med pynt). Att skriva åtta till ovanpå det är
den interna dubbletten huset straffas för, inte en ny runda — de kräver en egen
bildbaserad skärm mot de trettiotre, och den är ett eget jobb.

De åtta valda är i stället **figurer och lyktor utan publicerad motpart**.
De publicerade uppblåsbara är alla TOMTAR; noll pepparkaksgubbar, noll
pingviner, noll snögubbar, noll isbjörnar finns ute. De sex tyska tomtarna är
därför medvetet UTELÄMNADE ur rundan av samma skäl som granarna.

⚠️ **De tre pepparkaksgubbarna (250 / 200 / 183 cm) kan vara samma figur i tre
storlekar.** Det avgörs i dubblettskärmen på bilderna, inte av namnen — och
oavsett utfall måste texterna göra storleksskillnaden till det första som
skiljer sidorna åt, som cypressparet i L4.

## Lagergrinden i urvalet (#173)

Alla åtta har saldo **82–197** och `trackQuantity: true`. Kollen ligger i
urvalet med flit: L3 och L4 uteslöt `a1aed632` två gånger, och andra gången
hade saldot hunnit gå från 1 till 0. Hade den kollen legat sist hade en hel
text skrivits för en vara ingen kan köpa.

☠️ Saldot är läst ur `inventory-items/query`, aldrig ur `availabilityStatus` —
den säger `IN_STOCK` även för EN kvarvarande enhet.

## ☠️ Två namnfilter som gav fel svar, båda tysta

Urvalet krävde två regexar, och båda var fel första gången. Ingen av dem
kastade; båda returnerade helt trovärdiga listor.

1. **`jul\b` på svenska träffar varje HJUL.** Den skulle hitta publicerade
   julsidor och gav 199 träffar — **156 av dem var `hjul`- eller
   `skjul`-produkter** (kylvagn på hjul, plastskjul, sparkcykel). Svenskan
   sätter `jul` i SLUTET av ordet. Rätt ankare är ordets BÖRJAN: `\bjul`
   träffar julgran, jultomte, juldekoration men aldrig hjul. Med det:
   **47 publicerade julsidor**.
2. **`Tannen` på tyska träffar `Tannenholz` — alltså granVIRKE, inte julgran.**
   Sex av de 61 "juluttkasten" är kaninhus, smådjursstall, katthus och en
   strandkorg byggda av gran. De är inte julprodukter alls.

Samma familj som #218 (`Massagesessel` mot `Relaxsessel`): **ett familjefilter
är ett NAMNfilter, och ett namnfilter mäter stavning, inte betydelse.** Skillnaden
här är att båda felen var osynliga — en lista på 199 rader ser lika rimlig ut som
en på 47, tills man läser namnen.

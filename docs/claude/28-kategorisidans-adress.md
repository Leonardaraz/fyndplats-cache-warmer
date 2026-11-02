## ☠️ Kategorisidans adress räknas ur NAMNET, och é blev bindestreck (2026-09-24)

Butiken gör sin egen adress av kategorinamnet i Wix (`asciiSlug`, sedan #647 i
`lib/category-slug.ts`). Fram till dess gjorde den bara om å, ä och ö, och alla
andra tecken blev bindestreck. *Skärmtak & entrétak* (runda S13) fick därför
adressen `skarmtak-entr-tak`, medan texterna och Google-flödet var nycklade på
`skarmtak-entretak`. Sidan renderades med den generiska mallen, och den väntade
adressen gav 404.

☠️ **Vakten i skrivanropet kunde inte se det**, för den räknade med en egen
avskrift av funktionen, och avskriften hade två extra regler (`é→e`, `ü→u`).
En vakt som kör en kopia av butikens kod mäter kopian. Det som fångade felet
var förhandsbygget, som läser butikens riktiga svar. **Adressen kontrolleras
alltså i förhandsbygget, inte i skrivanropet.**

Lagningen tar bort accenter med NFD. Mätt mot alla 128 kategorinamn: bara den
kategorins adress ändrades.

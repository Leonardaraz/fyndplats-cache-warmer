---
name: seo-polering
description: SEO-polering av Fyndplats-utkast från Aosom och VEVOR, en runda om åtta produkter från urval till kontrollerad livesida. Använd när Leonard ber om polering eller en poleringsrunda, säger "polera", eller klistrar in en poleringsprompt från /admin/queue. Läser runbookens steg ett i taget i stället för allt på en gång.
---

# SEO-polering

Runbooken är den enda auktoriteten. Den här filen säger bara vad du läser och
när, så att varje steg bara kostar det steget behöver.

## Före rundan

1. Läs `docs/seo-polish-runbook.md` helt: inledningen, *Fasta regler*,
   stegtabellen, *Klart-kriterium*, *Wix-läsfällor* och *Utanför poleringen*.
2. VEVOR-utkast: läs `docs/polish/vevor.md` först. Det är VEVOR-chattens
   startdokument, och Aosom-utkasten poleras i en egen chatt.
3. `tools/polish-gates/FLAGGADE.md` är 1,5 MB. Läs början, fram till
   *Bortvalda av andra skäl*, och sök sedan med `grep` på varje kandidats
   första åtta tecken. En träff betyder att produkten inte väljs.

## Under rundan

Läs stegets fil i `docs/polish/runbook/` helt när du kommer till steget,
innan du gör något i det. Gör stegen i ordning och hoppa inte över något.

| Steg | Fil |
|---|---|
| 1. Välj åtta | `01-valj-atta.md` |
| 2. Hämta källan | `02-hamta-kallan.md` |
| 3. Bilderna före texten | `03-bilderna-fore-texten.md` |
| 4. Verifiera påståendena | `04-verifiera-pastaendena.md` |
| 5. Skriv texten | `05-skriv-texten.md` |
| 6. Läs sidan som kund | `06-las-sidan-som-kund.md` |
| 7. Recensionerna | `07-recensionerna.md` |
| 8. Grindar och skrivplan | `08-grindar-och-skrivplan.md` |
| 9. Skriv till Wix | `09-skriv-till-wix.md` |
| 10. Kontrollera live | `10-kontrollera-live.md` |
| 11. Dokumentera | `11-dokumentera.md` |

Fördjupningarna `docs/polish/bildmetoder.md`, `docs/polish/syskon.md` och
`docs/polish/varianter.md` läser du när ett steg hänvisar dit. Behöver du bara
ett avsnitt, sök på rubriken med `grep` och läs det avsnittet.

Runbooken hänvisar ibland till ett avsnitt i `CLAUDE.md` vid namn, till exempel
*Bilder bort* eller *Pensionerade utkast raderas efter fjorton dygn*. Avsnitten
står i `docs/claude/`: sök rubriken i innehållsförteckningen i `CLAUDE.md` och
läs bara den filen.

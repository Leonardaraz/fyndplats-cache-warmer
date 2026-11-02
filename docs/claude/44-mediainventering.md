## Mediainventering: "utan katalogreferens" är inte "oanvänd"

Mediabiblioteket på headless-sajten hade **30 231 bilder** 2026-08-27, mot 1 696
produkter. Frågan "vilka används inte?" går inte att besvara från chatten — ett
filobjekt är ~1,3 kB, så en full listning är ~39 MB. Den körs därför där
nycklarna finns: GitHub Actions-workflowen **"Bilder — inventera
mediabiblioteket"** → `/api/cron/media-audit`, rapporten hamnar i
`tools/media-audit/scan-latest.json`.

**Rutten kan inte skriva och kan inte radera.** Det är inte försiktighet på
måfå: Wix Media har inget API som svarar på VAR en fil används (kontrollerat
2026-08-27). Vi kan bara räkna vad katalogen pekar på — produkternas galleri,
`media.main`, `linkedMedia` och kategoribilderna. Utanför mätningen ligger
sidor, banners, logotyper, bloggen, Wix-appar och CMS-kollektionerna (bland
annat recensionsbilderna, som dessutom bor på ett **annat site-id**:
`WIX_SITE_ID`, inte butikens `HEADLESS_WIX_SITE_ID`).

Därför heter fältet `utanKatalogreferens`. Listan är ett underlag för en
människa, aldrig en dödslista — samma hållning som prisreparationens
"det finns ingen kör-allt-flagga".

Tre egenskaper som inte ska tas bort:

- **Katalogen läses FÖRE filerna.** Katalogen är den lilla sidan och den som
  gör listan meningsfull. Tar tidsbudgeten slut mitt i filerna får man en
  delrapport med korrekta referenser; tvärtom hade gett en lista där varje
  oläst produkts bilder ser föräldralösa ut.
- **`fullstandig: false` diskvalificerar listan för radering.** Den är sann
  bara när både filerna, katalogen OCH kategorierna gick klart.
- **Dolda kategorier räknas med.** En dold kategori kan publiceras igen, och
  dess bild ska inte hinna raderas under tiden.

Rapporten räknar också **byte-identiska dubbletter** (samma `hash`) och deras
kostnad — bara kopiorna, inte originalet. Dubbletter kostar plats även när de
används, och en stor post är importvägen: filer vars `displayName` är ett annat
Wix-media-id är omimporter av bilder som redan låg i biblioteket.

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.

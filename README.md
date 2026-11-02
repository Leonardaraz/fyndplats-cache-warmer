# Fyndplats-motorn

Motorn bakom fyndplats.se: import och synk av lager och pris från leverantörerna
(Aosom, VEVOR, AliExpress), poleringens skrivningar, ordrar, recensioner,
auktioner och flöden. Den körs på Vercel som projektet `fyndplats-cache-warmer`,
och workflows i `.github/workflows/` startar dess rutter för hand.

Butiken (`www.fyndplats.se`) bor i grenen `headless-site` och har egna
instruktioner där.

Läs `CLAUDE.md` innan du ändrar något. Den är en innehållsförteckning över
`docs/claude/`, där husets regler, varje verktyg och vad som är mätt står.

Repot hette från början efter en cache-värmare som pingade butikens sidor från
GitHub Actions (`ping_sitemap.py`). Den togs bort 2026-10-31: butiken värmer
sina sidor själv (`/api/cron/varm-katalogen`, `/api/cron/uppdatera-andrade` och
`/api/cron/warm-and-ping`), se *Den gamla GitHub-värmaren är borttagen* i
`docs/claude/39-orderpipelinen.md`.

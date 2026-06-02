# E-postautentisering — DNS-records (fyndplats.se)

Källa till sanning för SPF / DKIM / DMARC på `fyndplats.se`. DNS hanteras via
**Wix** (Leonards Wix-konto → Domains → Manage DNS). Det finns ingen DNS-API /
MCP kopplad till denna kodbas, så själva record-ändringen görs **manuellt** i
Wix-dashboarden. Detta dokument är runbook + verifieringssteg.

## DMARC

DMARC styr vad mottagare gör med mejl som inte passerar SPF/DKIM-alignment, och
vart aggregerade rapporter skickas.

### Mål (FIX-16) — uppgradera från monitoring till enforcement

| | Värde |
|---|---|
| **Host / Name** | `_dmarc` (full: `_dmarc.fyndplats.se`) |
| **Typ** | `TXT` |
| **Tidigare** | `v=DMARC1; p=none; rua=mailto:info@fyndplats.com; pct=100` |
| **Nytt** | `v=DMARC1; p=quarantine; pct=100; rua=mailto:info@fyndplats.com; ruf=mailto:info@fyndplats.com` |

`p=quarantine` = mottagaren lägger icke-alignade mejl i skräpposten (i stället
för `p=none` som bara övervakar). `ruf` lägger till forensiska/failure-rapporter
utöver de aggregerade (`rua`).

### Manuella steg (Wix)

1. Logga in på Wix → **Domains** → `fyndplats.se` → **Manage DNS Records**.
2. Hitta `TXT`-recordet med host `_dmarc`.
3. Ersätt värdet med:
   ```
   v=DMARC1; p=quarantine; pct=100; rua=mailto:info@fyndplats.com; ruf=mailto:info@fyndplats.com
   ```
4. Spara. Wix TTL är typiskt 1 h (3600 s) — propagering kan ta upp till en
   timme.

### Verifiering (efter propagering)

```bash
dig TXT _dmarc.fyndplats.se +short
# förväntat:
# "v=DMARC1; p=quarantine; pct=100; rua=mailto:info@fyndplats.com; ruf=mailto:info@fyndplats.com"
```

På Windows utan `dig`:

```powershell
Resolve-DnsName -Type TXT _dmarc.fyndplats.se | Select-Object -Expand Strings
```

### Rollback

Sätt tillbaka `p=none` om legitima mejl börjar hamna i skräpposten:
`v=DMARC1; p=none; rua=mailto:info@fyndplats.com; pct=100`. Granska `rua`-
rapporterna några dagar innan ev. uppgradering till `p=reject`.

> **Status:** DNS-recordet måste ändras manuellt i Wix (ingen API-åtkomst från
> kodbasen). Detta dokument definierar målvärdet och verifieringen.

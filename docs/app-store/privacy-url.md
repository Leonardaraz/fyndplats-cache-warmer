# Integritetspolicy-URL

**Obligatoriskt** i båda butikerna (Apple: *Privacy Policy URL*; Google Play:
*Privacy Policy* under App content). Krävs alltid för appar som samlar in
användardata.

```
https://www.fyndplats.se/sekretesspolicy
```

## Anteckningar

- Måste vara live, nåbar utan inloggning och beskriva vilka data som samlas in,
  varför, och hur användaren utövar sina GDPR-rättigheter. Granskare öppnar den.
- Innehållet i policyn måste stämma överens med:
  - Apples **Privacy Nutrition Labels** + Privacy Manifest
  - Googles **Data Safety**-formulär
  Se [`compliance-checklist.md`](compliance-checklist.md) för datatyperna som ska
  matcha.
- Verifiera 200-svar och att slug:en `sekretesspolicy` fortfarande gäller på
  live-sajten innan submission.

# Skåpet över tvättmaskinen: paketbilden på vit botten först (2026-10-30)

Leonard såg att `e08e34c4` saknade den första bilden som aosom.de visar för varan, ett
paketfoto på vit botten (800 × 800). Den ligger inte i feeden (tio bilder kollade, ingen
paketbild) och aosom.de svarar 403 på servrar, så bilden kom från Leonards egen
skärmklistring. Filen ligger inte i repot.

- Uppladdad som WebP (kvalitet 86, 5 878 byte) i ett anrop med bilden som base64.
  Hämtad tillbaka från wixstatic och jämförd: md5 lika och 800 × 800 vid avkodning.
- En första uppladdning (kvalitet 92, `b379ce_0e385ead…`) fick EN fel byte i avskriften.
  Wix tog emot den, men den avkodar inte. Den används inte, och bildstädningen är avstängd,
  så den ligger kvar oanvänd.
- Plan: paketbilden först (position 0), de fem som redan satt kvar i samma ordning,
  måttbilden sist. Alt-text 1 rättad från "ektopp" till "topp i ekoptik".
- Skrivs med workflowen "Polering — skriv bara bilderna" (`torr`, `skriv`, `verifiera`).

☠️ **Base64 genom chatten är en avskrift, och en avskrift får en felaktig byte någon gång.**
Svaret `READY` bevisar ingenting. Jämför md5 mot filen innan bilden läggs i ett galleri.

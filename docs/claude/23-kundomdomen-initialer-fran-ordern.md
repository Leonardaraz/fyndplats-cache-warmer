## Kundomdömen utan namn får initialer från ordern (2026-10-18)

Leonards rapport: ett godkänt kundomdöme på en elkamin visade "Verifierad
köpare" som namn. Butikens formulär har ett frivilligt namnfält, och lämnas det
tomt sparar butiken den texten som initialer (headless-site
`lib/customer-review.ts`, `initialsFromName`). Leonard: det ska visa
initialer, som de andra.

Motorn tar numera initialerna från ordern när fältet är tomt
(`/api/reviews/customer` → `lib/reviews/kundinitialer.ts`). Köparens namn på
fakturan gäller först, sedan mottagaren och leveransadressen. Regeln är
butikens: första bokstaven i första och sista ordet. Omdömen som skrevs innan
dess rättas med workflowen **"Recensioner — initialer på kundomdömen som visar
"Verifierad köpare""** (`/api/admin/kundomdome-initialer`, torrt som default).

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En order som inte går att läsa fäller aldrig omdömet.** Då står
   "Verifierad köpare" kvar, och workflowen rättar raden senare.
2. ☠️ **Statusen följer med oförändrad**, och en rad räknas som rättad först
   när den läses tillbaka med de nya initialerna.
3. ☠️ **Loggen och svaret bär bara räknare och produkt-id**, aldrig namn eller
   initialer.
4. ☠️ **Omdömets order-id är oftast ordernumret ("10083"), inte Wix order-id.**
   Butikens omdömeslänk bär `tracking_mapping.order_id`, som är numret, och
   `GET /ecom/v1/orders/{id}` svarar 404 på ett nummer. `fetchOrderKundnamn`
   (`lib/wix/orders.ts`) söker därför fram ett nummer, och träffen måste bära
   samma nummer: ett filter som inte biter hade gett en annan kunds initialer.
   Första versionen slog bara upp id:t, och torrkörningen 2026-10-19 hittade
   ingen av de tre gamla raderna (`orderSaknas` 3 av 3).

⚠️ Formuläret säger "frivilligt – vi visar bara initialer". Lämnar kunden
fältet tomt visas nu initialerna från beställningen, så texten bör säga det.
Det är en ändring i butiken (`components/review-form.tsx`).

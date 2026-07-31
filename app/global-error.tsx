"use client"; // Error boundaries måste vara klientkomponenter.

// Sista skyddsnätet: fångar fel i själva ROT-LAYOUTEN, som app/error.tsx ligger
// inuti och därför inte kan fånga. Filen ERSÄTTER rot-layouten när den är aktiv
// — därför egna <html>/<body>, och därför ingen header/footer att luta sig mot.
//
// Av samma skäl importeras ingen globals.css här: den lastar rot-layoutens
// hela designsystem för en sida som i praktiken aldrig ska visas, och om felet
// beror på CSS-/font-laddningen vore importen det som fällde oss. Stilarna är
// istället inline och medvetet minimala — men på svenska, med Fyndplats-orange
// och en väg tillbaka, i stället för Next.js grå standardskärm.
//
// `metadata` stöds inte i klientkomponenter → <title> sätts som React-element
// (dokumenterat i Next-guiden för global-error).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="sv">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#fff",
          color: "#1c1917",
          font: "16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Något gick fel – Fyndplats</title>
        <main style={{ maxWidth: 440 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: "#78716c" }}>
            Fyndplats
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 26, lineHeight: 1.25 }}>Något gick fel</h1>
          <p style={{ margin: "0 0 24px", color: "#57534e" }}>
            Ett oväntat fel gjorde att sidan inte kunde visas. Försök igen – det
            är nästan alltid tillfälligt.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                border: "none",
                background: "#C2410C",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Försök igen
            </button>
            <a
              href="/"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid #e7e5e4",
                color: "#1c1917",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Till startsidan
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 22, fontSize: 13, color: "#78716c" }}>
              Felkod: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}

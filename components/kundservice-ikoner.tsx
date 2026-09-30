// Ikonerna på kundservicesidorna (/kundtjanst, /kontaktaoss, /sparning).
// Samma form som på /omoss: 24×24, streck i currentColor, i en .om-ikon-ruta.

export const Ikon = {
  paket: <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z M4 7l8 4 8-4 M12 11v10" />,
  retur: <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 5 5v1" />,
  angra: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M9 9l6 6 M15 9l-6 6" />,
  frakt: <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7z M7 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z M17.5 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />,
  betalning: <path d="M3 6h18v12H3z M3 10h18 M7 15h4" />,
  service: <path d="M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H5a1 1 0 0 1-1-1v-5Z M20 13h-3v6h2a1 1 0 0 0 1-1v-5Z M17 19c0 1.5-2 2.5-5 2.5" />,
  mejl: <path d="M3 6h18v12H3z M3 7l9 6 9-6" />,
  telefon: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />,
  adress: <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  klocka: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l3 2" />,
};

export function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

// Ikoner för villkorssidorna (/returer, /angra-kop, /kopvillkor), i samma
// streckstil som /omoss (24×24, stroke 1.7). Egen fil så att sidorna delar
// ritningarna utan att röra app/omoss/page.tsx.

export const Ikon = {
  kalender: <path d="M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4 M8 14h3" />,
  retur: <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 5 5v1" />,
  paket: <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z M3.5 7.5L12 12l8.5-4.5 M12 12v9" />,
  pengar: <path d="M3 7h18v10H3z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M6.5 10v4 M17.5 10v4" />,
  verktyg: <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z" />,
  bock: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  kvitto: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6" />,
  mejl: <path d="M3 6h18v12H3z M3 7l9 6 9-6" />,
};

export function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

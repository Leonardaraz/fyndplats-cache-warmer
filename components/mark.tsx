// Kub-loggan i favicon-looken (app/icon.png): färgerna är pixel-samplade ur
// ikonen så header, webbläsarflik och Google-ruta visar samma varma kub.
// Ren komponent utan beroenden, så att både serverträdet (components/site.tsx)
// och kassans klientträd (app/kassa/kassa-ram.tsx) kan använda den.
//
// Gradienternas id: sidhuvudet och sidfoten ritar loggan med samma id, och
// definitionerna är identiska, så första vinner utan synlig skillnad. Kassan
// döljer butikens sidhuvud (display: none), och en gradient som definieras i
// ett dolt träd ritas inte i alla webbläsare. Kassans logga har därför egna id
// (`idPrefix`).
export const Mark = ({ size = 34, idPrefix = "fpmk" }: { size?: number; idPrefix?: string }) => (
  <svg className="mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <defs>
      <linearGradient id={`${idPrefix}-top`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#FC7E26" />
        <stop offset="1" stopColor="#FF9838" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-left`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF4210" />
        <stop offset="1" stopColor="#FA3A0B" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-right`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF852B" />
        <stop offset="1" stopColor="#FF6B1E" />
      </linearGradient>
    </defs>
    <polygon points="12,1 21.6,6.5 12,12.1 2.4,6.5" fill={`url(#${idPrefix}-top)`} />
    <polygon points="2.4,6.5 12,12.1 12,23 2.4,17.3" fill={`url(#${idPrefix}-left)`} />
    <polygon points="21.6,6.5 12,12.1 12,23 21.6,17.3" fill={`url(#${idPrefix}-right)`} />
  </svg>
);

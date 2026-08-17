// Stjärnraden. Bruten ur ProductReviews 2026-08-17 när samma betyg också
// började visas direkt under produktrubriken — två kopior av samma markup
// hade glidit isär.
//
// Ren presentation, inga hooks: fungerar i både server- och klientkomponenter.

export function Stars({ rating, className }: { rating: number; className?: string }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className={className ? `rev-stars ${className}` : "rev-stars"}
      aria-label={`${full} av 5 stjärnor`}
      title={`${full} av 5`}
    >
      {"★".repeat(full)}
      <span className="rev-stars-empty">{"★".repeat(5 - full)}</span>
    </span>
  );
}

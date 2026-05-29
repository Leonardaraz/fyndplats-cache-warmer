import type { ReactNode } from "react";

// Egen metadata för gradern — sidan i sig är en client-komponent och kan inte
// exportera metadata, så vi gör det här. OG-taggar gör att länken ser bra ut när
// den delas i t.ex. Facebook-grupper eller DM (valideringstrafiken).

export const metadata = {
  title: "Är din webbutik tillgänglig? Gratis EAA/WCAG-koll | Fyndplats",
  description:
    "European Accessibility Act gäller sedan 28 juni 2025. Kör en gratis " +
    "tillgänglighetskoll på din webbutik och se de vanligaste WCAG-felen direkt.",
  openGraph: {
    title: "Gratis EAA-tillgänglighetskoll för din webbutik",
    description:
      "Se på sekunder om din butik riskerar att bryta mot EU:s nya tillgänglighetslag.",
    type: "website",
    locale: "sv_SE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gratis EAA-tillgänglighetskoll",
    description: "Klistra in din URL och se WCAG-felen direkt.",
  },
};

export default function GradeLayout({ children }: { children: ReactNode }) {
  return children;
}

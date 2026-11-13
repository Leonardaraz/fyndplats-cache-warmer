import type { Metadata } from "next";
import { priceHubMetadata, PriceHubPage } from "../../components/price-hub-page";

// Översikten för prisgränsen (Pattern 2b, components/price-hub-page.tsx).
// Underkategorierna ligger i [category]/ som förut.
const PRICE = 500;

export const revalidate = 3600; // 1h ISR, i takt med prissidorna och sitemapen

export function generateMetadata(): Promise<Metadata> {
  return priceHubMetadata(PRICE);
}

export default function Page() {
  return <PriceHubPage price={PRICE} />;
}

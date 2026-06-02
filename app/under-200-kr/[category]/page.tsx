import type { Metadata } from "next";
import { priceTierStaticParams, priceTierMetadata, PriceTierPage } from "../../../components/price-tier-page";

const PRICE = 200;

export const revalidate = 86400; // 24h ISR
// dynamicParams=true: resolvern (samma tierCore-guard som sitemap-listan) är ENDA
// sanningskällan. Se kommentaren i basta-i-test/[type]/page.tsx — frusna build-tids-
// params drev isär från den ~timvis regenererade sitemapen och gav 404 i sitemap.
export const dynamicParams = true;

export function generateStaticParams() {
  return priceTierStaticParams(PRICE);
}

export function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  return params.then(({ category }) => priceTierMetadata(PRICE, category));
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <PriceTierPage price={PRICE} category={category} />;
}

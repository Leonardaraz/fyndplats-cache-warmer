import type { Metadata } from "next";
import { priceTierStaticParams, priceTierMetadata, PriceTierPage } from "../../../components/price-tier-page";

const PRICE = 500;

export const revalidate = 86400; // 24h ISR
export const dynamicParams = false;

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

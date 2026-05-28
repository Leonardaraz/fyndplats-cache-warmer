"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const KEY = "fp_recent";
const MAX = 10;

type RecentItem = { slug: string; name: string; price: string; img: string };

export function trackRecent(item: RecentItem) {
  try {
    const raw = localStorage.getItem(KEY);
    const arr: RecentItem[] = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((x) => x.slug !== item.slug);
    filtered.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {}
}

export function RecentlyViewedTracker({ slug, name, price, img }: RecentItem) {
  useEffect(() => {
    trackRecent({ slug, name, price, img });
  }, [slug, name, price, img]);
  return null;
}

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: RecentItem[] = raw ? JSON.parse(raw) : [];
      setItems(arr.filter((x) => x.slug !== excludeSlug).slice(0, 6));
    } catch {}
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="sec recent-sec">
      <div className="container">
        <div className="sechead"><div className="eyebrow">Senast tittat på</div><h2>Du var precis här</h2></div>
        <div className="recent-row">
          {items.map((it) => (
            <a key={it.slug} href={`/produkt/${it.slug}`} className="recent-card">
              <div className="recent-img">
                {it.img && (
                  <Image src={it.img} alt={it.name} fill sizes="160px" style={{ objectFit: "cover" }} />
                )}
              </div>
              <div className="recent-name">{it.name}</div>
              <div className="recent-price">{it.price}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import type { Product } from "../lib/products";

export function ProductCard({ p }: { p: Product }) {
  return (
    <a className="prod" href={`/produkt/${p.slug}`}>
      <div className="pimg">
        {p.img && (
          <Image
            src={p.img}
            alt={p.name}
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div className="pname">{p.name}</div>
        <div className="prow">
          <span className="pprice">{p.price}</span>
          <span className="pbtn">Köp</span>
        </div>
      </div>
    </a>
  );
}

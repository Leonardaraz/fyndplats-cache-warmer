// Granskningskö för nyimporterade produkter.
// Default: produkter får visible:false + draftStatus="pending_review" i import-flödet.
// Leonard öppnar denna sida, granskar SEO+pris+bilder+kategori, och publicerar.

import Link from "next/link";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store/index";
import {
  acceptCategorySuggestion,
  publishProducts,
  rejectProducts,
  removeImage,
} from "./actions";

export const dynamic = "force-dynamic";

function pendingFirst(a: ProductMappingRecord, b: ProductMappingRecord): number {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

const VERDICT_LABEL: Record<"ok" | "warn" | "reject", string> = {
  ok: "OK",
  warn: "Varning",
  reject: "Avvisad",
};

const VERDICT_COLOR: Record<"ok" | "warn" | "reject", string> = {
  ok: "#16a34a",
  warn: "#d97706",
  reject: "#dc2626",
};

export default async function QueuePage() {
  const store = getStore();
  const all = await store.listMappings();
  const pending = all
    .filter((m) => (m.draftStatus ?? "published") === "pending_review")
    .sort(pendingFirst);
  const recent = all
    .filter((m) => m.draftStatus === "published" || m.draftStatus === "rejected")
    .sort(pendingFirst)
    .slice(0, 10);

  // Aggregera bild-analys-statistik för översikt högst upp.
  const stats = pending.reduce(
    (acc, m) => {
      for (const e of m.imageAnalysis ?? []) {
        acc[e.verdict]++;
      }
      if (m.categorySuggestion?.status === "auto") acc.autoCat++;
      else if (m.categorySuggestion?.status === "suggested") acc.suggestedCat++;
      else acc.uncategorized++;
      return acc;
    },
    { ok: 0, warn: 0, reject: 0, autoCat: 0, suggestedCat: 0, uncategorized: 0 },
  );

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Granskningskö</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Nyimporterade produkter är dolda i butiken tills du publicerar. Granska
        titel, beskrivning, pris, bilder och kategori — klicka sedan{" "}
        <b>Publicera</b> (eller bocka för flera och klicka{" "}
        <b>Publicera valda</b>).
      </p>

      {pending.length > 0 ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "10px 14px",
            margin: "12px 0 16px",
            fontSize: 13,
            color: "#334155",
          }}
        >
          <b>AI-sammanfattning:</b> {stats.ok} bilder OK,{" "}
          <span style={{ color: VERDICT_COLOR.warn }}>{stats.warn} med varning</span>,{" "}
          <span style={{ color: VERDICT_COLOR.reject }}>{stats.reject} avvisade</span>. Kategorier:{" "}
          {stats.autoCat} auto-tilldelade, {stats.suggestedCat} föreslagna,{" "}
          {stats.uncategorized} okategoriserade.
        </div>
      ) : null}

      <h2>Väntar på granskning ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={{ color: "#888" }}>Inga produkter väntar på granskning.</p>
      ) : (
        <form>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pending.map((p) => (
              <QueueCard key={p.wixProductId} product={p} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, position: "sticky", bottom: 0, background: "#fff", padding: "8px 0" }}>
            <button
              formAction={publishProducts}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Publicera valda
            </button>
            <button
              formAction={rejectProducts}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Avvisa valda
            </button>
          </div>
        </form>
      )}

      <h2 style={{ marginTop: 28 }}>Senast granskade (10)</h2>
      {recent.length === 0 ? (
        <p style={{ color: "#888" }}>Inga granskade produkter än.</p>
      ) : (
        <ul style={{ fontSize: 13 }}>
          {recent.map((p) => (
            <li key={p.wixProductId}>
              [{p.draftStatus}] {p.seoTitle ?? p.wixProductId}
              {p.reviewedAt ? (
                <span style={{ color: "#888" }}> — {p.reviewedAt.slice(0, 16).replace("T", " ")}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function QueueCard({ product: p }: { product: ProductMappingRecord }) {
  const images = p.imageAnalysis ?? [];
  const okImages = images.filter((i) => i.verdict === "ok");
  const flaggedImages = images.filter((i) => i.verdict !== "ok");
  const cat = p.categorySuggestion;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <input
          type="checkbox"
          name="wixProductId"
          value={p.wixProductId}
          style={{ marginTop: 4 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {p.seoTitle ?? p.wixProductId}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {p.variants.length} varianter · importerad{" "}
            {p.createdAt ? p.createdAt.slice(0, 16).replace("T", " ") : "—"} · Wix:{" "}
            <code style={{ fontSize: 11 }}>{p.wixProductId}</code>
            {p.sourceUrl ? (
              <>
                {" · "}
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Källa
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Kategoriförslag */}
      {cat ? <CategoryRow productId={p.wixProductId} cat={cat} /> : null}

      {/* Bildgalleri med verdict-badges */}
      {images.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Bildanalys ({okImages.length} OK / {flaggedImages.length} flaggade)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {images.map((img, idx) => (
              <ImageThumb
                key={`${img.url}-${idx}`}
                img={img}
                productId={p.wixProductId}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImageThumb({
  img,
  productId,
}: {
  img: { url: string; verdict: "ok" | "warn" | "reject"; reason: string };
  productId: string;
}) {
  const color = VERDICT_COLOR[img.verdict];
  return (
    <div
      style={{
        width: 140,
        border: `2px solid ${color}`,
        borderRadius: 6,
        overflow: "hidden",
        background: "#fafafa",
        opacity: img.verdict === "reject" ? 0.6 : 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt=""
        style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
      />
      <div
        style={{
          fontSize: 11,
          padding: "4px 6px",
          background: color,
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {VERDICT_LABEL[img.verdict]}
      </div>
      {img.reason ? (
        <div style={{ fontSize: 11, padding: "4px 6px", color: "#444" }}>
          {img.reason}
        </div>
      ) : null}
      {img.verdict !== "ok" ? (
        <form action={removeImage}>
          <input type="hidden" name="wixProductId" value={productId} />
          <input type="hidden" name="imageUrl" value={img.url} />
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#fff",
              border: "none",
              borderTop: "1px solid #eee",
              padding: "5px 6px",
              cursor: "pointer",
              fontSize: 11,
              color: "#dc2626",
              fontWeight: 600,
            }}
          >
            Ta bort bild
          </button>
        </form>
      ) : null}
    </div>
  );
}

function CategoryRow({
  productId,
  cat,
}: {
  productId: string;
  cat: NonNullable<ProductMappingRecord["categorySuggestion"]>;
}) {
  const label = cat.collectionName ?? cat.collectionSlug ?? "—";

  if (cat.status === "auto") {
    return (
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: 6,
          padding: "6px 10px",
        }}
      >
        <b>Kategori (auto):</b> {label}{" "}
        <span style={{ color: "#065f46", fontSize: 12 }}>
          (säkerhet {Math.round(cat.confidence * 100)}%) — {cat.reason}
        </span>
      </div>
    );
  }
  if (cat.status === "suggested") {
    return (
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: 6,
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <b>Föreslagen kategori:</b> {label}{" "}
          <span style={{ color: "#854d0e", fontSize: 12 }}>
            (säkerhet {Math.round(cat.confidence * 100)}%) — {cat.reason}
          </span>
        </div>
        <form action={acceptCategorySuggestion}>
          <input type="hidden" name="wixProductId" value={productId} />
          <button
            type="submit"
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Acceptera kategori
          </button>
        </form>
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 8,
        fontSize: 13,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 6,
        padding: "6px 10px",
        color: "#991b1b",
      }}
    >
      <b>Okategoriserad.</b>{" "}
      <span style={{ fontSize: 12 }}>{cat.reason || "Sätt kategori manuellt i Wix."}</span>
    </div>
  );
}

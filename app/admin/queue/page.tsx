// Granskningskö för nyimporterade produkter.
// Default: produkter får visible:false + draftStatus="pending_review" i import-flödet.
// Leonard öppnar denna sida, granskar SEO+pris+bilder+kategori, och publicerar.

import Link from "next/link";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store/index";
import { getSupplierStore, type SupplierRecord, type SupplierStatus } from "@/lib/import/supplier-tracking";
import {
  acceptCategorySuggestion,
  publishProducts,
  rejectProducts,
  removeImage,
} from "./actions";
import { PolishButton } from "./polish-button";

export const dynamic = "force-dynamic";

function pendingFirst(a: ProductMappingRecord, b: ProductMappingRecord): number {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

/**
 * Sortering "EU först": hasEuWarehouse=true upp, sedan datum desc.
 * Tål att hasEuWarehouse saknas (= treat as false).
 */
function euFirst(a: ProductMappingRecord, b: ProductMappingRecord): number {
  const aEu = a.hasEuWarehouse ? 1 : 0;
  const bEu = b.hasEuWarehouse ? 1 : 0;
  if (aEu !== bEu) return bEu - aEu;
  return pendingFirst(a, b);
}

const WAREHOUSE_BADGE: Record<
  "EU" | "CN" | "MIXED" | "UNKNOWN",
  { label: string; bg: string; color: string; border: string }
> = {
  EU: { label: "🇪🇺 EU-lager", bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  MIXED: { label: "🇪🇺 Delvis EU", bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  CN: { label: "🇨🇳 Kina", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  UNKNOWN: { label: "Lager okänt", bg: "#e5e7eb", color: "#4b5563", border: "#d1d5db" },
};

function warehouseClassOf(m: ProductMappingRecord): "EU" | "CN" | "MIXED" | "UNKNOWN" {
  if (m.warehouseClass) return m.warehouseClass;
  // Härled från shipsFromCountries om warehouseClass inte sparades
  // (back-compat med äldre rader importerade innan EU-filtret fanns).
  if (m.hasEuWarehouse) return "EU";
  if (m.shipsFromCountries && m.shipsFromCountries.length > 0) return "CN";
  return "UNKNOWN";
}

const SUPPLIER_BADGE: Record<
  SupplierStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  good: { label: "✓ Säljare OK", bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  warning: { label: "⚠️ Säljare medel", bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  blocked: { label: "⛔ Säljare blockerad", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
};

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

export default async function QueuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const euOnly = sp.eu === "1" || sp.eu === "true";
  const polishOnly = sp.polish === "1" || sp.polish === "true";
  const sortMode = sp.sort === "eu" ? "eu" : "date";

  const store = getStore();
  const all = await store.listMappings();
  // Säljar-score (Feature 6) — slå upp status per supplierId för kö-badgen.
  const suppliers = await getSupplierStore()
    .listAll()
    .catch(() => [] as SupplierRecord[]);
  const supplierById = new Map(suppliers.map((s) => [s.supplierId, s]));
  const sortFn = sortMode === "eu" ? euFirst : pendingFirst;
  const pendingAll = all
    .filter((m) => (m.draftStatus ?? "published") === "pending_review")
    .sort(sortFn);
  let pending = euOnly
    ? pendingAll.filter((m) => m.hasEuWarehouse === true)
    : pendingAll;
  if (polishOnly) pending = pending.filter((m) => m.needsAiPolish === true);
  const recent = all
    .filter((m) => m.draftStatus === "published" || m.draftStatus === "rejected")
    .sort(pendingFirst)
    .slice(0, 10);
  const totalPending = pendingAll.length;
  const euPendingCount = pendingAll.filter((m) => m.hasEuWarehouse === true).length;
  const polishPendingCount = pendingAll.filter((m) => m.needsAiPolish === true).length;
  // Prisspärren: produkter som hålls som utkast för att variantpriserna inte
  // gick att bekräfta. De är det mest brådskande i kön — en felprissatt produkt
  // säljer med fel marginal så fort någon publicerar den.
  const priceUnverifiedCount = pendingAll.filter((m) => typeof m.priceUnverified === "string").length;

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

      {/* Filter + sort-chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: "12px 0",
          fontSize: 13,
        }}
      >
        <ChipLink
          href={buildQs(sp, { eu: undefined })}
          active={!euOnly}
          label={`Alla (${totalPending})`}
        />
        <ChipLink
          href={buildQs(sp, { eu: "1" })}
          active={euOnly}
          label={`🇪🇺 Endast EU-lager (${euPendingCount})`}
        />
        <ChipLink
          href={buildQs(sp, { polish: "1" })}
          active={polishOnly}
          label={`✨ Behöver AI-polering (${polishPendingCount})`}
        />
        {priceUnverifiedCount > 0 ? (
          <span
            title="Variantpriserna gick inte att bekräfta mot AliExpress DS-API vid import. Produkterna hålls som utkast — se badgen på raden."
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
            }}
          >
            💰 {priceUnverifiedCount} med overifierade priser
          </span>
        ) : null}
        <span style={{ borderLeft: "1px solid #e5e7eb", margin: "0 4px" }} />
        <ChipLink
          href={buildQs(sp, { sort: undefined })}
          active={sortMode === "date"}
          label="Senast importerade först"
        />
        <ChipLink
          href={buildQs(sp, { sort: "eu" })}
          active={sortMode === "eu"}
          label="🇪🇺 EU först"
        />
      </div>

      <h2>Väntar på granskning ({pending.length}{euOnly ? ` av ${totalPending}` : ""})</h2>
      {pending.length === 0 ? (
        <p style={{ color: "#888" }}>Inga produkter väntar på granskning.</p>
      ) : (
        <form>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pending.map((p) => (
              <QueueCard
                key={p.wixProductId}
                product={p}
                supplier={p.supplierId ? supplierById.get(p.supplierId) : undefined}
              />
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

function QueueCard({
  product: p,
  supplier,
}: {
  product: ProductMappingRecord;
  supplier?: SupplierRecord;
}) {
  const images = p.imageAnalysis ?? [];
  const okImages = images.filter((i) => i.verdict === "ok");
  const flaggedImages = images.filter((i) => i.verdict !== "ok");
  const cat = p.categorySuggestion;
  const cls = warehouseClassOf(p);
  const badge = WAREHOUSE_BADGE[cls];
  const codes = p.shipsFromCountries ?? [];

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {p.seoTitle ?? p.wixProductId}
            </div>
            <span
              title={codes.length ? `Warehouses: ${codes.join(", ")}` : ""}
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
              {codes.length ? ` (${codes.join(", ")})` : ""}
            </span>
            {supplier ? (
              <span
                title={
                  `Säljare: ${supplier.supplierName || supplier.supplierId} · ` +
                  `klagomål ${supplier.complaintRate}% (${supplier.complaintCount}/${supplier.productsSold} sålda) · ` +
                  `leverans ${supplier.avgShipDays} dgr · ${supplier.productsImported} importerade` +
                  (supplier.aeRating ? ` · AE-score ${supplier.aeRating}` : "")
                }
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: SUPPLIER_BADGE[supplier.status].bg,
                  color: SUPPLIER_BADGE[supplier.status].color,
                  border: `1px solid ${SUPPLIER_BADGE[supplier.status].border}`,
                }}
              >
                {SUPPLIER_BADGE[supplier.status].label}
              </span>
            ) : null}
            {p.slugSuffix ? (
              <span
                title={`Wix returnerade DUPLICATE_SLUG_ERROR — suffix "${p.slugSuffix}" lades på automatiskt.`}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#e0e7ff",
                  color: "#3730a3",
                  border: "1px solid #a5b4fc",
                }}
              >
                Slug auto-justerad ({p.slugSuffix})
              </span>
            ) : null}
            {p.variants.some((v) => v.shippableToSe === false) ? (
              <span
                title={`Varianter utan fraktväg till Sverige (AliExpress fraktAPI): ${p.variants
                  .filter((v) => v.shippableToSe === false)
                  .map((v) => Object.values(v.choices).join("/") || v.sku)
                  .join(", ")}. Synken håller deras lager på 0 — överväg att ta bort dem i Wix-editorn före publicering.`}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fca5a5",
                }}
              >
                🚫 {p.variants.filter((v) => v.shippableToSe === false).length} variant(er) ej fraktbara till SE
              </span>
            ) : null}
            {p.priceUnverified ? (
              <span
                title={p.priceUnverified}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fca5a5",
                  marginRight: 6,
                }}
              >
                💰 Priser overifierade
              </span>
            ) : null}
            {p.needsAiPolish ? (
              <span
                title={
                  p.unresolvedVariantValues?.length
                    ? `Olösta (engelska) variantvärden/axelnamn: ${p.unresolvedVariantValues.join(", ")} — key-låsta i Wix; rätta tabellen/AI:n och omimportera.`
                    : "Importerad RÅ (AI-berikning av) — saknar AI-genererad SEO/beskrivning/kategori. Polera via chatten."
                }
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#f3e8ff",
                  color: "#6b21a8",
                  border: "1px solid #d8b4fe",
                }}
              >
                ✨ Behöver AI-polering
                {p.unresolvedVariantValues?.length
                  ? ` · ${p.unresolvedVariantValues.length} olösta värden`
                  : ""}
              </span>
            ) : null}
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

      {/* RÅ import (behöver AI-polering): kopiera produkt-info till chatten. */}
      {p.needsAiPolish ? (
        <PolishButton
          wixProductId={p.wixProductId}
          title={p.seoTitle}
          sourceUrl={p.sourceUrl}
        />
      ) : null}

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

/**
 * Bygger en query-string baserat på nuvarande searchParams med patch-overrides.
 * `undefined` i patch betyder "ta bort den parametern".
 */
function buildQs(
  current: Record<string, string | string[] | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (k in patch) continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
    else if (v !== undefined) params.set(k, String(v));
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function ChipLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={`/admin/queue${href}`}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        textDecoration: "none",
        fontWeight: active ? 700 : 500,
        background: active ? "#1f2937" : "#f3f4f6",
        color: active ? "#fff" : "#374151",
        border: active ? "1px solid #1f2937" : "1px solid #e5e7eb",
        fontSize: 12,
      }}
    >
      {label}
    </Link>
  );
}

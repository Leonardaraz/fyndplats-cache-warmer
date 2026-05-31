// /admin/bulk-import — ladda upp CSV → bulk-importera AliExpress-produkter
// som visible:false. Granskningen sker som vanligt i /admin/queue.
//
// Datakällor:
//   - getBulkImportStore().listJobs()        — historik
//   - getJobWithItems(jobId) (när ?job=…)    — aktuell jobbstatus

import Link from "next/link";
import { getBulkImportStore } from "@/lib/bulk-import/store";
import { getJobWithItems } from "@/lib/bulk-import/service";
import { UploadClient } from "./upload-client";
import { ProgressClient } from "./progress-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ job?: string }>;
}

export default async function BulkImportPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const focusedJobId = params.job;

  const store = getBulkImportStore();
  const [jobs, focusedJob] = await Promise.all([
    store.listJobs(20).catch(() => []),
    focusedJobId ? getJobWithItems(focusedJobId).catch(() => null) : Promise.resolve(null),
  ]);

  // Token exponeras till klienten endast för SSE/CSV-download (rendered inline
  // av server-komponenten — admin-sidan kräver redan att Leonard kan nå Vercel).
  const clientToken = process.env.EXTENSION_API_TOKEN ?? "";

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Bulk-import från CSV</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Ladda upp en CSV med AliExpress-URL:er — produkterna importeras i bakgrunden
        som <b>osynliga utkast</b>. Granska och publicera dem från{" "}
        <Link href="/admin/queue">Granskningskön</Link>.
      </p>

      <div style={{
        marginTop: 12,
        padding: "10px 14px",
        background: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: 8,
        fontSize: 13,
        color: "#075985",
      }}>
        <b>Hur det fungerar:</b> Workern (Vercel-cron varje minut) plockar upp till 10 rader per körning
        och importerar 1 rad var 3:e sekund. Vid AliExpress-fel görs ett (1) omförsök. Allt landar som
        visible:false — ingen produkt blir publik automatiskt.
      </div>

      {focusedJob ? (
        <ProgressClient
          jobId={focusedJob.job.id}
          token={clientToken}
          initial={focusedJob}
        />
      ) : (
        <UploadClient />
      )}

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18 }}>Senaste jobben</h2>
        {jobs.length === 0 ? (
          <p style={{ color: "#888", fontSize: 14 }}>Inga jobb än.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "6px 8px" }}>ID</th>
                <th style={{ padding: "6px 8px" }}>Skapat</th>
                <th style={{ padding: "6px 8px" }}>Status</th>
                <th style={{ padding: "6px 8px" }}>Totalt</th>
                <th style={{ padding: "6px 8px" }}>Klara</th>
                <th style={{ padding: "6px 8px" }}>Misslyckade</th>
                <th style={{ padding: "6px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 8px" }}><code>{j.id}</code></td>
                  <td style={{ padding: "6px 8px" }}>{new Date(j.createdAt).toLocaleString("sv-SE")}</td>
                  <td style={{ padding: "6px 8px", color: jobColor(j.status) }}>{j.status}</td>
                  <td style={{ padding: "6px 8px" }}>{j.totalRows}</td>
                  <td style={{ padding: "6px 8px", color: "#16a34a" }}>{j.succeeded}</td>
                  <td style={{ padding: "6px 8px", color: "#dc2626" }}>{j.failed}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <Link href={`/admin/bulk-import?job=${encodeURIComponent(j.id)}`}>Detaljer →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function jobColor(status: string): string {
  switch (status) {
    case "completed": return "#16a34a";
    case "failed": return "#dc2626";
    case "stopped": return "#9ca3af";
    case "running": return "#0891b2";
    default: return "#475569";
  }
}

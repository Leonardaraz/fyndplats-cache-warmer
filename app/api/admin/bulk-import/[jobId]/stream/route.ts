// GET /api/admin/bulk-import/[jobId]/stream — Server-Sent Events för progress.
//
// Pollar storen var 2:a sekund, skickar `data:`-event vid förändring.
// Stänger när jobbet är completed/failed/stopped (eller vid 5 min timeout).
//
// Token via Authorization-header eller ?token=... (för EventSource som inte
// kan sätta egna headers; använd EventSourcePolyfill om du vill ha auth-header).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getJobWithItems } from "@/lib/bulk-import/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

function isAuthorizedSse(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!token || !expected) return false;
  return token === expected;
}

export async function GET(req: NextRequest, ctx: RouteContext): Promise<Response> {
  if (!isAuthorizedSse(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const { jobId } = await ctx.params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastSerialized = "";
      const POLL_MS = 2000;
      const MAX_MS = 280_000;
      const startedAt = Date.now();
      let closed = false;

      const send = (eventName: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Initial snapshot.
      const initial = await getJobWithItems(jobId).catch(() => null);
      if (!initial) {
        send("error", { message: "Jobbet hittades inte" });
        controller.close();
        return;
      }
      send("snapshot", initial);
      lastSerialized = serializeForDiff(initial);

      const tick = async () => {
        if (closed) return;
        if (Date.now() - startedAt > MAX_MS) {
          send("timeout", { message: "Stream-timeout, ladda om för fortsatt uppdatering" });
          closed = true;
          controller.close();
          return;
        }
        try {
          const snap = await getJobWithItems(jobId);
          if (!snap) {
            send("error", { message: "Jobbet hittades inte" });
            closed = true;
            controller.close();
            return;
          }
          const serialized = serializeForDiff(snap);
          if (serialized !== lastSerialized) {
            send("update", snap);
            lastSerialized = serialized;
          }
          if (
            snap.job.status === "completed"
            || snap.job.status === "failed"
            || snap.job.status === "stopped"
          ) {
            send("done", { status: snap.job.status });
            closed = true;
            controller.close();
            return;
          }
        } catch (err) {
          send("error", { message: err instanceof Error ? err.message : String(err) });
        }
        setTimeout(tick, POLL_MS);
      };
      setTimeout(tick, POLL_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function serializeForDiff(snap: { job: { succeeded: number; failed: number; status: string; totalRows: number }; items: { id: string; status: string }[] }): string {
  // Lightweight hash av status så vi inte spammar EventStream.
  const parts = [
    snap.job.status,
    snap.job.succeeded,
    snap.job.failed,
    snap.job.totalRows,
    ...snap.items.map((i) => `${i.id}:${i.status}`),
  ];
  return parts.join("|");
}

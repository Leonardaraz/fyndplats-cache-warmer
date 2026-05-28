import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { assertTransition } from "@/lib/orders/status";
import { getMemoryStore } from "@/lib/store/memory";

const Schema = z.object({ taskId: z.string().min(1) });

// Markerar en orderrad som beställd hos leverantören (pending -> ordered).
// Anropas av tilläggets order-kö efter ett bekräftat AliExpress-köp.
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const store = getMemoryStore();
  const task = (await store.listTasks()).find((t) => t.taskId === parsed.data.taskId);
  if (!task) return NextResponse.json({ error: "Task hittades inte" }, { status: 404 });

  try {
    assertTransition(task.status, "ordered");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }

  await store.setTaskStatus(task.taskId, "ordered");
  return NextResponse.json({ ok: true, taskId: task.taskId, status: "ordered" });
}

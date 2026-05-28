import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getMemoryStore } from "@/lib/store/memory";
import type { TaskStatus } from "@/lib/orders/types";

const VALID: TaskStatus[] = ["pending", "ordered", "shipped", "cancelled"];

// Listar fulfillment-tasks, valfritt filtrerat på status (?status=pending).
// Används av tilläggets order-läge och admin-vyn.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status = statusParam && VALID.includes(statusParam as TaskStatus) ? (statusParam as TaskStatus) : undefined;

  const tasks = await getMemoryStore().listTasks(status);
  return NextResponse.json({ ok: true, tasks });
}

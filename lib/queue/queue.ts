// Återupptagbar kö-logik (för tilläggets order-/sync-batch). Ren och testbar.
// En ögonblicksbild kan persisteras (t.ex. i chrome.storage) och återupptas
// om webbläsaren stängs mitt i — inga dubbletter, ingen omstart från noll.

export type QueueItemState = "pending" | "active" | "done" | "error";

export interface QueueItem {
  id: string;
  state: QueueItemState;
  error?: string;
}

export interface QueueSnapshot {
  items: QueueItem[];
}

export function initQueue(ids: string[]): QueueSnapshot {
  return { items: ids.map((id) => ({ id, state: "pending" })) };
}

/** Vid återupptagning: en post som fastnat i "active" återställs till "pending". */
export function resumeQueue(snapshot: QueueSnapshot): QueueSnapshot {
  return {
    items: snapshot.items.map((it) => (it.state === "active" ? { ...it, state: "pending" } : it)),
  };
}

export function nextPending(q: QueueSnapshot): QueueItem | null {
  return q.items.find((it) => it.state === "pending") ?? null;
}

function setState(q: QueueSnapshot, id: string, state: QueueItemState, error?: string): QueueSnapshot {
  return {
    items: q.items.map((it) => (it.id === id ? { ...it, state, error } : it)),
  };
}

export const markActive = (q: QueueSnapshot, id: string) => setState(q, id, "active");
export const markDone = (q: QueueSnapshot, id: string) => setState(q, id, "done");
export const markError = (q: QueueSnapshot, id: string, error: string) => setState(q, id, "error", error);

export function progress(q: QueueSnapshot) {
  const count = (s: QueueItemState) => q.items.filter((it) => it.state === s).length;
  return {
    total: q.items.length,
    pending: count("pending"),
    active: count("active"),
    done: count("done"),
    error: count("error"),
  };
}

/** Klar när inga poster är pending eller active (done + error = allt). */
export function isComplete(q: QueueSnapshot): boolean {
  return q.items.every((it) => it.state === "done" || it.state === "error");
}

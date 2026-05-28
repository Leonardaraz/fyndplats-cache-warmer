import type { TaskStatus } from "./types";

// Tillåtna statusövergångar för en fulfillment-task. Ren logik — testbar.
// pending  -> ordered | cancelled
// ordered  -> shipped | cancelled
// shipped  -> (terminal)
// cancelled-> (terminal)

const ALLOWED: Record<TaskStatus, TaskStatus[]> = {
  pending: ["ordered", "cancelled"],
  ordered: ["shipped", "cancelled"],
  shipped: [],
  cancelled: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Otillåten statusövergång: ${from} -> ${to}`);
  }
}

export function isTerminal(status: TaskStatus): boolean {
  return ALLOWED[status].length === 0;
}

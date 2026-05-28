import { describe, expect, it } from "vitest";
import {
  initQueue,
  isComplete,
  markActive,
  markDone,
  markError,
  nextPending,
  progress,
  resumeQueue,
} from "./queue";

describe("queue", () => {
  it("processes items one at a time in order", () => {
    let q = initQueue(["a", "b", "c"]);
    expect(nextPending(q)!.id).toBe("a");
    q = markActive(q, "a");
    expect(nextPending(q)!.id).toBe("b"); // active is not pending
    q = markDone(q, "a");
    expect(nextPending(q)!.id).toBe("b");
  });

  it("tracks progress and completion", () => {
    let q = initQueue(["a", "b"]);
    q = markDone(q, "a");
    q = markError(q, "b", "slut i lager");
    expect(progress(q)).toEqual({ total: 2, pending: 0, active: 0, done: 1, error: 1 });
    expect(isComplete(q)).toBe(true);
    expect(nextPending(q)).toBeNull();
  });

  it("records the error message on a failed item", () => {
    let q = initQueue(["a"]);
    q = markError(q, "a", "slut i lager");
    expect(q.items[0]).toEqual({ id: "a", state: "error", error: "slut i lager" });
  });

  it("resumes by resetting stuck active items to pending (no duplicates)", () => {
    let q = initQueue(["a", "b", "c"]);
    q = markDone(q, "a");
    q = markActive(q, "b"); // browser closed while b was active
    const resumed = resumeQueue(q);
    expect(resumed.items.find((i) => i.id === "a")!.state).toBe("done"); // done stays done
    expect(resumed.items.find((i) => i.id === "b")!.state).toBe("pending"); // re-queued
    expect(nextPending(resumed)!.id).toBe("b");
  });
});

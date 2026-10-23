import test from "node:test";
import assert from "node:assert/strict";
import { advanceExpiredPhases, buildPhases, calculateTotal } from "../timer-domain.js";

const phases = [
  { name: "A", sec: 10, type: "prep" },
  { name: "B", sec: 5, type: "work" },
  { name: "C", sec: 8, type: "rest" }
];

test("total estimate matches all phases when preparation occurs once", () => {
  const cfg = { prep: 10, work: 20, rest: 10, sets: 2, cycles: 2 };
  const built = buildPhases(cfg);
  const durationFromPhases = built.reduce((sum, phase) => sum + phase.sec, 0);
  assert.equal(calculateTotal(cfg), 110);
  assert.equal(durationFromPhases, calculateTotal(cfg));
});

test("does not advance before the deadline", () => {
  assert.deepEqual(advanceExpiredPhases(phases, 0, 10_000, 9_999), {
    index: 0, deadline: 10_000, advanced: 0, finished: false
  });
});

test("advances at the exact deadline without changing the timeline", () => {
  assert.deepEqual(advanceExpiredPhases(phases, 0, 10_000, 10_000), {
    index: 1, deadline: 15_000, advanced: 1, finished: false
  });
});

test("catches up across multiple phases after a delayed mobile tick", () => {
  const state = advanceExpiredPhases(phases, 0, 10_000, 17_000);
  assert.deepEqual(state, {
    index: 2, deadline: 23_000, advanced: 2, finished: false
  });
  assert.equal(Math.ceil((state.deadline - 17_000) / 1000), 6);
});

test("marks the workout finished when all phase deadlines have passed", () => {
  assert.deepEqual(advanceExpiredPhases(phases, 0, 10_000, 23_000), {
    index: 3, deadline: 23_000, advanced: 3, finished: true
  });
});

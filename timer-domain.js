export function calculateTotal({ prep, work, rest, sets, cycles }) {
  const safePrep = Math.max(0, Number(prep) || 0);
  const safeWork = Math.max(0, Number(work) || 0);
  const safeRest = Math.max(0, Number(rest) || 0);
  const safeSets = Math.max(1, Math.trunc(Number(sets) || 1));
  const safeCycles = Math.max(1, Math.trunc(Number(cycles) || 1));

  // Preparation occurs once before the first cycle, not once per cycle.
  return safePrep + (
    safeWork * safeSets + safeRest * Math.max(0, safeSets - 1)
  ) * safeCycles;
}

export function buildPhases(cfg) {
  const phases = [];

  for (let cycle = 1; cycle <= cfg.cycles; cycle++) {
    if (cfg.prep && cycle === 1) {
      phases.push({ name: "PREPARAÇÃO", sec: cfg.prep, type: "prep", cycle, set: 1 });
    }

    for (let set = 1; set <= cfg.sets; set++) {
      phases.push({ name: "EXERCÍCIO", sec: cfg.work, type: "work", cycle, set });

      if (set < cfg.sets && cfg.rest) {
        phases.push({ name: "DESCANSO", sec: cfg.rest, type: "rest", cycle, set });
      }
    }
  }

  return phases;
}

/** Advance the schedule using the original deadlines so delayed browser ticks do not add time. */
export function advanceExpiredPhases(phases, index, deadline, now) {
  const startingIndex = Math.max(0, Math.trunc(Number(index) || 0));
  let nextIndex = startingIndex;
  let nextDeadline = Number(deadline);
  const currentTime = Number(now);

  if (!Number.isFinite(nextDeadline) || !Number.isFinite(currentTime)) {
    return {
      index: nextIndex,
      deadline: nextDeadline,
      advanced: 0,
      finished: nextIndex >= phases.length
    };
  }

  while (nextIndex < phases.length && currentTime >= nextDeadline) {
    nextIndex += 1;
    if (nextIndex < phases.length) {
      nextDeadline += Math.max(0, Number(phases[nextIndex].sec) || 0) * 1000;
    }
  }

  return {
    index: nextIndex,
    deadline: nextDeadline,
    advanced: nextIndex - startingIndex,
    finished: nextIndex >= phases.length
  };
}

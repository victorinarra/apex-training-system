export function calculateTotal({ prep, work, rest, sets, cycles }) {
  const safeSets = Math.max(1, sets);
  const safeCycles = Math.max(1, cycles);
  return (prep + (work * safeSets) + (rest * Math.max(0, safeSets - 1))) * safeCycles;
}

export function buildPhases(cfg) {
  const phases = [];

  for (let c = 1; c <= cfg.cycles; c++) {
    if (cfg.prep && c === 1) {
      phases.push({ name: "PREPARAÇÃO", sec: cfg.prep, type: "prep", cycle: c, set: 1 });
    }

    for (let s = 1; s <= cfg.sets; s++) {
      phases.push({ name: "EXERCÍCIO", sec: cfg.work, type: "work", cycle: c, set: s });

      if (s < cfg.sets && cfg.rest) {
        phases.push({ name: "DESCANSO", sec: cfg.rest, type: "rest", cycle: c, set: s });
      }
    }
  }

  return phases;
}

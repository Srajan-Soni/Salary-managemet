import { summarize, histogram } from '../domain/stats.js';

export function createInsightsService(repo) {
  return {
    summary: (filters) => summarize(repo.salariesUsd(filters)),

    breakdown(by, filters) {
      const groups = new Map();
      for (const { key, v } of repo.groupedSalariesUsd(by, filters)) {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
      }
      return [...groups.entries()]
        .map(([key, values]) => ({ key, ...summarize(values) }))
        .sort((a, b) => b.median - a.median);
    },

    distribution: (bins, filters) => histogram(repo.salariesUsd(filters), bins),
  };
}
import { buildWhere, FROM } from './filters.js';

const GROUP_COLUMN = { country: 'e.country', department: 'e.department', jobTitle: 'e.job_title' };

export function createInsightsRepo(db) {
  return {
    /** USD-normalised salaries (one number per employee) for the filter. */
    salariesUsd(filters) {
      const { where, params } = buildWhere(filters);
      return db.prepare(`SELECT e.salary * x.rate_to_usd AS v ${FROM} ${where}`).pluck().all(params);
    },
    /** [{ key, v }] rows for grouping in the service layer. */
    groupedSalariesUsd(by, filters) {
      const { where, params } = buildWhere(filters);
      return db.prepare(`SELECT ${GROUP_COLUMN[by]} AS key, e.salary * x.rate_to_usd AS v ${FROM} ${where}`).all(params);
    },
  };
}
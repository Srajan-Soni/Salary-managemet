// Builds a parameterised WHERE clause. Column names are fixed here, values are always bound,
// so user input can never reach the SQL text.
export function buildWhere(f = {}) {
  const clauses = [];
  const params = {};
  if (f.search) {
    clauses.push('(e.full_name LIKE @search ESCAPE \'\\\' OR e.email LIKE @search ESCAPE \'\\\')');
    params.search = `%${f.search.replace(/[\\%_]/g, '\\$&')}%`;
  }
  if (f.country) { clauses.push('e.country = @country'); params.country = f.country; }
  if (f.department) { clauses.push('e.department = @department'); params.department = f.department; }
  if (f.jobTitle) { clauses.push('e.job_title = @jobTitle'); params.jobTitle = f.jobTitle; }
  if (f.minSalaryUsd !== undefined) { clauses.push('e.salary * x.rate_to_usd >= @minUsd'); params.minUsd = f.minSalaryUsd; }
  if (f.maxSalaryUsd !== undefined) { clauses.push('e.salary * x.rate_to_usd <= @maxUsd'); params.maxUsd = f.maxSalaryUsd; }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export const FROM = 'FROM employees e JOIN fx_rates x ON x.currency = e.currency';
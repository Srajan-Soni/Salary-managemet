import { buildWhere, FROM } from './filters.js';

const SORT_COLUMNS = {
  fullName: 'e.full_name COLLATE NOCASE',
  salaryUsd: 'e.salary * x.rate_to_usd',
  hireDate: 'e.hire_date',
  country: 'e.country',
  department: 'e.department',
  jobTitle: 'e.job_title',
};

const SELECT = `SELECT e.id, e.full_name AS fullName, e.email, e.job_title AS jobTitle,
  e.department, e.country, e.currency, e.salary,
  ROUND(e.salary * x.rate_to_usd) AS salaryUsd,
  e.hire_date AS hireDate, e.created_at AS createdAt, e.updated_at AS updatedAt`;

export function createEmployeeRepo(db) {
  const insert = db.prepare(`INSERT INTO employees (full_name, email, job_title, department, country, currency, salary, hire_date)
    VALUES (@fullName, @email, @jobTitle, @department, @country, @currency, @salary, @hireDate)`);
  const byId = db.prepare(`${SELECT} ${FROM} WHERE e.id = ?`);
  const update = db.prepare(`UPDATE employees SET full_name=@fullName, email=@email, job_title=@jobTitle,
    department=@department, country=@country, currency=@currency, salary=@salary, hire_date=@hireDate,
    updated_at=datetime('now') WHERE id=@id`);
  const remove = db.prepare('DELETE FROM employees WHERE id = ?');
  const addHistory = db.prepare(`INSERT INTO salary_history (employee_id, old_salary, new_salary, currency, reason)
    VALUES (@employeeId, @oldSalary, @newSalary, @currency, @reason)`);
  const history = db.prepare(`SELECT id, old_salary AS oldSalary, new_salary AS newSalary, currency, reason, changed_at AS changedAt
    FROM salary_history WHERE employee_id = ? ORDER BY id DESC`);

  return {
    insert: (row) => insert.run(row).lastInsertRowid,
    findById: (id) => byId.get(id),
    update: (row) => update.run(row).changes,
    remove: (id) => remove.run(id).changes,
    addHistory: (row) => addHistory.run(row),
    history: (id) => history.all(id),

    list(filters, { sort, order, page, pageSize }) {
      const { where, params } = buildWhere(filters);
      const dir = order === 'desc' ? 'DESC' : 'ASC';
      const total = db.prepare(`SELECT COUNT(*) AS n ${FROM} ${where}`).get(params).n;
      const items = db
        .prepare(`${SELECT} ${FROM} ${where} ORDER BY ${SORT_COLUMNS[sort]} ${dir}, e.id ASC LIMIT @limit OFFSET @offset`)
        .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });
      return { items, total };
    },

    /** Every matching row (for CSV export). */
    all(filters) {
      const { where, params } = buildWhere(filters);
      return db.prepare(`${SELECT} ${FROM} ${where} ORDER BY e.full_name COLLATE NOCASE, e.id`).all(params);
    },

    distinctJobTitles: () => db.prepare('SELECT DISTINCT job_title AS t FROM employees ORDER BY t').all().map((r) => r.t),
    transaction: (fn) => db.transaction(fn)(),
  };
}
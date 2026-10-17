import { currencyFor } from '../domain/reference.js';
import { AppError, notFound } from '../errors.js';

export function createEmployeeService(repo) {
  const toRow = (input) => ({
    fullName: input.fullName,
    email: input.email,
    jobTitle: input.jobTitle,
    department: input.department,
    country: input.country,
    currency: currencyFor(input.country), // derived, never trusted from the client
    salary: input.salary,
    hireDate: input.hireDate,
  });

  const get = (id) => {
    const e = repo.findById(id);
    if (!e) throw notFound('Employee');
    return e;
  };

  return {
    list: (filters, paging) => {
      const { items, total } = repo.list(filters, paging);
      return { items, total, page: paging.page, pageSize: paging.pageSize, totalPages: Math.max(1, Math.ceil(total / paging.pageSize)) };
    },

    get(id) {
      return { ...get(id), history: repo.history(id) };
    },

    create(input) {
      return repo.transaction(() => {
        const row = toRow(input);
        const id = Number(repo.insert(row));
        repo.addHistory({ employeeId: id, oldSalary: null, newSalary: row.salary, currency: row.currency, reason: input.reason ?? 'Initial salary' });
        return this.get(id);
      });
    },

    update(id, input) {
      return repo.transaction(() => {
        const before = get(id);
        const row = toRow(input);
        repo.update({ ...row, id });
        // A change of amount OR currency (country move) is a salary event worth recording.
        if (before.salary !== row.salary || before.currency !== row.currency) {
          repo.addHistory({ employeeId: id, oldSalary: before.salary, newSalary: row.salary, currency: row.currency, reason: input.reason ?? null });
        }
        return this.get(id);
      });
    },

    remove(id) {
      if (repo.remove(id) === 0) throw notFound('Employee');
    },

    exportRows: (filters) => repo.all(filters),
    jobTitles: () => repo.distinctJobTitles(),
  };
}

export { AppError };
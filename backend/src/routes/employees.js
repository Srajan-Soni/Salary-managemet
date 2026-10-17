import { Router } from 'express';
import { employeeInput, employeeQuery } from '../validation.js';
import { toCsv } from '../csv.js';
import { AppError } from '../errors.js';

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new AppError(400, 'BAD_ID', 'Invalid employee id');
  return id;
};

const CSV_COLUMNS = [
  { key: 'id', label: 'ID' }, { key: 'fullName', label: 'Name' }, { key: 'email', label: 'Email' },
  { key: 'jobTitle', label: 'Job title' }, { key: 'department', label: 'Department' }, { key: 'country', label: 'Country' },
  { key: 'currency', label: 'Currency' }, { key: 'salary', label: 'Salary (local)' }, { key: 'salaryUsd', label: 'Salary (USD)' },
  { key: 'hireDate', label: 'Hire date' },
];

export function employeeRoutes(service) {
  const r = Router();

  r.get('/', (req, res) => {
    const { sort, order, page, pageSize, ...filters } = employeeQuery.parse(req.query);
    res.json(service.list(filters, { sort, order, page, pageSize }));
  });

  // must be registered before /:id
  r.get('/export.csv', (req, res) => {
    const { sort, order, page, pageSize, ...filters } = employeeQuery.parse(req.query);
    res.type('text/csv').attachment('employees.csv').send(toCsv(CSV_COLUMNS, service.exportRows(filters)));
  });

  r.get('/:id', (req, res) => res.json(service.get(parseId(req.params.id))));
  r.post('/', (req, res) => res.status(201).json(service.create(employeeInput.parse(req.body))));
  r.put('/:id', (req, res) => res.json(service.update(parseId(req.params.id), employeeInput.parse(req.body))));
  r.delete('/:id', (req, res) => {
    service.remove(parseId(req.params.id));
    res.status(204).end();
  });
  return r;
}
import Database from 'better-sqlite3';
import { COUNTRIES } from './domain/reference.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS fx_rates (
  currency    TEXT PRIMARY KEY,
  rate_to_usd REAL NOT NULL CHECK (rate_to_usd > 0)
);

CREATE TABLE IF NOT EXISTS employees (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  job_title  TEXT NOT NULL,
  department TEXT NOT NULL,
  country    TEXT NOT NULL,
  currency   TEXT NOT NULL REFERENCES fx_rates(currency),
  salary     INTEGER NOT NULL CHECK (salary > 0),   -- annual base, local currency, whole units
  hire_date  TEXT NOT NULL,                          -- ISO yyyy-mm-dd
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emp_country    ON employees(country);
CREATE INDEX IF NOT EXISTS idx_emp_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_emp_job_title  ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_emp_salary     ON employees(salary);
CREATE INDEX IF NOT EXISTS idx_emp_name       ON employees(full_name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS salary_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  old_salary  INTEGER,                               -- NULL for the initial record
  new_salary  INTEGER NOT NULL,
  currency    TEXT NOT NULL,
  reason      TEXT,
  changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hist_employee ON salary_history(employee_id, id);
`;

/** Open (and migrate) a database. Use ':memory:' in tests. */
export function openDb(path = ':memory:') {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  const upsert = db.prepare(
    'INSERT INTO fx_rates (currency, rate_to_usd) VALUES (?, ?) ON CONFLICT(currency) DO UPDATE SET rate_to_usd = excluded.rate_to_usd',
  );
  db.transaction(() => {
    for (const c of Object.values(COUNTRIES)) upsert.run(c.currency, c.rateToUsd);
  })();
  return db;
}
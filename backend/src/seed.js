import { openDb } from './db.js';
import { COUNTRIES, ORG } from './domain/reference.js';

const FIRST = ['Aarav','Priya','Liam','Olivia','Noah','Emma','Mateo','Sofia','Hiroshi','Yuki','Chen','Mei','Lukas','Anna','Rahul','Ananya','James','Charlotte','Ethan','Isabella','Arjun','Kavya','Oliver','Amelia','Lucas','Mia','Daniel','Sara','Kenji','Aiko','Tom','Zoe','Carlos','Ines','Omar','Fatima','Ravi','Neha','Jack','Grace'];
const LAST = ['Sharma','Patel','Smith','Johnson','Williams','Brown','Garcia','Silva','Tanaka','Sato','Wang','Li','Mueller','Schmidt','Gupta','Iyer','Taylor','Wilson','Martin','Lee','Kumar','Singh','Clark','Walker','Santos','Costa','Nguyen','Kim','Ito','Suzuki','Anderson','Thomas','Lopez','Ferrari','Khan','Ali','Reddy','Nair','Evans','Hughes'];

// Weighted so the org looks plausible (US/IN heavy).
const COUNTRY_WEIGHTS = { US: 28, IN: 24, GB: 10, DE: 8, CA: 7, AU: 5, SG: 5, JP: 7, BR: 6 };
const DEPT_WEIGHTS = { Engineering: 38, Product: 8, Sales: 18, Marketing: 8, HR: 5, Finance: 8, Operations: 15 };

/** Small deterministic PRNG so seeds (and tests) are reproducible. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickWeighted = (rand, weights) => {
  const entries = Object.entries(weights);
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((r -= w) < 0) return k;
  return entries[0][0];
};
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

/** Pure generator: returns employee rows (no DB access). */
export function generateEmployees(count, seed = 42, today = new Date('2026-01-01')) {
  const rand = mulberry32(seed);
  const rows = [];
  for (let i = 1; i <= count; i++) {
    const country = pickWeighted(rand, COUNTRY_WEIGHTS);
    const { currency, rateToUsd, costFactor } = COUNTRIES[country];
    const department = pickWeighted(rand, DEPT_WEIGHTS);
    const jobTitle = pick(rand, Object.keys(ORG[department]));
    const [lo, hi] = ORG[department][jobTitle];
    // Skew toward the lower half of the band (a few high earners), +-5% noise.
    const usd = (lo + (hi - lo) * rand() ** 1.4) * costFactor * (0.95 + rand() * 0.1);
    const salary = Math.max(1000, Math.round(usd / rateToUsd / 100) * 100); // local currency, nearest 100
    const first = pick(rand, FIRST);
    const last = pick(rand, LAST);
    const hire = new Date(today.getTime() - Math.floor(rand() * 3650) * 86_400_000);
    rows.push({
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i}@acme.example`.toLowerCase(),
      jobTitle, department, country, currency, salary,
      hireDate: hire.toISOString().slice(0, 10),
    });
  }
  return rows;
}

export function seed(db, count = 10_000, seedValue = 42) {
  const insertEmp = db.prepare(`INSERT INTO employees (full_name, email, job_title, department, country, currency, salary, hire_date)
    VALUES (@fullName, @email, @jobTitle, @department, @country, @currency, @salary, @hireDate)`);
  const insertHist = db.prepare(`INSERT INTO salary_history (employee_id, old_salary, new_salary, currency, reason) VALUES (?, NULL, ?, ?, 'Initial salary')`);
  const rows = generateEmployees(count, seedValue);
  db.transaction(() => {
    db.exec('DELETE FROM salary_history; DELETE FROM employees;');
    for (const r of rows) insertHist.run(insertEmp.run(r).lastInsertRowid, r.salary, r.currency);
  })();
  return rows.length;
}

// CLI: `npm run seed [count]`
if (process.argv[1]?.endsWith('seed.js')) {
  const count = Number(process.argv[2] ?? 10_000);
  const db = openDb(process.env.DB_PATH ?? './salary.db');
  const t = Date.now();
  console.log(`Seeded ${seed(db, count)} employees in ${Date.now() - t}ms`);
}
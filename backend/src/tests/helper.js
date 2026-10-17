import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

export const makeApp = () => {
  const db = openDb(':memory:');
  return { db, app: createApp(db) };
};

export const validEmployee = (over = {}) => ({
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  salary: 2_400_000,
  hireDate: '2022-03-01',
  ...over,
});
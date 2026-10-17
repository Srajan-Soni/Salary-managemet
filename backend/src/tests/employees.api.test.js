import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { makeApp, validEmployee } from './helpers.js';

let app;
beforeEach(() => ({ app } = makeApp()));

const create = (over) => request(app).post('/api/employees').send(validEmployee(over));

describe('POST /api/employees', () => {
  it('creates an employee, derives currency from country and records initial history', async () => {
    const res = await create();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ currency: 'INR', salary: 2_400_000, salaryUsd: 28_800 });
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0]).toMatchObject({ oldSalary: null, newSalary: 2_400_000 });
  });

  it('ignores a client-supplied currency', async () => {
    const res = await create({ currency: 'USD' });
    expect(res.body.currency).toBe('INR');
  });

  it.each([
    ['negative salary', { salary: -5 }],
    ['fractional salary', { salary: 10.5 }],
    ['bad email', { email: 'nope' }],
    ['unknown country', { country: 'XX' }],
    ['unknown department', { department: 'Wizardry' }],
    ['future hire date', { hireDate: '2999-01-01' }],
    ['short name', { fullName: 'A' }],
  ])('rejects %s with 400 and field details', async (_label, over) => {
    const res = await create(over);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('returns 409 for a duplicate email', async () => {
    await create();
    const res = await create({ fullName: 'Someone Else' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app).post('/api/employees').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/employees/:id', () => {
  it('records history only when salary or currency changes', async () => {
    const { body } = await create();
    const noChange = await request(app).put(`/api/employees/${body.id}`).send(validEmployee({ jobTitle: 'Senior Software Engineer' }));
    expect(noChange.body.history).toHaveLength(1);

    const raise = await request(app).put(`/api/employees/${body.id}`).send(validEmployee({ salary: 2_800_000, reason: 'Promotion' }));
    expect(raise.status).toBe(200);
    expect(raise.body.history).toHaveLength(2);
    expect(raise.body.history[0]).toMatchObject({ oldSalary: 2_400_000, newSalary: 2_800_000, reason: 'Promotion' });
  });

  it('switches currency when the country changes', async () => {
    const { body } = await create();
    const res = await request(app).put(`/api/employees/${body.id}`).send(validEmployee({ country: 'GB', salary: 60_000 }));
    expect(res.body).toMatchObject({ country: 'GB', currency: 'GBP' });
    expect(res.body.history[0].currency).toBe('GBP');
  });

  it('404s for a missing employee and 400s for a bad id', async () => {
    expect((await request(app).put('/api/employees/999').send(validEmployee())).status).toBe(404);
    expect((await request(app).put('/api/employees/abc').send(validEmployee())).status).toBe(400);
  });
});

describe('DELETE /api/employees/:id', () => {
  it('deletes the employee and cascades history', async () => {
    const { body } = await create();
    expect((await request(app).delete(`/api/employees/${body.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/employees/${body.id}`)).status).toBe(404);
    expect((await request(app).delete(`/api/employees/${body.id}`)).status).toBe(404);
  });
});

describe('GET /api/employees (list)', () => {
  beforeEach(async () => {
    await create({ fullName: 'Ann Alpha', email: 'a@x.io', country: 'US', salary: 100_000 });
    await create({ fullName: 'Bob Beta', email: 'b@x.io', country: 'US', salary: 150_000, department: 'Sales', jobTitle: 'Account Executive' });
    await create({ fullName: 'Cid Gamma', email: 'c@x.io', country: 'IN', salary: 5_000_000 }); // = 60k USD
  });

  it('paginates and reports totals', async () => {
    const res = await request(app).get('/api/employees?pageSize=2&page=2');
    expect(res.body).toMatchObject({ total: 3, page: 2, pageSize: 2, totalPages: 2 });
    expect(res.body.items).toHaveLength(1);
  });

  it('filters by country, department and USD range', async () => {
    expect((await request(app).get('/api/employees?country=US')).body.total).toBe(2);
    expect((await request(app).get('/api/employees?department=Sales')).body.items[0].fullName).toBe('Bob Beta');
    const range = await request(app).get('/api/employees?minSalaryUsd=50000&maxSalaryUsd=120000');
    expect(range.body.items.map((e) => e.fullName).sort()).toEqual(['Ann Alpha', 'Cid Gamma']);
  });

  it('sorts by normalised USD salary, not raw local amounts', async () => {
    const res = await request(app).get('/api/employees?sort=salaryUsd&order=desc');
    expect(res.body.items.map((e) => e.fullName)).toEqual(['Bob Beta', 'Ann Alpha', 'Cid Gamma']);
  });

  it('searches name or email case-insensitively and treats % literally', async () => {
    expect((await request(app).get('/api/employees?search=GAMMA')).body.total).toBe(1);
    expect((await request(app).get('/api/employees?search=b@x')).body.total).toBe(1);
    expect((await request(app).get('/api/employees?search=%25')).body.total).toBe(0);
  });

  it('rejects an invalid sort column rather than passing it to SQL', async () => {
    expect((await request(app).get('/api/employees?sort=salary;DROP TABLE employees')).status).toBe(400);
  });

  it('exports the filtered view as CSV', async () => {
    const res = await request(app).get('/api/employees/export.csv?country=IN');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = res.text.trim().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Cid Gamma');
  });
});
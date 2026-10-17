import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { makeApp, validEmployee } from './helpers.js';

let app;
beforeEach(async () => {
  ({ app } = makeApp());
  const add = (o) => request(app).post('/api/employees').send(validEmployee(o));
  await add({ email: '1@x.io', country: 'US', salary: 100_000 });
  await add({ email: '2@x.io', country: 'US', salary: 200_000, department: 'Sales', jobTitle: 'Sales Manager' });
  await add({ email: '3@x.io', country: 'GB', salary: 100_000 }); // 127k USD
  await add({ email: '4@x.io', country: 'IN', salary: 5_000_000 }); // 60k USD
});

describe('insights', () => {
  it('summarises the whole org in USD', async () => {
    const { body } = await request(app).get('/api/insights/summary');
    expect(body).toMatchObject({ headcount: 4, min: 60_000, max: 200_000, total: 487_000 });
    expect(body.median).toBe(113_500);
  });

  it('applies filters to the summary', async () => {
    const { body } = await request(app).get('/api/insights/summary?country=US');
    expect(body).toMatchObject({ headcount: 2, avg: 150_000, median: 150_000 });
  });

  it('returns an empty summary, not an error, when nothing matches', async () => {
    const { body } = await request(app).get('/api/insights/summary?country=JP');
    expect(body).toMatchObject({ headcount: 0, median: null });
  });

  it('breaks down by country sorted by median desc', async () => {
    const { body } = await request(app).get('/api/insights/breakdown?by=country');
    expect(body.rows.map((r) => r.key)).toEqual(['US', 'GB', 'IN']);
    expect(body.rows[0]).toMatchObject({ headcount: 2, median: 150_000 });
  });

  it('breaks down by department and job title', async () => {
    const dept = await request(app).get('/api/insights/breakdown?by=department');
    expect(dept.body.rows.find((r) => r.key === 'Sales').headcount).toBe(1);
    const title = await request(app).get('/api/insights/breakdown?by=jobTitle&country=US');
    expect(title.body.rows.map((r) => r.key)).toEqual(['Sales Manager', 'Software Engineer']);
  });

  it('rejects an unknown breakdown dimension', async () => {
    expect((await request(app).get('/api/insights/breakdown?by=password')).status).toBe(400);
  });

  it('returns a distribution whose counts add up to the headcount', async () => {
    const { body } = await request(app).get('/api/insights/distribution?bins=5');
    expect(body.bins).toHaveLength(5);
    expect(body.bins.reduce((s, b) => s + b.count, 0)).toBe(4);
  });
});

describe('meta & misc', () => {
  it('exposes reference data for the UI', async () => {
    const { body } = await request(app).get('/api/meta');
    expect(body.countries.find((c) => c.code === 'JP').currency).toBe('JPY');
    expect(body.departments).toContain('Engineering');
    expect(body.jobTitles).toContain('Software Engineer');
  });
  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { COUNTRIES, DEPARTMENTS } from './domain/reference.js';
import { createEmployeeRepo } from './repositories/employeeRepo.js';
import { createInsightsRepo } from './repositories/insightsRepo.js';
import { createEmployeeService } from './services/employeeService.js';
import { createInsightsService } from './services/insightsService.js';
import { employeeRoutes } from './routes/employees.js';
import { insightRoutes } from './routes/insights.js';

/** App factory: takes a db so tests can inject an in-memory one. */
export function createApp(db, { corsOrigin = '*' } = {}) {
  const employees = createEmployeeService(createEmployeeRepo(db));
  const insights = createInsightsService(createInsightsRepo(db));

  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/meta', (_req, res) =>
    res.json({
      countries: Object.entries(COUNTRIES).map(([code, c]) => ({ code, name: c.name, currency: c.currency })),
      departments: DEPARTMENTS,
      jobTitles: employees.jobTitles(),
    }),
  );
  app.use('/api/employees', employeeRoutes(employees));
  app.use('/api/insights', insightRoutes(insights));

  app.use('/api', (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
      });
    }
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: 'An employee with this email already exists' } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
    }
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
  });
  return app;
}
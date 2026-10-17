import { Router } from 'express';
import { insightFilter, breakdownQuery, distributionQuery } from '../validation.js';

export function insightRoutes(service) {
  const r = Router();
  r.get('/summary', (req, res) => res.json(service.summary(insightFilter.parse(req.query))));
  r.get('/breakdown', (req, res) => {
    const { by, ...filters } = breakdownQuery.parse(req.query);
    res.json({ by, rows: service.breakdown(by, filters) });
  });
  r.get('/distribution', (req, res) => {
    const { bins, ...filters } = distributionQuery.parse(req.query);
    res.json({ bins: service.distribution(bins, filters) });
  });
  return r;
}
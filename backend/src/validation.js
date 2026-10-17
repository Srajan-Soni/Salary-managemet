import { z } from 'zod';
import { COUNTRY_CODES, DEPARTMENTS } from './domain/reference.js';

const todayIso = () => new Date().toISOString().slice(0, 10);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((d) => !Number.isNaN(Date.parse(d)), 'Invalid date')
  .refine((d) => d <= todayIso(), 'Hire date cannot be in the future');

export const employeeInput = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  jobTitle: z.string().trim().min(2).max(100),
  department: z.enum(DEPARTMENTS),
  country: z.enum(COUNTRY_CODES),
  salary: z.number().int().positive().max(10_000_000_000),
  hireDate: isoDate,
  reason: z.string().trim().max(300).optional(), // why the salary is set/changed
});

export const employeeQuery = z.object({
  search: z.string().trim().max(100).optional(),
  country: z.enum(COUNTRY_CODES).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  minSalaryUsd: z.coerce.number().nonnegative().optional(),
  maxSalaryUsd: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['fullName', 'salaryUsd', 'hireDate', 'country', 'department', 'jobTitle']).default('fullName'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

export const insightFilter = z.object({
  country: z.enum(COUNTRY_CODES).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  jobTitle: z.string().trim().max(100).optional(),
});

export const breakdownQuery = insightFilter.extend({
  by: z.enum(['country', 'department', 'jobTitle']),
});

export const distributionQuery = insightFilter.extend({
  bins: z.coerce.number().int().min(2).max(40).default(12),
});
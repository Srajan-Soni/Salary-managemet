# Requirements: Salary Management for ACME (10,000 employees)

**Persona:** HR Manager (single trusted user). **Written before any code.**

## Goal
Replace the Excel sheets HR uses today with a web app where the HR Manager can (1) maintain salary records for ~10,000 employees across multiple countries and (2) quickly answer "how do we pay people?" without building pivot tables.

## Success looks like
- Find any employee in < 1 s and edit their salary in < 3 clicks.
- Answer, from one screen: *What is our payroll? What is the median pay per country / department / job title? Who is paid at the extremes? How is pay distributed?*
- Every salary change is traceable (who/what/when/why), which Excel never gave us.

## Scope & features (v1)
| # | Feature | Why |
|---|---------|-----|
| 1 | Employee list: server-side search, filters (country, department, job title, salary range), sorting, pagination | 10k rows cannot be shipped to the browser or scrolled |
| 2 | Create / edit / delete employee | Replaces Excel editing |
| 3 | Salary history, auto-recorded on every salary change, with optional reason | Auditability |
| 4 | Multi-currency: salary stored in local currency; country determines currency; USD-normalised via an FX table for cross-country comparison | Org pays in 9 countries; comparing INR to GBP raw is meaningless |
| 5 | Insights dashboard: headcount, payroll, min/median/avg/p10/p90/max, breakdown by country / department / job title, salary distribution histogram | The "answer questions" half of the problem |
| 6 | Seed script: 10,000 realistic, deterministic employees | Required, and used for performance testing |
| 7 | CSV export of the current filtered view | Excel habits die slowly; easy bridge |

## Deliberately left out (and why)
- **Authentication / RBAC:** one persona (HR Manager). Real deployment would sit behind SSO; building login adds no insight into the core problem. *First follow-up item*, since salary data is sensitive.
- **Payroll, tax, payslips, bonus, equity, benefits:** a different product; we model base salary only.
- **Live FX rates:** static, editable table keeps results deterministic and testable; rates are a documented assumption.
- **Gender / demographic pay-equity analysis:** valuable but needs data-governance decisions that HR/legal must own, not an assessment build.
- **Bulk CSV *import* UI:** the seed covers initial load; import needs validation/rollback UX worth its own iteration.
- **Approval workflows, org hierarchy, multi-tenant:** not requested; would triple scope.

## Non-functional requirements
- Lists and insights respond in well under 300 ms at 10k rows (indexes + server-side pagination/aggregation).
- Money is stored as integers (no float rounding in stored data).
- Input validated at the API boundary; consistent error shape.
- Unit tests fast (<5 s) and deterministic (seeded PRNG, in-memory SQLite).

## Key assumptions
1. One salary figure per employee = annual base salary in local currency.
2. Currency is derived from country (one currency per country).
3. Hard delete is acceptable for v1 (history rows go with the employee); soft delete is a noted follow-up.
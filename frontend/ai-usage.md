# How AI was used

Tool: Claude (agentic coding), driven as a pair-programmer with me as reviewer/decision-maker.

## Workflow
1. **Requirements first** - asked the AI to turn the assessment brief into a one-page doc (goal, scope, explicit exclusions). I made the scope calls (no auth, no payroll, static FX).
2. **Design before code** - agreed layering (routes → services → repositories → domain) and the data model before any implementation.
3. **Small vertical slices, each committed**: domain+stats → schema/services → API → seed → UI → docs.
4. **Tests alongside code**, not after. The AI wrote tests; I checked that they assert behaviour (e.g. "sorts by USD, not raw local amount") rather than implementation.
5. **Verification beyond unit tests**: ran the seeded API, curled endpoints, drove the UI in headless Chromium (create → search → edit → history) and reviewed screenshots.

## Representative prompts
- "Write a one-page requirements doc for an HR salary tool for 10k employees across countries. Include what we deliberately leave out and why."
- "Design a SQLite schema where salaries are in local currency but insights compare across countries without storing stale USD values."
- "Implement employee CRUD where every salary or currency change writes a history row in the same transaction."
- "Write API tests for filtering, pagination, sorting by normalised salary, validation errors, duplicate email and SQL-injection attempts on sort/search."
- "Seed 10,000 realistic employees deterministically with country-appropriate salary bands."

## Where I corrected / validated the AI
- Summary stats initially returned float min/max from FX conversion → rounded in `summarize`.
- Frontend test caught compact currency rendering `$40.0K` → fixed.
- Insisted currency be derived server-side instead of trusted from the client.
- Checked Next.js scaffold flags (`cacheComponents`) and removed unneeded ones for a client-rendered app.
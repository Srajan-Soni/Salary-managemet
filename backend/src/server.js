import { openDb } from './db.js';
import { createApp } from './app.js';
import { seed } from './seed.js';

const port = Number(process.env.PORT ?? 4000);
const dbPath = process.env.DB_PATH ?? './salary.db';
const db = openDb(dbPath);

// On ephemeral hosts (free tiers) the DB starts empty; AUTO_SEED=true fills it once.
if (process.env.AUTO_SEED === 'true' && db.prepare('SELECT COUNT(*) AS n FROM employees').get().n === 0) {
  console.log(`Empty database: seeded ${seed(db)} employees`);
}

const app = createApp(db, { corsOrigin: process.env.CORS_ORIGIN ?? '*' });
app.listen(port, () => console.log(`API listening on :${port} (db: ${dbPath})`));
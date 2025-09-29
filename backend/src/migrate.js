/* Simple migration runner: executes all .sql files in db/migrations in lexicographic order */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./db');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('No migrations directory found at', migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found. Nothing to do.');
    process.exit(0);
  }

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n>>> Running migration: ${file}`);
    try {
      await db.query(sql);
      console.log(`<<< Completed: ${file}`);
    } catch (err) {
      console.error(`*** Migration failed: ${file}`);
      console.error(err);
      process.exit(1);
    }
  }

  // Close pool explicitly
  if (db.pool && typeof db.pool.end === 'function') {
    await db.pool.end();
  }
  console.log('\nAll migrations completed successfully.');
}

run();

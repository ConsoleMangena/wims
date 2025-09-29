const { Pool } = require('pg');

// Sanitize/augment the database URL for Node 'pg'
function buildPoolConfig() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set. Create a .env with DATABASE_URL');
  }

  let sslRequired = process.env.DB_SSL === 'true';

  // Remove channel_binding param which may not be supported by node-postgres
  // Keep sslmode if present
  let connectionString = rawUrl;
  try {
    const u = new URL(rawUrl);
    // If sslmode=require present, assume SSL required
    if (u.searchParams.get('sslmode') === 'require') {
      sslRequired = true;
    }
    // Remove channel_binding which is not used by node-postgres
    if (u.searchParams.has('channel_binding')) {
      u.searchParams.delete('channel_binding');
      connectionString = u.toString();
    }
  } catch (e) {
    // If URL parsing fails, fall back to raw string
    connectionString = rawUrl;
  }

  const config = { connectionString };
  if (sslRequired) {
    // Neon and many cloud PG providers require TLS; disable cert verification for simplicity.
    // If you have CA certificates configured, prefer providing them and setting rejectUnauthorized: true
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

async function ping() {
  const { rows } = await pool.query('select now() as now');
  return rows[0];
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  ping,
};

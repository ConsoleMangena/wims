const dns = require('dns');
const { Pool } = require('pg');

// Prefer IPv4 to avoid ENETUNREACH on some networks with IPv6-only DNS answers
if (typeof dns.setDefaultResultOrder === 'function') {
  try { dns.setDefaultResultOrder('ipv4first'); } catch (_) {}
}

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
  let hostForLog;
  let portForLog = 5432;
  try {
    const u = new URL(rawUrl);
    hostForLog = u.hostname || undefined;
    portForLog = u.port ? Number(u.port) : 5432;
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

  const config = {
    connectionString,
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 15000,
  };
  if (sslRequired) {
    // Neon and many cloud PG providers require TLS; disable cert verification for simplicity.
    // If you have CA certificates configured, prefer providing them and setting rejectUnauthorized: true
    config.ssl = { rejectUnauthorized: false };
  }

  if (hostForLog) {
    // Log sanitized destination only (no credentials)
    console.log(`DB: connecting to ${hostForLog}:${portForLog} ssl=${!!config.ssl}`);
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

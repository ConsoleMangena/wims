const express = require('express');
const db = require('../db');

const router = express.Router();

// API root
router.get('/', (req, res) => {
  res.json({ name: 'WIMS Backend', version: '0.1.0' });
});

// DB connectivity check
router.get('/db/ping', async (req, res) => {
  try {
    const result = await db.ping();
    res.json({ ok: true, now: result.now });
  } catch (err) {
    console.error('DB ping failed:', err);
    res.status(500).json({ ok: false, error: 'DB connection failed' });
  }
});

// Update quota
router.put('/quotas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { year, w_species_id, reserve_id, quota } = req.body || {};
    const y = Number(year); const sid = Number(w_species_id); const rid = Number(reserve_id); const q = Number(quota);
    if (!Number.isInteger(y)) return res.status(400).json({ error: 'year must be an integer' });
    if (!Number.isInteger(sid)) return res.status(400).json({ error: 'w_species_id must be an integer' });
    if (!Number.isInteger(rid)) return res.status(400).json({ error: 'reserve_id must be an integer' });
    if (!Number.isInteger(q) || q < 0) return res.status(400).json({ error: 'quota must be a non-negative integer' });
    const result = await db.query(
      'UPDATE annual_quota SET year=$2, w_species_id=$3, reserve_id=$4, quota=$5 WHERE quota_id=$1 RETURNING quota_id, year, w_species_id, reserve_id, quota',
      [id, y, sid, rid, q]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update quota error:', err);
    res.status(500).json({ error: 'Failed to update quota' });
  }
});

// Species list
router.get('/species', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT w_species_id, name, population, created_at FROM wildlife_species ORDER BY w_species_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('species error:', err);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// Create species
router.post('/species', async (req, res) => {
  try {
    const { name, population } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const popVal = population === undefined || population === null || population === ''
      ? null
      : Number(population);
    if (popVal !== null && Number.isNaN(popVal)) {
      return res.status(400).json({ error: 'population must be a number' });
    }
    const { rows } = await db.query(
      'INSERT INTO wildlife_species (name, population) VALUES ($1, $2) RETURNING w_species_id, name, population, created_at',
      [name, popVal]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create species error:', err);
    res.status(500).json({ error: 'Failed to create species' });
  }
});

// Delete species
router.delete('/species/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM wildlife_species WHERE w_species_id = $1 RETURNING w_species_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete species error:', err);
    res.status(500).json({ error: 'Failed to delete species' });
  }
});

// Update species
router.put('/species/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { name, population } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const popVal = population === undefined || population === null || population === '' ? null : Number(population);
    if (popVal !== null && Number.isNaN(popVal)) return res.status(400).json({ error: 'population must be a number' });
    const result = await db.query(
      'UPDATE wildlife_species SET name=$2, population=$3 WHERE w_species_id=$1 RETURNING w_species_id, name, population, created_at',
      [id, name, popVal]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update species error:', err);
    res.status(500).json({ error: 'Failed to update species' });
  }
});

// Sightings list
router.get('/sightings', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT sighting_id, w_species_id, sighting_date, location, notes, created_at FROM sighting ORDER BY sighting_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('sightings error:', err);
    res.status(500).json({ error: 'Failed to fetch sightings' });
  }
});

// Create sighting
router.post('/sightings', async (req, res) => {
  try {
    const { w_species_id, sighting_date, lat, lon, notes } = req.body || {};
    const speciesId = Number(w_species_id);
    if (!Number.isInteger(speciesId)) return res.status(400).json({ error: 'w_species_id must be an integer' });
    if (!sighting_date) return res.status(400).json({ error: 'sighting_date is required (YYYY-MM-DD)' });
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return res.status(400).json({ error: 'lat and lon must be numbers' });

    const { rows } = await db.query(
      'INSERT INTO sighting (w_species_id, sighting_date, location, notes) VALUES ($1, $2, point($3, $4), $5) RETURNING sighting_id, w_species_id, sighting_date, location, notes, created_at',
      [speciesId, sighting_date, lonNum, latNum, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create sighting error:', err);
    res.status(500).json({ error: 'Failed to create sighting' });
  }
});

// Delete sighting
router.delete('/sightings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM sighting WHERE sighting_id = $1 RETURNING sighting_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete sighting error:', err);
    res.status(500).json({ error: 'Failed to delete sighting' });
  }
});

// Update sighting
router.put('/sightings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { w_species_id, sighting_date, lat, lon, notes } = req.body || {};
    const sid = Number(w_species_id);
    if (!Number.isInteger(sid)) return res.status(400).json({ error: 'w_species_id must be an integer' });
    if (!sighting_date) return res.status(400).json({ error: 'sighting_date is required (YYYY-MM-DD)' });
    const latNum = Number(lat); const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return res.status(400).json({ error: 'lat and lon must be numbers' });
    const result = await db.query(
      'UPDATE sighting SET w_species_id=$2, sighting_date=$3, location=point($4,$5), notes=$6 WHERE sighting_id=$1 RETURNING sighting_id, w_species_id, sighting_date, location, notes, created_at',
      [id, sid, sighting_date, lonNum, latNum, notes ?? null]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update sighting error:', err);
    res.status(500).json({ error: 'Failed to update sighting' });
  }
});

// Reserves list
router.get('/reserves', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT reserve_id, name, boundary, created_at FROM game_reserve ORDER BY reserve_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('reserves error:', err);
    res.status(500).json({ error: 'Failed to fetch reserves' });
  }
});

// Create reserve
router.post('/reserves', async (req, res) => {
  // Make boundary available in catch for better error reporting
  let boundary;
  try {
    const { name } = req.body || {};
    let { points } = req.body || {};
    boundary = req.body?.boundary;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    // If points array provided, build polygon text
    if ((!boundary || typeof boundary !== 'string') && Array.isArray(points)) {
      const pts = points.filter((p) => p && typeof p.lon === 'number' && typeof p.lat === 'number');
      if (pts.length < 3) {
        return res.status(400).json({ error: 'points must include at least 3 vertices' });
      }
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (first.lat !== last.lat || first.lon !== last.lon) pts.push(first);
      // Build polygon text: one outer pair of parentheses enclosing a list of (x,y) points
      // Example: ((x1,y1),(x2,y2),...) — starts with "((" because of outer "(" and first point "("
      boundary = `(${pts.map((p) => `(${p.lon}, ${p.lat})`).join(',')})`;
    }

    if (!boundary || typeof boundary !== 'string') {
      return res.status(400).json({
        error: 'boundary is required as polygon text ((x1,y1),(x2,y2),...) or provide points: [{lon,lat}, ...] with at least 3 vertices',
      });
    }

    // Basic sanity check for polygon string
    if (!boundary.startsWith('((') || !boundary.endsWith(')')) {
      return res.status(400).json({ error: 'boundary must start with (( and end with )' });
    }

    // Insert as polygon
    const { rows } = await db.query(
      'INSERT INTO game_reserve (name, boundary) VALUES ($1, $2::polygon) RETURNING reserve_id, name, boundary, created_at',
      [name, boundary]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create reserve error:', err);
    // Surface a clearer error for invalid polygon input
    const msg = String(err.message || '');
    if (/invalid input syntax for type (polygon|path|point)/i.test(msg)) {
      const snippet = (req.body?.boundary || boundary || '').toString().slice(0, 120);
      return res.status(400).json({ error: 'Invalid polygon syntax. Expected ((x1,y1),(x2,y2),...) with numeric lon/lat.', sample: snippet });
    }
    res.status(500).json({ error: 'Failed to create reserve' });
  }
});

// Delete reserve
router.delete('/reserves/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM game_reserve WHERE reserve_id = $1 RETURNING reserve_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete reserve error:', err);
    res.status(500).json({ error: 'Failed to delete reserve' });
  }
});

// Update reserve
router.put('/reserves/:id', async (req, res) => {
  let boundary;
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { name } = req.body || {};
    let { points } = req.body || {};
    boundary = req.body?.boundary;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    if ((!boundary || typeof boundary !== 'string') && Array.isArray(points)) {
      const pts = points.filter((p) => p && typeof p.lon === 'number' && typeof p.lat === 'number');
      if (pts.length < 3) return res.status(400).json({ error: 'points must include at least 3 vertices' });
      const first = pts[0]; const last = pts[pts.length - 1];
      if (first.lat !== last.lat || first.lon !== last.lon) pts.push(first);
      boundary = `(${pts.map((p) => `(${p.lon}, ${p.lat})`).join(',')})`;
    }
    if (!boundary || typeof boundary !== 'string') {
      return res.status(400).json({ error: 'boundary is required as polygon text ((x1,y1),(x2,y2),...) or provide points: [{lon,lat}, ...] with at least 3 vertices' });
    }
    if (!boundary.startsWith('((') || !boundary.endsWith(')')) {
      return res.status(400).json({ error: 'boundary must start with (( and end with )' });
    }
    const result = await db.query(
      'UPDATE game_reserve SET name=$2, boundary=$3::polygon WHERE reserve_id=$1 RETURNING reserve_id, name, boundary, created_at',
      [id, name, boundary]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update reserve error:', err);
    const msg = String(err.message || '');
    if (/invalid input syntax for type (polygon|path|point)/i.test(msg)) {
      const snippet = (req.body?.boundary || boundary || '').toString().slice(0, 120);
      return res.status(400).json({ error: 'Invalid polygon syntax. Expected ((x1,y1),(x2,y2),...) with numeric lon/lat.', sample: snippet });
    }
    res.status(500).json({ error: 'Failed to update reserve' });
  }
});

// Hunters list
router.get('/hunters', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT hunter_id, name, address, created_at FROM hunter ORDER BY hunter_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('hunters error:', err);
    res.status(500).json({ error: 'Failed to fetch hunters' });
  }
});

// Create hunter
router.post('/hunters', async (req, res) => {
  try {
    const { name, address } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const { rows } = await db.query(
      'INSERT INTO hunter (name, address) VALUES ($1, $2) RETURNING hunter_id, name, address, created_at',
      [name, address ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create hunter error:', err);
    res.status(500).json({ error: 'Failed to create hunter' });
  }
});

// Delete hunter
router.delete('/hunters/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM hunter WHERE hunter_id = $1 RETURNING hunter_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete hunter error:', err);
    res.status(500).json({ error: 'Failed to delete hunter' });
  }
});

// Update hunter
router.put('/hunters/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { name, address } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const result = await db.query(
      'UPDATE hunter SET name=$2, address=$3 WHERE hunter_id=$1 RETURNING hunter_id, name, address, created_at',
      [id, name, address ?? null]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update hunter error:', err);
    res.status(500).json({ error: 'Failed to update hunter' });
  }
});

// Licences list
router.get('/licences', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT licence_id, hunter_id, issue_date, expiry_date, created_at FROM licence ORDER BY licence_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('licences error:', err);
    res.status(500).json({ error: 'Failed to fetch licences' });
  }
});

// Create licence
router.post('/licences', async (req, res) => {
  try {
    const { hunter_id, issue_date, expiry_date } = req.body || {};
    const hid = Number(hunter_id);
    if (!Number.isInteger(hid)) return res.status(400).json({ error: 'hunter_id must be an integer' });
    if (!issue_date || !expiry_date) return res.status(400).json({ error: 'issue_date and expiry_date are required' });
    const { rows } = await db.query(
      'INSERT INTO licence (hunter_id, issue_date, expiry_date) VALUES ($1, $2, $3) RETURNING licence_id, hunter_id, issue_date, expiry_date, created_at',
      [hid, issue_date, expiry_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create licence error:', err);
    res.status(500).json({ error: 'Failed to create licence' });
  }
});

// Delete licence
router.delete('/licences/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM licence WHERE licence_id = $1 RETURNING licence_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete licence error:', err);
    res.status(500).json({ error: 'Failed to delete licence' });
  }
});

// Update licence
router.put('/licences/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { hunter_id, issue_date, expiry_date } = req.body || {};
    const hid = Number(hunter_id);
    if (!Number.isInteger(hid)) return res.status(400).json({ error: 'hunter_id must be an integer' });
    if (!issue_date || !expiry_date) return res.status(400).json({ error: 'issue_date and expiry_date are required' });
    const result = await db.query(
      'UPDATE licence SET hunter_id=$2, issue_date=$3, expiry_date=$4 WHERE licence_id=$1 RETURNING licence_id, hunter_id, issue_date, expiry_date, created_at',
      [id, hid, issue_date, expiry_date]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update licence error:', err);
    res.status(500).json({ error: 'Failed to update licence' });
  }
});

// Poaching incidents list
router.get('/poaching', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT incident_id, incident_date, location, reserve_id, description, created_at FROM poaching_incident ORDER BY incident_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('poaching error:', err);
    res.status(500).json({ error: 'Failed to fetch poaching incidents' });
  }
});

// Create poaching incident
router.post('/poaching', async (req, res) => {
  try {
    const { incident_date, lat, lon, reserve_id, description } = req.body || {};
    if (!incident_date) return res.status(400).json({ error: 'incident_date is required' });
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return res.status(400).json({ error: 'lat and lon must be numbers' });
    const rid = reserve_id == null || reserve_id === '' ? null : Number(reserve_id);
    if (rid !== null && !Number.isInteger(rid)) return res.status(400).json({ error: 'reserve_id must be an integer' });
    const { rows } = await db.query(
      'INSERT INTO poaching_incident (incident_date, location, reserve_id, description) VALUES ($1, point($2, $3), $4, $5) RETURNING incident_id, incident_date, location, reserve_id, description, created_at',
      [incident_date, lonNum, latNum, rid, description ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create poaching error:', err);
    res.status(500).json({ error: 'Failed to create poaching incident' });
  }
});

// Delete poaching incident
router.delete('/poaching/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM poaching_incident WHERE incident_id = $1 RETURNING incident_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete poaching error:', err);
    res.status(500).json({ error: 'Failed to delete poaching incident' });
  }
});

// Update poaching incident
router.put('/poaching/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const { incident_date, lat, lon, reserve_id, description } = req.body || {};
    if (!incident_date) return res.status(400).json({ error: 'incident_date is required' });
    const latNum = Number(lat); const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return res.status(400).json({ error: 'lat and lon must be numbers' });
    const rid = reserve_id == null || reserve_id === '' ? null : Number(reserve_id);
    if (rid !== null && !Number.isInteger(rid)) return res.status(400).json({ error: 'reserve_id must be an integer' });
    const result = await db.query(
      'UPDATE poaching_incident SET incident_date=$2, location=point($3,$4), reserve_id=$5, description=$6 WHERE incident_id=$1 RETURNING incident_id, incident_date, location, reserve_id, description, created_at',
      [id, incident_date, lonNum, latNum, rid, description ?? null]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update poaching error:', err);
    res.status(500).json({ error: 'Failed to update poaching incident' });
  }
});

// Annual quotas list
router.get('/quotas', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT quota_id, year, w_species_id, reserve_id, quota FROM annual_quota ORDER BY quota_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('quotas error:', err);
    res.status(500).json({ error: 'Failed to fetch quotas' });
  }
});

// Create quota
router.post('/quotas', async (req, res) => {
  try {
    const { year, w_species_id, reserve_id, quota } = req.body || {};
    const y = Number(year);
    const sid = Number(w_species_id);
    const rid = Number(reserve_id);
    const q = Number(quota);
    if (!Number.isInteger(y)) return res.status(400).json({ error: 'year must be an integer' });
    if (!Number.isInteger(sid)) return res.status(400).json({ error: 'w_species_id must be an integer' });
    if (!Number.isInteger(rid)) return res.status(400).json({ error: 'reserve_id must be an integer' });
    if (!Number.isInteger(q) || q < 0) return res.status(400).json({ error: 'quota must be a non-negative integer' });
    const { rows } = await db.query(
      'INSERT INTO annual_quota (year, w_species_id, reserve_id, quota) VALUES ($1, $2, $3, $4) RETURNING quota_id, year, w_species_id, reserve_id, quota',
      [y, sid, rid, q]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create quota error:', err);
    res.status(500).json({ error: 'Failed to create quota' });
  }
});

// Delete quota
router.delete('/quotas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
    const result = await db.query('DELETE FROM annual_quota WHERE quota_id = $1 RETURNING quota_id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('delete quota error:', err);
    res.status(500).json({ error: 'Failed to delete quota' });
  }
});

// Stats for dashboard tiles
router.get('/stats', async (req, res) => {
  try {
    const queries = [
      db.query('SELECT COUNT(*)::int AS c FROM wildlife_species'),
      db.query('SELECT COUNT(*)::int AS c FROM sighting'),
      db.query('SELECT COUNT(*)::int AS c FROM game_reserve'),
      db.query('SELECT COUNT(*)::int AS c FROM hunter'),
      db.query('SELECT COUNT(*)::int AS c FROM licence'),
      db.query('SELECT COUNT(*)::int AS c FROM poaching_incident'),
      db.query('SELECT COUNT(*)::int AS c FROM annual_quota')
    ];
    const [species, sightings, reserves, hunters, licences, poaching, quotas] = await Promise.all(queries);
    res.json({
      species: species.rows[0].c,
      sightings: sightings.rows[0].c,
      reserves: reserves.rows[0].c,
      hunters: hunters.rows[0].c,
      licences: licences.rows[0].c,
      poaching: poaching.rows[0].c,
      quotas: quotas.rows[0].c
    });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

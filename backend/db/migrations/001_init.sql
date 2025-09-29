-- Initial schema for Wildlife Management Information System (PostgreSQL)
-- This adapts the provided SQL to PostgreSQL and incorporates features from the README:
-- - Wildlife Population Monitoring (species, sightings)
-- - Hunting Management (hunters, licenses, catches, quotas)
-- - Anti-Poaching Support (poaching incidents, relation to reserves)
-- - Spatial Analysis (locations and reserve boundaries using built-in point/polygon)
-- If you later enable PostGIS, you can migrate columns from point/polygon to geometry/geography.

BEGIN;

-- Core reference: wildlife species
CREATE TABLE IF NOT EXISTS wildlife_species (
  w_species_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  population INTEGER CHECK (population IS NULL OR population >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE wildlife_species IS 'Catalog of wildlife species';

-- Wildlife sighting reports
CREATE TABLE IF NOT EXISTS sighting (
  sighting_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  w_species_id INTEGER NOT NULL REFERENCES wildlife_species(w_species_id) ON DELETE CASCADE,
  sighting_date DATE NOT NULL,
  location POINT NOT NULL, -- (longitude, latitude) or (x, y)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sighting IS 'Recorded wildlife sightings with geolocation';

-- Game reserves with boundaries
CREATE TABLE IF NOT EXISTS game_reserve (
  reserve_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  boundary POLYGON NOT NULL, -- Reserve boundary polygon in (x,y) plane
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE game_reserve IS 'Game reserves and their boundaries';

-- Species present in a reserve (many-to-many)
CREATE TABLE IF NOT EXISTS species_in_reserve (
  w_species_id INTEGER NOT NULL REFERENCES wildlife_species(w_species_id) ON DELETE CASCADE,
  reserve_id INTEGER NOT NULL REFERENCES game_reserve(reserve_id) ON DELETE CASCADE,
  PRIMARY KEY (w_species_id, reserve_id)
);

-- Hunters
CREATE TABLE IF NOT EXISTS hunter (
  hunter_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Local hunter specialization
CREATE TABLE IF NOT EXISTS local_hunter (
  hunter_id INTEGER PRIMARY KEY REFERENCES hunter(hunter_id) ON DELETE CASCADE,
  village TEXT
);

-- Tourist hunter specialization
CREATE TABLE IF NOT EXISTS tourist_hunter (
  hunter_id INTEGER PRIMARY KEY REFERENCES hunter(hunter_id) ON DELETE CASCADE,
  country TEXT
);

-- Licenses
CREATE TABLE IF NOT EXISTS licence (
  licence_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hunter_id INTEGER NOT NULL REFERENCES hunter(hunter_id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  CHECK (expiry_date >= issue_date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Private licence specialization
CREATE TABLE IF NOT EXISTS private_licence (
  licence_id INTEGER PRIMARY KEY REFERENCES licence(licence_id) ON DELETE CASCADE,
  permitted_species TEXT -- Optional: comma-separated names or codes; consider a join table if needed
);

-- Safari licence specialization
CREATE TABLE IF NOT EXISTS safari_licence (
  licence_id INTEGER PRIMARY KEY REFERENCES licence(licence_id) ON DELETE CASCADE,
  safari_company TEXT
);

-- Catches by local hunters
CREATE TABLE IF NOT EXISTS local_catch (
  catch_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hunter_id INTEGER NOT NULL REFERENCES local_hunter(hunter_id) ON DELETE CASCADE,
  w_species_id INTEGER NOT NULL REFERENCES wildlife_species(w_species_id) ON DELETE RESTRICT,
  licence_id INTEGER NOT NULL REFERENCES private_licence(licence_id) ON DELETE RESTRICT,
  catch_date DATE NOT NULL,
  location POINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catches by tourist hunters
CREATE TABLE IF NOT EXISTS tourist_catch (
  catch_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hunter_id INTEGER NOT NULL REFERENCES tourist_hunter(hunter_id) ON DELETE CASCADE,
  w_species_id INTEGER NOT NULL REFERENCES wildlife_species(w_species_id) ON DELETE RESTRICT,
  licence_id INTEGER NOT NULL REFERENCES safari_licence(licence_id) ON DELETE RESTRICT,
  catch_date DATE NOT NULL,
  location POINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anti-poaching: incidents
CREATE TABLE IF NOT EXISTS poaching_incident (
  incident_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  incident_date DATE NOT NULL,
  location POINT NOT NULL,
  reserve_id INTEGER REFERENCES game_reserve(reserve_id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Annual quotas per species per reserve (from README: annual quotas)
CREATE TABLE IF NOT EXISTS annual_quota (
  quota_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  w_species_id INTEGER NOT NULL REFERENCES wildlife_species(w_species_id) ON DELETE CASCADE,
  reserve_id INTEGER NOT NULL REFERENCES game_reserve(reserve_id) ON DELETE CASCADE,
  quota INTEGER NOT NULL CHECK (quota >= 0),
  UNIQUE (year, w_species_id, reserve_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sighting_species_date ON sighting (w_species_id, sighting_date);
CREATE INDEX IF NOT EXISTS idx_local_catch_species_date ON local_catch (w_species_id, catch_date);
CREATE INDEX IF NOT EXISTS idx_tourist_catch_species_date ON tourist_catch (w_species_id, catch_date);
CREATE INDEX IF NOT EXISTS idx_licence_hunter ON licence (hunter_id);
CREATE INDEX IF NOT EXISTS idx_poaching_incident_date ON poaching_incident (incident_date);

COMMIT;

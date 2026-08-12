CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'staff')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilitators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  degree TEXT,
  birth_info TEXT,
  nik TEXT UNIQUE,
  nip TEXT UNIQUE,
  position TEXT,
  unit TEXT,
  address TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  photo_url TEXT,
  signature_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilitator_competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facilitator_id INTEGER NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(facilitator_id, name)
);

CREATE TABLE IF NOT EXISTS facilitator_educations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facilitator_id INTEGER NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  graduation_year INTEGER
);

CREATE TABLE IF NOT EXISTS facilitator_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facilitator_id INTEGER NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('certificate', 'supporting', 'cv')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facilitator_id INTEGER NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  material TEXT,
  event_date TEXT NOT NULL,
  organizer TEXT,
  certificate_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facilitator_id INTEGER NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competencies_name ON facilitator_competencies(name);
CREATE INDEX IF NOT EXISTS idx_trainings_facilitator ON trainings(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_facilitator ON reviews(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_documents_facilitator_type ON facilitator_documents(facilitator_id, type);

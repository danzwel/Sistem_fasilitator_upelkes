CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('institutionName', 'UPTD UPELKES Jawa Barat'),
  ('logoUrl', ''),
  ('cvTemplate', 'default'),
  ('maxUploadMb', '10'),
  ('documentCategories', 'Sertifikat, Dokumen Pendukung');

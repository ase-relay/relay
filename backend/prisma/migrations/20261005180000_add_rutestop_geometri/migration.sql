-- Migration: 20261005180000_add_rutestop_geometri
-- Additive only — menambahkan kolom `geometri` (nullable JSONB) ke tabel "RuteStop".
-- Data lama tidak terpengaruh. Kolom null by default.
-- Format isi: [[lat, lng], ...] — array titik koordinat jalur rel (Overpass API).

ALTER TABLE "RuteStop" ADD COLUMN "geometri" JSONB;

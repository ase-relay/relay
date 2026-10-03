-- Tarif per moda: FLAT/PER_KM saja, satu tarif per moda, tambah biayaLayanan.
-- (1) GUARD PER_STASIUN: tolak diam-diam; butuh keputusan manual bila ada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Tarif" WHERE "tipeTarif" = 'PER_STASIUN') THEN
    RAISE EXCEPTION 'Migrasi dibatalkan: masih ada baris Tarif dengan tipeTarif PER_STASIUN';
  END IF;
END $$;

-- (2) GUARD KONFLIK: satu modaId tidak boleh punya >1 kombinasi tarif berbeda.
DO $$
DECLARE
  v_moda integer;
BEGIN
  SELECT "modaId" INTO v_moda
  FROM (
    SELECT DISTINCT "modaId", "tipeTarif", "nominalDasar", "nominalPerKm", "jarakMinimumKm"
    FROM "Tarif"
  ) s
  GROUP BY "modaId"
  HAVING COUNT(*) > 1
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Migrasi dibatalkan: modaId % punya kombinasi tarif berbeda (butuh keputusan manual)', v_moda;
  END IF;
END $$;

-- (3) DEDUPLIKASI: per modaId pertahankan satu baris (utamakan ruteId IS NULL, lalu id terkecil).
DELETE FROM "Tarif" WHERE id IN (
  SELECT id FROM (
    SELECT id, "modaId",
      ROW_NUMBER() OVER (
        PARTITION BY "modaId"
        ORDER BY CASE WHEN "ruteId" IS NULL THEN 0 ELSE 1 END, id
      ) AS rn
    FROM "Tarif"
  ) s WHERE rn > 1
);

-- (4) Enum TipeTarif tinggal (FLAT, PER_KM).
CREATE TYPE "TipeTarif_new" AS ENUM ('FLAT', 'PER_KM');
ALTER TABLE "Tarif" ALTER COLUMN "tipeTarif" DROP DEFAULT;
ALTER TABLE "Tarif" ALTER COLUMN "tipeTarif" TYPE "TipeTarif_new" USING ("tipeTarif"::text::"TipeTarif_new");
ALTER TYPE "TipeTarif" RENAME TO "TipeTarif_old";
ALTER TYPE "TipeTarif_new" RENAME TO "TipeTarif";
DROP TYPE "TipeTarif_old";
ALTER TABLE "Tarif" ALTER COLUMN "tipeTarif" SET DEFAULT 'FLAT'::"TipeTarif";

-- (5) Kolom baru biayaLayanan (hanya bermakna untuk PER_KM; FLAT mengabaikan).
ALTER TABLE "Tarif" ADD COLUMN "biayaLayanan" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- (6) Hapus FK ruteId lalu kolomnya (nama constraint dari pg_constraint: Tarif_ruteId_fkey).
ALTER TABLE "Tarif" DROP CONSTRAINT "Tarif_ruteId_fkey";
ALTER TABLE "Tarif" DROP COLUMN "ruteId";

-- (7) Satu moda satu tarif.
CREATE UNIQUE INDEX "Tarif_modaId_key" ON "Tarif"("modaId");

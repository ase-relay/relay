-- AlterTable
ALTER TABLE "Rute" ADD COLUMN     "intervalWaktu" TEXT,
ADD COLUMN     "jamMulaiOperasi" TEXT,
ADD COLUMN     "jamSelesaiOperasi" TEXT;

-- AlterTable
ALTER TABLE "RuteStop" ADD COLUMN     "jadwalKeberangkatan" TEXT[] DEFAULT ARRAY[]::TEXT[];

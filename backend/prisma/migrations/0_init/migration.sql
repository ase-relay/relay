-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipeTarif" AS ENUM ('FLAT', 'PER_KM', 'PER_STASIUN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModaTransportasi" (
    "id" SERIAL NOT NULL,
    "namaModa" TEXT NOT NULL,
    "tipeModa" TEXT,
    "ikon" TEXT,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModaTransportasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Halte" (
    "id" SERIAL NOT NULL,
    "namaHalte" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "alamat" TEXT,
    "kota" TEXT NOT NULL DEFAULT 'Bandung',
    "isTransit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Halte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rute" (
    "id" SERIAL NOT NULL,
    "namaRute" TEXT NOT NULL,
    "kodeRute" TEXT,
    "deskripsi" TEXT,
    "modaId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuteStop" (
    "id" SERIAL NOT NULL,
    "ruteId" INTEGER NOT NULL,
    "halteId" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "estimasiMenit" INTEGER,
    "jarakMeter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarif" (
    "id" SERIAL NOT NULL,
    "modaId" INTEGER NOT NULL,
    "ruteId" INTEGER,
    "tipeTarif" "TipeTarif" NOT NULL DEFAULT 'FLAT',
    "nominalDasar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nominalPerKm" DOUBLE PRECISION DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "originName" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "destName" TEXT NOT NULL,
    "destLat" DOUBLE PRECISION,
    "destLng" DOUBLE PRECISION,
    "selectedRuteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ModaTransportasi_namaModa_key" ON "ModaTransportasi"("namaModa");

-- CreateIndex
CREATE UNIQUE INDEX "RuteStop_ruteId_urutan_key" ON "RuteStop"("ruteId", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "RuteStop_ruteId_halteId_key" ON "RuteStop"("ruteId", "halteId");

-- AddForeignKey
ALTER TABLE "Rute" ADD CONSTRAINT "Rute_modaId_fkey" FOREIGN KEY ("modaId") REFERENCES "ModaTransportasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuteStop" ADD CONSTRAINT "RuteStop_ruteId_fkey" FOREIGN KEY ("ruteId") REFERENCES "Rute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuteStop" ADD CONSTRAINT "RuteStop_halteId_fkey" FOREIGN KEY ("halteId") REFERENCES "Halte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarif" ADD CONSTRAINT "Tarif_modaId_fkey" FOREIGN KEY ("modaId") REFERENCES "ModaTransportasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarif" ADD CONSTRAINT "Tarif_ruteId_fkey" FOREIGN KEY ("ruteId") REFERENCES "Rute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


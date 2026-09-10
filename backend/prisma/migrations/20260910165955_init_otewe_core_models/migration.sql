/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ModaTransportasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaModa" TEXT NOT NULL,
    "tipeModa" TEXT,
    "ikon" TEXT,
    "deskripsi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Halte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaHalte" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "alamat" TEXT,
    "kota" TEXT NOT NULL DEFAULT 'Bandung',
    "isTransit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaRute" TEXT NOT NULL,
    "kodeRute" TEXT,
    "deskripsi" TEXT,
    "modaId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rute_modaId_fkey" FOREIGN KEY ("modaId") REFERENCES "ModaTransportasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuteStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ruteId" INTEGER NOT NULL,
    "halteId" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "estimasiMenit" INTEGER,
    "jarakMeter" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RuteStop_ruteId_fkey" FOREIGN KEY ("ruteId") REFERENCES "Rute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RuteStop_halteId_fkey" FOREIGN KEY ("halteId") REFERENCES "Halte" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarif" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modaId" INTEGER NOT NULL,
    "ruteId" INTEGER,
    "tipeTarif" TEXT NOT NULL DEFAULT 'FLAT',
    "nominalDasar" REAL NOT NULL DEFAULT 0,
    "nominalPerKm" REAL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tarif_modaId_fkey" FOREIGN KEY ("modaId") REFERENCES "ModaTransportasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tarif_ruteId_fkey" FOREIGN KEY ("ruteId") REFERENCES "Rute" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "originName" TEXT NOT NULL,
    "originLat" REAL,
    "originLng" REAL,
    "destName" TEXT NOT NULL,
    "destLat" REAL,
    "destLng" REAL,
    "selectedRuteId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "username") SELECT "createdAt", "email", "id", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ModaTransportasi_namaModa_key" ON "ModaTransportasi"("namaModa");

-- CreateIndex
CREATE UNIQUE INDEX "RuteStop_ruteId_urutan_key" ON "RuteStop"("ruteId", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "RuteStop_ruteId_halteId_key" ON "RuteStop"("ruteId", "halteId");

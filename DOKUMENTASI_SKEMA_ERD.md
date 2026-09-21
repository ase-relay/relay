# Dokumentasi Skema Database & Relasi (Untuk ERD & SDD)
**Proyek:** Relay (Otewe) - ASE Lab  
**Database Provider:** PostgreSQL (Supabase)  
**ORM:** Prisma ORM  

---

##  Ringkasan Entitas

Database terdiri dari **6 entitas utama** dan **1 entitas junction / relasi**:

1. `User` (Manajemen Pengguna & Autentikasi)
2. `ModaTransportasi` (Master Data Moda Transportasi)
3. `Halte` (Master Data Titik Pemberhentian & Transit)
4. `Rute` (Master Data Rute Tiap Moda)
5. `RuteStop` (Junction Table: Urutan & Jarak Halte pada Rute)
6. `Tarif` (Aturan & Perhitungan Tarif)
7. `SearchHistory` (Log Riwayat Pencarian User)

---

##  Rincian Tabel & Atribut

### 1. `User`
Menyimpan data pengguna aplikasi dan hak akses (Role).

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik user |
| `username` | `VARCHAR` | `Unique`, `Not Null` | Username untuk login/tampilan |
| `email` | `VARCHAR` | `Unique`, `Not Null` | Email unik pengguna |
| `password` | `VARCHAR` | `Not Null` | Hash password (bcrypt) |
| `role` | `ENUM('USER', 'ADMIN')` | `Default: 'USER'` | Peran pengguna |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu registrasi |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan akun |

---

### 2. `ModaTransportasi`
Menyimpan master data jenis transportasi umum (contoh: Bus, Angkot, Kereta/KRD, Ojol).

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik moda transportasi |
| `namaModa` | `VARCHAR` | `Unique`, `Not Null` | Nama moda (misal: "Bus", "Angkot") |
| `tipeModa` | `VARCHAR` | `Nullable` | Klasifikasi (BRT, FEEDER, COMMUTER_TRAIN) |
| `ikon` | `VARCHAR` | `Nullable` | URL atau nama identifier SVG icon |
| `deskripsi` | `TEXT` | `Nullable` | Keterangan detail moda |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pembuatan |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan |

---

### 3. `Halte`
Menyimpan titik halte/stasiun/shelter pemberhentian di area operasional (Bandung Raya).

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik halte |
| `namaHalte` | `VARCHAR` | `Not Null` | Nama halte / shelter |
| `latitude` | `DOUBLE / FLOAT` | `Not Null` | Koordinat Latitude |
| `longitude` | `DOUBLE / FLOAT` | `Not Null` | Koordinat Longitude |
| `alamat` | `TEXT` | `Nullable` | Deskripsi alamat lengkap |
| `kota` | `VARCHAR` | `Default: 'Bandung'` | Cakupan wilayah (Bandung, Cimahi, dll) |
| `isTransit` | `BOOLEAN` | `Default: false` | Indikator titik transit antar-moda |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pembuatan |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan |

---

### 4. `Rute`
Menyimpan lintasan operasional dari sebuah moda transportasi.

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik rute |
| `namaRute` | `VARCHAR` | `Not Null` | Misal: "Koridor 1: Cibiru - Elang" |
| `kodeRute` | `VARCHAR` | `Nullable` | Misal: "K1", "KRD-BDG-CMH" |
| `deskripsi` | `TEXT` | `Nullable` | Deskripsi detail rute |
| `modaId` | `INT` | `FK -> ModaTransportasi.id`, `ON DELETE CASCADE` | Moda transportasi yang melayani rute |
| `isActive` | `BOOLEAN` | `Default: true` | Status operasional rute |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pembuatan |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan |

---

### 5. `RuteStop` *(Junction / Bridge Entity)*
Menghubungkan `Rute` dan `Halte` dengan urutan terstruktur serta kalkulasi jarak antar titik.

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik junction stop |
| `ruteId` | `INT` | `FK -> Rute.id`, `ON DELETE CASCADE` | ID rute terkait |
| `halteId` | `INT` | `FK -> Halte.id`, `ON DELETE CASCADE` | ID halte terkait |
| `urutan` | `INT` | `Not Null` | Nomor urut pemberhentian (1, 2, 3...) |
| `estimasiMenit` | `INT` | `Nullable` | Estimasi durasi (menit) ke stop berikutnya |
| `jarakMeter` | `INT` | `Nullable` | Estimasi jarak (meter) ke stop berikutnya |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pembuatan |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan |

> **Unique Keys:**
> - `UNIQUE(ruteId, urutan)`: Memastikan urutan tidak duplikat dalam 1 rute.
> - `UNIQUE(ruteId, halteId)`: Mencegah halte yang sama masuk lebih dari 1x di rute yang sama.

---

### 6. `Tarif`
Menyimpan skema penetapan tarif berdasarkan moda dan rute tertentu.

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik tarif |
| `modaId` | `INT` | `FK -> ModaTransportasi.id`, `ON DELETE CASCADE` | Moda transportasi |
| `ruteId` | `INT` | `FK -> Rute.id (Nullable)`, `ON DELETE SET NULL` | Khusus rute tertentu (opsional) |
| `tipeTarif` | `ENUM('FLAT', 'PER_KM', 'PER_STASIUN')` | `Default: 'FLAT'` | Metode perhitungan tarif |
| `nominalDasar` | `DOUBLE / FLOAT` | `Default: 0` | Base fare (tarif dasar) |
| `nominalPerKm` | `DOUBLE / FLOAT` | `Nullable, Default: 0` | Biaya tambahan per km jika `PER_KM` |
| `keterangan` | `TEXT` | `Nullable` | Catatan/ketentuan tarif |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pembuatan |
| `updatedAt` | `TIMESTAMP` | `Auto Update` | Waktu pembaruan |

---

### 7. `SearchHistory`
Mencatat histori query pencarian lokasi dan rute yang dilakukan pengguna.

| Field | Tipe Data | Constraint / Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PK`, `Auto Increment` | ID unik riwayat |
| `userId` | `INT` | `FK -> User.id (Nullable)`, `ON DELETE CASCADE` | User yang melakukan pencarian |
| `originName` | `VARCHAR` | `Not Null` | Nama lokasi titik awal |
| `originLat` | `DOUBLE / FLOAT` | `Nullable` | Latitude lokasi awal |
| `originLng` | `DOUBLE / FLOAT` | `Nullable` | Longitude lokasi awal |
| `destName` | `VARCHAR` | `Not Null` | Nama lokasi titik tujuan |
| `destLat` | `DOUBLE / FLOAT` | `Nullable` | Latitude lokasi tujuan |
| `destLng` | `DOUBLE / FLOAT` | `Nullable` | Longitude lokasi tujuan |
| `selectedRuteId` | `INT` | `Nullable` | ID rute yang akhirnya dipilih user |
| `createdAt` | `TIMESTAMP` | `Default: now()` | Waktu pencarian dilakukan |

---

##  Relasi Antar Entitas (Kardinalitas untuk ERD)

```text
+-------------------+           1 : N           +-------------------+
| ModaTransportasi  | <-----------------------> |       Rute        |
+-------------------+                           +-------------------+
        |                                                 |
        | 1 : N                                           | 1 : N
        v                                                 v
+-------------------+                           +-------------------+
|       Tarif       | >-- (Opsional 0..1 : N) - |     RuteStop      |
+-------------------+                           +-------------------+
                                                          ^
                                                          | N : 1
                                                +-------------------+
                                                |       Halte       |
                                                +-------------------+

+-------------------+           1 : N           +-------------------+
|       User        | <-----------------------> |   SearchHistory   |
+-------------------+                           +-------------------+
```

### Penjelasan Kardinalitas:
1. **ModaTransportasi ke Rute (`1 : N`)**: Satu moda transportasi dapat memiliki banyak rute (contoh: Moda Bus punya Koridor 1, Koridor 2).
2. **ModaTransportasi ke Tarif (`1 : N`)**: Satu moda transportasi memiliki satu atau beberapa skema tarif (misal tarif umum vs tarif rute khusus).
3. **Rute ke Tarif (`0..1 : N`)**: Relasi opsional. Rute bisa merujuk ke tarif tertentu jika memiliki tarif khusus di luar moda-nya.
4. **Rute ke RuteStop (`1 : N`)**: Satu rute memiliki banyak titik pemberhentian/urutan halte.
5. **Halte ke RuteStop (`1 : N`)**: Satu halte dapat dilewati oleh banyak rute (menjadi titik transit).
6. **Rute ke Halte (`M : N` via `RuteStop`)**: Relasi many-to-many antar Rute dan Halte yang dijembatani oleh `RuteStop`.
7. **User ke SearchHistory (`1 : N`)**: Satu user dapat memiliki banyak catatan histori pencarian.

# Panduan Titik Bantu (Shaping Points) Geometri Rute

Folder ini berisi file konfigurasi titik bantu (*shaping points* / *via points*) untuk memperbaiki geometri segmen rute transportasi umum (Bus/BRT) yang keliru akibat keterbatasan routing OSRM (misalnya bus memutar balik alih-alih berbelok).

---

## 1. Cara Mengambil Koordinat Titik Bantu
1. Buka [OpenStreetMap](https://www.openstreetmap.org/) atau [Google Maps].
2. Temukan ruas jalan yang **seharusnya** dilalui kendaraan (setelah belokan atau persimpangan yang benar).
3. Klik kanan di tengah ruas jalan tersebut dan salin koordinatnya:
   - Format: `[latitude, longitude]`, contoh: `[-6.93835, 107.59697]`.
4. Pastikan titik berada di jalan searah yang benar dan tidak tepat di persimpangan agar snapping OSRM tidak ambigu.

---

## 2. Format File Konfigurasi JSON
Simpan file baru di folder `prisma/shaping-points/<nama-rute>.json` dengan struktur:
```json
{
  "ruteId": 23,
  "segments": [
    {
      "dariHalteId": 220,
      "keHalteId": 2,
      "via": [
        [-6.93835, 107.59697]
      ],
      "catatan": "Alasan singkat perbaikan"
    }
  ]
}
```

---

## 3. Cara Menjalankan Skrip

Skrip dijalankan melalui CLI `npm run shaping-points` (atau `npx tsx prisma/apply-shaping-points.ts`):

### A. Uji Coba (Dry-run — Default, Tidak Menulis ke DB)
```bash
npm run shaping-points -- prisma/shaping-points/k4-imanuel.json
```
Skrip akan:
- Memvalidasi urutan halte dan koordinat titik bantu.
- Menghitung rute via OSRM (`continue_straight=true`).
- Memeriksa rasio jarak, kedekatan titik ujung, dan mendeteksi U-turn.
- Menghasilkan file preview GeoJSON di folder `prisma/shaping-points/out/<nama>.geojson`.

### B. Terapkan ke Database (--apply)
```bash
npm run shaping-points -- prisma/shaping-points/k4-imanuel.json --apply
```
- Menulis geometri hasil kalkulasi ke kolom `RuteStop.geometri` pada stop awal segmen.
- Bila segmen sudah memiliki geometri sebelumnya, tambahkan flag `--overwrite`.
- Bila ada peringatan kualitas rute yang ingin diabaikan, tambahkan flag `--force`.

---

## 4. Efek Cache & Pemulihan Seeder
- **Cache Jaringan Runtime**: Skrip berjalan di proses terpisah dari server Express. Perubahan geometri akan terbaca otomatis setelah TTL cache kedaluwarsa (**60 detik**) atau setelah server backend di-restart.
- **Seeder Database (`npm run seed`)**: Perintah `prisma/seed.ts` membersihkan tabel rute dan stop (`deleteMany`), sehingga menghapus seluruh geometri. Untuk memulihkan geometri:
  1. Jalankan `npx tsx scripts/compute-rail-geometry.ts` untuk moda Kereta.
  2. Jalankan `npm run shaping-points -- prisma/shaping-points/<file>.json --apply` untuk segmen Bus yang memiliki file konfigurasi.

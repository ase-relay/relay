# OTEWE - Sistem Pencarian Rute Transportasi

OTEWE adalah aplikasi web untuk mencari rute transportasi publik yang membantu pengguna menemukan rute terbaik berdasarkan ongkos, waktu, dan jenis transportasi.

## 🏗️ Arsitektur Project

Project ini menggunakan arsitektur monorepo dengan dua bagian utama:

- **frontend** - Aplikasi web Next.js (React)
- **backend** - API Express dengan Prisma ORM

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16.3.3 (App Router)
- **UI**: React 19.2.8
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Maps**: Leaflet 1.9.4 + React Leaflet 5.0.0
- **Auth**: Google OAuth (@react-oauth/google, jwt-decode)
- **HTTP Client**: Axios 1.20.0
- **Icons**: React Icons 5.7.0

### Backend
- **Framework**: Express 5.2.1
- **ORM**: Prisma 6.0.0
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3
- **Validation**: Zod 4.6.5
- **Language**: TypeScript 7.0.2
- **Runtime**: tsx 4.23.12

## 📁 Struktur Project

```
relay/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   │   ├── (auth)/  # Login & Register pages
│   │   │   ├── admin/   # Admin dashboard pages
│   │   │   ├── beranda/ # Landing page
│   │   │   ├── cari-rute/ # Route search
│   │   │   ├── profil/  # User profile
│   │   │   └── ...
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities & API client
│   │   └── ...
│   └── package.json
├── backend/              # Express API
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middlewares/ # Express middlewares
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (routing engine)
│   │   ├── types/       # TypeScript types
│   │   ├── utils/       # Utility functions
│   │   └── index.ts     # Entry point
│   ├── prisma/          # Database schema & seed
│   └── package.json
└── README.md
```

## 🔧 Instalasi

### Prerequisites
- Node.js (v20 atau lebih baru)
- PostgreSQL database
- npm atau yarn

### Setup Database

1. Setup environment variables di `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/relay_db"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
PORT=8000
```

2. Generate Prisma client:
```bash
cd backend
npx prisma generate
```

3. Run migrations:
```bash
npx prisma migrate dev
```

4. Seed database (opsional):
```bash
npm run seed
```

5. Create admin user:
```bash
npm run create-admin
```

### Setup Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Setup environment variables di `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
```

## 🏃 Menjalankan Project

### Backend
```bash
cd backend
npm run dev
```
Server berjalan di `http://localhost:8000`

### Frontend
```bash
cd frontend
npm run dev
```
Frontend berjalan di `http://localhost:3000`

## 📦 Fitur Utama

### Pengguna (User)
- **Pencarian Rute**: Cari rute transportasi dengan berbagai opsi (termurah, tercepat, rekomendasi)
- **Autentikasi**: Login dengan email/username atau Google OAuth
- **Profile**: Kelola profil pengguna

### Admin
- **Kelola Moda**: Tambah, edit, hapus moda transportasi (Bus, Angkot, Kereta, dll)
- **Kelola Halte**: Kelola titik pemberhentian dengan lokasi di peta
- **Kelola Rute**: Buat rute dengan urutan halte dan segmen jalan
- **Kelola Tarif**: Atur tarif per moda untuk semua rute

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Build Frontend
```bash
cd frontend
npm run build
npm start
```

### Build Backend
```bash
cd backend
npm run build
npm start
```

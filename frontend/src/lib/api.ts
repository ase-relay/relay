import axios from 'axios';
import type { RoutingSearchRequest, RoutingSearchResponse, RoutingGeometryRequest, RoutingGeometryResponse } from '@/types/api/routing';
import type { UpdateProfileRequest, UpdateProfileResponse, UpdateProfileData, ChangePasswordRequest, ChangePasswordResponse, DeleteAccountResponse, GoogleLoginRequest, GoogleLoginResponse, GoogleLoginData } from '@/types/api/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('otewe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('otewe_token');
        const pathname = window.location.pathname;
        // Hindari loop bila sudah di halaman auth.
        if (pathname !== '/login' && pathname !== '/register') {
          const target = `${pathname}${window.location.search}`;
          window.location.href = `${window.location.origin}/login?redirect=${encodeURIComponent(target)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Endpoint: POST /api/routing/search
// (kontrak: routing_search_request.json & routing_search_response.json)
// ---------------------------------------------------------------------------

/**
 * Cari rekomendasi rute ke BE.
 *
 * Mengembalikan envelope response BE (`RoutingSearchResponse`) yang sudah
 * di-unwrap dari AxiosResponse — pemanggil tinggal membaca `response.data.routes`
 * (plus `response.data.origin/destination/totalRoutesFound` bila perlu).
 *
 * - `status !== 'success'` → throw `Error` dengan `message` dari BE.
 * - `totalRoutesFound === 0` → TIDAK throw; `data.routes` berupa `[]` —
 *   halaman pemanggil yang menampilkan empty state.
 */
export async function searchRoutes(payload: RoutingSearchRequest): Promise<RoutingSearchResponse> {
  const response = await api.post<RoutingSearchResponse>('/routing/search', payload);
  const envelope = response.data;

  if (envelope.status !== 'success') {
    throw new Error(envelope.message || 'Gagal mencari rute. Silakan coba lagi.');
  }

  return envelope;
}

// ---------------------------------------------------------------------------
// Endpoint: POST /api/routing/geometry (aditif)
// ---------------------------------------------------------------------------

/**
 * Susulan geometri OSRM untuk leg-leg yang masih berupa garis lurus
 * (stale-while-revalidate di halaman detail rute).
 *
 * - `status !== 'success'` → throw `Error` dengan `message` dari BE.
 */
export async function fetchRouteGeometry(
  payload: RoutingGeometryRequest,
): Promise<RoutingGeometryResponse> {
  const response = await api.post<RoutingGeometryResponse>('/routing/geometry', payload);
  const envelope = response.data;

  if (envelope.status !== 'success') {
    throw new Error(envelope.message || 'Gagal memuat geometri rute. Silakan coba lagi.');
  }

  return envelope;
}

// ---------------------------------------------------------------------------
// Endpoint: PUT /auth/profile
// ---------------------------------------------------------------------------

/**
 * Update profil user (username dan/atau email).
 *
 * Response BE menggunakan envelope pattern { success, message, data: user },
 * sama seperti searchRoutes().
 */
export async function updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileData> {
  const response = await api.put<UpdateProfileResponse>('/auth/profile', payload);
  const envelope = response.data;

  if (!envelope.success) {
    throw new Error(envelope.message || 'Gagal memperbarui profil. Silakan coba lagi.');
  }

  return envelope.data;
}

// ---------------------------------------------------------------------------
// Endpoint: PATCH /auth/change-password
// ---------------------------------------------------------------------------

/**
 * Ganti kata sandi user.
 *
 * Response BE menggunakan envelope pattern { success, message }.
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  const response = await api.patch<ChangePasswordResponse>('/auth/change-password', payload);
  const envelope = response.data;

  if (!envelope.success) {
    throw new Error(envelope.message || 'Gagal mengubah kata sandi. Silakan coba lagi.');
  }
}

// ---------------------------------------------------------------------------
// Endpoint: DELETE /auth/account
// ---------------------------------------------------------------------------

/**
 * Hapus akun user yang sedang login secara permanen.
 *
 * Response BE menggunakan envelope pattern { success, message }.
 */
export async function deleteAccount(): Promise<void> {
  const response = await api.delete<DeleteAccountResponse>('/auth/account');
  const envelope = response.data;

  if (!envelope.success) {
    throw new Error(envelope.message || 'Gagal menghapus akun. Silakan coba lagi.');
  }
}

// ---------------------------------------------------------------------------
// Endpoint: POST /auth/google
// ---------------------------------------------------------------------------

/**
 * Login dengan Google Sign-In.
 *
 * Response BE menggunakan envelope pattern { success, message, data: { token, user } },
 * sama seperti endpoint login biasa.
 */
export async function googleLogin(payload: GoogleLoginRequest): Promise<GoogleLoginData> {
  const response = await api.post<GoogleLoginResponse>('/auth/google', payload);
  const envelope = response.data;

  if (!envelope.success) {
    throw new Error(envelope.message || 'Gagal login dengan Google. Silakan coba lagi.');
  }

  return envelope.data;
}

// ---------------------------------------------------------------------------
// Endpoint: GET /transport/halte/:id (publik)
// ---------------------------------------------------------------------------

interface HalteDetailData {
  id: number;
  namaHalte: string;
  alamat?: string | null;
  kota?: string | null;
}

interface HalteDetailResponse {
  success: boolean;
  message: string;
  data: HalteDetailData;
}

/** Cache alamat halte per sesi (halaman detail rute bisa meminta halte yang sama). */
const halteAddressCache = new Map<number, string>();

/**
 * Alamat lengkap halte (kolom `alamat` DB, fallback `kota`).
 * Dipakai kartu lokasi transit di halaman detail rute. Gagal/‘’ → string kosong,
 * pemanggil tidak me-render baris alamat.
 */
export async function fetchHalteAddress(id: number): Promise<string> {
  const cached = halteAddressCache.get(id);
  if (cached !== undefined) return cached;

  const response = await api.get<HalteDetailResponse>(`/transport/halte/${id}`);
  const data = response.data.data;
  const address = data?.alamat?.trim() || data?.kota?.trim() || '';
  halteAddressCache.set(id, address);
  return address;
}

export default api;

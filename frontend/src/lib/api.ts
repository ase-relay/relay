import axios from 'axios';
import type { RoutingSearchRequest, RoutingSearchResponse } from '@/types/api/routing';
import type { UpdateProfileRequest, UpdateProfileResponse, UpdateProfileData, ChangePasswordRequest, ChangePasswordResponse, GoogleLoginRequest, GoogleLoginResponse, GoogleLoginData } from '@/types/api/auth';

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
        window.location.href = '/login';
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

export default api;

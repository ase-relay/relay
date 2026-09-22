import { useCallback, useState } from 'react';
import type { LocationSuggestion } from '@/services/mock/locationSearch';

/**
 * Hook untuk mendapat koordinat ASLI perangkat via `navigator.geolocation`.
 *
 * Latar belakang (lihat "⚠️ Catatan Tambahan" di TODO-integrasi-routing-search.md):
 * opsi "Lokasi saya" dulu memakai placeholder `lat: 0, lng: 0` — padahal (0,0) adalah
 * koordinat valid di dunia nyata, bukan sentinel value. Kini opsi tersebut HANYA
 * menghasilkan koordinat asli, atau gagal dengan pesan error (tidak ada placeholder).
 */
export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = useCallback((): Promise<LocationSuggestion> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        reject(new Error('Browser tidak mendukung deteksi lokasi. Silakan pilih lokasi dari daftar saran.'));
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            id: 'current-location',
            name: 'Lokasi saya',
            district: 'Lokasi perangkat saat ini',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocating(false);
          const message =
            error.code === error.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser atau pilih lokasi dari daftar saran.'
              : error.code === error.TIMEOUT
                ? 'Waktu deteksi lokasi habis. Coba lagi atau pilih lokasi dari daftar saran.'
                : 'Lokasi perangkat tidak dapat dideteksi. Silakan pilih lokasi dari daftar saran.';
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
      );
    });
  }, []);

  return { isLocating, getCurrentLocation };
}
